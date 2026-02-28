// src/app/components/contact/contact.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ContactService } from '../../services/contact.service';

/**
 * Industry-standard email validator (stricter than Angular's built-in Validators.email).
 *
 * Rules enforced:
 *  - Local part (before @): min 2 chars, allows letters, digits, ._%+-
 *  - Must contain exactly one @
 *  - Domain part (between @ and last .): min 2 chars per label, allows letters, digits, hyphens
 *  - TLD (after last .): 2–10 letters only
 *
 * Rejects: a@a, 1@1, a@_.7319, test@.com, test@com., user@-domain.com
 */
function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const email: string = control.value.trim();
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

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
      email: ['', [Validators.required, strictEmailValidator]],
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

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

  async onSubmit(): Promise<void> {
    this.formSubmitted = true;
    this.submitError = false;

    if (!this.contactForm.valid || this.isSubmitting) {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    try {
      await this.contactService.sendMessage({
        name: this.contactForm.value.name.trim(),
        email: this.contactForm.value.email.trim(),
        subject: this.contactForm.value.subject.trim(),
        message: this.contactForm.value.message.trim()
      });

      this.isSubmitting = false;
      this.submitSuccess = true;
      this.formSubmitted = false;
      this.contactForm.reset();

      setTimeout(() => {
        this.submitSuccess = false;
      }, 4000);

    } catch (error) {
      console.error('Failed to send message:', error);
      this.isSubmitting = false;
      this.submitError = true;

      setTimeout(() => {
        this.submitError = false;
      }, 5000);
    }
  }
}
