import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Gear {
  x: number;
  y: number;
  radius: number;
  teeth: number;
  angle: number;
  speed: number;
  color: string;
  opacity: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './under-construction.component.html',
  styleUrl: './under-construction.component.css'
})
export class UnderConstructionComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('constructionCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private langSub!: Subscription;
  private animationId = 0;
  private gears: Gear[] = [];
  private sparks: Spark[] = [];
  private frame = 0;

  // Progress bar animation
  progress = 0;
  private progressInterval: any;

  constructor(
    private translationService: TranslationService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(() => {});
    this.animateProgress();
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initCanvas();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    cancelAnimationFrame(this.animationId);
    clearInterval(this.progressInterval);
  }

  private animateProgress(): void {
    const target = 65; // "65% complete"
    this.progressInterval = setInterval(() => {
      if (this.progress < target) {
        this.progress += 0.5;
      } else {
        clearInterval(this.progressInterval);
      }
    }, 30);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.initGears(canvas.offsetWidth, canvas.offsetHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      this.drawFrame(ctx, canvas.offsetWidth, canvas.offsetHeight);
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  private initGears(w: number, h: number): void {
    this.gears = [];

    // Poisson-disk-like placement: try random positions, reject if too close to existing gears
    const minDist = 140;
    const maxAttempts = 300;
    const targetCount = Math.max(8, Math.floor((w * h) / 60000));

    for (let attempt = 0; attempt < maxAttempts && this.gears.length < targetCount; attempt++) {
      const x = -60 + Math.random() * (w + 120);
      const y = -60 + Math.random() * (h + 120);
      const radius = 25 + Math.random() * 55;

      // Check distance to all existing gears
      let tooClose = false;
      for (const g of this.gears) {
        const dist = Math.hypot(x - g.x, y - g.y);
        if (dist < g.radius + radius + 20) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Fade opacity near center so gears don't compete with content
      const distFromCenter = Math.hypot(x - w / 2, y - h / 2);
      const maxDist = Math.hypot(w / 2, h / 2);
      const centerFade = Math.min(1, distFromCenter / (maxDist * 0.35));
      const opacity = (0.04 + Math.random() * 0.08) * (0.3 + 0.7 * centerFade);

      const colors = ['#2563EB', '#4F46E5', '#7C3AED', '#1D4ED8'];

      this.gears.push({
        x,
        y,
        radius,
        teeth: Math.floor(6 + Math.random() * 10),
        angle: Math.random() * Math.PI * 2,
        speed: (0.001 + Math.random() * 0.004) * (Math.random() < 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity
      });
    }
  }

  private drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.clearRect(0, 0, w, h);

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw & rotate gears
    for (const gear of this.gears) {
      gear.angle += gear.speed;
      this.drawGear(ctx, gear);
    }

    // Emit sparks occasionally
    this.frame++;
    if (this.frame % 8 === 0) {
      const sourceGear = this.gears[Math.floor(Math.random() * this.gears.length)];
      if (sourceGear) {
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          this.sparks.push({
            x: sourceGear.x + Math.cos(angle) * sourceGear.radius,
            y: sourceGear.y + Math.sin(angle) * sourceGear.radius,
            vx: Math.cos(angle) * (1 + Math.random() * 2),
            vy: Math.sin(angle) * (1 + Math.random() * 2),
            life: 0,
            maxLife: 30 + Math.floor(Math.random() * 40),
            color: Math.random() < 0.5 ? '#3B82F6' : '#7C3AED',
            size: 1 + Math.random() * 2
          });
        }
      }
    }

    // Draw & update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      const alpha = 1 - s.life / s.maxLife;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = s.color.replace(')', `, ${alpha * 0.6})`).replace('rgb', 'rgba');

      // Parse hex to rgba for spark
      const r = parseInt(s.color.slice(1, 3), 16);
      const g = parseInt(s.color.slice(3, 5), 16);
      const b = parseInt(s.color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
      ctx.fill();

      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.03; // slight gravity
      s.life++;

      if (s.life >= s.maxLife) {
        this.sparks.splice(i, 1);
      }
    }
  }

  private drawGear(ctx: CanvasRenderingContext2D, gear: Gear): void {
    ctx.save();
    ctx.translate(gear.x, gear.y);
    ctx.rotate(gear.angle);
    ctx.globalAlpha = gear.opacity;
    ctx.strokeStyle = gear.color;
    ctx.lineWidth = 2;

    const { radius, teeth } = gear;
    const innerR = radius * 0.7;
    const outerR = radius;
    const toothAngle = (Math.PI * 2) / teeth;
    const halfTooth = toothAngle * 0.3;

    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = i * toothAngle;
      ctx.lineTo(Math.cos(a - halfTooth) * innerR, Math.sin(a - halfTooth) * innerR);
      ctx.lineTo(Math.cos(a - halfTooth * 0.5) * outerR, Math.sin(a - halfTooth * 0.5) * outerR);
      ctx.lineTo(Math.cos(a + halfTooth * 0.5) * outerR, Math.sin(a + halfTooth * 0.5) * outerR);
      ctx.lineTo(Math.cos(a + halfTooth) * innerR, Math.sin(a + halfTooth) * innerR);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = gear.color;
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
