import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';

interface Project {
  id: number;
  title: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  technologies: string[];
  category: string;
  demoUrl?: string;
  githubUrl?: string;
  featured: boolean;
  date: string;
  challenges?: string[];
  solutions?: string[];
  results?: string[];
  screenshots?: string[];
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;

  // Ide jöhet majd az adatbázisból való betöltés
  projects: Project[] = [
    {
      id: 1,
      title: 'E-commerce Platform',
      shortDescription: 'Modern e-commerce solution with Angular frontend',
      description: 'A full-featured e-commerce platform built with Angular and Firebase. This project demonstrates my ability to create complex web applications with real-time features, secure authentication, and scalable architecture.',
      imageUrl: '/assets/projects/ecommerce.jpg',
      technologies: ['Angular', 'Firebase', 'TypeScript', 'Material UI', 'Stripe', 'RxJS', 'NgRx'],
      category: 'Web',
      demoUrl: 'https://demo.example.com/ecommerce',
      githubUrl: 'https://github.com/yourusername/ecommerce',
      featured: true,
      date: '2024-03',
      challenges: [
        'Implementing real-time inventory management',
        'Creating a seamless checkout experience',
        'Ensuring secure payment processing',
        'Building a responsive admin dashboard'
      ],
      solutions: [
        'Used Firebase Realtime Database for instant updates',
        'Integrated Stripe for secure payments',
        'Implemented Angular Material for consistent UI',
        'Created custom authentication guards'
      ],
      results: [
        '50% reduction in cart abandonment',
        '99.9% uptime since launch',
        'Processing 1000+ orders per day',
        '4.8/5 user satisfaction rating'
      ],
      screenshots: [
        '/assets/projects/ecommerce/dashboard.jpg',
        '/assets/projects/ecommerce/products.jpg',
        '/assets/projects/ecommerce/checkout.jpg'
      ]
    },
    // ... további projektek
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const projectId = +params['id'];
      this.project = this.projects.find(p => p.id === projectId) || null;
    });
  }
}
