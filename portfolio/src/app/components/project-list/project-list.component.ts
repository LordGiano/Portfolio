import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  technologies: string[];
  category: string;
  status: 'completed' | 'in-progress' | 'planned';
  featured: boolean;
  icon: string;
  color: string;
  gradient: string;
  date: string;
  githubUrl?: string;
  highlights?: string[];
}

interface OrbitParticle {
  angle: number;
  label: string;
  color: string;
  size: number;
}

interface Orbit {
  radius: number;
  tilt: number;
  rotationSpeed: number;
  particles: OrbitParticle[];
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ProjectListComponent implements OnInit, OnDestroy, AfterViewInit {

  private langSub!: Subscription;
  visibleSections = new Set<string>();
  selectedCategory = 'all';

  categories = ['all', 'Computer Vision', 'Mobile', 'Web'];
  projects: Project[] = [];

  // Orbits state
  private orbitsAnimId: number | null = null;
  private orbits: Orbit[] = [];
  private orbitsMouse = { x: 0.5, y: 0.5 };
  private orbitsMouseTarget = { x: 0.5, y: 0.5 };
  private heroStarted = false;

  constructor(
    private translationService: TranslationService,
    private ngZone: NgZone,
    private elRef: ElementRef
  ) {}

  private el(selector: string): HTMLElement | null {
    return this.elRef.nativeElement.querySelector(selector);
  }

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(() => this.loadData());
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    if (this.orbitsAnimId) cancelAnimationFrame(this.orbitsAnimId);
    window.removeEventListener('resize', this.onResize);
    const wrap = this.el('.hero-orbits-wrap');
    if (wrap) wrap.removeEventListener('mousemove', this.onOrbitsMouseMove);
  }

  // ====================
  // INTERSECTION OBSERVER
  // ====================
  private setupIntersectionObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) {
              this.visibleSections.add(id);
              if (id === 'hero' && !this.heroStarted) {
                this.heroStarted = true;
                setTimeout(() => this.initOrbits(), 300);
              }
            }
          }
        });
      },
      { threshold: 0.1 }
    );
    setTimeout(() => {
      this.elRef.nativeElement.querySelectorAll('[data-section]').forEach((el: Element) => observer.observe(el));
    }, 100);
  }

  isSectionVisible(name: string): boolean {
    return this.visibleSections.has(name);
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
  }

  get filteredProjects(): Project[] {
    if (this.selectedCategory === 'all') return this.projects;
    return this.projects.filter(p => p.category === this.selectedCategory);
  }

  get featuredProjects(): Project[] {
    return this.filteredProjects.filter(p => p.featured);
  }

  get otherProjects(): Project[] {
    return this.filteredProjects.filter(p => !p.featured);
  }

  getStatusLabel(status: string): string {
    const t = (key: string) => this.translationService.translate(key);
    switch (status) {
      case 'completed': return t('proj.status_completed');
      case 'in-progress': return t('proj.status_inprogress');
      case 'planned': return t('proj.status_planned');
      default: return status;
    }
  }

  getCategoryLabel(cat: string): string {
    if (cat === 'all') return this.translationService.translate('proj.cat_all');
    return cat;
  }

  // ====================
  // ORBITING TECH PARTICLES
  // ====================
  private readonly TECH_ITEMS = [
    { label: 'Python', color: '#A78BFA' },
    { label: 'Angular', color: '#60A5FA' },
    { label: 'OpenCV', color: '#34D399' },
    { label: 'Kotlin', color: '#FBBF24' },
    { label: 'TypeScript', color: '#60A5FA' },
    { label: 'MediaPipe', color: '#C4B5FD' },
    { label: 'NumPy', color: '#22D3EE' },
    { label: 'C#', color: '#67E8F9' },
    { label: 'ML Kit', color: '#FCD34D' },
    { label: 'Docker', color: '#60A5FA' },
    { label: 'Git', color: '#C4B5FD' },
    { label: 'MSSQL', color: '#22D3EE' },
    { label: 'REST API', color: '#34D399' },
    { label: '.NET', color: '#67E8F9' },
    { label: 'RxJS', color: '#A78BFA' },
    { label: 'Room DB', color: '#FBBF24' },
    { label: 'HTML5', color: '#FB923C' },
    { label: 'CSS3', color: '#60A5FA' },
    { label: 'Jetpack', color: '#C4B5FD' },
    { label: 'Firebase', color: '#FBBF24' },
  ];

  private initOrbits(): void {
    this.initOrbitsCanvas();
    this.buildOrbits();

    const wrap = this.el('.hero-orbits-wrap');
    if (wrap) {
      wrap.addEventListener('mousemove', this.onOrbitsMouseMove);
      wrap.addEventListener('mouseleave', () => {
        this.orbitsMouseTarget = { x: 0.5, y: 0.5 };
      });
    }

    window.addEventListener('resize', this.onResize);

    this.ngZone.runOutsideAngular(() => {
      this.renderOrbits();
    });
  }

  private onResize = (): void => {
    this.initOrbitsCanvas();
    this.buildOrbits();
  };

  private onOrbitsMouseMove = (e: MouseEvent): void => {
    const wrap = this.el('.hero-orbits-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    this.orbitsMouseTarget = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  private initOrbitsCanvas(): void {
    const canvas = this.el('#orbitsCanvas') as HTMLCanvasElement;
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private buildOrbits(): void {
    const canvas = this.el('#orbitsCanvas') as HTMLCanvasElement;
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const baseRadius = Math.min(W, H) * 0.13;

    this.orbits = [];
    let techIdx = 0;
    const numOrbits = 5;

    for (let o = 0; o < numOrbits; o++) {
      const radius = baseRadius * 0.8 + o * (baseRadius * 0.7);
      const particlesPerOrbit = 2 + o;
      const orbit: Orbit = {
        radius,
        tilt: 0.3 + o * 0.1,
        rotationSpeed: (0.28 - o * 0.03) * (o % 2 === 0 ? 1 : -1),
        particles: []
      };
      for (let p = 0; p < particlesPerOrbit; p++) {
        const item = this.TECH_ITEMS[techIdx % this.TECH_ITEMS.length];
        orbit.particles.push({
          angle: (p / particlesPerOrbit) * Math.PI * 2 + o * 0.5,
          label: item.label,
          color: item.color,
          size: 4 + (numOrbits - o) * 0.7
        });
        techIdx++;
      }
      this.orbits.push(orbit);
    }
  }

  private renderOrbits = (): void => {
    const canvas = this.el('#orbitsCanvas') as HTMLCanvasElement;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    // Smooth lerp
    const lerpFactor = 0.06;
    this.orbitsMouse.x += (this.orbitsMouseTarget.x - this.orbitsMouse.x) * lerpFactor;
    this.orbitsMouse.y += (this.orbitsMouseTarget.y - this.orbitsMouse.y) * lerpFactor;

    const mouse = this.orbitsMouse;
    const tiltX = (mouse.y - 0.5) * 0.45;
    const tiltY = (mouse.x - 0.5) * 0.35;
    const cx = W / 2;
    const cy = H / 2;

    // Core glow
    const pulse = Math.sin(Date.now() * 0.0008) * 0.05 + 0.18;
    const coreGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    coreGrd.addColorStop(0, `rgba(139,92,246,${pulse})`);
    coreGrd.addColorStop(0.4, `rgba(59,130,246,${pulse * 0.5})`);
    coreGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrd;
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(139,92,246,${0.5 + Math.sin(Date.now() * 0.002) * 0.2})`;
    ctx.fill();

    // Core symbol
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(167,139,250,${0.45 + Math.sin(Date.now() * 0.002) * 0.15})`;
    ctx.fillText('</>', cx, cy);

    const allParticles: {
      px: number; py: number; pz: number;
      label: string; color: string; size: number;
      depthScale: number;
    }[] = [];

    this.orbits.forEach(orbit => {
      // Orbit ring
      ctx.beginPath();
      const segments = 80;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const x3d = Math.cos(a) * orbit.radius;
        const y3d = Math.sin(a) * orbit.radius * Math.cos(orbit.tilt + tiltX);
        const z3d = Math.sin(a) * orbit.radius * Math.sin(orbit.tilt + tiltX);
        const px = cx + x3d * Math.cos(tiltY) - z3d * Math.sin(tiltY);
        const py = cy + y3d;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(139,92,246,0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = 'rgba(59,130,246,0.07)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Particles
      orbit.particles.forEach(p => {
        p.angle += orbit.rotationSpeed * 0.008;
        const x3d = Math.cos(p.angle) * orbit.radius;
        const y3d = Math.sin(p.angle) * orbit.radius * Math.cos(orbit.tilt + tiltX);
        const z3d = Math.sin(p.angle) * orbit.radius * Math.sin(orbit.tilt + tiltX);
        const px = cx + x3d * Math.cos(tiltY) - z3d * Math.sin(tiltY);
        const py = cy + y3d;
        const pz = z3d * Math.cos(tiltY) + x3d * Math.sin(tiltY);
        const depthScale = 0.55 + (pz + 300) / 600 * 0.55;

        allParticles.push({
          px, py, pz, label: p.label, color: p.color, size: p.size, depthScale
        });
      });
    });

    allParticles.sort((a, b) => a.pz - b.pz);

    allParticles.forEach(p => {
      const r = p.size * Math.max(0.5, p.depthScale);
      const alpha = Math.max(0.3, Math.min(1, p.depthScale));

      // Glow
      const grd = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, r * 6);
      grd.addColorStop(0, p.color + '35');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.px, p.py, r * 6, 0, Math.PI * 2);
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Highlight
      ctx.beginPath();
      ctx.arc(p.px - r * 0.2, p.py - r * 0.2, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.35 * alpha})`;
      ctx.fill();

      // Label
      const fs = Math.max(9, 11.5 * p.depthScale);
      ctx.font = `600 ${fs}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      ctx.globalAlpha = Math.max(0.5, alpha);
      ctx.fillStyle = p.color;
      ctx.fillText(p.label, p.px, p.py - r - 6);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = 1;
    });

    this.orbitsAnimId = requestAnimationFrame(this.renderOrbits);
  };

  // ====================
  // PROJECT DATA
  // ====================
  private loadData(): void {
    const t = (key: string) => this.translationService.translate(key);

    this.projects = [
      {
        id: 'thesis',
        title: t('proj.thesis_title'),
        subtitle: t('proj.thesis_subtitle'),
        description: t('proj.thesis_desc'),
        technologies: ['Python', 'OpenCV', 'NumPy', 'Alpha Shape', 'Background Subtraction', 'Keypoint Detection'],
        category: 'Computer Vision',
        status: 'completed',
        featured: true,
        icon: 'biotech',
        color: '#7C3AED',
        gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        date: '2025',
        githubUrl: 'https://github.com/bertran',
        highlights: [t('proj.thesis_h1'), t('proj.thesis_h2'), t('proj.thesis_h3')]
      },
      {
        id: 'virtual-mouse',
        title: t('proj.vmouse_title'),
        subtitle: t('proj.vmouse_subtitle'),
        description: t('proj.vmouse_desc'),
        technologies: ['Python', 'OpenCV', 'MediaPipe', 'Threading'],
        category: 'Computer Vision',
        status: 'completed',
        featured: true,
        icon: 'mouse',
        color: '#2563EB',
        gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)',
        date: '2024',
        githubUrl: 'https://github.com/bertran',
        highlights: [t('proj.vmouse_h1'), t('proj.vmouse_h2'), t('proj.vmouse_h3')]
      },
      {
        id: 'cell-segmentation',
        title: t('proj.cell_title'),
        subtitle: t('proj.cell_subtitle'),
        description: t('proj.cell_desc'),
        technologies: ['Python', 'OpenCV', 'Image Processing'],
        category: 'Computer Vision',
        status: 'completed',
        featured: false,
        icon: 'blur_on',
        color: '#059669',
        gradient: 'linear-gradient(135deg, #059669, #10B981)',
        date: '2024',
        githubUrl: 'https://github.com/bertran',
        highlights: [t('proj.cell_h1'), t('proj.cell_h2'), t('proj.cell_h3')]
      },
      {
        id: 'spendlens',
        title: 'SpendLens',
        subtitle: t('proj.spendlens_subtitle'),
        description: t('proj.spendlens_desc'),
        technologies: ['Android', 'Kotlin', 'ML Kit', 'Room DB', 'Jetpack Compose'],
        category: 'Mobile',
        status: 'planned',
        featured: true,
        icon: 'receipt_long',
        color: '#D97706',
        gradient: 'linear-gradient(135deg, #D97706, #F59E0B)',
        date: '2025',
        highlights: [t('proj.spendlens_h1'), t('proj.spendlens_h2'), t('proj.spendlens_h3')]
      },
      {
        id: 'portfolio',
        title: t('proj.portfolio_title'),
        subtitle: t('proj.portfolio_subtitle'),
        description: t('proj.portfolio_desc'),
        technologies: ['Angular', 'TypeScript', 'CSS3', 'i18n'],
        category: 'Web',
        status: 'in-progress',
        featured: false,
        icon: 'web',
        color: '#0891B2',
        gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)',
        date: '2025',
        githubUrl: 'https://github.com/bertran',
        highlights: [t('proj.portfolio_h1'), t('proj.portfolio_h2'), t('proj.portfolio_h3')]
      }
    ];
  }
}
