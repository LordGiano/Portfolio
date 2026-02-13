// bug-report.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

/** A single falling column in the "bug rain" */
interface RainDrop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  charIndex: number;
  fontSize: number;
  opacity: number;
  hue: number; // color hue (red-ish for bugs)
}

/** A floating bug icon drifting across the background */
interface FloatingBug {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  symbol: string;
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

  // Bug rain canvas
  private drops: RainDrop[] = [];
  private floatingBugs: FloatingBug[] = [];
  private animFrameId: number = 0;
  private ctx!: CanvasRenderingContext2D;

  // Glitch effect — subtle scanline only
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

    // Subtle glitch scanline
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
      setTimeout(() => this.initBugRain(), 100);
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
      const titleControl = this.bugReportForm.get('title');
      const descControl = this.bugReportForm.get('description');
      if (titleControl?.invalid || descControl?.invalid) {
        titleControl?.markAsTouched();
        descControl?.markAsTouched();
        return;
      }
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
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

  // ── Bug Rain Canvas — Matrix-style falling code with bug symbols ──

  private initBugRain(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.ctx = canvas.getContext('2d')!;

    // Bug-themed characters: code fragments, error symbols, hex values
    const bugChars = [
      '0', '1', '{', '}', ';', '/', '\\', '<', '>', '!',
      'E', 'R', 'R', 'x', 'F', 'F', 'null', '⚠', '✗',
      '404', '500', '0x', 'NaN', '∅', '⊘', '×', '‽'
    ];

    // Create rain drops (columns)
    this.drops = [];
    const cols = Math.floor(canvas.width / 18);
    for (let i = 0; i < cols; i++) {
      this.drops.push({
        x: i * 18 + 9,
        y: Math.random() * canvas.height * -1,
        speed: 0.3 + Math.random() * 1.2,
        chars: bugChars,
        charIndex: Math.floor(Math.random() * bugChars.length),
        fontSize: 10 + Math.floor(Math.random() * 4),
        opacity: 0.03 + Math.random() * 0.08,
        hue: Math.random() > 0.7 ? 0 : (Math.random() > 0.5 ? 220 : 270) // red, blue, purple
      });
    }

    // Create floating bug symbols
    this.floatingBugs = [];
    const bugSymbols = ['🐛', '🪲', '🐞', '⚠', '✗', '⊘'];
    for (let i = 0; i < 6; i++) {
      this.floatingBugs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 12 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        opacity: 0.06 + Math.random() * 0.08,
        symbol: bugSymbols[Math.floor(Math.random() * bugSymbols.length)]
      });
    }

    this.animateBugRain();
  }

  private animateBugRain(): void {
    if (!this.ctx || !this.isExpanded) return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    // Fade trail effect instead of full clear
    this.ctx.fillStyle = 'rgba(11, 17, 32, 0.15)';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw rain drops
    for (const drop of this.drops) {
      drop.y += drop.speed;

      // Reset when off screen
      if (drop.y > canvas.height + 20) {
        drop.y = -20;
        drop.charIndex = Math.floor(Math.random() * drop.chars.length);
      }

      // Cycle through characters
      if (Math.random() < 0.05) {
        drop.charIndex = (drop.charIndex + 1) % drop.chars.length;
      }

      const char = drop.chars[drop.charIndex];

      this.ctx.save();
      this.ctx.font = `${drop.fontSize}px 'JetBrains Mono', monospace`;
      this.ctx.globalAlpha = drop.opacity;

      // Head character is brighter
      const headAlpha = drop.opacity * 3;
      this.ctx.globalAlpha = Math.min(headAlpha, 0.35);
      this.ctx.fillStyle = `hsl(${drop.hue}, 70%, 60%)`;
      this.ctx.fillText(char, drop.x, drop.y);

      // Trail character (dimmer, slightly above)
      this.ctx.globalAlpha = drop.opacity;
      this.ctx.fillStyle = `hsl(${drop.hue}, 50%, 40%)`;
      this.ctx.fillText(char, drop.x, drop.y - drop.fontSize);

      this.ctx.restore();
    }

    // Draw floating bug symbols
    for (const bug of this.floatingBugs) {
      bug.x += bug.vx;
      bug.y += bug.vy;
      bug.rotation += bug.rotSpeed;

      // Bounce off edges
      if (bug.x < 0 || bug.x > canvas.width) bug.vx *= -1;
      if (bug.y < 0 || bug.y > canvas.height) bug.vy *= -1;

      this.ctx.save();
      this.ctx.globalAlpha = bug.opacity;
      this.ctx.translate(bug.x, bug.y);
      this.ctx.rotate(bug.rotation);
      this.ctx.font = `${bug.size}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(bug.symbol, 0, 0);
      this.ctx.restore();
    }

    this.animFrameId = requestAnimationFrame(() => this.animateBugRain());
  }
}
