import { Component, OnInit } from '@angular/core';
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
  startDate: Date;
  endDate: Date | null;
  location: string;
  description: string[];
  technologies?: string[];
  achievements?: string[];
}

interface TimelineYear {
  year: number;
  months: number[];
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
export class ExperienceComponent implements OnInit {
  experiences: Experience[] = [
    {
      type: 'work',
      title: 'Senior Frontend Developer',
      company: 'Tech Solutions Inc.',
      period: 'July 2021 - Present',
      startDate: new Date(2021, 6), // July 2021 (month 6 = July)
      endDate: null, // Present
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
      period: 'March 2019 - June 2021',
      startDate: new Date(2019, 2), // March 2019 (month 2 = March)
      endDate: new Date(2021, 5), // June 2021 (month 5 = June)
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
      period: 'September 2017 - June 2019',
      startDate: new Date(2017, 8), // September 2017 (month 8 = September)
      endDate: new Date(2019, 5), // June 2019 (month 5 = June)
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
      type: 'work',
      title: 'Junior Developer Intern',
      company: 'Microsoft Hungary',
      period: 'June 2018 - August 2018',
      startDate: new Date(2018, 5), // June 2018
      endDate: new Date(2018, 7), // August 2018
      location: 'Budapest, Hungary',
      description: [
        'Developed features for internal tools using C# and .NET',
        'Participated in code reviews and agile ceremonies',
        'Created automated tests for existing functionality'
      ],
      technologies: ['C#', '.NET', 'Azure', 'SQL Server']
    }
  ];

  timelineYears: TimelineYear[] = [];
  educationExperiences: Experience[] = [];
  workExperiences: Experience[] = [];

  ngOnInit() {
    // Separate experiences by type - sort newest first
    this.educationExperiences = this.experiences
      .filter(exp => exp.type === 'education')
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    this.workExperiences = this.experiences
      .filter(exp => exp.type === 'work')
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    // Generate timeline years
    this.generateTimelineYears();
  }

  generateTimelineYears() {
    const minYear = 2017; // Fixed start year
    const maxYear = new Date().getFullYear() + 1; // Current year + 1

    // Create years in descending order (newest first)
    for (let year = maxYear; year >= minYear; year--) {
      this.timelineYears.push({
        year: year,
        months: Array.from({ length: 12 }, (_, i) => i + 1)
      });
    }
  }

  getVerticalPositionStyle(experience: Experience) {
    const startYear = experience.startDate.getFullYear();
    const startMonth = experience.startDate.getMonth();

    // For "Present", use current date
    const currentDate = new Date();
    const endYear = experience.endDate ? experience.endDate.getFullYear() : currentDate.getFullYear();
    const endMonth = experience.endDate ? experience.endDate.getMonth() : currentDate.getMonth();

    const maxYear = this.timelineYears[0].year; // Most recent year
    const minYear = this.timelineYears[this.timelineYears.length - 1].year; // Oldest year

    // Calculate positions as percentage of the total timeline
    const totalMonths = (maxYear - minYear + 1) * 12;

    // Calculate month offsets from the bottom of the timeline
    const startMonthsFromBottom = ((startYear - minYear) * 12) + startMonth;
    const endMonthsFromBottom = ((endYear - minYear) * 12) + endMonth;

    // Convert to percentages
    const startPercentFromBottom = (startMonthsFromBottom / totalMonths) * 100;
    const endPercentFromBottom = (endMonthsFromBottom / totalMonths) * 100;

    // Since the timeline is inverted (newest on top), we need to flip the positions
    const startPercentFromTop = 100 - startPercentFromBottom;
    const endPercentFromTop = 100 - endPercentFromBottom;

    // Height is the difference between start and end
    const height = startPercentFromTop - endPercentFromTop;

    // Position the card so that:
    // - The bottom of the card aligns with the start date
    // - The top of the card aligns with the end date
    return {
      top: `${endPercentFromTop}%`,
      height: `${height}%`,
      minHeight: height < 5 ? '80px' : 'auto'
    };
  }
}
