import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';

interface Document {
  id: string;
  icon: string;
  title: string;
  type: string;
  description: string;
  size: string;
  date: string;
  url: string;
  category: 'cv' | 'education' | 'certificates' | 'projects' | 'other';
  tags: string[];
  isDownloadable: boolean;
  hasPreview: boolean;
  featured?: boolean;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTabsModule
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent {
  selectedCategory: string = 'all';
  selectedDocument: Document | null = null;

  documents: Document[] = [
    {
      id: 'cv-hun',
      icon: 'description',
      title: 'Önéletrajz (Magyar)',
      type: 'PDF dokumentum',
      description: 'Részletes magyar nyelvű önéletrajz tapasztalatokkal, készségekkel és projektekkel.',
      size: '245 KB',
      date: '2024-01-15',
      url: '/assets/documents/oneletrajz-hun.pdf',
      category: 'cv',
      tags: ['CV', 'Magyar', 'Aktuális'],
      isDownloadable: true,
      hasPreview: true,
      featured: true
    },
    {
      id: 'cv-eng',
      icon: 'description',
      title: 'CV (English)',
      type: 'PDF document',
      description: 'Comprehensive English CV with experience, skills and project portfolio.',
      size: '250 KB',
      date: '2024-01-15',
      url: '/assets/documents/cv-english.pdf',
      category: 'cv',
      tags: ['CV', 'English', 'International'],
      isDownloadable: true,
      hasPreview: true,
      featured: true
    },
    {
      id: 'diploma',
      icon: 'school',
      title: 'Egyetemi Diploma',
      type: 'PDF dokumentum',
      description: 'Informatikai mérnök BSc diploma és melléklet részletes osztályzatokkal.',
      size: '1.8 MB',
      date: '2022-06-20',
      url: '/assets/documents/diploma.pdf',
      category: 'education',
      tags: ['Diploma', 'BSc', 'Informatika'],
      isDownloadable: true,
      hasPreview: true
    },
    {
      id: 'transcripts',
      icon: 'assignment',
      title: 'Egyetemi Eredmények',
      type: 'PDF gyűjtemény',
      description: 'Teljes egyetemi tanulmányi eredmények és kurzus részletezők.',
      size: '2.1 MB',
      date: '2022-06-20',
      url: '/assets/documents/transcripts.pdf',
      category: 'education',
      tags: ['Tanulmányok', 'Osztályzatok', 'Részletes'],
      isDownloadable: true,
      hasPreview: false
    },
    {
      id: 'aws-cert',
      icon: 'workspace_premium',
      title: 'AWS Certified Developer',
      type: 'Digitális tanúsítvány',
      description: 'Amazon Web Services Developer Associate tanúsítvány és részletek.',
      size: '890 KB',
      date: '2023-11-10',
      url: '/assets/documents/aws-certificate.pdf',
      category: 'certificates',
      tags: ['AWS', 'Cloud', 'Developer', 'Associate'],
      isDownloadable: true,
      hasPreview: true
    },
    {
      id: 'angular-cert',
      icon: 'workspace_premium',
      title: 'Angular Professional Certificate',
      type: 'Digitális tanúsítvány',
      description: 'Google Angular fejlesztői szakmai tanúsítvány advanced szinten.',
      size: '650 KB',
      date: '2023-08-15',
      url: '/assets/documents/angular-certificate.pdf',
      category: 'certificates',
      tags: ['Angular', 'Google', 'Frontend', 'Professional'],
      isDownloadable: true,
      hasPreview: true
    },
    {
      id: 'docker-cert',
      icon: 'workspace_premium',
      title: 'Docker Certified Associate',
      type: 'Digitális tanúsítvány',
      description: 'Docker containerization és orchestration szakmai tanúsítvány.',
      size: '720 KB',
      date: '2023-09-22',
      url: '/assets/documents/docker-certificate.pdf',
      category: 'certificates',
      tags: ['Docker', 'DevOps', 'Containers'],
      isDownloadable: true,
      hasPreview: true
    },
    {
      id: 'portfolio-doc',
      icon: 'code',
      title: 'Portfolio Projektek Dokumentáció',
      type: 'Projekt leírás',
      description: 'Részletes technikai dokumentáció a legfontosabb projektjeimről architektúrával és kóddal.',
      size: '4.2 MB',
      date: '2024-01-20',
      url: '/assets/documents/portfolio-projects.pdf',
      category: 'projects',
      tags: ['Projektek', 'Dokumentáció', 'Technikai', 'Kód'],
      isDownloadable: true,
      hasPreview: true
    },
    {
      id: 'github-summary',
      icon: 'code',
      title: 'GitHub Aktivitás Összefoglaló',
      type: 'Fejlesztői jelentés',
      description: 'GitHub repositoryk, commit történet és open source közreműködések összefoglalója.',
      size: '1.5 MB',
      date: '2024-01-25',
      url: '/assets/documents/github-summary.pdf',
      category: 'projects',
      tags: ['GitHub', 'Open Source', 'Commit', 'Statisztika'],
      isDownloadable: true,
      hasPreview: false
    },
    {
      id: 'recommendation-letter',
      icon: 'verified_user',
      title: 'Ajánlólevél',
      type: 'Hivatalos dokumentum',
      description: 'Korábbi munkáltatótól származó hivatalos ajánlólevél teljesítményről és készségekről.',
      size: '320 KB',
      date: '2023-12-05',
      url: '/assets/documents/recommendation.pdf',
      category: 'other',
      tags: ['Ajánlás', 'Munka', 'Referencia'],
      isDownloadable: true,
      hasPreview: true
    }
  ];

  categories = [
    { id: 'all', name: 'Minden dokumentum', icon: 'folder', count: this.documents.length },
    { id: 'cv', name: 'Önéletrajz', icon: 'person', count: this.getDocumentsByCategory('cv').length },
    { id: 'education', name: 'Tanulmányok', icon: 'school', count: this.getDocumentsByCategory('education').length },
    { id: 'certificates', name: 'Tanúsítványok', icon: 'workspace_premium', count: this.getDocumentsByCategory('certificates').length },
    { id: 'projects', name: 'Projektek', icon: 'code', count: this.getDocumentsByCategory('projects').length },
    { id: 'other', name: 'Egyéb', icon: 'more_horiz', count: this.getDocumentsByCategory('other').length }
  ];

  getDocumentsByCategory(category: string): Document[] {
    if (category === 'all') return this.documents;
    return this.documents.filter(doc => doc.category === category);
  }

  getFilteredDocuments(): Document[] {
    return this.getDocumentsByCategory(this.selectedCategory);
  }

  getFeaturedDocuments(): Document[] {
    return this.documents.filter(doc => doc.featured);
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
  }

  downloadDocument(doc: Document) {
    console.log('Letöltés:', doc.title);
    // Itt implementáljuk a letöltés logikát
    // window.open(doc.url, '_blank');

    // Simulált letöltés
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  previewDocument(doc: Document) {
    if (!doc.hasPreview) {
      alert('Ennek a dokumentumnak nincs elérhető előnézete.');
      return;
    }

    this.selectedDocument = doc;
    console.log('Előnézet:', doc.title);
    // Itt implementáljuk az előnézet logikát
  }

  closePreview() {
    this.selectedDocument = null;
  }

  shareDocument(doc: Document) {
    if (navigator.share) {
      navigator.share({
        title: doc.title,
        text: doc.description,
        url: doc.url
      });
    } else {
      // Fallback - clipboard API
      navigator.clipboard.writeText(window.location.origin + doc.url).then(() => {
        alert('Dokumentum link másolva a vágólapra!');
      });
    }
  }

  getDocumentTypeClass(type: string): string {
    if (type.includes('PDF')) return 'pdf';
    if (type.includes('Digitális')) return 'digital';
    if (type.includes('Projekt')) return 'project';
    return 'default';
  }

  trackByDocId(index: number, doc: Document): string {
    return doc.id;
  }

  getDownloadableCount(): number {
    return this.documents.filter(d => d.isDownloadable).length;
  }
}
