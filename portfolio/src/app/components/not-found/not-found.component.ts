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
  color: string;
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
  private chars: FallingChar[] = [];
  private glitchBlocks: GlitchBlock[] = [];
  private glitchTimer = 0;
  private readonly CHAR_POOL = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ{}[]<>/\\|?!@#$%&*';

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
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.initChars(canvas.offsetWidth, canvas.offsetHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      this.drawFrame(ctx, canvas.offsetWidth, canvas.offsetHeight);
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  private initChars(w: number, h: number): void {
    this.chars = [];
    const count = Math.floor(w / 18);
    for (let i = 0; i < count; i++) {
      this.chars.push(this.createChar(w, h, true));
    }
  }

  private createChar(w: number, h: number, randomY: boolean): FallingChar {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -20,
      speed: 1 + Math.random() * 3,
      char: this.CHAR_POOL[Math.floor(Math.random() * this.CHAR_POOL.length)],
      opacity: 0.05 + Math.random() * 0.4,
      fontSize: 10 + Math.random() * 8
    };
  }

  private drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Semi-transparent background for trailing effect
    ctx.fillStyle = 'rgba(10, 15, 30, 0.15)';
    ctx.fillRect(0, 0, w, h);

    // Draw falling characters
    for (const c of this.chars) {
      // Change char occasionally
      if (Math.random() < 0.02) {
        c.char = this.CHAR_POOL[Math.floor(Math.random() * this.CHAR_POOL.length)];
      }

      ctx.font = `${c.fontSize}px monospace`;
      const blue = Math.floor(180 + c.opacity * 75);
      ctx.fillStyle = `rgba(37, 99, ${blue}, ${c.opacity})`;
      ctx.fillText(c.char, c.x, c.y);

      c.y += c.speed;
      if (c.y > h + 20) {
        Object.assign(c, this.createChar(w, h, false));
      }
    }

    // Occasional glitch blocks
    this.glitchTimer++;
    if (this.glitchTimer > 60 && Math.random() < 0.05) {
      this.glitchTimer = 0;
      const numBlocks = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numBlocks; i++) {
        this.glitchBlocks.push({
          x: Math.random() * w,
          y: Math.random() * h,
          w: 30 + Math.random() * 150,
          h: 2 + Math.random() * 8,
          life: 0,
          maxLife: 5 + Math.floor(Math.random() * 10),
          color: Math.random() < 0.5
            ? `rgba(37, 99, 235, ${0.2 + Math.random() * 0.3})`
            : `rgba(79, 70, 229, ${0.2 + Math.random() * 0.3})`
        });
      }
    }

    // Draw & update glitch blocks
    for (let i = this.glitchBlocks.length - 1; i >= 0; i--) {
      const g = this.glitchBlocks[i];
      ctx.fillStyle = g.color;
      ctx.fillRect(g.x, g.y, g.w, g.h);
      g.life++;
      if (g.life >= g.maxLife) {
        this.glitchBlocks.splice(i, 1);
      }
    }

    // Scanline effect
    for (let y = 0; y < h; y += 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, y, w, 1);
    }
  }
}
