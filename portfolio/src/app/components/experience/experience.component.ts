import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

interface WorkExperience {
  role: string; company: string; type: 'full-time' | 'contract' | 'internship';
  period: string; location: string; mode: string;
  technologies: string[]; descriptions: string[];
  highlight?: string; color: string; gradient: string; icon: string;
}

interface Education {
  degree: string; specialization: string; institution: string;
  period: string; location: string; grade?: string;
  subjects?: string[]; activities?: string;
  icon: string; color: string; gradient: string;
}


@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css'
})
export class ExperienceComponent implements OnInit, OnDestroy, AfterViewInit {

  private langSub!: Subscription;
  visibleSections = new Set<string>();

  // Book pagination
  activeEduPage = 0;
  bookAnimating = false;

  // Expanded timeline card
  expandedJob = -1;

  workExperiences: WorkExperience[] = [];
  educations: Education[] = [];

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(() => this.loadData());
    this.loadData();
  }

  ngAfterViewInit(): void { this.setupIntersectionObserver(); }
  ngOnDestroy(): void { this.langSub?.unsubscribe(); }

  // —— Intersection Observer ——
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
      { threshold: 0.15 }
    );
    setTimeout(() => {
      document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    }, 100);
  }

  isSectionVisible(name: string): boolean { return this.visibleSections.has(name); }

  // —— Timeline expand ——
  toggleJob(index: number): void {
    this.expandedJob = this.expandedJob === index ? -1 : index;
  }

  // —— 3D Tilt for timeline cards ——
  onCardTilt(event: MouseEvent): void {
    const card = (event.currentTarget as HTMLElement);
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;

    const inner = card.querySelector('.v-tl-card-inner') as HTMLElement;
    if (inner) {
      inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
    }

    // Move light dot
    const lightDot = card.querySelector('.v-tl-light-dot') as HTMLElement;
    if (lightDot) {
      lightDot.style.left = x + 'px';
      lightDot.style.top = y + 'px';
    }
  }

  onCardTiltReset(event: MouseEvent): void {
    const card = (event.currentTarget as HTMLElement);
    const inner = card.querySelector('.v-tl-card-inner') as HTMLElement;
    if (inner) {
      inner.style.transform = 'rotateX(0) rotateY(0) translateZ(0)';
    }
  }

  // —— Book pagination ——
  goToEduPage(index: number): void {
    if (this.bookAnimating || index === this.activeEduPage) return;
    this.bookAnimating = true;
    this.activeEduPage = index;
    setTimeout(() => this.bookAnimating = false, 700);
  }

  nextEdu(): void {
    if (this.activeEduPage < this.educations.length - 1) this.goToEduPage(this.activeEduPage + 1);
  }

  prevEdu(): void {
    if (this.activeEduPage > 0) this.goToEduPage(this.activeEduPage - 1);
  }

  getTypeLabel(type: string): string {
    const t = (key: string) => this.translationService.translate(key);
    switch (type) {
      case 'full-time': return t('exp.type_fulltime');
      case 'contract': return t('exp.type_contract');
      case 'internship': return t('exp.type_internship');
      default: return type;
    }
  }

  // —— Data ——
  private loadData(): void {
    const t = (key: string) => this.translationService.translate(key);

    this.workExperiences = [
      { role: t('exp.job0_role'), company: 'Ericsson Magyarország Kft.', type: 'full-time', period: t('exp.job0_period'), location: 'Budapest', mode: 'On-site',
        technologies: ['Java', 'Spring Boot', 'Python', 'Docker', 'Kubernetes', 'CI/CD', 'Agile/Scrum'], descriptions: [t('exp.job0_desc1'), t('exp.job0_desc2'), t('exp.job0_desc3'), t('exp.job0_desc4')],
        color: '#0082F0', gradient: 'linear-gradient(135deg, #0082F0, #00B8F0)', icon: 'cell_tower' },
      { role: t('exp.job1_role'), company: 'Master Consulting Kft.', type: 'full-time', period: t('exp.job1_period'), location: 'Budapest', mode: 'Hybrid',
        technologies: ['Python', 'Angular', 'MSSQL', 'REST APIs', 'Git'], descriptions: [t('exp.job1_desc1'), t('exp.job1_desc2'), t('exp.job1_desc3'), t('exp.job1_desc4')],
        highlight: t('exp.job1_highlight'), color: '#0D9488', gradient: 'linear-gradient(135deg, #0D9488, #14B8A6)', icon: 'business' },
      { role: t('exp.job2_role'), company: 'NetAdClick Kft.', type: 'contract', period: t('exp.job2_period'), location: 'Budapest', mode: 'On-site',
        technologies: ['Python', 'Angular', 'MySQL'], descriptions: [t('exp.job2_desc1'), t('exp.job2_desc2'), t('exp.job2_desc3'), t('exp.job2_desc4')],
        color: '#D97706', gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', icon: 'ads_click' },
      { role: t('exp.job3_role'), company: 'Robert Bosch Kft.', type: 'internship', period: t('exp.job3_period'), location: 'Budapest', mode: 'Hybrid',
        technologies: ['Angular', 'C#', 'MSSQL', 'Docker', 'ISTQB', 'Agile/Scrum'], descriptions: [t('exp.job3_desc1'), t('exp.job3_desc2'), t('exp.job3_desc3'), t('exp.job3_desc4')],
        color: '#059669', gradient: 'linear-gradient(135deg, #059669, #10B981)', icon: 'precision_manufacturing' },
      { role: t('exp.job4_role'), company: 'e-track Informatikai Kft.', type: 'full-time', period: t('exp.job4_period'), location: 'Budapest', mode: 'On-site',
        technologies: ['C#', 'MSSQL', 'WinForms', 'XML', 'JSON'], descriptions: [t('exp.job4_desc1'), t('exp.job4_desc2'), t('exp.job4_desc3'), t('exp.job4_desc4')],
        color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', icon: 'gps_fixed' },
      { role: t('exp.job5_role'), company: 'Cognizant', type: 'contract', period: t('exp.job5_period'), location: 'Kraków', mode: 'On-site',
        technologies: ['Google Tag Manager', 'Google Ads', 'CRM'], descriptions: [t('exp.job5_desc1'), t('exp.job5_desc2')],
        color: '#0891B2', gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)', icon: 'support_agent' },
      { role: t('exp.job6_role'), company: 'DEÁK Kft.', type: 'internship', period: t('exp.job6_period'), location: 'Dunaújváros', mode: 'On-site',
        technologies: ['C#', 'MySQL', 'Visual Studio'], descriptions: [t('exp.job6_desc1'), t('exp.job6_desc2')],
        color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #EF4444)', icon: 'settings' }
    ];

    this.educations = [
      { degree: t('exp.edu1_degree'), specialization: t('exp.edu1_spec'), institution: t('exp.edu1_institution'), period: '2022 – 2025', location: 'Szeged', grade: '4/5',
        subjects: ['Image Processing', 'OpenCV', 'Machine Learning', 'Neural Networks', 'Computer Vision', 'Cryptography', 'Firebase', 'Unity'], activities: 'ESN Szeged',
        icon: 'school', color: '#2563EB', gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)' },
      { degree: t('exp.edu2_degree'), specialization: t('exp.edu2_spec'), institution: t('exp.edu2_institution'), period: '2018 – 2022', location: 'Dunaújváros', grade: '4/5',
        subjects: ['C#', 'Java', 'Python', 'HTML/CSS/JS', 'PHP', 'MySQL', 'MSSQL', 'UML', 'Linux'], activities: 'Selmeci Hagyományok, EFOP 3.6.1',
        icon: 'engineering', color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' },
      { degree: t('exp.edu3_degree'), specialization: t('exp.edu3_spec'), institution: 'Universidad del País Vasco (EHU)', period: '2020 – 2021', location: 'Bilbao, Spain',
        subjects: ['Telecommunications', 'Spanish', 'Basque'], activities: 'Erasmus+',
        icon: 'public', color: '#059669', gradient: 'linear-gradient(135deg, #059669, #10B981)' }
    ];
  }
}
