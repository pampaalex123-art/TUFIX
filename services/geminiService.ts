

import { GoogleGenAI, Type, Content, FunctionDeclaration } from "@google/genai";
import { ServiceCategory, Worker, User } from '../types';

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("Gemini API key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

const dayAvailabilitySchema = {
  type: Type.OBJECT,
  description: "Working hours for this day. If the worker is unavailable, this object should be omitted or contain empty strings.",
  properties: {
      start: { type: Type.STRING, description: "Start time in 24-hour format, e.g., '09:00'." },
      end: { type: Type.STRING, description: "End time in 24-hour format, e.g., '17:00'." },
  },
};

const currencyCodes = ['USD', 'ARS', 'BOB', 'BRL', 'CLP', 'COP', 'GYD', 'PYG', 'PEN', 'SRD', 'UYU', 'VES'];

// FIX: The root of a schema must be an OBJECT. The response itself should be a JSON object containing the array.
const workerSchema = {
  type: Type.OBJECT,
  properties: {
    workers: {
        type: Type.ARRAY,
        items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique identifier for the worker." },
          name: { type: Type.STRING, description: "The full name of the worker." },
          email: { type: Type.STRING, description: "The worker's email address." },
          password: { type: Type.STRING, description: "A simple, secure-looking password for the worker account, like 'p@ssword123'." },
          service: { 
            type: Type.STRING, 
            description: "The primary service offered by the worker.",
            enum: Object.values(ServiceCategory)
          },
          jobTypes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2 to 4 specific job types the worker specializes in, relevant to their main service category."
          },
          location: { type: Type.STRING, description: "The city and state where the worker is based, e.g., 'San Francisco, CA'." },
          regions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "A list of neighborhoods or nearby cities they serve."
          },
          avgJobCost: {
            type: Type.OBJECT,
            description: "The approximate average cost per job, including amount and currency.",
            properties: {
              amount: { type: Type.NUMBER, description: "The numerical amount for the average job cost." },
              currency: { type: Type.STRING, description: `The currency code, e.g., ${currencyCodes.join(', ')}.`, enum: currencyCodes },
            }
          },
          bio: { type: Type.STRING, description: "A short, engaging biography about their experience and skills (2-3 sentences)." },
          avatarUrl: { type: Type.STRING, description: "A placeholder image URL from picsum.photos, e.g., 'https://picsum.photos/200'." },
          rating: { type: Type.NUMBER, description: "An average star rating between 3.5 and 5.0." },
          reviews: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                author: { type: Type.STRING, description: "The name of the client who left the review." },
                rating: { type: Type.NUMBER, description: "A star rating between 1 and 5." },
                comment: { type: Type.STRING, description: "A brief comment about the service provided." },
                date: { type: Type.STRING, description: "The date of the review in 'Month Year' format, e.g., 'June 2024'." },
              },
            },
          },
          availability: {
            type: Type.OBJECT,
            description: "An object representing the worker's weekly availability. For each day of the week, provide an object with 'start' and 'end' times, or null if unavailable. Omitted days are also considered unavailable.",
            properties: {
                Sunday: dayAvailabilitySchema,
                Monday: dayAvailabilitySchema,
                Tuesday: dayAvailabilitySchema,
                Wednesday: dayAvailabilitySchema,
                Thursday: dayAvailabilitySchema,
                Friday: dayAvailabilitySchema,
                Saturday: dayAvailabilitySchema,
            },
          },
          availabilityOverrides: {
            type: Type.OBJECT,
            description: "Optional. An object to override weekly availability for specific dates. Keys are dates in 'YYYY-MM-DD' format. Values are either null (for unavailable) or an object with 'start' and 'end' times. For example: { '2024-12-25': null, '2024-12-26': { start: '10:00', end: '14:00' } }",
          },
          signupDate: { type: Type.STRING, description: "The date the worker signed up, in ISO 8601 format." },
          lastLoginDate: { type: Type.STRING, description: "The date the worker last logged in, in ISO 8601 format." },
        },
      },
    }
  }
};

export const generateMockWorkers = async (count: number, service: ServiceCategory): Promise<Worker[]> => {
  try {
    const prompt = `Generate a list of ${count} realistic profiles for ${service} professionals. The final output must be a JSON object with a single key "workers" which contains the array of profiles. Include email, a simple but secure-looking password (like "pass123WORD" or "MySecureP@ss!"), signup date, last login date, an average job cost as an object with an 'amount' and a 'currency' (from this list: ${currencyCodes.join(', ')}), and 2-4 specific job types they specialize in from the following list if relevant: [Furniture Assembly, TV Mounting, Wiring, Fixture Installation, Leak Repair, Drain Cleaning, Interior Painting, Exterior Painting, Custom Shelving, Deck Building, Standard Cleaning, Deep Cleaning, Lockout Service, Rekeying, Lawn Mowing, Weeding & Planting]. Ensure diverse names, locations within the USA, and detailed, plausible bios and reviews. For some workers, add an 'availabilityOverrides' object to demonstrate taking a day off (e.g., '2024-12-25': null) or adding a special shift on a weekend. IMPORTANT: The output must be a valid JSON object adhering to the provided schema. All string values within the JSON must be properly escaped. For instance, any double quote characters inside a string value (like in a bio or review) must be preceded by a backslash (e.g., "He said, \\"hello there\\"."). Do not include unescaped newline characters within strings.`;
    
    const response = await getAi().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: workerSchema,
      },
    });

    const jsonString = (response.text || '').trim();
    if (!jsonString) {
      throw new Error("Empty response from Gemini API");
    }
    // The Gemini API returns a JSON string, which needs to be parsed.
    const responseObject = JSON.parse(jsonString);
    return responseObject.workers as Worker[];

  } catch (error) {
    console.error("Error generating mock workers:", error);
    // Fallback to static data in case of API error
    return [];
  }
};

const findWorkersFunctionDeclaration: FunctionDeclaration = {
  name: 'findWorkers',
  parameters: {
    type: Type.OBJECT,
    description: 'Busca trabajadores en la plataforma TUFIX basados en criterios específicos como servicio, calificación mínima o ubicación.',
    properties: {
      service: { 
        type: Type.STRING, 
        description: 'La categoría de servicio a buscar (ej. Handyman, Electrician, Plumber).',
        enum: Object.values(ServiceCategory)
      },
      minRating: { type: Type.NUMBER, description: 'Calificación mínima de estrellas (0-5).' },
      location: { type: Type.STRING, description: 'Ciudad o estado para filtrar.' },
      maxPrice: { type: Type.NUMBER, description: 'Precio máximo promedio por trabajo.' }
    },
  },
};

const requestHumanSupportFunctionDeclaration: FunctionDeclaration = {
  name: 'requestHumanSupport',
  parameters: {
    type: Type.OBJECT,
    description: 'Escala el chat a un agente de soporte humano cuando el usuario lo solicita explícitamente.',
    properties: {},
    required: [],
  },
};

export const getAiSupportResponse = async (
  history: Content[],
  currentUser?: any,
  userType?: any,
  jobRequests?: any[],
  transactions?: any[],
  workers?: Worker[],
  users?: User[]
): Promise<{ text: string; functionCall?: string; functionArgs?: any }> => {
  // Only use the last 15 messages to keep the context relevant
  const recentHistory = history.slice(-15);

  let userContext = '';
  if (currentUser) {
    userContext = `
Contexto del usuario actual:
- Tipo de Usuario: ${userType}
- Nombre: ${currentUser.name}
- Email: ${currentUser.email}
- Ubicación: ${currentUser.location}
- Calificación: ${currentUser.rating}
- ID: ${currentUser.id}
`;
    if (userType === 'worker') {
      userContext += `- Servicio: ${currentUser.service}
- Tipos de Trabajo: ${currentUser.jobTypes?.join(', ')}
- Costo Promedio: ${currentUser.avgJobCost?.amount} ${currentUser.avgJobCost?.currency}
`;
    }

    if (jobRequests) {
      const userJobs = jobRequests.filter(j => j.clientId === currentUser.id || j.workerId === currentUser.id || j.user?.id === currentUser.id);
      userContext += `- Total de Trabajos: ${userJobs.length}\n`;
      userContext += `- Trabajos Recientes (JSON): ${JSON.stringify(userJobs.slice(0, 20).map(j => {
        const client = users?.find(u => u.id === (j.user?.id || j.clientId));
        const worker = workers?.find(w => w.id === j.workerId);
        return { 
          id: j.id, 
          status: j.status, 
          service: j.service, 
          date: j.date, 
          finalPrice: j.finalPrice,
          clientId: j.user?.id || j.clientId,
          clientName: j.user?.name || client?.name || j.clientName,
          workerId: j.workerId,
          workerName: worker?.name || j.workerName
        };
      }))}\n`;
    }

    if (transactions) {
      const userTransactions = transactions.filter(t => t.clientId === currentUser.id || t.workerId === currentUser.id);
      userContext += `- Total de Transacciones: ${userTransactions.length}\n`;
      userContext += `- Datos de Transacciones (JSON): ${JSON.stringify(userTransactions.map(t => {
        const client = users?.find(u => u.id === t.clientId);
        const worker = workers?.find(w => w.id === t.workerId);
        return {
          id: t.id,
          amount: t.total,
          date: t.paidAt,
          status: t.status,
          type: t.workerId === currentUser.id ? 'ingreso' : 'gasto',
          clientId: t.clientId,
          clientName: client?.name,
          workerId: t.workerId,
          workerName: worker?.name
        };
      }))}\n`;
    }
  }

  const systemInstruction = `Eres TUFIX AI Support, un asistente experto y amigable para la plataforma TUFIX.
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
- Teléfono: +1 (555) 123-4567`;

  try {
    const response = await getAi().models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: recentHistory,
      config: {
        systemInstruction: systemInstruction + "\n\n" + userContext,
        tools: [{ functionDeclarations: [findWorkersFunctionDeclaration, requestHumanSupportFunctionDeclaration] }],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      return {
        text: "", 
        functionCall: functionCall.name,
        functionArgs: functionCall.args
      };
    }

    return { text: response.text || "Lo siento, no pude generar una respuesta en este momento." };
  } catch (error) {
    console.error("Error getting AI support response:", error);
    return { text: "Lo siento, estoy teniendo problemas para conectarme en este momento. Por favor, inténtalo de nuevo más tarde." };
  }
};