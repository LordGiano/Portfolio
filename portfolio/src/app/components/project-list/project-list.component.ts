import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent {
  searchText: string = '';
  selectedCategory: string = 'all';

  categories: string[] = ['all', 'Web', 'Mobile', 'AI/ML', 'Desktop'];

  projects: Project[] = [
    {
      id: 1,
      title: 'E-commerce Platform',
      shortDescription: 'Modern e-commerce solution with Angular frontend',
      description: 'A full-featured e-commerce platform built with Angular and Firebase. Includes real-time inventory management, user authentication, payment integration, and admin dashboard.',
      imageUrl: 'https://via.placeholder.com/800x400/e2e8f0/2563eb?text=E-commerce+Platform',
      technologies: ['Angular', 'Firebase', 'TypeScript', 'Material UI', 'Stripe'],
      category: 'Web',
      demoUrl: 'https://demo.example.com/ecommerce',
      githubUrl: 'https://github.com/yourusername/ecommerce',
      featured: true,
      date: '2024-03'
    },
    {
      id: 2,
      title: 'AI Image Recognition',
      shortDescription: 'Computer vision application for object detection',
      description: 'Machine learning project using TensorFlow for real-time object detection and classification. Includes web interface for image upload and analysis.',
      imageUrl: 'https://via.placeholder.com/800x400/dbeafe/3b82f6?text=AI+Image+Recognition',
      technologies: ['Python', 'TensorFlow', 'OpenCV', 'Flask', 'React'],
      category: 'AI/ML',
      githubUrl: 'https://github.com/yourusername/ai-vision',
      featured: true,
      date: '2024-01'
    },
    {
      id: 3,
      title: 'Task Management App',
      shortDescription: 'Cross-platform task management solution',
      description: 'A productivity app built with React Native for iOS and Android. Features task organization, reminders, team collaboration, and cloud synchronization.',
      imageUrl: 'https://via.placeholder.com/800x400/fae8ff/a855f7?text=Task+Management',
      technologies: ['React Native', 'TypeScript', 'Redux', 'Firebase'],
      category: 'Mobile',
      demoUrl: 'https://demo.example.com/taskapp',
      featured: false,
      date: '2023-11'
    },
    {
      id: 4,
      title: 'Portfolio Website',
      shortDescription: 'Personal portfolio and blog platform',
      description: 'Modern portfolio website built with Angular, featuring project showcase, blog functionality, and contact form with email integration.',
      imageUrl: 'https://via.placeholder.com/800x400/f0fdf4/22c55e?text=Portfolio+Website',
      technologies: ['Angular', 'TypeScript', 'SCSS', 'Firebase'],
      category: 'Web',
      demoUrl: 'https://yourportfolio.com',
      githubUrl: 'https://github.com/yourusername/portfolio',
      featured: false,
      date: '2023-09'
    }
  ];

  get filteredProjects() {
    return this.projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
                          project.shortDescription.toLowerCase().includes(this.searchText.toLowerCase()) ||
                          project.technologies.some(tech => tech.toLowerCase().includes(this.searchText.toLowerCase()));

      const matchesCategory = this.selectedCategory === 'all' || project.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  get featuredProjects() {
    return this.filteredProjects.filter(project => project.featured);
  }

  get hasFeaturedProjects() {
    return this.featuredProjects.length > 0;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }
}
