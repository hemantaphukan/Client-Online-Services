import { GoogleGenAI } from "@google/genai";
import { Service } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize the client only if the key exists, otherwise handle gracefully in the app
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getServiceRecommendation = async (
  userQuery: string,
  availableServices: Service[]
): Promise<string> => {
  if (!ai) {
    return "I'm sorry, the AI assistant is currently unavailable (Missing API Key). Please contact support.";
  }

  try {
    const servicesContext = availableServices
      .map(s => `- ${s.name} (₹${s.price.toLocaleString('en-IN')} INR): ${s.description}`)
      .join('\n');

    const prompt = `
      You are a helpful customer service agent for "ServiceMaster Pro".
      
      Here is a list of our available services:
      ${servicesContext}

      A customer has asked: "${userQuery}"

      Please provide a helpful, friendly, and concise recommendation based *only* on our available services. 
      If no service fits, politely suggest contacting manual support.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error while processing your request. Please try again later.";
  }
};