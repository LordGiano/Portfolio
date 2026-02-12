import { Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  contactForm: FormGroup;
  hoveredCard: string | null = null;
  isSubmitting = false;
  submitSuccess = false;

  // 3D Cube rotation
  cubeRotX = -20;
  cubeRotY = 30;
  private cubeBaseRotX = -20;
  private cubeBaseRotY = 30;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onCubeMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    this.cubeRotY = this.cubeBaseRotY + ((event.clientX - cx) / window.innerWidth) * 25;
    this.cubeRotX = this.cubeBaseRotX + ((event.clientY - cy) / window.innerHeight) * -25;
  }

  resetCubeRotation(): void {
    this.cubeRotX = this.cubeBaseRotX;
    this.cubeRotY = this.cubeBaseRotY;
  }

  onSubmit(): void {
    if (!this.contactForm.valid || this.isSubmitting) return;

    this.isSubmitting = true;

    // Replace with actual HTTP call (e.g. EmailJS, Formspree, backend API)
    setTimeout(() => {
      console.log('Contact form submitted:', this.contactForm.value);
      this.isSubmitting = false;
      this.submitSuccess = true;
      this.contactForm.reset();

      setTimeout(() => {
        this.submitSuccess = false;
      }, 3000);
    }, 1500);
  }
}
