import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface FallingChar {
  x: number;
  y: number;
  speed: number;
  char: string;
  opacity: number;
  fontSize: number;
}

interface GlitchBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  life: number;
  maxLife: number;
  color: 'blue' | 'purple';
  opacity: number;
}

interface GridNode {
  x: number;
  y: number;
  opacity: number;
  phase: number;
  speed: number;
}

interface DeadPixel {
  x: number;
  y: number;
  w: number;
  h: number;
  color: 'blue' | 'purple';
  flicker: number;
  flickerSpeed: number;
  opacity: number;
  stuck: boolean;
}

interface TearLine {
  y: number;
  offset: number;
  height: number;
  life: number;
  maxLife: number;
}

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('voidCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private langSub!: Subscription;
  private animationId = 0;
  private t = 0;

  // Falling chars (original)
  private chars: FallingChar[] = [];
  private readonly CHAR_POOL = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ{}[]<>/\\|?!@#$%&*';

  // Glitch blocks (enhanced from minimal demo)
  private glitchBlocks: GlitchBlock[] = [];

  // Grid nodes (minimal demo)
  private gridNodes: GridNode[] = [];

  // Dead pixels (TV static demo)
  private deadPixels: DeadPixel[] = [];

  // Tear lines (TV static demo)
  private tearLines: TearLine[] = [];

  // Canvas dimensions
  private W = 0;
  private H = 0;

  // Typed "404" glitch effect
  glitchText = '404';
  private glitchInterval: any;

  constructor(
    private translationService: TranslationService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(() => {});
    this.startGlitchText();
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initCanvas();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    cancelAnimationFrame(this.animationId);
    clearInterval(this.glitchInterval);
  }

  private startGlitchText(): void {
    this.glitchInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        const glitchChars = '4Ø0!?#@&%';
        const arr = ['4', '0', '4'];
        const idx = Math.floor(Math.random() * 3);
        arr[idx] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        this.glitchText = arr.join('');
        setTimeout(() => {
          this.glitchText = '404';
        }, 100 + Math.random() * 150);
      }
    }, 800);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      this.W = canvas.offsetWidth;
      this.H = canvas.offsetHeight;
      canvas.width = this.W * dpr;
      canvas.height = this.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.initChars();
      this.initGridNodes();
      this.initDeadPixels();
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      this.drawFrame(ctx);
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  // ── Falling characters (original) ──
  private initChars(): void {
    this.chars = [];
    const count = Math.floor(this.W / 22);
    for (let i = 0; i < count; i++) {
      this.chars.push(this.createChar(true));
    }
  }

  private createChar(randomY: boolean): FallingChar {
    return {
      x: Math.random() * this.W,
      y: randomY ? Math.random() * this.H : -20,
      speed: 1 + Math.random() * 3,
      char: this.CHAR_POOL[Math.floor(Math.random() * this.CHAR_POOL.length)],
      opacity: 0.03 + Math.random() * 0.25,
      fontSize: 10 + Math.random() * 8
    };
  }

  // ── Grid nodes (minimal demo) ──
  private initGridNodes(): void {
    this.gridNodes = [];
    const gs = 60;
    for (let x = gs; x < this.W; x += gs) {
      for (let y = gs; y < this.H; y += gs) {
        if (Math.random() < 0.08) {
          const dx = x - this.W / 2;
          const dy = y - this.H / 2;
          const distC = Math.sqrt(dx * dx + dy * dy);
          const maxD = Math.sqrt((this.W / 2) ** 2 + (this.H / 2) ** 2);
          const fade = Math.min(1, distC / (maxD * 0.3));
          this.gridNodes.push({
            x, y,
            opacity: (0.1 + Math.random() * 0.2) * (0.15 + 0.85 * fade),
            phase: Math.random() * Math.PI * 2,
            speed: 0.015 + Math.random() * 0.025
          });
        }
      }
    }
  }

  // ── Dead pixels (TV static demo) ──
  private initDeadPixels(): void {
    this.deadPixels = [];
    const count = Math.max(6, Math.floor((this.W * this.H) / 60000));
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.W;
      const y = Math.random() * this.H;
      const dx = x - this.W / 2;
      const dy = y - this.H / 2;
      const distC = Math.sqrt(dx * dx + dy * dy);
      const maxD = Math.sqrt((this.W / 2) ** 2 + (this.H / 2) ** 2);
      const fade = Math.min(1, distC / (maxD * 0.35));
      this.deadPixels.push({
        x: Math.floor(x / 4) * 4,
        y: Math.floor(y / 4) * 4,
        w: 2 + Math.floor(Math.random() * 4) * 2,
        h: 2 + Math.floor(Math.random() * 3) * 2,
        color: Math.random() < 0.6 ? 'blue' : 'purple',
        flicker: Math.random() * Math.PI * 2,
        flickerSpeed: 0.02 + Math.random() * 0.05,
        opacity: (0.15 + Math.random() * 0.35) * (0.2 + 0.8 * fade),
        stuck: Math.random() < 0.3
      });
    }
  }

  // ══════════════════════════════════════════
  //  MAIN DRAW FRAME – all layers combined
  // ══════════════════════════════════════════
  private drawFrame(ctx: CanvasRenderingContext2D): void {
    const W = this.W;
    const H = this.H;
    this.t++;

    // 1) Semi-transparent clear (trailing effect)
    ctx.fillStyle = 'rgba(10, 15, 30, 0.2)';
    ctx.fillRect(0, 0, W, H);

    // 2) Subtle background grid (minimal demo)
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.025)';
    ctx.lineWidth = 0.5;
    const gs = 60;
    for (let x = 0; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // 3) Grid node pulsing dots (minimal demo)
    for (const n of this.gridNodes) {
      const p = 0.3 + 0.7 * Math.sin(this.t * n.speed + n.phase);
      const alpha = n.opacity * p;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(37, 99, 235, ${alpha})`;
      ctx.fill();
    }

    // 4) Falling characters (original)
    for (const c of this.chars) {
      if (Math.random() < 0.02) {
        c.char = this.CHAR_POOL[Math.floor(Math.random() * this.CHAR_POOL.length)];
      }
      ctx.font = `${c.fontSize}px monospace`;
      const blue = Math.floor(180 + c.opacity * 75);
      ctx.fillStyle = `rgba(37, 99, ${blue}, ${c.opacity})`;
      ctx.fillText(c.char, c.x, c.y);
      c.y += c.speed;
      if (c.y > H + 20) {
        Object.assign(c, this.createChar(false));
      }
    }

    // 5) Static noise patches (TV demo)
    this.drawStaticNoise(ctx, W, H);

    // 6) Dead/stuck pixels (TV demo)
    this.drawDeadPixels(ctx);

    // 7) Glitch blocks + burst (enhanced from minimal demo)
    this.updateGlitchBlocks(ctx, W, H);

    // 8) Tear effect (TV demo)
    this.drawTearEffect(ctx, W, H);

    // 9) Scanline overlay (drawn in canvas)
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, y, W, 1);
    }

    // 10) CRT vignette (TV demo)
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Static noise patches ──
  private drawStaticNoise(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const regions = 2 + Math.floor(Math.random() * 3);
    for (let r = 0; r < regions; r++) {
      const rx = Math.random() * W;
      const ry = Math.random() * H;
      const rw = 30 + Math.random() * 120;
      const rh = 20 + Math.random() * 50;
      for (let i = 0; i < 30; i++) {
        const px = rx + Math.random() * rw;
        const py = ry + Math.random() * rh;
        const size = 1 + Math.random() * 2;
        const brightness = Math.random();
        ctx.fillStyle = `rgba(${Math.floor(brightness * 40)}, ${Math.floor(brightness * 60)}, ${Math.floor(brightness * 120)}, ${0.015 + brightness * 0.04})`;
        ctx.fillRect(px, py, size, size);
      }
    }
  }

  // ── Dead pixels ──
  private drawDeadPixels(ctx: CanvasRenderingContext2D): void {
    for (const p of this.deadPixels) {
      let alpha: number;
      if (p.stuck) {
        alpha = p.opacity * (0.5 + 0.5 * Math.sin(this.t * 0.005 + p.flicker));
      } else {
        const flick = Math.sin(this.t * p.flickerSpeed + p.flicker);
        alpha = flick > 0.3 ? p.opacity * flick : 0;
      }

      if (alpha > 0.01) {
        ctx.fillStyle = p.color === 'blue'
          ? `rgba(37, 99, 235, ${alpha})`
          : `rgba(124, 58, 237, ${alpha})`;
        ctx.fillRect(p.x, p.y, p.w, p.h);

        // Subtle glow for brighter pixels
        if (alpha > 0.2) {
          const glow = ctx.createRadialGradient(
            p.x + p.w / 2, p.y + p.h / 2, 0,
            p.x + p.w / 2, p.y + p.h / 2, p.w * 3
          );
          glow.addColorStop(0, `rgba(37, 99, 235, ${alpha * 0.08})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(p.x - p.w * 2, p.y - p.h * 2, p.w * 5, p.h * 5);
        }
      }
    }
  }

  // ── Glitch blocks + burst ──
  private updateGlitchBlocks(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    // Spawn regular glitch blocks
    if (this.t % 40 === 0 || (this.t % 15 === 0 && Math.random() < 0.3)) {
      const count = 1 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const isWide = Math.random() < 0.6;
        this.glitchBlocks.push({
          x: Math.random() * W,
          y: Math.random() * H,
          w: isWide ? (40 + Math.random() * 200) : (3 + Math.random() * 20),
          h: isWide ? (1 + Math.random() * 4) : (10 + Math.random() * 60),
          life: 0,
          maxLife: 4 + Math.floor(Math.random() * 12),
          color: Math.random() < 0.5 ? 'blue' : 'purple',
          opacity: 0.06 + Math.random() * 0.15
        });
      }
    }

    // Occasional burst
    if (Math.random() < 0.008) {
      const cx = W * 0.2 + Math.random() * W * 0.6;
      const cy = H * 0.2 + Math.random() * H * 0.6;
      for (let i = 0; i < 8 + Math.floor(Math.random() * 12); i++) {
        this.glitchBlocks.push({
          x: cx + (Math.random() - 0.5) * 200,
          y: cy + (Math.random() - 0.5) * 100,
          w: 5 + Math.random() * 80,
          h: 1 + Math.random() * 3,
          life: 0,
          maxLife: 3 + Math.floor(Math.random() * 8),
          color: Math.random() < 0.5 ? 'blue' : 'purple',
          opacity: 0.08 + Math.random() * 0.2
        });
      }
    }

    // Draw & cull
    for (let i = this.glitchBlocks.length - 1; i >= 0; i--) {
      const g = this.glitchBlocks[i];
      const fadeIn = Math.min(1, g.life / 2);
      const fadeOut = Math.max(0, 1 - (g.life - g.maxLife + 3) / 3);
      const alpha = g.opacity * fadeIn * fadeOut;

      ctx.fillStyle = g.color === 'blue'
        ? `rgba(37, 99, 235, ${alpha})`
        : `rgba(124, 58, 237, ${alpha})`;
      ctx.fillRect(g.x, g.y, g.w, g.h);

      // Faint edge glow
      if (alpha > 0.08) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = g.color === 'blue'
          ? 'rgba(37, 99, 235, 0.12)'
          : 'rgba(124, 58, 237, 0.12)';
        ctx.fillRect(g.x, g.y, g.w, g.h);
        ctx.shadowBlur = 0;
      }

      g.life++;
      if (g.life >= g.maxLife) {
        this.glitchBlocks.splice(i, 1);
      }
    }
  }

  // ── Tear effect ──
  private drawTearEffect(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    // Spawn
    if (Math.random() < 0.025) {
      this.tearLines.push({
        y: Math.random() * H,
        offset: (Math.random() - 0.5) * 15,
        height: 1 + Math.random() * 4,
        life: 0,
        maxLife: 3 + Math.floor(Math.random() * 6)
      });
    }

    // Draw & cull
    for (let i = this.tearLines.length - 1; i >= 0; i--) {
      const tear = this.tearLines[i];
      const alpha = (1 - tear.life / tear.maxLife) * 0.12;

      ctx.fillStyle = `rgba(37, 99, 235, ${alpha})`;
      ctx.fillRect(0, tear.y, W, tear.height);

      for (let x = 0; x < W; x += 20 + Math.random() * 40) {
        const bw = 5 + Math.random() * 15;
        ctx.fillStyle = `rgba(124, 58, 237, ${alpha * 0.5})`;
        ctx.fillRect(x + tear.offset, tear.y - 1, bw, tear.height + 2);
      }

      tear.life++;
      if (tear.life >= tear.maxLife) {
        this.tearLines.splice(i, 1);
      }
    }
  }
}
