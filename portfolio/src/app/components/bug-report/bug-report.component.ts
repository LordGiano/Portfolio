// bug-report.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
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
  @ViewChild('particleCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  bugReportForm!: FormGroup;
  isSubmitting = false;
  isExpanded = false;
  currentStep = 1;
  totalSteps = 3;
  submitSuccess = false;
  buttonPulse = true;
  mouseX = 0;
  mouseY = 0;

  // Particle system
  private particles: Particle[] = [];
  private animFrameId: number = 0;
  private ctx!: CanvasRenderingContext2D;

  // Glitch effect
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
    { value: 'low', key: 'bug.sev_low', color: '#22C55E', icon: '●' },
    { value: 'medium', key: 'bug.sev_medium', color: '#F59E0B', icon: '●' },
    { value: 'high', key: 'bug.sev_high', color: '#EF4444', icon: '●' },
    { value: 'critical', key: 'bug.sev_critical', color: '#DC2626', icon: '◆' }
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

    // Glitch effect interval
    this.glitchInterval = setInterval(() => {
      if (this.isExpanded) {
        this.glitchActive = true;
        setTimeout(() => this.glitchActive = false, 150);
      }
    }, 4000);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.glitchInterval) clearInterval(this.glitchInterval);
    if (this.langSub) this.langSub.unsubscribe();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    this.buttonPulse = false;

    if (this.isExpanded) {
      this.currentStep = 1;
      this.submitSuccess = false;
      setTimeout(() => this.initParticles(), 100);
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
    if (this.bugReportForm.valid || (this.currentStep === 3 && this.selectedCategory && this.bugReportForm.get('title')?.valid && this.bugReportForm.get('description')?.valid)) {
      this.isSubmitting = true;

      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;

        // Auto close after success
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

  // Particle system
  private initParticles(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.ctx = canvas.getContext('2d')!;

    this.particles = [];
    const count = 40;
    const colors = ['#2563EB', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B'];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    this.animateParticles();
  }

  private animateParticles(): void {
    if (!this.ctx || !this.isExpanded) return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fill();
    });

    // Draw connections
    this.ctx.globalAlpha = 0.05;
    this.ctx.strokeStyle = '#2563EB';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }

    this.ctx.globalAlpha = 1;

    this.animFrameId = requestAnimationFrame(() => this.animateParticles());
  }
}
