// src/app/services/contact.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private firestore = inject(Firestore);

  /**
   * Saves a contact form message to Firestore.
   * The Cloud Function will detect this new document and send an email notification.
   */
  async sendMessage(data: ContactMessage): Promise<void> {
    const messagesRef = collection(this.firestore, 'messages');

    await addDoc(messagesRef, {
      ...data,
      createdAt: serverTimestamp(),
      read: false,         // Useful if you later build an admin dashboard
      source: 'portfolio'  // Identifies where the message came from
    });
  }
}
