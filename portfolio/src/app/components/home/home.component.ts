import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

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
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Typing animation
  typedText = '';
  fullTexts = [
    'Full Stack Fejlesztő',
    'Angular Szakértő',
    'Python Fejlesztő',
    'Computer Vision Kutató'
  ];
  currentTextIndex = 0;
  charIndex = 0;
  isDeleting = false;
  typingSpeed = 80;
  private typingTimer: any;

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

  // Skills data
  competencies = [
    {
      icon: 'web',
      title: 'Frontend Fejlesztés',
      description: 'Modern, reszponzív webalkalmazások fejlesztése enterprise szinten',
      techs: ['Angular', 'TypeScript', 'HTML5/CSS3', 'Material Design'],
      color: '#2563EB',
      gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)'
    },
    {
      icon: 'terminal',
      title: 'Backend Fejlesztés',
      description: 'Skálázható szerver oldali alkalmazások és API-k tervezése',
      techs: ['Python', 'C#', '.NET', 'REST API'],
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669, #10B981)'
    },
    {
      icon: 'storage',
      title: 'Adatbázis-kezelés',
      description: 'Komplex adatbázis sémák tervezése és optimalizálása',
      techs: ['MSSQL', 'MySQL', 'Firebase', 'NoSQL'],
      color: '#D97706',
      gradient: 'linear-gradient(135deg, #D97706, #F59E0B)'
    },
    {
      icon: 'visibility',
      title: 'Képfeldolgozás & CV',
      description: 'Számítógépes látás és képelemzés kutatási szintű megvalósítása',
      techs: ['OpenCV', 'MediaPipe', 'Python', 'Gépi tanulás'],
      color: '#7C3AED',
      gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)'
    },
    {
      icon: 'bug_report',
      title: 'QA & Tesztelés',
      description: 'Szoftverminőség biztosítása ISTQB szabványok szerint',
      techs: ['ISTQB', 'Manuális tesztelés', 'Agile/Scrum', 'CI/CD'],
      color: '#DC2626',
      gradient: 'linear-gradient(135deg, #DC2626, #EF4444)'
    },
    {
      icon: 'devices',
      title: 'DevOps & Eszközök',
      description: 'Modern fejlesztői munkafolyamatok és eszközök használata',
      techs: ['Git', 'Docker', 'Firebase', 'VS Code'],
      color: '#0891B2',
      gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)'
    }
  ];

  experienceHighlights = [
    {
      company: 'Master Consulting Kft.',
      role: 'Szoftverfejlesztő',
      period: '2025 júl. – jelen',
      type: 'full-time',
      techs: ['Angular', 'Python', 'MSSQL']
    },
    {
      company: 'NetAdClick Kft.',
      role: 'Szoftverfejlesztő',
      period: '2025 jan. – máj.',
      type: 'contract',
      techs: ['Angular', 'Python', 'MySQL']
    },
    {
      company: 'Robert Bosch Kft.',
      role: 'Fejlesztő & Tesztelő Gyakornok',
      period: '2023 feb. – 2024 dec.',
      type: 'internship',
      techs: ['Angular', 'C#', 'MSSQL', 'ISTQB']
    },
    {
      company: 'e-track Informatikai Kft.',
      role: 'Szoftverfejlesztő',
      period: '2021 nov. – 2023 jan.',
      type: 'full-time',
      techs: ['C#', 'MSSQL', 'WinForms']
    }
  ];

  ngOnInit(): void {
    this.startTypingAnimation();
  }

  ngAfterViewInit(): void {
    this.initParticleCanvas();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.typingTimer) clearTimeout(this.typingTimer);
    if (this.animationId) cancelAnimationFrame(this.animationId);
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

  // --- Typing animation ---
  private startTypingAnimation(): void {
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

  // --- Particle canvas ---
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

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();
    }

    // Draw connections
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

  // --- Intersection observer for scroll reveal & counter ---
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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
