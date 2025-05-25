import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

interface Skill {
  icon: string;
  title: string;
  description: string;
  technologies: string[];
  level: number;
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.css'
})
export class SkillsComponent {
  skills: Skill[] = [
    {
      icon: 'code',
      title: 'Frontend Fejlesztés',
      description: 'Modern webes felületek készítése responsive design-nal és felhasználóbarát élménnyel.',
      technologies: ['Angular', 'React', 'TypeScript', 'HTML5', 'CSS3', 'SCSS', 'Bootstrap', 'Material Design'],
      level: 90
    },
    {
      icon: 'storage',
      title: 'Backend Fejlesztés',
      description: 'Szerveroldali alkalmazások és API-k fejlesztése skálázható architektúrával.',
      technologies: ['Node.js', 'Express.js', 'Python', 'Django', 'REST API', 'GraphQL', 'PostgreSQL', 'MongoDB'],
      level: 85
    },
    {
      icon: 'cloud',
      title: 'Felhő Technológiák',
      description: 'Alkalmazások telepítése, kezelése és monitorozása felhőalapú környezetben.',
      technologies: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions'],
      level: 75
    },
    {
      icon: 'phonelink',
      title: 'Mobil Fejlesztés',
      description: 'Natív és hibrid mobil alkalmazások készítése iOS és Android platformokra.',
      technologies: ['React Native', 'Ionic', 'Flutter', 'PWA', 'Cordova', 'Xamarin'],
      level: 70
    },
    {
      icon: 'analytics',
      title: 'Adatbázis & Adatelemzés',
      description: 'Adatbázis tervezés, optimalizálás és big data megoldások implementálása.',
      technologies: ['SQL', 'NoSQL', 'Redis', 'Elasticsearch', 'Power BI', 'Tableau', 'Python Analytics'],
      level: 80
    },
    {
      icon: 'security',
      title: 'Biztonság & Tesztelés',
      description: 'Alkalmazások biztonsági auditálása és átfogó tesztelési stratégiák kialakítása.',
      technologies: ['Jest', 'Cypress', 'Selenium', 'OAuth', 'JWT', 'SSL/TLS', 'Penetration Testing'],
      level: 75
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
}
