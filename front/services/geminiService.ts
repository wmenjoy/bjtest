import { GoogleGenAI, Type } from "@google/genai";
import { TestCase, Priority, Status } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTestCase = async (description: string): Promise<Partial<TestCase> | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a scientific software test case based on this requirement: "${description}". 
      Include a title, a summary description, priority (Low, Medium, High, Critical), and a list of steps with expected results.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  instruction: { type: Type.STRING },
                  expectedResult: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const data = JSON.parse(text);
    
    // Map response to our internal structure
    return {
      title: data.title,
      description: data.description,
      priority: data.priority as Priority,
      status: Status.DRAFT,
      steps: data.steps.map((s: any, idx: number) => ({
        id: `step-${Date.now()}-${idx}`,
        instruction: s.instruction,
        expectedResult: s.expectedResult
      })),
      tags: ["AI-Generated"],
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error("Failed to generate test case:", error);
    return null;
  }
};

export const analyzeTestReport = async (executionSummary: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Service Unavailable";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following test execution summary and provide a brief risk assessment and suggestion for the next steps. Keep it under 50 words.
      Summary: ${executionSummary}`
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Analysis failed", error);
    return "Failed to analyze report.";
  }
};

export const chatWithCopilot = async (logs: string[], userMessage: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Service Unavailable";

  try {
    const context = logs.join("\n");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a QA Automation Expert assisting a developer.
      
      Context (Execution Logs):
      ${context}
      
      User Question: ${userMessage}
      
      Provide a concise, technical, and helpful answer.`
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat failed", error);
    return "Error communicating with AI service.";
  }
};