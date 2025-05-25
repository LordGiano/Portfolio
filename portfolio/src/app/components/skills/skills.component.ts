import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

interface Technology {
  name: string;
  level: number;
  yearsOfExperience: number;
  projects: string[];
  description: string;
  category: string;
}

interface Skill {
  icon: string;
  title: string;
  description: string;
  technologies: string[];
  level: number;
  detailedTechnologies: Technology[];
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.css'
})
export class SkillsComponent {
  selectedSkill: Skill | null = null;
  selectedTechnology: Technology | null = null;

  skills: Skill[] = [
    {
      icon: 'code',
      title: 'Frontend Fejlesztés',
      description: 'Modern webes felületek készítése responsive design-nal és felhasználóbarát élménnyel.',
      technologies: ['Angular', 'React', 'TypeScript', 'HTML5', 'CSS3', 'SCSS', 'Bootstrap', 'Material Design'],
      level: 90,
      detailedTechnologies: [
        {
          name: 'Angular',
          level: 95,
          yearsOfExperience: 4,
          projects: ['Portfolio App', 'E-commerce Platform', 'Admin Dashboard', 'Real-time Chat App'],
          description: 'Teljes stack Angular fejlesztés, komponens architektúra, RxJS, NgRx state management.',
          category: 'Framework'
        },
        {
          name: 'TypeScript',
          level: 90,
          yearsOfExperience: 4,
          projects: ['Minden Angular projekt', 'Node.js Backend', 'React Native App'],
          description: 'Type-safe fejlesztés, advanced típusok, decoratorok, generics használata.',
          category: 'Nyelv'
        },
        {
          name: 'React',
          level: 85,
          yearsOfExperience: 3,
          projects: ['Social Media App', 'Blog Platform', 'Portfolio Website'],
          description: 'Hooks, Context API, Redux, functional komponensek, performance optimalizálás.',
          category: 'Framework'
        },
        {
          name: 'SCSS/CSS3',
          level: 88,
          yearsOfExperience: 5,
          projects: ['Minden frontend projekt'],
          description: 'Advanced CSS, Flexbox, Grid, animációk, responsive design, CSS-in-JS.',
          category: 'Styling'
        }
      ]
    },
    {
      icon: 'storage',
      title: 'Backend Fejlesztés',
      description: 'Szerveroldali alkalmazások és API-k fejlesztése skálázható architektúrával.',
      technologies: ['Node.js', 'Express.js', 'Python', 'Django', 'REST API', 'GraphQL', 'PostgreSQL', 'MongoDB'],
      level: 85,
      detailedTechnologies: [
        {
          name: 'Node.js',
          level: 88,
          yearsOfExperience: 3,
          projects: ['REST API Server', 'Microservices', 'Real-time Socket App'],
          description: 'Express.js, Fastify, middleware development, async/await, streams.',
          category: 'Runtime'
        },
        {
          name: 'Python',
          level: 82,
          yearsOfExperience: 2,
          projects: ['Data Analysis Tool', 'ML Model API', 'Web Scraper'],
          description: 'Django, Flask, FastAPI, pandas, numpy, machine learning basics.',
          category: 'Nyelv'
        },
        {
          name: 'PostgreSQL',
          level: 85,
          yearsOfExperience: 3,
          projects: ['E-commerce DB', 'User Management System', 'Analytics Platform'],
          description: 'Complex queries, indexing, triggers, stored procedures, performance tuning.',
          category: 'Adatbázis'
        },
        {
          name: 'MongoDB',
          level: 80,
          yearsOfExperience: 2,
          projects: ['Content Management', 'Social Media Backend', 'IoT Data Storage'],
          description: 'Document design, aggregation pipeline, indexing, replica sets.',
          category: 'Adatbázis'
        }
      ]
    },
    {
      icon: 'cloud',
      title: 'Felhő Technológiák',
      description: 'Alkalmazások telepítése, kezelése és monitorozása felhőalapú környezetben.',
      technologies: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions'],
      level: 75,
      detailedTechnologies: [
        {
          name: 'Docker',
          level: 85,
          yearsOfExperience: 2,
          projects: ['Microservices Deployment', 'Dev Environment Setup', 'Production Containers'],
          description: 'Dockerfile optimization, multi-stage builds, docker-compose, container orchestration.',
          category: 'Containerization'
        },
        {
          name: 'AWS',
          level: 78,
          yearsOfExperience: 1.5,
          projects: ['Static Site Hosting', 'Serverless Functions', 'Database Migration'],
          description: 'EC2, S3, Lambda, RDS, CloudFormation, IAM, Route53.',
          category: 'Cloud Platform'
        },
        {
          name: 'GitHub Actions',
          level: 80,
          yearsOfExperience: 2,
          projects: ['Automated Testing', 'Deployment Pipeline', 'Code Quality Checks'],
          description: 'YAML workflows, matrix builds, secrets management, deployment automation.',
          category: 'CI/CD'
        }
      ]
    },
    {
      icon: 'phonelink',
      title: 'Mobil Fejlesztés',
      description: 'Natív és hibrid mobil alkalmazások készítése iOS és Android platformokra.',
      technologies: ['React Native', 'Ionic', 'Flutter', 'PWA', 'Cordova', 'Xamarin'],
      level: 70,
      detailedTechnologies: [
        {
          name: 'React Native',
          level: 75,
          yearsOfExperience: 1,
          projects: ['Todo App', 'Weather App', 'Social Media Client'],
          description: 'Navigation, state management, native modules, performance optimization.',
          category: 'Cross-platform'
        },
        {
          name: 'PWA',
          level: 80,
          yearsOfExperience: 2,
          projects: ['Portfolio PWA', 'Offline News Reader', 'Shopping List App'],
          description: 'Service workers, caching strategies, web app manifest, push notifications.',
          category: 'Web Technology'
        },
        {
          name: 'Ionic',
          level: 70,
          yearsOfExperience: 1,
          projects: ['Hybrid Mobile App', 'Prototype Development'],
          description: 'Angular integration, Capacitor plugins, native functionality access.',
          category: 'Hybrid Framework'
        }
      ]
    }
  ];

  getSkillLevelText(level: number): string {
    if (level >= 90) return 'Haladó';
    if (level >= 75) return 'Középhaladó';
    if (level >= 60) return 'Középszint';
    return 'Alapszint';
  }

  getSkillLevelClass(level: number): string {
    if (level >= 90) return 'expert';
    if (level >= 75) return 'advanced';
    if (level >= 60) return 'intermediate';
    return 'beginner';
  }

  trackByFn(index: number, item: Skill): string {
    return item.title;
  }

  openSkillDetails(skill: Skill) {
    this.selectedSkill = skill;
    this.selectedTechnology = null;
  }

  closeSkillDetails() {
    this.selectedSkill = null;
    this.selectedTechnology = null;
  }

  openTechnologyDetails(technology: Technology) {
    this.selectedTechnology = technology;
  }

  closeTechnologyDetails() {
    this.selectedTechnology = null;
  }

  getTechnologyLevelText(level: number): string {
    if (level >= 90) return 'Szakértő';
    if (level >= 80) return 'Haladó';
    if (level >= 70) return 'Középhaladó';
    if (level >= 60) return 'Középszint';
    return 'Alapszint';
  }

  getTechnologyLevelClass(level: number): string {
    if (level >= 90) return 'expert';
    if (level >= 80) return 'advanced';
    if (level >= 70) return 'intermediate-advanced';
    if (level >= 60) return 'intermediate';
    return 'beginner';
  }
}
