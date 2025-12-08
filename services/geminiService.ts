import { GoogleGenAI, Type } from "@google/genai";
import { UploadedFile, MaintenanceItem } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is set
const ai = new GoogleGenAI({ apiKey });

// Helper to get the right model based on task complexity
const getModel = (isComplex: boolean = false) => {
  // Using flash for general speed and context, pro for complex reasoning if needed
  // Per instructions: 'gemini-2.5-flash' for basic, 'gemini-3-pro-preview' for complex
  return isComplex ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
};

export const streamResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  files: UploadedFile[],
  newMessage: string,
  onChunk: (text: string) => void
) => {
  try {
    const modelId = getModel(false);
    
    // Construct the content with files for the *current* message context
    // In a real chat loop with the SDK, we usually add history. 
    // However, the SDK's chat.sendMessageStream handles history state if using chat.
    // But since we need to attach large files (manuals) to the context, 
    // it's best to treat the files as part of the system context or the first message.
    
    // We will use the 'generateContentStream' approach with a constructed history for flexibility with file attachments
    // as the Chat object manages history but adding heavy files to every request can be tricky depending on implementation.
    // The robust way for "Chat with PDF" is sending the file in the first turn or system instruction context isn't fully supported for files.
    // We will send the file in the `contents` of the request.

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

    // Attach files to the user's latest message if they haven't been "seen" yet, 
    // or typically we attach them to the first message. 
    // For this stateless-ish implementation, we'll attach files to the *current* request content 
    // if it's the first message, or we rely on the caching/context window of the model.
    // To ensure reliability without a backend vector store, we attach the file data to the request.
    
    if (files.length > 0 && history.length === 0) {
        files.forEach(file => {
            currentParts.unshift({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.data
                }
            });
        });
    } else if (files.length > 0) {
       // If history exists, we assume the model *should* have context, 
       // but strictly speaking, standard REST API needs context re-sent or cached.
       // For this demo, we will re-send the file data in the system instruction or first message
       // effectively to ensure the model "sees" the manual every time without vector DB.
       // Re-sending base64 for large PDFs every turn is heavy but necessary for a purely client-side "Chat with PDF" 
       // without a session ID/caching mechanism actively managed here.
       // OPTIMIZATION: We will insert the file into the latest message parts for the context.
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
        temperature: 0.2, // Low temperature for factual manual interpretation
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
            model: 'gemini-2.5-flash',
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
