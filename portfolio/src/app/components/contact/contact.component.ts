import { Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Industry-standard email validator (stricter than Angular's built-in Validators.email).
 *
 * Rules enforced:
 *  - Local part (before @): min 2 chars, allows letters, digits, ._%+-
 *  - Must contain exactly one @
 *  - Domain part (between @ and last .): min 2 chars, allows letters, digits, hyphens, dots for subdomains
 *  - TLD (after last .): 2–10 letters only (covers .com, .info, .museum, .travel, etc.)
 *
 * Rejects: a@a, 1@1, a@_.7319, test@.com, test@com., user@-domain.com
 */
function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // let Validators.required handle empty
  }

  const email: string = control.value.trim();

  //  local   : 2+ chars from [a-zA-Z0-9._%+-]
  //  @
  //  domain  : 2+ chars per label [a-zA-Z0-9-], labels separated by dots, no leading/trailing hyphens
  //  .
  //  TLD     : 2-10 alpha chars
  const pattern = /^[a-zA-Z0-9._%+\-]{2,}@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,10}$/;

  if (!pattern.test(email)) {
    return { emailFormat: true };
  }

  return null;
}

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
  submitError = false;
  formSubmitted = false;

  // 3D Scene parallax rotation
  sceneRotX = 5;
  sceneRotY = -5;
  private sceneBaseRotX = 5;
  private sceneBaseRotY = -5;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
      email: ['', [Validators.required, strictEmailValidator]],
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
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

  get messageCharCount(): number {
    return this.contactForm.get('message')?.value?.length || 0;
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

  dismissError(): void {
    this.submitError = false;
  }

  closeSuccessOverlay(): void {
    this.submitSuccess = false;
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.submitError = false;

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
      const success = true; // Toggle to false to test error state

      if (success) {
        console.log('Contact form submitted:', this.contactForm.value);
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.formSubmitted = false;
        this.contactForm.reset();

        // Auto-close success overlay after 4 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 4000);
      } else {
        this.isSubmitting = false;
        this.submitError = true;

        // Auto-dismiss error after 5 seconds
        setTimeout(() => {
          this.submitError = false;
        }, 5000);
      }
    }, 1500);
  }
}
