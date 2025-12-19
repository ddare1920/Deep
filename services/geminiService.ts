
import { GoogleGenAI, Type } from "@google/genai";
import { UploadedFile, MaintenanceItem } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper to get the right model based on task complexity
const getModel = (isComplex: boolean = false) => {
  return isComplex ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
};

export const streamResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  files: UploadedFile[],
  newMessage: string,
  onChunk: (text: string) => void
) => {
  try {
    const modelId = getModel(false);
    const contents = [];

    // Add history
    history.forEach(msg => {
      contents.push({
        role: msg.role,
        parts: msg.parts
      });
    });

    // Prepare current message parts
    const currentParts: any[] = [{ text: newMessage }];

    // Attach files to the user's latest message
    if (files.length > 0) {
       files.forEach(file => {
           currentParts.unshift({
               inlineData: {
                   mimeType: file.mimeType,
                   data: file.data
               }
           });
       });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // Even lower for strictly factual manual lookups
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    onChunk("\n\n**Error:** Unable to process request. Please check your API key or file size.");
  }
};

export const extractMaintenanceData = async (files: UploadedFile[]): Promise<MaintenanceItem[]> => {
    if (files.length === 0) return [];
    
    try {
        const parts: any[] = [{ text: "Extract all preventive maintenance tasks from this manual. Return JSON format with fields: component, interval, task, priority (High/Medium/Low)." }];
        
        files.forEach(file => {
            parts.unshift({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.data
                }
            });
        });

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { role: 'user', parts },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            component: { type: Type.STRING },
                            interval: { type: Type.STRING },
                            task: { type: Type.STRING },
                            priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
                        }
                    }
                }
            }
        });

        return JSON.parse(response.text || '[]');
    } catch (e) {
        console.error("Extraction error", e);
        return [];
    }
}
