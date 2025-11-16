
import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';

interface AnalysisPair {
  review: string;
  response: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  reviewsInput = signal<string>(`Lokacija je bila odlična, u samom centru grada. Međutim, apartman je bio malo bučan noću zbog prometa. Sve u svemu, solidan boravak.

Apartman je bio besprijekorno čist i moderno uređen. Domaćin je bio vrlo ljubazan i dao nam je odlične preporuke za restorane. Jedina zamjerka je što je Wi-Fi bio spor s vremena na vrijeme. Vratit ćemo se sigurno!`);
  analysisResult = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  copiedIndex = signal<number | null>(null);

  parsedResults = computed<AnalysisPair[]>(() => {
    const result = this.analysisResult();
    if (!result) return [];

    const pairs = result.split('---').filter(p => p.trim() !== '');
    return pairs.map(pair => {
      const reviewMarker = 'Recenzija:';
      const responseMarker = 'Odgovor:';
      
      const reviewIndex = pair.indexOf(reviewMarker);
      const responseIndex = pair.indexOf(responseMarker);

      if (reviewIndex === -1 || responseIndex === -1) {
        return { review: pair.trim(), response: 'Format odgovora nije prepoznat.' };
      }

      const review = pair.substring(reviewIndex + reviewMarker.length, responseIndex).trim();
      const response = pair.substring(responseIndex + responseMarker.length).trim();
      
      return { review, response };
    });
  });

  async analyzeReviews() {
    const currentInput = this.reviewsInput().trim();
    if (!currentInput) {
      this.error.set('Molimo unesite tekst recenzija za analizu.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.analysisResult.set(null);

    try {
      const result = await this.geminiService.analyzeReviews(currentInput);
      this.analysisResult.set(result);
    } catch (e: any) {
      this.error.set(e.message || 'Došlo je do nepoznate pogreške.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onTextAreaInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.reviewsInput.set(target.value);
  }

  copyResponse(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedIndex.set(index);
      setTimeout(() => {
        if (this.copiedIndex() === index) {
          this.copiedIndex.set(null);
        }
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      this.error.set('Kopiranje nije uspjelo. Provjerite dozvole u pregledniku.');
    });
  }
}
