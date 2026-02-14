import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    LanguageSwitcherComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isScrolled = false;
  isSidebarOpen = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 40;
  }

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.isSidebarOpen) {
      this.closeSidebar();
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.updateBodyScroll();
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    this.updateBodyScroll();
  }

  private updateBodyScroll(): void {
    document.body.style.overflow = this.isSidebarOpen ? 'hidden' : '';
  }
}
