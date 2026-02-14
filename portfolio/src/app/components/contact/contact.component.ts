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
  formSubmitted = false;

  // 3D Scene parallax rotation
  sceneRotX = 5;
  sceneRotY = -5;
  private sceneBaseRotX = 5;
  private sceneBaseRotY = -5;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  /**
   * Returns true if a field should display its error state.
   * Shows errors when the field has been touched/dirty OR the form has been submitted.
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    if (!field) return false;
    return field.invalid && (field.dirty || field.touched || this.formSubmitted);
  }

  onSceneMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (event.clientX - cx) / rect.width;
    const dy = (event.clientY - cy) / rect.height;
    this.sceneRotY = this.sceneBaseRotY + dx * 15;
    this.sceneRotX = this.sceneBaseRotX + dy * -10;
  }

  resetScene(): void {
    this.sceneRotX = this.sceneBaseRotX;
    this.sceneRotY = this.sceneBaseRotY;
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (!this.contactForm.valid || this.isSubmitting) {
      // Mark all fields as touched so errors appear
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Replace with actual HTTP call (e.g. EmailJS, Formspree, backend API)
    setTimeout(() => {
      console.log('Contact form submitted:', this.contactForm.value);
      this.isSubmitting = false;
      this.submitSuccess = true;
      this.formSubmitted = false;
      this.contactForm.reset();

      setTimeout(() => {
        this.submitSuccess = false;
      }, 3000);
    }, 1500);
  }
}
