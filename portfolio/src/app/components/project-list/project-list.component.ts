import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  technologies: string[];
  category: string;
  status: 'completed' | 'in-progress' | 'planned';
  featured: boolean;
  icon: string;
  color: string;
  gradient: string;
  date: string;
  githubUrl?: string;
  highlights?: string[];
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent implements OnInit, OnDestroy, AfterViewInit {

  private langSub!: Subscription;
  visibleSections = new Set<string>();
  selectedCategory = 'all';
  expandedProject: string | null = null;

  categories = ['all', 'Computer Vision', 'Mobile', 'Web'];
  projects: Project[] = [];

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(() => this.loadData());
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  private setupIntersectionObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) this.visibleSections.add(id);
          }
        });
      },
      { threshold: 0.1 }
    );
    setTimeout(() => {
      document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    }, 100);
  }

  isSectionVisible(name: string): boolean {
    return this.visibleSections.has(name);
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
  }

  toggleProject(id: string): void {
    this.expandedProject = this.expandedProject === id ? null : id;
  }

  get filteredProjects(): Project[] {
    if (this.selectedCategory === 'all') return this.projects;
    return this.projects.filter(p => p.category === this.selectedCategory);
  }

  get featuredProjects(): Project[] {
    return this.filteredProjects.filter(p => p.featured);
  }

  get otherProjects(): Project[] {
    return this.filteredProjects.filter(p => !p.featured);
  }

  getStatusLabel(status: string): string {
    const t = (key: string) => this.translationService.translate(key);
    switch (status) {
      case 'completed': return t('proj.status_completed');
      case 'in-progress': return t('proj.status_inprogress');
      case 'planned': return t('proj.status_planned');
      default: return status;
    }
  }

  getCategoryLabel(cat: string): string {
    if (cat === 'all') return this.translationService.translate('proj.cat_all');
    return cat;
  }

  private loadData(): void {
    const t = (key: string) => this.translationService.translate(key);

    this.projects = [
      {
        id: 'thesis',
        title: t('proj.thesis_title'),
        subtitle: t('proj.thesis_subtitle'),
        description: t('proj.thesis_desc'),
        technologies: ['Python', 'OpenCV', 'NumPy', 'Alpha Shape', 'Background Subtraction', 'Keypoint Detection'],
        category: 'Computer Vision',
        status: 'completed',
        featured: true,
        icon: 'biotech',
        color: '#7C3AED',
        gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        date: '2025',
        highlights: [
          t('proj.thesis_h1'),
          t('proj.thesis_h2'),
          t('proj.thesis_h3')
        ]
      },
      {
        id: 'virtual-mouse',
        title: t('proj.vmouse_title'),
        subtitle: t('proj.vmouse_subtitle'),
        description: t('proj.vmouse_desc'),
        technologies: ['Python', 'OpenCV', 'MediaPipe', 'Threading'],
        category: 'Computer Vision',
        status: 'completed',
        featured: true,
        icon: 'mouse',
        color: '#2563EB',
        gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)',
        date: '2024',
        highlights: [
          t('proj.vmouse_h1'),
          t('proj.vmouse_h2'),
          t('proj.vmouse_h3')
        ]
      },
      {
        id: 'cell-segmentation',
        title: t('proj.cell_title'),
        subtitle: t('proj.cell_subtitle'),
        description: t('proj.cell_desc'),
        technologies: ['Python', 'OpenCV', 'Image Processing'],
        category: 'Computer Vision',
        status: 'completed',
        featured: false,
        icon: 'blur_on',
        color: '#059669',
        gradient: 'linear-gradient(135deg, #059669, #10B981)',
        date: '2024',
        highlights: [
          t('proj.cell_h1'),
          t('proj.cell_h2'),
          t('proj.cell_h3')
        ]
      },
      {
        id: 'spendlens',
        title: 'SpendLens',
        subtitle: t('proj.spendlens_subtitle'),
        description: t('proj.spendlens_desc'),
        technologies: ['Android', 'Kotlin', 'ML Kit', 'Room DB', 'Jetpack Compose'],
        category: 'Mobile',
        status: 'planned',
        featured: true,
        icon: 'receipt_long',
        color: '#D97706',
        gradient: 'linear-gradient(135deg, #D97706, #F59E0B)',
        date: '2025',
        highlights: [
          t('proj.spendlens_h1'),
          t('proj.spendlens_h2'),
          t('proj.spendlens_h3')
        ]
      },
      {
        id: 'portfolio',
        title: t('proj.portfolio_title'),
        subtitle: t('proj.portfolio_subtitle'),
        description: t('proj.portfolio_desc'),
        technologies: ['Angular', 'TypeScript', 'CSS3', 'i18n'],
        category: 'Web',
        status: 'in-progress',
        featured: false,
        icon: 'web',
        color: '#0891B2',
        gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)',
        date: '2025',
        highlights: [
          t('proj.portfolio_h1'),
          t('proj.portfolio_h2'),
          t('proj.portfolio_h3')
        ]
      }
    ];
  }
}
