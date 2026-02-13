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
  symbol: string;        // 'BUG_ICON' | '404' | 'ERROR' | 'NULL' | ''
  flashTimer: number;
  flashDur: number;
  nextFlash: number;
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

  // Hex grid canvas
  private hexes: HexCell[] = [];
  private animFrameId: number = 0;
  private ctx!: CanvasRenderingContext2D;
  private readonly HEX_SIZE = 26;

  // Glitch scanline
  glitchActive = false;
  private glitchInterval: any;

  // Translation
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

    // Subtle glitch scanline every 5s
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
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    this.buttonPulse = false;

    if (this.isExpanded) {
      this.currentStep = 1;
      this.submitSuccess = false;
      setTimeout(() => this.initHexGrid(), 100);
    } else {
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

  // ── Bug Hex Grid Background ──

  private initHexGrid(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.ctx = canvas.getContext('2d')!;

    const sz = this.HEX_SIZE;
    const hH = sz * Math.sqrt(3);
    const hW = sz * 2;
    const symbols = ['BUG_ICON', '404', 'ERROR', 'NULL'];

    this.hexes = [];
    for (let row = -1; row < canvas.height / hH + 1; row++) {
      for (let col = -1; col < canvas.width / (hW * 0.75) + 1; col++) {
        const hasSymbol = Math.random() < 0.14;
        this.hexes.push({
          x: col * hW * 0.75,
          y: row * hH + (col % 2 === 0 ? 0 : hH / 2),
          hasSymbol,
          symbol: hasSymbol ? symbols[Math.floor(Math.random() * symbols.length)] : '',
          flashTimer: 0,
          flashDur: 1.2 + Math.random() * 1.5,
          nextFlash: 1 + Math.random() * 6,
          baseHexOp: 0.03 + Math.random() * 0.02,
          baseSymbolOp: 0.04 + Math.random() * 0.03
        });
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
    c.strokeStyle = color;
    c.lineWidth = 1.2;
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
    c.moveTo(0, -4);
    c.lineTo(0, 7);
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
    c.clearRect(0, 0, canvas.width, canvas.height);

    for (const hex of this.hexes) {
      // Symbol flash timing
      if (hex.hasSymbol) {
        hex.nextFlash -= 0.016;
        if (hex.nextFlash <= 0) {
          hex.flashTimer = hex.flashDur;
          hex.nextFlash = 3 + Math.random() * 8;
        }
        if (hex.flashTimer > 0) hex.flashTimer -= 0.016;
      }

      const flashing = hex.hasSymbol && hex.flashTimer > 0;
      const intensity = flashing ? Math.sin((hex.flashTimer / hex.flashDur) * Math.PI) : 0;

      // Hex outline — always static
      this.drawHex(hex.x, hex.y, sz);
      c.strokeStyle = `rgba(148,163,184,${hex.baseHexOp})`;
      c.lineWidth = 0.5;
      c.stroke();

      // Symbol rendering
      if (hex.hasSymbol) {
        const symAlpha = flashing ? hex.baseSymbolOp + intensity * 0.55 : hex.baseSymbolOp;

        if (hex.symbol === 'BUG_ICON') {
          this.drawBugIcon(hex.x, hex.y, 1.1, symAlpha, intensity);

          // Rectangular glow
          if (flashing && intensity > 0.4) {
            c.save();
            c.globalAlpha = intensity * 0.07;
            c.fillStyle = '#EF4444';
            c.fillRect(hex.x - 10, hex.y - 12, 20, 24);
            c.restore();
          }
        } else {
          // Text symbols: 404, ERROR, NULL
          c.save();
          c.textAlign = 'center';
          c.textBaseline = 'middle';

          const r = flashing ? Math.round(148 + (239 - 148) * intensity) : 148;
          const g = flashing ? Math.round(163 - 95 * intensity) : 163;
          const b = flashing ? Math.round(184 - 116 * intensity) : 184;
          c.globalAlpha = symAlpha;
          c.font = `bold ${sz * 0.34}px 'Courier New', monospace`;
          c.fillStyle = `rgb(${r},${g},${b})`;
          c.fillText(hex.symbol, hex.x, hex.y + 1);

          // Rectangular glow
          if (flashing && intensity > 0.4) {
            const tw = c.measureText(hex.symbol).width;
            const pad = 4;
            c.globalAlpha = intensity * 0.07;
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
