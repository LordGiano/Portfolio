import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import hu from '../../assets/i18n/hu.json';
import en from '../../assets/i18n/en.json';
import de from '../../assets/i18n/de.json';
import es from '../../assets/i18n/es.json';

export type Language = 'hu' | 'en' | 'de' | 'es';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

const TRANSLATIONS: Record<Language, any> = { hu, en, de, es };

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'selectedLanguage';
  private readonly DEFAULT_LANG: Language = 'hu';

  readonly languages: LanguageOption[] = [
    { code: 'hu', name: 'Magyar',  flag: 'assets/flags/hu.svg' },
    { code: 'en', name: 'English', flag: 'assets/flags/gb.svg' },
    { code: 'de', name: 'Deutsch', flag: 'assets/flags/de.svg' },
    { code: 'es', name: 'Español', flag: 'assets/flags/es.svg' }
  ];

  private currentLang$ = new BehaviorSubject<Language>(this.getInitialLanguage());

  /** Reaktív nyelvi állapot — komponensek subscribe-olnak rá */
  get language$(): Observable<Language> {
    return this.currentLang$.asObservable();
  }

  /** Szinkron lekérés */
  get currentLang(): Language {
    return this.currentLang$.value;
  }

  /** Nyelv váltása — minden feliratkozó automatikusan frissül */
  setLanguage(lang: Language): void {
    this.currentLang$.next(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }

  /** Fordítás lekérése pont-szeparált kulcs alapján: 'nav.home' */
  translate(key: string): string {
    const result = this.resolve(key, this.currentLang);
    if (result !== undefined) return result;

    // Fallback magyar nyelvre
    const fallback = this.resolve(key, this.DEFAULT_LANG);
    if (fallback !== undefined) return fallback;

    // Ha sehol sincs, visszaadjuk a kulcsot
    console.warn(`[i18n] Missing key: "${key}" for lang: "${this.currentLang}"`);
    return key;
  }

  /** Aktuális nyelv opció objektum */
  getCurrentLanguageOption(): LanguageOption {
    return this.languages.find(l => l.code === this.currentLang) || this.languages[0];
  }

  // ── Privát segédfüggvények ──

  private getInitialLanguage(): Language {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Language;
    if (saved && this.languages.some(l => l.code === saved)) {
      return saved;
    }
    return this.DEFAULT_LANG;
  }

  private resolve(key: string, lang: Language): string | undefined {
    const parts = key.split('.');
    let current: any = TRANSLATIONS[lang];

    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = current[part];
    }

    return typeof current === 'string' ? current : undefined;
  }
}
