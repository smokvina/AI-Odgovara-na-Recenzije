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

  reviewsInput = signal<string>(`The location was excellent, right in the city center. However, the apartment was a bit noisy at night due to traffic. All in all, a solid stay.

The apartment was spotlessly clean and modernly furnished. The host was very friendly and gave us great recommendations for restaurants. The only complaint is that the Wi-Fi was slow from time to time. We will definitely be back!`);
  analysisResult = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  copiedIndex = signal<number | null>(null);
  selectedLanguage = signal<string>('English');

  readonly availableLanguages = ['English', 'Spanish', 'French', 'German', 'Croatian'];

  parsedResults = computed<AnalysisPair[]>(() => {
    const result = this.analysisResult();
    if (!result) return [];

    const pairs = result.split('---').filter(p => p.trim() !== '');
    return pairs.map(pair => {
      const reviewMarker = 'Review:';
      const responseMarker = 'Response:';
      
      const reviewIndex = pair.indexOf(reviewMarker);
      const responseIndex = pair.indexOf(responseMarker);

      if (reviewIndex === -1 || responseIndex === -1) {
        return { review: pair.trim(), response: 'Response format not recognized.' };
      }

      const review = pair.substring(reviewIndex + reviewMarker.length, responseIndex).trim();
      const response = pair.substring(responseIndex + responseMarker.length).trim();
      
      return { review, response };
    });
  });

  async analyzeReviews() {
    const currentInput = this.reviewsInput().trim();
    if (!currentInput) {
      this.error.set('Please enter review text to analyze.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.analysisResult.set(null);

    try {
      const result = await this.geminiService.analyzeReviews(currentInput, this.selectedLanguage());
      this.analysisResult.set(result);
    } catch (e: any) {
      this.error.set(e.message || 'An unknown error occurred.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onTextAreaInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.reviewsInput.set(target.value);
  }

  onLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedLanguage.set(target.value);
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
      this.error.set('Could not copy text. Please check browser permissions.');
    });
  }
}