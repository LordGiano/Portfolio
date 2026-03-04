// src/app/services/bug-report.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';

export interface BugReport {
  category: string;
  severity: string;
  title: string;
  description: string;
  reproduceSteps?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BugReportService {
  private firestore = inject(Firestore);

  /**
   * Saves a bug report to Firestore.
   * The existing Cloud Function can be extended to notify about new bug reports too.
   */
  async submitBugReport(data: BugReport): Promise<void> {
    const bugsRef = collection(this.firestore, 'bug-reports');

    await addDoc(bugsRef, {
      ...data,
      createdAt: serverTimestamp(),
      status: 'new',          // For tracking: new → in-progress → resolved
      source: 'portfolio'
    });
  }
}
