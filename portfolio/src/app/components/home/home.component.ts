import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslationService, Language } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    TranslatePipe
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Typing animation
  typedText = '';
  private fullTexts: string[] = [];
  currentTextIndex = 0;
  charIndex = 0;
  isDeleting = false;
  typingSpeed = 80;
  private typingTimer: any;

  // Language
  showRoleSuffix = true;
  private langSub!: Subscription;

  // Particle system
  private particles: Particle[] = [];
  private animationId: any;
  private ctx!: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;

  // Counter animations
  yearsExperience = 0;
  projectsCompleted = 0;
  technologiesUsed = 0;
  languagesSpoken = 0;
  private counterAnimated = false;

  // Scroll reveal
  visibleSections = new Set<string>();

  // Skills data — titleKey and descKey reference translation keys
  competencies = [
    {
      icon: 'web',
      titleKey: 'home.comp_frontend',
      descKey: 'home.comp_frontend_desc',
      techs: ['Angular', 'TypeScript', 'HTML5/CSS3', 'Material Design'],
      color: '#2563EB',
      gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)'
    },
    {
      icon: 'terminal',
      titleKey: 'home.comp_backend',
      descKey: 'home.comp_backend_desc',
      techs: ['Python', 'C#', '.NET', 'REST API'],
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669, #10B981)'
    },
    {
      icon: 'storage',
      titleKey: 'home.comp_database',
      descKey: 'home.comp_database_desc',
      techs: ['MSSQL', 'MySQL', 'Firebase', 'NoSQL'],
      color: '#D97706',
      gradient: 'linear-gradient(135deg, #D97706, #F59E0B)'
    },
    {
      icon: 'visibility',
      titleKey: 'home.comp_cv',
      descKey: 'home.comp_cv_desc',
      techs: ['OpenCV', 'MediaPipe', 'Python', this.getMLTechLabel()],
      color: '#7C3AED',
      gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)'
    },
    {
      icon: 'bug_report',
      titleKey: 'home.comp_qa',
      descKey: 'home.comp_qa_desc',
      techs: ['ISTQB', 'Manual Testing', 'Agile/Scrum', 'CI/CD'],
      color: '#DC2626',
      gradient: 'linear-gradient(135deg, #DC2626, #EF4444)'
    },
    {
      icon: 'devices',
      titleKey: 'home.comp_devops',
      descKey: 'home.comp_devops_desc',
      techs: ['Git', 'Docker', 'Firebase', 'VS Code'],
      color: '#0891B2',
      gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)'
    }
  ];

  experienceHighlights = [
    {
      company: 'Master Consulting Kft.',
      roleKey: 'home.exp_role_1',
      periodKey: 'home.exp_period_1',
      type: 'full-time',
      typeKey: 'home.exp_type_fulltime',
      techs: ['Angular', 'Python', 'MSSQL']
    },
    {
      company: 'NetAdClick Kft.',
      roleKey: 'home.exp_role_2',
      periodKey: 'home.exp_period_2',
      type: 'contract',
      typeKey: 'home.exp_type_contract',
      techs: ['Angular', 'Python', 'MySQL']
    },
    {
      company: 'Robert Bosch Kft.',
      roleKey: 'home.exp_role_3',
      periodKey: 'home.exp_period_3',
      type: 'internship',
      typeKey: 'home.exp_type_internship',
      techs: ['Angular', 'C#', 'MSSQL', 'ISTQB']
    },
    {
      company: 'e-track Informatikai Kft.',
      roleKey: 'home.exp_role_4',
      periodKey: 'home.exp_period_4',
      type: 'full-time',
      typeKey: 'home.exp_type_fulltime',
      techs: ['C#', 'MSSQL', 'WinForms']
    }
  ];

  // ——— Tech Stack Marquee ———
  // id is used as CSS class suffix for per-tech coloring (no CSS variable binding issues)
  techStackItems = [
    { id: 'angular',    name: 'Angular',    icon: 'angular.svg' },
    { id: 'typescript', name: 'TypeScript', icon: 'typescript.svg' },
    { id: 'python',     name: 'Python',     icon: 'python.svg' },
    { id: 'csharp',     name: 'C#',         icon: 'csharp.svg' },
    { id: 'dotnet',     name: '.NET',       icon: 'dotnet.svg' },
    { id: 'html5',      name: 'HTML5',      icon: 'html5.svg' },
    { id: 'css3',       name: 'CSS3',       icon: 'css3.svg' },
    { id: 'firebase',   name: 'Firebase',   icon: 'firebase.svg' },
    { id: 'docker',     name: 'Docker',     icon: 'docker.svg' },
    { id: 'git',        name: 'Git',        icon: 'git.svg' },
    { id: 'mssql',      name: 'MSSQL',      icon: 'mssql.svg' },
    { id: 'mysql',      name: 'MySQL',      icon: 'mysql.svg' },
    { id: 'opencv',     name: 'OpenCV',     icon: 'opencv.svg' },
    { id: 'istqb',      name: 'ISTQB',      icon: 'istqb.svg' },
    { id: 'linux',      name: 'Linux',      icon: 'linux.svg' },
  ];

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(lang => {
      this.onLanguageChange(lang);
    });
  }

  ngAfterViewInit(): void {
    this.initParticleCanvas();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.typingTimer) clearTimeout(this.typingTimer);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.langSub?.unsubscribe();
  }

  private onLanguageChange(lang: Language): void {
    this.showRoleSuffix = (lang === 'hu');

    this.fullTexts = [
      this.translationService.translate('home.typed_1'),
      this.translationService.translate('home.typed_2'),
      this.translationService.translate('home.typed_3'),
      this.translationService.translate('home.typed_4')
    ];

    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typedText = '';
    this.currentTextIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.startTypingAnimation();
  }

  downloadCV(): void {
    const lang = this.translationService.currentLang;

    const cvFiles: Record<string, string> = {
      'hu': '/assets/documents/cv-hu.pdf',
      'en': '/assets/documents/cv-en.pdf',
      'de': '/assets/documents/cv-de.pdf',
      'es': '/assets/documents/cv-es.pdf'
    };

    const cvUrl = cvFiles[lang] || cvFiles['en'];

    const fileNames: Record<string, string> = {
      'hu': 'Szabó_Norbert_önéletrajz.pdf',
      'en': 'Norbert_Szabó_CV.pdf',
      'de': 'Norbert_Szabó_Lebenslauf.pdf',
      'es': 'Norbert_Szabó_CV.pdf'
    };

    const link = document.createElement('a');
    link.href = cvUrl;
    link.download = fileNames[lang] || fileNames['en'];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private getMLTechLabel(): string {
    return 'ML';
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.canvasRef) {
      const canvas = this.canvasRef.nativeElement;
      canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  private startTypingAnimation(): void {
    if (!this.fullTexts.length) return;

    const currentFull = this.fullTexts[this.currentTextIndex];

    if (!this.isDeleting) {
      this.typedText = currentFull.substring(0, this.charIndex + 1);
      this.charIndex++;

      if (this.charIndex === currentFull.length) {
        this.isDeleting = true;
        this.typingTimer = setTimeout(() => this.startTypingAnimation(), 2000);
        return;
      }
    } else {
      this.typedText = currentFull.substring(0, this.charIndex - 1);
      this.charIndex--;

      if (this.charIndex === 0) {
        this.isDeleting = false;
        this.currentTextIndex = (this.currentTextIndex + 1) % this.fullTexts.length;
      }
    }

    const speed = this.isDeleting ? 40 : this.typingSpeed;
    this.typingTimer = setTimeout(() => this.startTypingAnimation(), speed);
  }

  private initParticleCanvas(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.offsetHeight || 700;

    const colors = ['#2563EB', '#4F46E5', '#7C3AED', '#3B82F6', '#06B6D4'];
    const count = Math.min(80, Math.floor(canvas.width / 15));

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    this.animateParticles();
  }

  private animateParticles(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = this.particles[i].color;
          this.ctx.globalAlpha = (1 - dist / 120) * 0.15;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }

    this.ctx.globalAlpha = 1;
    this.animationId = requestAnimationFrame(() => this.animateParticles());
  }

  private setupIntersectionObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) this.visibleSections.add(id);

            if (id === 'stats' && !this.counterAnimated) {
              this.counterAnimated = true;
              this.animateCounters();
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    setTimeout(() => {
      document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    }, 100);
  }

  private animateCounters(): void {
    this.animateValue('yearsExperience', 0, 3, 1500);
    this.animateValue('projectsCompleted', 0, 10, 1800);
    this.animateValue('technologiesUsed', 0, 15, 2000);
    this.animateValue('languagesSpoken', 0, 4, 1200);
  }

  private animateValue(prop: string, start: number, end: number, duration: number): void {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      (this as any)[prop] = Math.round(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  isSectionVisible(id: string): boolean {
    return this.visibleSections.has(id);
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}
