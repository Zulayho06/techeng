import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Word } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getNewWords(level: string = "beginner"): Promise<Word[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 English words for ${level} level with their Uzbek translations, simple definitions in English, an example sentence, and a short visual description (visualPrompt) for an AI image generator.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              english: { type: Type.STRING },
              uzbek: { type: Type.STRING },
              definition: { type: Type.STRING },
              example: { type: Type.STRING },
              visualPrompt: { type: Type.STRING, description: "A descriptive prompt for an image generator to illustrate this word." },
            },
            required: ["english", "uzbek", "definition", "example", "visualPrompt"],
          },
        },
      },
    });

    const words: Word[] = JSON.parse(response.text || "[]");
    
    // Generate images for each word in parallel
    const wordsWithImages = await Promise.all(words.map(async (word) => {
      try {
        const imageUrl = await generateImage(word.visualPrompt);
        return { ...word, imageUrl };
      } catch (e) {
        console.error("Image generation failed for", word.english, e);
        return word;
      }
    }));

    return wordsWithImages;
  } catch (error) {
    console.error("Error fetching words:", error);
    return [
      { english: "Apple", uzbek: "Olma", definition: "A round fruit with red or green skin.", example: "I eat an apple every day.", visualPrompt: "A fresh red apple on a wooden table", imageUrl: "https://picsum.photos/seed/apple/400/400" },
      { english: "Book", uzbek: "Kitob", definition: "A set of printed pages bound together.", example: "She is reading an interesting book.", visualPrompt: "An open old book with glowing pages", imageUrl: "https://picsum.photos/seed/book/400/400" },
    ];
  }
}

export async function getPronunciation(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/mp3;base64,${base64Audio}`;
  }
  throw new Error("Failed to generate audio");
}

async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Simple, clean, educational illustration of: ${prompt}. White background, minimalist style.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image data found in response");
}
