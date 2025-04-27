// bug-report.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bug-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './bug-report.component.html',
  styleUrl: './bug-report.component.css'
})
export class BugReportComponent implements OnInit {
  bugReportForm!: FormGroup;
  isSubmitting = false;
  isExpanded = false;

  bugCategories = [
    { value: 'ui', viewValue: 'Felhasználói felület' },
    { value: 'functionality', viewValue: 'Funkcionalitás' },
    { value: 'performance', viewValue: 'Teljesítmény' },
    { value: 'other', viewValue: 'Egyéb' }
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.bugReportForm = this.fb.group({
      category: ['ui', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
      reproduceSteps: ['', Validators.maxLength(500)],
      email: ['', [Validators.email]]
    });
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;

    // If we're closing the form and it was in the middle of being filled out, reset it
    if (!this.isExpanded && this.bugReportForm.dirty && !this.isSubmitting) {
      this.bugReportForm.reset({
        category: 'ui'
      });
    }
  }

  onSubmit(): void {
    if (this.bugReportForm.valid) {
      this.isSubmitting = true;

      // Itt később implementálható a tényleges küldés API-n keresztül
      // Például egy BugReportService segítségével

      // Szimuláljuk az API hívást
      setTimeout(() => {
        this.isSubmitting = false;
        this.snackBar.open('Köszönjük a hibajelentést!', 'Bezár', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.bugReportForm.reset({
          category: 'ui'
        });

        // Close the form after successful submission
        this.isExpanded = false;
      }, 1500);
    } else {
      this.markFormGroupTouched(this.bugReportForm);
    }
  }

  // Segédfüggvény az összes form mező "touched" állapotba helyezéséhez
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
