
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

  async analyzeReviews(reviewsText: string): Promise<string> {
    if (!this.ai) {
        throw new Error("Gemini AI client is not initialized. Please check your API key.");
    }

    const model = 'gemini-2.5-flash';
    
    const systemPrompt = `
Persona: Vrhunski turistički iznajmljivač sa preko 10 godina iskustva.
Cilj: Izdvoji i analiziraj SVE recenzije iz teksta ispod.
Ograničenje: NIKADA NE PRIHVAĆAJ KRIVNJU/OPRAVDAVAJ. Transformiraj svaku kritiku u optimizam i priliku za poboljšanje.
Proces: Nakon izdvajanja svake pojedinačne recenzije, automatski generiraj odgovor na nju.
Format: Strogo sekvencijalno. Započni sa "Recenzija:", zatim na novi red "Odgovor:", pa na novi red "---" za separator.
Ton: Uključi bprofesionalnost i decentrnost i koristi frazu "što nije savršeno, zaboraviti, što je lijepo, zapamtiti" ili njene varijacije u odgovorima gdje je prikladno.
VAŽNO PRAVILO ZA FORMATIRANJE: Nakon svakog para 'Recenzija' i 'Odgovor', ubaci separator '---' na kraju.

Evo teksta sa recenzijama:
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
