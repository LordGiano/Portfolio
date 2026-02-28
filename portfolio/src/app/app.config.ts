import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';

const firebaseConfig = {
  projectId: 'norbert-szabo-portfolio',
  appId: '1:389821024268:web:b215411e5d8ff148544629',
  storageBucket: 'norbert-szabo-portfolio.firebasestorage.app',
  apiKey: 'AIzaSyDRLsVtzyrWHGuhwFl98jxgnSO8bTnhU-Q',
  authDomain: 'norbert-szabo-portfolio.firebaseapp.com',
  messagingSenderId: '389821024268',
  measurementId: 'G-Z1ZX679Q17',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
  ]
};
