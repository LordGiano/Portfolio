import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  TranslationService,
  Language,
  LanguageOption
} from '../../services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css'
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  isOpen = false;
  currentLang: LanguageOption;
  languages: LanguageOption[];

  private langSub!: Subscription;

  constructor(
    private translationService: TranslationService,
    private elRef: ElementRef
  ) {
    this.languages = this.translationService.languages;
    this.currentLang = this.translationService.getCurrentLanguageOption();
  }

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(() => {
      this.currentLang = this.translationService.getCurrentLanguageOption();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  select(lang: LanguageOption): void {
    this.translationService.setLanguage(lang.code);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen = false;
  }
}
