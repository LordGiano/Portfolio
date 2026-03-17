import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslationService, Language } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface NetworkNode {
  x: number;
  y: number;
  z: number;          // depth (0.4–1.0) for parallax + size scaling
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pulse: number;       // phase for pulsing glow
  pulseSpeed: number;
}

interface LanguageSkill {
  name: string;
  level: string;
  flag: string;
  percent: number;
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

  // Network node system
  private nodes: NetworkNode[] = [];
  private animationId: any;
  private ctx!: CanvasRenderingContext2D;
  private canvasW = 0;
  private canvasH = 0;

  // Mouse tracking – pixel coords relative to canvas; null = mouse outside hero
  private mouseCanvasX: number | null = null;
  private mouseCanvasY: number | null = null;
  // Normalised 0‑1 coords for parallax (default center)
  private mouseNormX = 0.5;
  private mouseNormY = 0.5;
  private mouseInsideHero = false;

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
      company: 'Ericsson Magyarország Kft.',
      roleKey: 'home.exp_role_1',
      periodKey: 'home.exp_period_1',
      type: 'full-time',
      typeKey: 'home.exp_type_fulltime',
      techs: ['Java', 'Spring Boot', 'Python', 'Docker', 'Kubernetes']
    },
    {
      company: 'Master Consulting Kft.',
      roleKey: 'home.exp_role_2',
      periodKey: 'home.exp_period_2',
      type: 'full-time',
      typeKey: 'home.exp_type_fulltime',
      techs: ['Angular', 'Python', 'MSSQL']
    },
    {
      company: 'Robert Bosch Kft.',
      roleKey: 'home.exp_role_3',
      periodKey: 'home.exp_period_3',
      type: 'internship',
      typeKey: 'home.exp_type_internship',
      techs: ['Angular', 'C#', 'MSSQL', 'ISTQB']
    }
  ];

  // ——— Tech Stack Marquee ———
  techStackItems = [
    // ── web alap ──
    { id: 'html5',      name: 'HTML5',      icon: 'html5.svg' },
    { id: 'css3',       name: 'CSS3',       icon: 'css3.svg' },
    { id: 'javascript', name: 'JavaScript', icon: 'javascript.svg' },
    // ── Angular ökoszisztéma ──
    { id: 'typescript', name: 'TypeScript', icon: 'typescript.svg' },
    { id: 'angular',    name: 'Angular',    icon: 'angular.svg' },
    // ── .NET ökoszisztéma ──
    { id: 'csharp',     name: 'C#',         icon: 'csharp.svg' },
    { id: 'dotnet',     name: '.NET',       icon: 'dotnet.svg' },
    // ── JVM → mobile ──
    { id: 'java',       name: 'Java',       icon: 'java.svg' },
    { id: 'kotlin',     name: 'Kotlin',     icon: 'kotlin.svg' },
    { id: 'android',    name: 'Android',    icon: 'android.svg' },
    // ── CV / AI ──
    { id: 'python',     name: 'Python',     icon: 'python.svg' },
    { id: 'opencv',     name: 'OpenCV',     icon: 'opencv.svg' },
    // ── adatbázisok ──
    { id: 'mssql',      name: 'MSSQL',      icon: 'mssql.svg' },
    { id: 'mysql',      name: 'MySQL',      icon: 'mysql.svg' },
    // ── infra / DevOps ──
    { id: 'firebase',   name: 'Firebase',   icon: 'firebase.svg' },
    { id: 'docker',     name: 'Docker',     icon: 'docker.svg' },
    { id: 'git',        name: 'Git',        icon: 'git.svg' },
    { id: 'linux',      name: 'Linux',      icon: 'linux.svg' },
    // ── módszertan ──
    { id: 'istqb',      name: 'ISTQB',      icon: 'istqb.svg' },
  ];

  // ——— Language Skills ———
  languages: LanguageSkill[] = [];

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(lang => {
      this.onLanguageChange(lang);
    });
  }

  ngAfterViewInit(): void {
    this.initNodeNetwork();
    this.setupIntersectionObserver();
    this.attachHeroMouseListeners();
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

    this.loadLanguages();
  }

  private loadLanguages(): void {
    const t = (key: string) => this.translationService.translate(key);
    this.languages = [
      { name: t('home.lang_hu'), level: t('home.lang_native'), flag: '🇭🇺', percent: 100, color: '#22C55E' },
      { name: t('home.lang_en'), level: 'C1', flag: '🇬🇧', percent: 85, color: '#3B82F6' },
      { name: t('home.lang_de'), level: 'B2', flag: '🇩🇪', percent: 65, color: '#F59E0B' },
      { name: t('home.lang_es'), level: 'B1', flag: '🇪🇸', percent: 50, color: '#EF4444' }
    ];
  }

  getRingDash(percent: number): string {
    const circumference = 2 * Math.PI * 58;
    const filled = (percent / 100) * circumference;
    return `${filled} ${circumference}`;
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

  // ──────────────────────────────────────────────
  //  Canvas resize
  // ──────────────────────────────────────────────
  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvasToParent();
  }

  private resizeCanvasToParent(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.canvasW = w;
    this.canvasH = h;
  }

  // ──────────────────────────────────────────────
  //  Mouse tracking — only inside hero-section
  // ──────────────────────────────────────────────
  private attachHeroMouseListeners(): void {
    const heroEl = this.canvasRef?.nativeElement?.closest('.hero-section') as HTMLElement | null;
    if (!heroEl) return;

    heroEl.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = heroEl.getBoundingClientRect();
      this.mouseCanvasX = e.clientX - rect.left;
      this.mouseCanvasY = e.clientY - rect.top;
      this.mouseNormX = (e.clientX - rect.left) / rect.width;
      this.mouseNormY = (e.clientY - rect.top) / rect.height;
      this.mouseInsideHero = true;
    });

    heroEl.addEventListener('mouseleave', () => {
      this.mouseInsideHero = false;
      this.mouseCanvasX = null;
      this.mouseCanvasY = null;
      // Keep last norm for parallax so it doesn't snap
    });
  }

  // ──────────────────────────────────────────────
  //  Node network initialisation
  // ──────────────────────────────────────────────
  private initNodeNetwork(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvasToParent();

    // Site palette: primary blue, accent purple, light blue, lavender, emerald, cyan
    const colors = ['#2563EB', '#7C3AED', '#60A5FA', '#A78BFA', '#34D399', '#06B6D4'];
    // Dense coverage — many small dots filling the hero
    const count = Math.min(Math.floor((this.canvasW * this.canvasH) / 4500), 160);

    this.nodes = [];
    for (let i = 0; i < count; i++) {
      this.nodes.push({
        x: Math.random() * this.canvasW,
        y: Math.random() * this.canvasH,
        z: Math.random() * 0.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.018
      });
    }

    this.animateNetwork();
  }

  // ──────────────────────────────────────────────
  //  Render loop
  // ──────────────────────────────────────────────
  private animateNetwork(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;

    const w = this.canvasW;
    const h = this.canvasH;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // --- Update nodes ---
    for (const n of this.nodes) {
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += n.pulseSpeed;

      // Parallax offset from mouse (normalised)
      const px = (this.mouseNormX - 0.5) * 25 * n.z;
      const py = (this.mouseNormY - 0.5) * 25 * n.z;
      (n as any)._dx = n.x + px;
      (n as any)._dy = n.y + py;

      // Wrap edges with margin
      if (n.x < -40) n.x = w + 40;
      if (n.x > w + 40) n.x = -40;
      if (n.y < -40) n.y = h + 40;
      if (n.y > h + 40) n.y = -40;
    }

    // --- Draw connections between nodes ---
    const maxDist = 160;
    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      const ax = (a as any)._dx;
      const ay = (a as any)._dy;
      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        const bx = (b as any)._dx;
        const by = (b as any)._dy;
        const dx = ax - bx;
        const dy = ay - by;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.4;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = `rgba(124,58,237,${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // --- Mouse connections (only when inside hero) ---
    if (this.mouseInsideHero && this.mouseCanvasX !== null && this.mouseCanvasY !== null) {
      const mx = this.mouseCanvasX;
      const my = this.mouseCanvasY;
      const mouseReach = 200;

      for (const n of this.nodes) {
        const nx = (n as any)._dx;
        const ny = (n as any)._dy;
        const dx = nx - mx;
        const dy = ny - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseReach) {
          const alpha = (1 - dist / mouseReach) * 0.45;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(6,182,212,${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    // --- Draw node dots ---
    for (const n of this.nodes) {
      const nx = (n as any)._dx;
      const ny = (n as any)._dy;
      const pulseR = Math.sin(n.pulse) * 0.5;
      const r = Math.max(0.1, (n.radius + pulseR) * n.z);

      // Outer glow
      const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 3.5);
      grd.addColorStop(0, n.color + '28');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(nx, ny, r * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();

      // Inner highlight (small white center)
      ctx.beginPath();
      ctx.arc(nx, ny, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    }

    this.animationId = requestAnimationFrame(() => this.animateNetwork());
  }

  // ──────────────────────────────────────────────
  //  Typing animation
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  //  Intersection observer
  // ──────────────────────────────────────────────
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
