

import { GoogleGenAI, Type, Content, FunctionDeclaration } from "@google/genai";
import { ServiceCategory, Worker } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this example, we'll proceed, but API calls will fail.
  console.error("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const dayAvailabilitySchema = {
  type: Type.OBJECT,
  description: "Working hours for this day. This property should be `null` if the worker is unavailable on this day.",
  properties: {
      start: { type: Type.STRING, description: "Start time in 24-hour format, e.g., '09:00'." },
      end: { type: Type.STRING, description: "End time in 24-hour format, e.g., '17:00'." },
  },
  nullable: true,
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
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: workerSchema,
      },
    });

    const jsonString = response.text.trim();
    // The Gemini API returns a JSON string, which needs to be parsed.
    const responseObject = JSON.parse(jsonString);
    return responseObject.workers as Worker[];

  } catch (error) {
    console.error("Error generating mock workers:", error);
    // Fallback to static data in case of API error
    return [];
  }
};

const requestHumanSupportFunctionDeclaration: FunctionDeclaration = {
  name: 'requestHumanSupport',
  parameters: {
    type: Type.OBJECT,
    description: 'Escalates the chat to a human support agent when the user explicitly asks to speak with a person, human, or live representative.',
    properties: {},
    required: [],
  },
};

export const getAiSupportResponse = async (
  history: Content[],
  currentUser?: any,
  userType?: any,
  jobRequests?: any[],
  transactions?: any[]
): Promise<{ text: string; functionCall?: string }> => {
  // Only use the last 10 messages to keep the context small and relevant
  const recentHistory = history.slice(-10);

  let userContext = '';
  if (currentUser) {
    userContext = `
Here is the context about the current user you are talking to:
- User Type: ${userType}
- Name: ${currentUser.name}
- Email: ${currentUser.email}
- Location: ${currentUser.location}
- Rating: ${currentUser.rating}
- ID: ${currentUser.id}
`;
    if (userType === 'worker') {
      userContext += `- Service: ${currentUser.service}
- Job Types: ${currentUser.jobTypes?.join(', ')}
- Average Job Cost: ${currentUser.avgJobCost?.amount} ${currentUser.avgJobCost?.currency}
`;
    }

    if (jobRequests) {
      const userJobs = jobRequests.filter(j => j.clientId === currentUser.id || j.workerId === currentUser.id);
      userContext += `- Total Jobs: ${userJobs.length}\n`;
      userContext += `- Recent Jobs: ${JSON.stringify(userJobs.slice(0, 3).map(j => ({ id: j.id, status: j.status, title: j.title, date: j.date, finalPrice: j.finalPrice })))}\n`;
    }

    if (transactions) {
      const userTransactions = transactions.filter(t => t.fromUserId === currentUser.id || t.toUserId === currentUser.id);
      userContext += `- Total Transactions: ${userTransactions.length}\n`;
      if (userType === 'worker') {
        const earnings = userTransactions.filter(t => t.toUserId === currentUser.id && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
        userContext += `- Total Earnings: $${earnings.toFixed(2)}\n`;
      }
    }
  }

  const systemInstruction = `You are TUFIX AI Support, a friendly and helpful assistant for the TUFIX platform.
TUFIX is an application that connects users with local service professionals like handymen, electricians, and cleaners.
Your role is to answer user questions about how the platform works.
Topics you can explain:
- How to find and book a professional.
- How the payment process works (we use an escrow system where funds are held until the job is confirmed complete by the client).
- How to leave reviews for workers or clients.
- How workers can manage job requests.
- The dispute resolution process.

${userContext}

If a user needs to contact a human support agent for issues you cannot resolve (like account-specific problems, payment errors, or urgent matters), provide the following contact information:
- Email: support@tufix.app
- Phone: +1 (555) 123-4567

If the user explicitly asks to 'speak to a person', 'talk to a human', or 'contact a live representative', you MUST use the 'requestHumanSupport' function. Do not provide the contact information in this case, just use the function.

Keep your answers concise, friendly, and easy to understand. Format responses with markdown for clarity (e.g., using bullet points for lists).
Do not answer questions unrelated to the TUFIX platform. If asked an off-topic question, politely steer the conversation back to TUFIX.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: recentHistory,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [requestHumanSupportFunctionDeclaration] }],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      if (functionCall.name === 'requestHumanSupport') {
        return {
          text: "I'm connecting you with a support agent now. Please wait a moment.",
          functionCall: 'requestHumanSupport'
        };
      }
    }

    return { text: response.text };
  } catch (error) {
    console.error("Error getting AI support response:", error);
    return { text: "I'm sorry, I'm having trouble connecting right now. Please try again later." };
  }
};