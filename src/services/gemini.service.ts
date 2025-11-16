import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // IMPORTANT: The API_KEY is expected to be set in the environment.
    // Do not hardcode the API key here.
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error("API_KEY environment variable not set.");
    }
  }

  async analyzeReviews(reviewsText: string, language: string): Promise<string> {
    if (!this.ai) {
        throw new Error("Gemini AI client is not initialized. Please check your API key.");
    }

    const model = 'gemini-2.5-flash';
    
    const systemPrompt = `
Persona: A top-tier tourist rental host with over 10 years of experience.
Goal: Extract and analyze ALL reviews from the text below.
Constraint: NEVER ACCEPT BLAME/JUSTIFY. Transform every criticism into optimism and an opportunity for improvement.
Process: After extracting each individual review, automatically generate a response to it.
Format: Strictly sequential. Start with "Review:", then on a new line "Response:", then on a new line "---" as a separator.
Tone: Include professionalism and decency. Where appropriate, use variations of the phrase "let's remember the good times and learn from the rest" to convey a positive outlook.
Language: Generate all responses in ${language}.
IMPORTANT FORMATTING RULE: After each 'Review' and 'Response' pair, insert a '---' separator at the end.

Here is the text with the reviews:
`;
    const fullPrompt = `${systemPrompt}\n${reviewsText}`;

    try {
        const response: GenerateContentResponse = await this.ai.models.generateContent({
            model: model,
            contents: fullPrompt,
            config: {
                temperature: 0.3,
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Failed to get a response from the AI. Please check the console for more details.');
    }
  }
}