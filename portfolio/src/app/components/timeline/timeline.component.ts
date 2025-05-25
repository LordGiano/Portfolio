// timeline.component.ts

import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ElementRef, Renderer2, ViewChild, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

export interface TimelineItem {
  id: string;
  type: 'education' | 'experience';
  title: string;
  organization: string;
  startDate: Date;
  endDate: Date | null; // null, ha jelenleg is tart
  description?: string;
  details?: string; // Részletes leírás a dialog ablakban
  skills?: string[]; // Kapcsolódó készségek
  logo?: string; // Opcionálisan szervezet logója
  url?: string; // Szervezet weboldala
  color?: string; // Egyedi szín az elemhez
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit, AfterViewInit {
  @Input() timelineItems: TimelineItem[] = [];
  @Input() showControls: boolean = true; // Vezérlők megjelenítése
  @Input() maxHeight: string = '800px'; // Maximális magasság
  @Input() showSkills: boolean = true; // Készségek megjelenítése

  @Output() itemClick = new EventEmitter<TimelineItem>(); // Esemény, amikor egy elemre kattintanak

  @ViewChild('detailsDialog') detailsDialog!: TemplateRef<any>;

  // Évek és hónapok megjelenítéséhez
  years: number[] = [];
  months: string[] = [
    'December', 'November', 'Október', 'Szeptember',
    'Augusztus', 'Július', 'Június', 'Május',
    'Április', 'Március', 'Február', 'Január'
  ];

  // Szűrési opciók
  filterType: 'all' | 'education' | 'experience' = 'all';
  selectedYear: number | null = null;
  searchText: string = '';

  // Részletek mutatása
  selectedItem: TimelineItem | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Ha nincsenek megadva elemek, használjuk a példa adatokat
    if (this.timelineItems.length === 0) {
      this.timelineItems = this.getExampleData();
    }

    this.generateYears();
  }

  ngAfterViewInit() {
    // Beállítjuk közvetlenül az évek magasságát és szélességét (reszponzív esetben)
    setTimeout(() => {
      const yearElements = this.el.nativeElement.querySelectorAll('.timeline-year');
      const yearHeight = 100 / this.years.length;

      yearElements.forEach((el: HTMLElement) => {
        el.style.height = `${yearHeight}%`;
        el.style.width = `${yearHeight}%`;  // Mobilnézetben a szélesség is beállítva
      });

      this.handleOverlappingCards();
    }, 0);
  }

  // Példa adatok
  getExampleData(): TimelineItem[] {
    return [
      {
        id: '1',
        type: 'education',
        title: 'Mérnökinformatikus BSc',
        organization: 'XYZ Egyetem',
        startDate: new Date(2017, 8, 1),
        endDate: new Date(2021, 6, 31),
        description: 'Mérnökinformatikus BSc képzés, specializáció: webfejlesztés',
        details: 'A képzés során elsajátítottam a programozás alapjait, adatbáziskezelést, webes technológiákat és szoftverfejlesztési módszertanokat. Szakdolgozatom témája egy modern webalkalmazás fejlesztése volt Angular keretrendszerben.',
        skills: ['Java', 'C#', 'JavaScript', 'HTML/CSS', 'Angular', 'SQL']
      },
      {
        id: '2',
        type: 'experience',
        title: 'Junior Frontend Fejlesztő',
        organization: 'ABC Tech Kft.',
        startDate: new Date(2020, 5, 1),
        endDate: new Date(2022, 3, 30),
        description: 'Angular alapú webalkalmazások fejlesztése',
        details: 'Frontend fejlesztőként Angular alapú vállalati alkalmazások fejlesztésében vettem részt. Fő projektjeink közé tartozott egy komplex adminisztrációs felület és egy ügyfélkezelő rendszer. Napi szinten használtam az Angular keretrendszert, TypeScriptet, RxJS-t és modern CSS technikákat.',
        skills: ['Angular', 'TypeScript', 'RxJS', 'SCSS', 'Git']
      },
      {
        id: '3',
        type: 'experience',
        title: 'Frontend Fejlesztő',
        organization: 'WebSolutions Zrt.',
        startDate: new Date(2022, 4, 1),
        endDate: null,
        description: 'Komplex webalkalmazások fejlesztése Angular és React technológiákkal',
        details: 'Komplex vállalati webalkalmazások fejlesztésén dolgozom, ahol mind Angular, mind React technológiákat használunk. Részt veszek az architektúra tervezésében, komponens könyvtárak fejlesztésében és junior kollégák mentorálásában.',
        skills: ['Angular', 'React', 'TypeScript', 'Redux', 'SCSS', 'Tailwind']
      }
    ];
  }

  // Elem kattintás kezelése
  onItemClick(item: TimelineItem): void {
    this.selectedItem = item;
    this.itemClick.emit(item);

    // Megnyitjuk a dialógus ablakot
    this.dialog.open(this.detailsDialog, {
      width: '600px',
      maxWidth: '95vw'
    });
  }

  // Részletek bezárása
  closeDetails(): void {
    this.dialog.closeAll();
    this.selectedItem = null;
  }

  // Szűrés típus szerint
  filterByType(type: 'all' | 'education' | 'experience'): void {
    this.filterType = type;
  }

  // Szűrés év szerint
  filterByYear(year: number | null): void {
    this.selectedYear = year;
  }

  // Keresés
  onSearchChange(text: string): void {
    this.searchText = text;
  }

  // Szűrt elemek
  get filteredItems(): TimelineItem[] {
    return this.timelineItems.filter(item => {
      // Típus szűrés
      if (this.filterType !== 'all' && item.type !== this.filterType) {
        return false;
      }

      // Év szűrés
      if (this.selectedYear !== null) {
        const startYear = item.startDate.getFullYear();
        const endYear = item.endDate ? item.endDate.getFullYear() : new Date().getFullYear();

        if (this.selectedYear < startYear || this.selectedYear > endYear) {
          return false;
        }
      }

      // Szöveg keresés
      if (this.searchText) {
        const searchFields = [
          item.title,
          item.organization,
          item.description,
          item.details,
          ...(item.skills || [])
        ];

        return searchFields.some(field =>
          field && field.toLowerCase().includes(this.searchText.toLowerCase())
        );
      }

      return true;
    });
  }

  // Az idővonalon megjelenő évek generálása
  generateYears() {
    // Adatok alapján határozzuk meg az évtartományt
    let minYear = new Date().getFullYear();
    let maxYear = 2000;

    this.timelineItems.forEach(item => {
      const startYear = item.startDate.getFullYear();
      const endYear = item.endDate ? item.endDate.getFullYear() : new Date().getFullYear();

      if (startYear < minYear) minYear = startYear;
      if (endYear > maxYear) maxYear = endYear;
    });

    // Adjunk hozzá +1/-1 évet a kezdő és végdátumhoz, hogy legyen extra tér
    minYear = Math.max(1900, minYear - 1);
    maxYear = Math.min(new Date().getFullYear() + 5, maxYear + 1);

    // Fordított sorrendben adjuk hozzá az éveket (legújabbtól a legrégebbig)
    for (let year = maxYear; year >= minYear; year--) {
      this.years.push(year);
    }
  }

  // Kártyák átfedésének kezelése
  handleOverlappingCards() {
    const leftCards = this.el.nativeElement.querySelectorAll('.timeline-left .timeline-card');
    const rightCards = this.el.nativeElement.querySelectorAll('.timeline-right .timeline-card');

    this.checkOverlap(leftCards);
    this.checkOverlap(rightCards);
  }

  checkOverlap(cards: NodeListOf<Element>) {
    if (!cards || cards.length < 2) return;

    // Kártyák csoportosítása átfedés szerint
    const overlappingGroups = [];
    let currentGroup = [cards[0]];

    for (let i = 1; i < cards.length; i++) {
      const current = cards[i] as HTMLElement;
      const last = currentGroup[currentGroup.length - 1] as HTMLElement;

      // Ellenőrizzük, hogy átfedik-e egymást
      if (this.isOverlapping(current, last)) {
        currentGroup.push(current);
      } else {
        if (currentGroup.length > 1) {
          overlappingGroups.push([...currentGroup]);
        }
        currentGroup = [current];
      }
    }

    if (currentGroup.length > 1) {
      overlappingGroups.push(currentGroup);
    }

    // Átfedések kezelése
    overlappingGroups.forEach(group => {
      const offsetStep = 20; // px
      for (let i = 1; i < group.length; i++) {
        const card = group[i] as HTMLElement;
        const side = card.closest('.timeline-left') ? 'right' : 'left';
        const offset = i * offsetStep;

        if (side === 'right') {
          this.renderer.setStyle(card, 'right', `${offset}px`);
        } else {
          this.renderer.setStyle(card, 'left', `${offset}px`);
        }
      }
    });
  }

  isOverlapping(el1: HTMLElement, el2: HTMLElement): boolean {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    return !(
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }

  // Egy elem pozíciójának kiszámítása az idővonalon
  getItemPosition(item: TimelineItem): { top: string, height: string } {
    const today = new Date();
    const endDate = item.endDate || today;

    // Számoljuk ki a kezdő és befejező dátumok relatív pozícióját
    const startY = this.calculateRelativePosition(item.startDate);
    const endY = this.calculateRelativePosition(endDate);

    // Az elem magassága a két pozíció különbsége
    const height = Math.abs(startY - endY);

    // Minimum magasság, hogy rövid időtartamok is jól láthatóak legyenek
    const minHeight = 5; // százalék

    return {
      top: `${Math.min(startY, endY)}%`,
      height: `${Math.max(height, minHeight)}%`
    };
  }

  // Egy dátum relatív pozíciójának kiszámítása az idővonalon
  private calculateRelativePosition(date: Date): number {
    if (!this.years.length) return 0;

    // A legkorábbi és legkésőbbi megjelenített év
    const minYear = this.years[this.years.length - 1];
    const maxYear = this.years[0];

    // A teljes időtartam hónapokban
    const totalMonths = (maxYear - minYear + 1) * 12;

    // Az adott dátum hány hónapra van a legkorábbi megjelenített évtől
    const monthsFromMin = (date.getFullYear() - minYear) * 12 + date.getMonth();

    // Fordított számítás, mert felülről lefelé csökkennek az évek
    return 100 - (monthsFromMin / totalMonths) * 100;
  }

  // Meghatározza, hogy egy elem az idővonal bal vagy jobb oldalán jelenjen meg
  isLeftSide(item: TimelineItem): boolean {
    return item.type === 'experience';
  }

  // Segédmetódus dátum formázáshoz
  formatDate(date: Date | null): string {
    if (!date) return 'Jelenleg is';

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return `${year}. ${this.getMonthName(month)}`;
  }

  // Hónap nevének megszerzése
  getMonthName(monthIndex: number): string {
    // Fordított sorrendben vannak a hónapok
    return this.months[12 - monthIndex];
  }

  // Időtartam kiszámítása
  calculateDuration(startDate: Date, endDate: Date | null): string {
    const end = endDate || new Date();
    const diffTime = Math.abs(end.getTime() - startDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;

    let result = '';
    if (years > 0) {
      result += `${years} év `;
    }
    if (months > 0 || years === 0) {
      result += `${months} hónap`;
    }

    return result;
  }
}
