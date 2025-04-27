import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

interface Experience {
  type: 'work' | 'education';
  title: string;
  company?: string;
  institution?: string;
  period: string;
  location: string;
  description: string[];
  technologies?: string[];
  achievements?: string[];
}

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatDividerModule
  ],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css'
})
export class ExperienceComponent {
  experiences: Experience[] = [
    {
      type: 'work',
      title: 'Senior Frontend Developer',
      company: 'Tech Solutions Inc.',
      period: '2021 - Present',
      location: 'Remote',
      description: [
        'Led development of enterprise Angular applications',
        'Implemented CI/CD pipelines and automated testing',
        'Mentored junior developers and conducted code reviews'
      ],
      technologies: ['Angular', 'TypeScript', 'RxJS', 'Firebase', 'Jest'],
      achievements: [
        'Reduced load time by 40% through optimization',
        'Successfully launched 5 major features',
        'Improved code coverage from 65% to 95%'
      ]
    },
    {
      type: 'work',
      title: 'Frontend Developer',
      company: 'Digital Innovations Ltd.',
      period: '2019 - 2021',
      location: 'Budapest, Hungary',
      description: [
        'Developed responsive web applications using Angular and React',
        'Collaborated with UX/UI designers to implement pixel-perfect designs',
        'Integrated REST APIs and managed state with NgRx'
      ],
      technologies: ['Angular', 'React', 'JavaScript', 'SASS', 'Redux']
    },
    {
      type: 'education',
      title: 'Master of Science in Computer Science',
      institution: 'Budapest University of Technology',
      period: '2017 - 2019',
      location: 'Budapest, Hungary',
      description: [
        'Specialized in Software Engineering and Artificial Intelligence',
        'Thesis: "Real-time Computer Vision System for Object Detection"',
        'GPA: 4.8/5.0'
      ],
      achievements: [
        'Graduated with Honors',
        'Best Thesis Award 2019',
        'Research paper published in International Journal'
      ]
    },
    {
      type: 'education',
      title: 'Bachelor of Science in Computer Engineering',
      institution: 'Budapest University of Technology',
      period: '2013 - 2017',
      location: 'Budapest, Hungary',
      description: [
        'Focus on software development and computer systems',
        'Completed internship at Microsoft Hungary',
        'Led student programming club'
      ],
      achievements: [
        'Dean\'s List all semesters',
        'Won National Programming Competition 2016'
      ]
    }
  ];
}
