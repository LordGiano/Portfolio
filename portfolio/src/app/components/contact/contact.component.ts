import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  contactForm: FormGroup;
  newsletterForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      // Itt kellene implementálni az email küldést
      console.log('Form submitted:', this.contactForm.value);

      // Siker üzenet megjelenítése
      this.snackBar.open('Üzenet sikeresen elküldve! Hamarosan válaszolok.', 'Bezár', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });

      // Form visszaállítása
      this.contactForm.reset();
    } else {
      // Hibaüzenet megjelenítése
      this.snackBar.open('Kérlek, töltsd ki az összes mezőt helyesen!', 'Bezár', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }

  subscribeNewsletter() {
    if (this.newsletterForm.valid) {
      // Itt kellene implementálni a hírlevél feliratkozást
      console.log('Newsletter subscription:', this.newsletterForm.value);

      // Siker üzenet megjelenítése
      this.snackBar.open('Sikeresen feliratkoztál a hírlevélre!', 'Bezár', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });

      // Form visszaállítása
      this.newsletterForm.reset();
    } else {
      // Hibaüzenet megjelenítése
      this.snackBar.open('Kérlek, adj meg egy érvényes email címet!', 'Bezár', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }
}
