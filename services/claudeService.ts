import Anthropic from "@anthropic-ai/sdk";
import { ServiceCategory, Worker, User } from "../types";
 
// ─── Client factory ────────────────────────────────────────────────────────────
const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Anthropic API key not found in environment variables.");
    throw new Error("API_KEY_MISSING");
  }
  return new Anthropic({ apiKey });
};
 
// ─── Types ─────────────────────────────────────────────────────────────────────
 
/** Mirrors the shape of Gemini's `Content` so AiSupportBubble.tsx needs no changes */
export interface Content {
  role: "user" | "model";
  parts: { text?: string; functionCall?: any; functionResponse?: any }[];
}
 
// ─── Constants ─────────────────────────────────────────────────────────────────
const currencyCodes = [
  "USD", "ARS", "BOB", "BRL", "CLP", "COP",
  "GYD", "PYG", "PEN", "SRD", "UYU", "VES",
];
 
// ─── generateMockWorkers ───────────────────────────────────────────────────────
 
export const generateMockWorkers = async (
  count: number,
  service: ServiceCategory
): Promise<Worker[]> => {
  try {
    const client = getClient();
 
    const prompt = `Generate a list of ${count} realistic profiles for ${service} professionals.
 
Return ONLY a valid JSON object (no markdown, no backticks, no preamble) with this exact shape:
{
  "workers": [ ...array of worker objects... ]
}
 
Each worker object must include:
- id: string (unique)
- name: string (full name)
- email: string
- password: string (e.g. "p@ssword123")
- service: one of [${Object.values(ServiceCategory).join(", ")}]
- jobTypes: array of 2-4 specific job types relevant to their service
- location: "City, State" (USA)
- regions: array of 2-4 nearby neighborhoods or cities
- avgJobCost: { amount: number, currency: one of [${currencyCodes.join(", ")}] }
- bio: string (2-3 sentence engaging biography)
- avatarUrl: "https://picsum.photos/200"
- rating: number between 3.5 and 5.0
- reviews: array of 2-3 objects with { author, rating (1-5), comment, date ("Month Year") }
- availability: object with day keys (Sunday-Saturday), each either null or { start: "HH:MM", end: "HH:MM" } in 24h format
- availabilityOverrides: object with "YYYY-MM-DD" keys, values are null or { start, end }
- signupDate: ISO 8601 string
- lastLoginDate: ISO 8601 string
- idNumber: string
- phoneNumber: { code: string, number: string }
- verificationStatus: "approved"
 
Ensure diverse names and plausible bios. All string values must be properly escaped JSON. Do not include unescaped newlines in strings.`;
 
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });
 
    const rawText = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("");
 
    // Strip any accidental markdown fences
    const jsonString = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonString);
    return parsed.workers as Worker[];
  } catch (error: any) {
    console.error("Error generating mock workers:", error);
    return [];
  }
};
 
// ─── Tool definitions (mirrors the Gemini function declarations) ───────────────
 
const tools: Anthropic.Tool[] = [
  {
    name: "findWorkers",
    description:
      "Busca trabajadores en la plataforma TUFIX basados en criterios específicos como servicio, calificación mínima o ubicación.",
    input_schema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          description:
            "La categoría de servicio a buscar (ej. Handyman, Electrician, Plumber).",
          enum: Object.values(ServiceCategory),
        },
        minRating: {
          type: "number",
          description: "Calificación mínima de estrellas (0-5).",
        },
        location: {
          type: "string",
          description: "Ciudad o estado para filtrar.",
        },
        maxPrice: {
          type: "number",
          description: "Precio máximo promedio por trabajo.",
        },
      },
    },
  },
  {
    name: "requestHumanSupport",
    description:
      "Escala el chat a un agente de soporte humano cuando el usuario lo solicita explícitamente.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
];
 
// ─── getAiSupportResponse ──────────────────────────────────────────────────────
 
export const getAiSupportResponse = async (
  history: Content[],
  currentUser?: any,
  userType?: any,
  jobRequests?: any[],
  transactions?: any[],
  workers?: Worker[],
  users?: User[]
): Promise<{ text: string; functionCall?: string; functionArgs?: any }> => {
  // Build user context string (identical logic to the original)
  let userContext = "";
  if (currentUser && typeof currentUser === "object") {
    try {
      userContext = `
Contexto del usuario actual:
- Tipo de Usuario: ${userType || "N/A"}
- Nombre: ${currentUser.name || "N/A"}
- Email: ${currentUser.email || "N/A"}
- Ubicación: ${currentUser.location || "N/A"}
- Calificación: ${currentUser.rating || 0}
- ID: ${currentUser.id || "N/A"}
`;
      if (userType === "worker") {
        userContext += `- Servicio: ${currentUser.service || "N/A"}
- Tipos de Trabajo: ${currentUser.jobTypes?.join(", ") || "N/A"}
- Costo Promedio: ${currentUser.avgJobCost?.amount || 0} ${currentUser.avgJobCost?.currency || ""}
`;
      }
 
      if (Array.isArray(jobRequests)) {
        const userJobs = jobRequests.filter(
          (j) =>
            j.workerId === currentUser.id || j.user?.id === currentUser.id
        );
        userContext += `- Total de Trabajos: ${userJobs.length}\n`;
        if (userJobs.length > 0) {
          userContext += `- Trabajos Recientes (JSON): ${JSON.stringify(
            userJobs.slice(0, 5).map((j) => ({
              id: j.id,
              status: j.status,
              service: j.service,
              date: j.date,
              finalPrice: j.finalPrice,
              clientName: j.user?.name || "N/A",
              workerName:
                workers?.find((w) => w.id === j.workerId)?.name || "N/A",
            }))
          )}\n`;
        }
      }
 
      if (Array.isArray(transactions)) {
        const userTransactions = transactions.filter(
          (t) =>
            t.clientId === currentUser.id || t.workerId === currentUser.id
        );
        userContext += `- Total de Transacciones: ${userTransactions.length}\n`;
        if (userTransactions.length > 0) {
          userContext += `- Datos de Transacciones (JSON): ${JSON.stringify(
            userTransactions.slice(0, 5).map((t) => ({
              id: t.id,
              amount: t.total,
              date: t.paidAt,
              status: t.status,
              type: t.workerId === currentUser.id ? "ingreso" : "gasto",
              clientName:
                users?.find((u) => u.id === t.clientId)?.name || "N/A",
              workerName:
                workers?.find((w) => w.id === t.workerId)?.name || "N/A",
            }))
          )}\n`;
        }
      }
    } catch (e) {
      console.error("Error building user context:", e);
    }
  }
 
  const systemPrompt = `Eres TUFIX AI Support, un asistente experto y amigable para la plataforma TUFIX.
TUFIX conecta a usuarios con profesionales locales (handymen, electricistas, plomeros, etc.).
 
REGLAS CRÍTICAS:
1. RESPONDE SIEMPRE EN ESPAÑOL.
2. Eres capaz de realizar tareas complejas analizando los datos proporcionados en el contexto (JSON de trabajos y transacciones). Mantén tus respuestas concisas y útiles.
3. Si el usuario pregunta por gastos o ingresos en un periodo (ej. "este mes", "el año pasado"), filtra las transacciones por fecha y suma los montos.
4. Si el usuario busca un trabajador para un trabajo específico, usa la función 'findWorkers'. Si ya tienes información en el contexto sobre trabajadores previos, puedes mencionarlos.
5. Si el usuario pregunta por sus "clientes más valiosos" (si es trabajador) o "trabajadores preferidos" (si es cliente), analiza quién aparece más veces en la lista de trabajos o quién ha generado más volumen de dinero.
6. Traduce las categorías de servicio (ej. 'Handyman' -> 'Personal de mantenimiento', 'Electrician' -> 'Electricista') al responder al usuario.
7. Mantén un tono profesional, servicial y cercano.
 
TAREAS COMPLEJAS - GUÍA DE RESPUESTA:
- "Encontrar a la persona adecuada": Pregunta detalles si faltan (servicio, ubicación, presupuesto). Luego usa 'findWorkers'.
- "Gasto/Ingreso en un periodo": Revisa las fechas en el JSON de transacciones. Si no hay transacciones en ese periodo, indícalo claramente.
- "Clientes más valorados": Cuenta cuántos trabajos has hecho con cada cliente (clientId/clientName) y suma los montos. Menciona nombres específicos si están disponibles.
- "Resumen de actividad": Da un resumen de trabajos completados, pendientes y el balance financiero total basado en los datos.
 
DATOS DISPONIBLES:
- Tienes acceso a los trabajos y transacciones del usuario actual en el contexto.
- Para buscar trabajadores que NO están en el contexto inmediato, DEBES usar 'findWorkers'.
 
Si el usuario pide hablar con un humano, usa 'requestHumanSupport'.
 
Información de contacto de respaldo:
- Email: support@tufix.app
- Teléfono: +1 (555) 123-4567
 
${userContext}`;
 
  // Convert Content[] (Gemini format) → Anthropic MessageParam[]
  // Only keep the last 15 messages; skip function-call/function-response turns
  const anthropicMessages: Anthropic.MessageParam[] = history
    .slice(-15)
    .filter((msg) => {
      const part = msg.parts[0];
      return part?.text; // keep only plain text turns
    })
    .map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.parts[0].text || "",
    }));
 
  try {
    const client = getClient();
 
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
    });
 
    // Check if Claude wants to call a tool
    const toolUseBlock = response.content.find((b) => b.type === "tool_use");
    if (toolUseBlock && toolUseBlock.type === "tool_use") {
      return {
        text: "",
        functionCall: toolUseBlock.name,
        functionArgs: toolUseBlock.input,
      };
    }
 
    // Otherwise return the text response
    const textBlock = response.content.find((b) => b.type === "text");
    return {
      text:
        textBlock && textBlock.type === "text"
          ? textBlock.text
          : "Lo siento, no pude generar una respuesta en este momento.",
    };
  } catch (error: any) {
    console.error("Detailed Error getting AI support response:", error);
    if (error.message === "API_KEY_MISSING") {
      return {
        text: "Error: La clave de API de Anthropic no está configurada. Por favor, contacta al administrador.",
      };
    }
    return {
      text: `Lo siento, estoy teniendo problemas para conectarme en este momento. Error: ${error.message || "Desconocido"}`,
    };
  }
};