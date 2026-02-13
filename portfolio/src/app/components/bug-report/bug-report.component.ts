// bug-report.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

interface HexCell {
  x: number;
  y: number;
  hasSymbol: boolean;
  symbol: string;
  // Visibility: symbols fade in and out slowly
  visible: boolean;
  fadeValue: number;       // 0 = invisible, 1 = fully visible (at baseSymbolOp)
  fadeSpeed: number;       // how fast it fades in/out per frame
  fadeDirection: number;   // 1 = fading in, -1 = fading out
  holdTimer: number;       // how long to stay visible before fading out
  holdDuration: number;
  cooldown: number;        // time before next appearance
  // Flash (red pulse on top of visibility)
  flashTimer: number;
  flashDur: number;
  nextFlash: number;
  // Base opacities
  baseHexOp: number;
  baseSymbolOp: number;
}

@Component({
  selector: 'app-bug-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './bug-report.component.html',
  styleUrl: './bug-report.component.css'
})
export class BugReportComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('bugCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  bugReportForm!: FormGroup;
  isSubmitting = false;
  isExpanded = false;
  currentStep = 1;
  totalSteps = 3;
  submitSuccess = false;
  buttonPulse = true;

  // Hex grid
  private hexes: HexCell[] = [];
  private symbolHexes: HexCell[] = [];  // only hexes that have symbols
  private animFrameId: number = 0;
  private ctx!: CanvasRenderingContext2D;
  private readonly HEX_SIZE = 26;
  private readonly MAX_VISIBLE = 4;     // max symbols visible at once

  // Glitch scanline
  glitchActive = false;
  private glitchInterval: any;

  private langSub!: Subscription;

  bugCategories = [
    { value: 'ui', icon: '🎨', key: 'bug.cat_ui' },
    { value: 'functionality', icon: '⚙️', key: 'bug.cat_func' },
    { value: 'performance', icon: '⚡', key: 'bug.cat_perf' },
    { value: 'translation', icon: '🌍', key: 'bug.cat_translation' },
    { value: 'other', icon: '📋', key: 'bug.cat_other' }
  ];

  severityLevels = [
    { value: 'low', key: 'bug.sev_low', color: '#22C55E' },
    { value: 'medium', key: 'bug.sev_medium', color: '#F59E0B' },
    { value: 'high', key: 'bug.sev_high', color: '#EF4444' },
    { value: 'critical', key: 'bug.sev_critical', color: '#DC2626' }
  ];

  selectedCategory = '';
  selectedSeverity = '';

  constructor(
    private fb: FormBuilder,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.bugReportForm = this.fb.group({
      category: ['', Validators.required],
      severity: ['medium'],
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      reproduceSteps: ['', Validators.maxLength(500)],
      email: ['', [Validators.email]]
    });

    this.langSub = this.translationService.language$.subscribe(() => {});

    this.glitchInterval = setInterval(() => {
      if (this.isExpanded) {
        this.glitchActive = true;
        setTimeout(() => this.glitchActive = false, 200);
      }
    }, 5000);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.glitchInterval) clearInterval(this.glitchInterval);
    if (this.langSub) this.langSub.unsubscribe();
    document.body.style.overflow = '';
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    this.buttonPulse = false;

    if (this.isExpanded) {
      // Lock background scroll
      document.body.style.overflow = 'hidden';
      this.currentStep = 1;
      this.submitSuccess = false;
      setTimeout(() => this.initHexGrid(), 100);
    } else {
      // Unlock background scroll
      document.body.style.overflow = '';
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      if (this.bugReportForm.dirty && !this.isSubmitting) {
        this.bugReportForm.reset({ severity: 'medium' });
        this.selectedCategory = '';
        this.selectedSeverity = '';
      }
    }
  }

  selectCategory(value: string): void {
    this.selectedCategory = value;
    this.bugReportForm.patchValue({ category: value });
  }

  selectSeverity(value: string): void {
    this.selectedSeverity = value;
    this.bugReportForm.patchValue({ severity: value });
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.selectedCategory) return;
    if (this.currentStep === 2) {
      const titleCtrl = this.bugReportForm.get('title');
      const descCtrl = this.bugReportForm.get('description');
      if (titleCtrl?.invalid || descCtrl?.invalid) {
        titleCtrl?.markAsTouched();
        descCtrl?.markAsTouched();
        return;
      }
    }
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  onSubmit(): void {
    if (this.selectedCategory && this.bugReportForm.get('title')?.valid && this.bugReportForm.get('description')?.valid) {
      this.isSubmitting = true;
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        setTimeout(() => {
          this.bugReportForm.reset({ severity: 'medium' });
          this.selectedCategory = '';
          this.selectedSeverity = '';
          this.isExpanded = false;
          this.submitSuccess = false;
          this.buttonPulse = true;
          document.body.style.overflow = '';
        }, 3000);
      }, 2000);
    }
  }

  getStepValid(step: number): boolean {
    switch (step) {
      case 1: return !!this.selectedCategory;
      case 2: return this.bugReportForm.get('title')?.valid === true && this.bugReportForm.get('description')?.valid === true;
      case 3: return true;
      default: return false;
    }
  }

  get progressPercent(): number {
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  get charCount(): number {
    return this.bugReportForm.get('description')?.value?.length || 0;
  }

  getCategoryIcon(): string {
    return this.bugCategories.find(c => c.value === this.selectedCategory)?.icon || '';
  }

  getCategoryTranslationKey(): string {
    return this.bugCategories.find(c => c.value === this.selectedCategory)?.key || '';
  }

  // ── Bug Hex Grid ──

  private initHexGrid(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.ctx = canvas.getContext('2d')!;

    const sz = this.HEX_SIZE;
    const hH = sz * Math.sqrt(3);
    const hW = sz * 2;
    // Weighted symbol pool: 404, NULL, ⚠ appear more often; BUG_ICON and ERROR less
    const weightedSymbols = [
      '404', '404', '404',
      'NULL', 'NULL', 'NULL',
      'WARN', 'WARN', 'WARN',
      'BUG_ICON', 'BUG_ICON',
      'ERROR', 'ERROR'
    ];

    this.hexes = [];
    this.symbolHexes = [];

    for (let row = -1; row < canvas.height / hH + 1; row++) {
      for (let col = -1; col < canvas.width / (hW * 0.75) + 1; col++) {
        const hasSymbol = Math.random() < 0.14;
        const hex: HexCell = {
          x: col * hW * 0.75,
          y: row * hH + (col % 2 === 0 ? 0 : hH / 2),
          hasSymbol,
          symbol: hasSymbol ? weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)] : '',
          // Start invisible, with a random cooldown before first appearance
          visible: false,
          fadeValue: 0,
          fadeSpeed: 0.004 + Math.random() * 0.004,  // slow fade: ~4-6 seconds to fully appear
          fadeDirection: 0, // 0 = waiting
          holdTimer: 0,
          holdDuration: 4 + Math.random() * 6,        // stay visible 4-10 seconds
          cooldown: 2 + Math.random() * 12,            // wait 2-12 seconds before appearing
          flashTimer: 0,
          flashDur: 1.5 + Math.random() * 2,
          nextFlash: 3 + Math.random() * 8,
          baseHexOp: 0.03 + Math.random() * 0.02,
          baseSymbolOp: 0.05 + Math.random() * 0.03
        };
        this.hexes.push(hex);
        if (hasSymbol) this.symbolHexes.push(hex);
      }
    }

    this.animateHexGrid();
  }

  private drawHex(cx: number, cy: number, s: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const hx = cx + s * Math.cos(a);
      const hy = cy + s * Math.sin(a);
      if (i === 0) this.ctx.moveTo(hx, hy);
      else this.ctx.lineTo(hx, hy);
    }
    this.ctx.closePath();
  }

  private drawBugIcon(cx: number, cy: number, scale: number, alpha: number, intensity: number): void {
    const c = this.ctx;
    c.save();
    c.translate(cx, cy);
    c.scale(scale, scale);

    const r = Math.round(180 + 59 * intensity);
    const g = Math.round(40 + 28 * intensity);
    const b = Math.round(40 + 28 * intensity);
    const color = `rgb(${r},${g},${b})`;

    c.globalAlpha = alpha;
    c.fillStyle = color;
    c.lineCap = 'round';

    // Body
    c.beginPath();
    c.ellipse(0, 1.5, 4, 5.5, 0, 0, Math.PI * 2);
    c.fill();

    // Head
    c.beginPath();
    c.arc(0, -4.5, 2.5, 0, Math.PI * 2);
    c.fill();

    // Center line
    c.beginPath();
    c.moveTo(0, -4); c.lineTo(0, 7);
    c.strokeStyle = `rgba(11,17,32,${0.3 + intensity * 0.2})`;
    c.lineWidth = 1;
    c.stroke();

    // Antennae + legs
    c.strokeStyle = color;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-1.5, -6.5); c.lineTo(-3.5, -9);
    c.moveTo(1.5, -6.5);  c.lineTo(3.5, -9);
    c.stroke();

    c.beginPath();
    c.moveTo(-3.8, -1); c.lineTo(-7, -3);
    c.moveTo(-4, 2);    c.lineTo(-7, 2);
    c.moveTo(-3.8, 5);  c.lineTo(-7, 7);
    c.moveTo(3.8, -1);  c.lineTo(7, -3);
    c.moveTo(4, 2);     c.lineTo(7, 2);
    c.moveTo(3.8, 5);   c.lineTo(7, 7);
    c.stroke();

    c.restore();
  }

  private animateHexGrid(): void {
    if (!this.ctx || !this.isExpanded) return;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const c = this.ctx;
    const sz = this.HEX_SIZE;
    const dt = 0.016; // ~60fps frame time

    c.clearRect(0, 0, canvas.width, canvas.height);

    // Count currently visible symbols
    let visibleCount = 0;
    for (const hex of this.symbolHexes) {
      if (hex.fadeValue > 0) visibleCount++;
    }

    // Update symbol visibility state machine
    for (const hex of this.symbolHexes) {
      if (hex.fadeDirection === 0 && hex.fadeValue === 0) {
        // Waiting to appear
        hex.cooldown -= dt;
        if (hex.cooldown <= 0 && visibleCount < this.MAX_VISIBLE) {
          hex.fadeDirection = 1; // start fading in
          hex.visible = true;
          visibleCount++;
        }
      } else if (hex.fadeDirection === 1) {
        // Fading in
        hex.fadeValue = Math.min(1, hex.fadeValue + hex.fadeSpeed);
        if (hex.fadeValue >= 1) {
          hex.fadeDirection = 0;
          hex.holdTimer = hex.holdDuration;
        }
      } else if (hex.fadeDirection === 0 && hex.fadeValue >= 1) {
        // Holding visible
        hex.holdTimer -= dt;
        if (hex.holdTimer <= 0) {
          hex.fadeDirection = -1; // start fading out
        }
      } else if (hex.fadeDirection === -1) {
        // Fading out
        hex.fadeValue = Math.max(0, hex.fadeValue - hex.fadeSpeed);
        if (hex.fadeValue <= 0) {
          hex.fadeDirection = 0;
          hex.visible = false;
          hex.cooldown = 4 + Math.random() * 14; // wait 4-18s before next appearance
          hex.holdDuration = 4 + Math.random() * 6;
        }
      }

      // Red flash timing (only when visible enough)
      if (hex.fadeValue > 0.5) {
        hex.nextFlash -= dt;
        if (hex.nextFlash <= 0) {
          hex.flashTimer = hex.flashDur;
          hex.nextFlash = 5 + Math.random() * 10;
        }
        if (hex.flashTimer > 0) hex.flashTimer -= dt;
      }
    }

    // Draw all hexes
    for (const hex of this.hexes) {
      // Hex outline — always static
      this.drawHex(hex.x, hex.y, sz);
      c.strokeStyle = `rgba(148,163,184,${hex.baseHexOp})`;
      c.lineWidth = 0.5;
      c.stroke();

      // Symbol (only if has one and fadeValue > 0)
      if (hex.hasSymbol && hex.fadeValue > 0) {
        const flashing = hex.flashTimer > 0;
        const intensity = flashing ? Math.sin((hex.flashTimer / hex.flashDur) * Math.PI) : 0;
        const symAlpha = hex.baseSymbolOp * hex.fadeValue + (flashing ? intensity * 0.55 * hex.fadeValue : 0);

        if (hex.symbol === 'BUG_ICON') {
          this.drawBugIcon(hex.x, hex.y, 1.1, symAlpha, intensity * hex.fadeValue);

          if (flashing && intensity > 0.4) {
            c.save();
            c.globalAlpha = intensity * 0.07 * hex.fadeValue;
            c.fillStyle = '#EF4444';
            c.fillRect(hex.x - 10, hex.y - 12, 20, 24);
            c.restore();
          }
        } else {
          c.save();
          c.textAlign = 'center';
          c.textBaseline = 'middle';

          const fade = hex.fadeValue;
          const r = flashing ? Math.round(148 + (239 - 148) * intensity) : 148;
          const g = flashing ? Math.round(163 - 95 * intensity) : 163;
          const b = flashing ? Math.round(184 - 116 * intensity) : 184;
          c.globalAlpha = symAlpha;
          const displayText = hex.symbol === 'WARN' ? '⚠' : hex.symbol;
          c.font = hex.symbol === 'WARN'
            ? `${sz * 0.5}px sans-serif`
            : `bold ${sz * 0.34}px 'Courier New', monospace`;
          c.fillStyle = `rgb(${r},${g},${b})`;
          c.fillText(displayText, hex.x, hex.y + 1);

          if (flashing && intensity > 0.4) {
            const tw = c.measureText(displayText).width;
            const pad = 4;
            c.globalAlpha = intensity * 0.07 * fade;
            c.fillStyle = '#EF4444';
            c.fillRect(hex.x - tw / 2 - pad, hex.y - sz * 0.22 - pad, tw + pad * 2, sz * 0.44 + pad * 2);
          }

          c.restore();
        }
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.animateHexGrid());
  }
}
