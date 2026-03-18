import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
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
  color: string;
  gradient: string;
  date: string;
  githubUrl?: string;
  highlights?: string[];
}

interface CodeToken {
  text: string;
  type: 'keyword' | 'function' | 'string' | 'comment' | 'number' | 'operator' | 'variable' | 'decorator' | 'type' | 'plain' | 'bracket';
}

interface CodeSnippet {
  fileName: string;
  language: string;
  langColor: string;
  lines: CodeToken[][];
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, TranslatePipe],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ProjectListComponent implements OnInit, OnDestroy, AfterViewInit {

  private langSub!: Subscription;
  visibleSections = new Set<string>();

  // Project data
  heroProject: Project | null = null;
  gridProjects: Project[] = [];

  // Code editor state
  private heroStarted = false;
  private currentSnippetIdx = 0;
  private currentLineIdx = 0;
  private currentCharIdx = 0;
  private typeTimer: ReturnType<typeof setTimeout> | null = null;
  private snippetTimer: ReturnType<typeof setTimeout> | null = null;
  private editorMouse = { x: 0.5, y: 0.5 };
  private editorMouseTarget = { x: 0.5, y: 0.5 };
  private frameId: number | null = null;

  // Rendered lines for the template
  renderedLines: { tokens: CodeToken[]; lineNum: number }[] = [];
  currentFile = '';
  currentLang = '';
  currentLangColor = '';
  showCursor = true;
  private cursorInterval: ReturnType<typeof setInterval> | null = null;

  // Editor tilt
  editorTiltX = 0;
  editorTiltY = 0;

  // Card visual backgrounds by project id
  private readonly CARD_BGS: Record<string, string> = {
    'virtual-mouse': 'linear-gradient(135deg, #0c1a38 0%, #0f1628 100%)',
    'spendlens': 'linear-gradient(135deg, #1a1508 0%, #161210 100%)',
    'cell-segmentation': 'linear-gradient(135deg, #061a14 0%, #0f1628 100%)',
    'portfolio': 'linear-gradient(135deg, #061820 0%, #0f1628 100%)'
  };

  private readonly CODE_SNIPPETS: CodeSnippet[] = [
    {
      fileName: 'segmentation.py',
      language: 'Python',
      langColor: '#A78BFA',
      lines: [
        [
          { text: 'import', type: 'keyword' },
          { text: ' cv2', type: 'variable' }
        ],
        [
          { text: 'import', type: 'keyword' },
          { text: ' numpy ', type: 'variable' },
          { text: 'as', type: 'keyword' },
          { text: ' np', type: 'variable' }
        ],
        [],
        [
          { text: 'def', type: 'keyword' },
          { text: ' segment_objects', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'frame', type: 'variable' },
          { text: ',', type: 'plain' },
          { text: ' bg_model', type: 'variable' },
          { text: '):', type: 'bracket' }
        ],
        [
          { text: '    ', type: 'plain' },
          { text: '# Apply background subtraction', type: 'comment' }
        ],
        [
          { text: '    fg_mask ', type: 'plain' },
          { text: '=', type: 'operator' },
          { text: ' bg_model', type: 'variable' },
          { text: '.', type: 'operator' },
          { text: 'apply', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'frame', type: 'variable' },
          { text: ')', type: 'bracket' }
        ],
        [
          { text: '    contours', type: 'plain' },
          { text: ',', type: 'plain' },
          { text: ' _', type: 'variable' },
          { text: ' =', type: 'operator' },
          { text: ' cv2', type: 'variable' },
          { text: '.', type: 'operator' },
          { text: 'findContours', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'fg_mask', type: 'variable' },
          { text: ')', type: 'bracket' }
        ],
        [],
        [
          { text: '    ', type: 'plain' },
          { text: '# Build alpha shape hull', type: 'comment' }
        ],
        [
          { text: '    ', type: 'plain' },
          { text: 'for', type: 'keyword' },
          { text: ' c ', type: 'variable' },
          { text: 'in', type: 'keyword' },
          { text: ' contours', type: 'variable' },
          { text: ':', type: 'bracket' }
        ],
        [
          { text: '        hull ', type: 'plain' },
          { text: '=', type: 'operator' },
          { text: ' alpha_shape', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'c', type: 'variable' },
          { text: ',', type: 'plain' },
          { text: ' alpha', type: 'variable' },
          { text: '=', type: 'operator' },
          { text: '0.03', type: 'number' },
          { text: ')', type: 'bracket' }
        ],
        [
          { text: '        cv2', type: 'variable' },
          { text: '.', type: 'operator' },
          { text: 'drawContours', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'frame', type: 'variable' },
          { text: ',', type: 'plain' },
          { text: ' [hull]', type: 'variable' },
          { text: ',', type: 'plain' },
          { text: ' -1', type: 'number' },
          { text: ',', type: 'plain' },
          { text: ' (', type: 'bracket' },
          { text: '0', type: 'number' },
          { text: ',', type: 'plain' },
          { text: '255', type: 'number' },
          { text: ',', type: 'plain' },
          { text: '0', type: 'number' },
          { text: ')', type: 'bracket' },
          { text: ')', type: 'bracket' }
        ]
      ]
    },
    {
      fileName: 'SpendLensApp.kt',
      language: 'Kotlin',
      langColor: '#FBBF24',
      lines: [
        [
          { text: '@Composable', type: 'decorator' }
        ],
        [
          { text: 'fun', type: 'keyword' },
          { text: ' ExpenseCard', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'expense', type: 'variable' },
          { text: ':', type: 'operator' },
          { text: ' Expense', type: 'type' },
          { text: ') {', type: 'bracket' }
        ],
        [
          { text: '    Card', type: 'function' },
          { text: '(', type: 'bracket' }
        ],
        [
          { text: '        modifier ', type: 'variable' },
          { text: '=', type: 'operator' },
          { text: ' Modifier', type: 'type' },
          { text: '.', type: 'operator' },
          { text: 'padding', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: '16', type: 'number' },
          { text: '.dp', type: 'variable' },
          { text: ')', type: 'bracket' }
        ],
        [
          { text: '    ) {', type: 'bracket' }
        ],
        [
          { text: '        ', type: 'plain' },
          { text: '// ML Kit receipt scanning', type: 'comment' }
        ],
        [
          { text: '        ', type: 'plain' },
          { text: 'val', type: 'keyword' },
          { text: ' total ', type: 'variable' },
          { text: '=', type: 'operator' },
          { text: ' recognizer', type: 'variable' },
          { text: '.', type: 'operator' },
          { text: 'process', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'image', type: 'variable' },
          { text: ')', type: 'bracket' }
        ],
        [
          { text: '        Text', type: 'function' },
          { text: '(', type: 'bracket' }
        ],
        [
          { text: '            text ', type: 'variable' },
          { text: '=', type: 'operator' },
          { text: ' "', type: 'string' },
          { text: '${expense.amount}', type: 'variable' },
          { text: ' Ft"', type: 'string' },
        ],
        [
          { text: '        )', type: 'bracket' }
        ],
        [
          { text: '    }', type: 'bracket' }
        ],
        [
          { text: '}', type: 'bracket' }
        ]
      ]
    },
    {
      fileName: 'virtual-mouse.py',
      language: 'Python',
      langColor: '#60A5FA',
      lines: [
        [
          { text: 'import', type: 'keyword' },
          { text: ' mediapipe ', type: 'variable' },
          { text: 'as', type: 'keyword' },
          { text: ' mp', type: 'variable' }
        ],
        [
          { text: 'import', type: 'keyword' },
          { text: ' pyautogui', type: 'variable' }
        ],
        [],
        [
          { text: 'hands ', type: 'variable' },
          { text: '=', type: 'operator' },
          { text: ' mp', type: 'variable' },
          { text: '.', type: 'operator' },
          { text: 'solutions', type: 'variable' },
          { text: '.', type: 'operator' },
          { text: 'hands', type: 'variable' },
          { text: '.', type: 'operator' },
          { text: 'Hands', type: 'function' },
          { text: '()', type: 'bracket' }
        ],
        [],
        [
          { text: 'def', type: 'keyword' },
          { text: ' track_gesture', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'landmarks', type: 'variable' },
          { text: '):', type: 'bracket' }
        ],
        [
          { text: '    ', type: 'plain' },
          { text: '# Index finger tip detection', type: 'comment' }
        ],
        [
          { text: '    tip ', type: 'plain' },
          { text: '=', type: 'operator' },
          { text: ' landmarks', type: 'variable' },
          { text: '[', type: 'bracket' },
          { text: '8', type: 'number' },
          { text: ']', type: 'bracket' }
        ],
        [
          { text: '    x', type: 'variable' },
          { text: ',', type: 'plain' },
          { text: ' y ', type: 'variable' },
          { text: '=', type: 'operator' },
          { text: ' int', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'tip', type: 'variable' },
          { text: '.x ', type: 'variable' },
          { text: '*', type: 'operator' },
          { text: ' W', type: 'variable' },
          { text: ')', type: 'bracket' },
          { text: ',', type: 'plain' },
          { text: ' int', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'tip', type: 'variable' },
          { text: '.y ', type: 'variable' },
          { text: '*', type: 'operator' },
          { text: ' H', type: 'variable' },
          { text: ')', type: 'bracket' }
        ],
        [
          { text: '    pyautogui', type: 'variable' },
          { text: '.', type: 'operator' },
          { text: 'moveTo', type: 'function' },
          { text: '(', type: 'bracket' },
          { text: 'x', type: 'variable' },
          { text: ',', type: 'plain' },
          { text: ' y', type: 'variable' },
          { text: ',', type: 'plain' },
          { text: ' duration', type: 'variable' },
          { text: '=', type: 'operator' },
          { text: '0.1', type: 'number' },
          { text: ')', type: 'bracket' }
        ]
      ]
    },
    {
      fileName: 'portfolio.component.ts',
      language: 'Angular',
      langColor: '#F472B6',
      lines: [
        [
          { text: 'import', type: 'keyword' },
          { text: ' { Component } ', type: 'plain' },
          { text: 'from', type: 'keyword' },
          { text: " '@angular/core'", type: 'string' }
        ],
        [],
        [
          { text: '@', type: 'decorator' },
          { text: 'Component', type: 'decorator' },
          { text: '({', type: 'bracket' }
        ],
        [
          { text: '  selector', type: 'variable' },
          { text: ':', type: 'operator' },
          { text: " 'app-portfolio'", type: 'string' },
          { text: ',', type: 'plain' }
        ],
        [
          { text: '  standalone', type: 'variable' },
          { text: ':', type: 'operator' },
          { text: ' true', type: 'keyword' },
          { text: ',', type: 'plain' }
        ],
        [
          { text: '})', type: 'bracket' }
        ],
        [
          { text: 'export', type: 'keyword' },
          { text: ' class', type: 'keyword' },
          { text: ' PortfolioComponent', type: 'type' },
          { text: ' {', type: 'bracket' }
        ],
        [
          { text: '  languages', type: 'variable' },
          { text: ':', type: 'operator' },
          { text: ' string[]', type: 'type' },
          { text: " = ['hu','en','de','es']", type: 'string' }
        ],
        [
          { text: '  darkMode', type: 'variable' },
          { text: ' =', type: 'operator' },
          { text: ' true', type: 'keyword' }
        ],
        [
          { text: '}', type: 'bracket' }
        ]
      ]
    }
  ];

  constructor(
    private translationService: TranslationService,
    private ngZone: NgZone,
    private elRef: ElementRef
  ) {}

  private el(selector: string): HTMLElement | null {
    return this.elRef.nativeElement.querySelector(selector);
  }

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(() => this.loadData());
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    if (this.typeTimer) clearTimeout(this.typeTimer);
    if (this.snippetTimer) clearTimeout(this.snippetTimer);
    if (this.cursorInterval) clearInterval(this.cursorInterval);
    if (this.frameId) cancelAnimationFrame(this.frameId);
    const wrap = this.el('.hero-editor-wrap');
    if (wrap) wrap.removeEventListener('mousemove', this.onEditorMouseMove);
  }

  // ====================
  // INTERSECTION OBSERVER
  // ====================
  private setupIntersectionObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) {
              this.visibleSections.add(id);
              observer.unobserve(entry.target);
              if (id === 'hero' && !this.heroStarted) {
                this.heroStarted = true;
                setTimeout(() => this.initCodeEditor(), 300);
              }
            }
          }
        });
      },
      { threshold: 0.1 }
    );
    setTimeout(() => {
      this.elRef.nativeElement.querySelectorAll('[data-section]').forEach((el: Element) => observer.observe(el));
    }, 100);
  }

  isSectionVisible(name: string): boolean {
    return this.visibleSections.has(name);
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

  getCardBg(id: string): string {
    return this.CARD_BGS[id] || 'linear-gradient(135deg, #0f1628 0%, #0d1117 100%)';
  }

  // ====================
  // CODE EDITOR ANIMATION
  // ====================
  private initCodeEditor(): void {
    const snippet = this.CODE_SNIPPETS[0];
    this.currentFile = snippet.fileName;
    this.currentLang = snippet.language;
    this.currentLangColor = snippet.langColor;
    this.renderedLines = [];
    this.currentSnippetIdx = 0;
    this.currentLineIdx = 0;
    this.currentCharIdx = 0;

    // Cursor blink
    this.cursorInterval = setInterval(() => {
      this.showCursor = !this.showCursor;
    }, 530);

    // Mouse parallax
    const wrap = this.el('.hero-editor-wrap');
    if (wrap) {
      wrap.addEventListener('mousemove', this.onEditorMouseMove);
      wrap.addEventListener('mouseleave', () => {
        this.editorMouseTarget = { x: 0.5, y: 0.5 };
      });
    }

    // Start parallax loop
    this.ngZone.runOutsideAngular(() => {
      this.updateTilt();
    });

    // Start typing
    this.typeNextChar();
  }

  private onEditorMouseMove = (e: MouseEvent): void => {
    const wrap = this.el('.hero-editor-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    this.editorMouseTarget = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  private updateTilt = (): void => {
    const lerp = 0.08;
    this.editorMouse.x += (this.editorMouseTarget.x - this.editorMouse.x) * lerp;
    this.editorMouse.y += (this.editorMouseTarget.y - this.editorMouse.y) * lerp;

    this.editorTiltX = (this.editorMouse.y - 0.5) * -8;
    this.editorTiltY = (this.editorMouse.x - 0.5) * 8;

    const editor = this.el('.code-editor');
    if (editor) {
      editor.style.transform = `perspective(800px) rotateX(${this.editorTiltX}deg) rotateY(${this.editorTiltY}deg)`;
    }

    this.frameId = requestAnimationFrame(this.updateTilt);
  };

  private typeNextChar(): void {
    const snippet = this.CODE_SNIPPETS[this.currentSnippetIdx];
    if (!snippet) return;

    const lines = snippet.lines;

    if (this.currentLineIdx >= lines.length) {
      this.snippetTimer = setTimeout(() => {
        this.transitionToNextSnippet();
      }, 2800);
      return;
    }

    const currentLine = lines[this.currentLineIdx];

    if (currentLine.length === 0) {
      this.renderedLines.push({ tokens: [], lineNum: this.renderedLines.length + 1 });
      this.currentLineIdx++;
      this.currentCharIdx = 0;
      this.scrollEditorToBottom();
      this.typeTimer = setTimeout(() => this.typeNextChar(), 60);
      return;
    }

    const fullText = currentLine.map(t => t.text).join('');

    if (this.currentCharIdx === 0) {
      this.renderedLines.push({ tokens: [], lineNum: this.renderedLines.length + 1 });
    }

    this.currentCharIdx++;
    const visibleText = fullText.substring(0, this.currentCharIdx);

    const partialTokens: CodeToken[] = [];
    let consumed = 0;
    for (const token of currentLine) {
      if (consumed >= visibleText.length) break;
      const remaining = visibleText.length - consumed;
      const visiblePart = token.text.substring(0, remaining);
      if (visiblePart.length > 0) {
        partialTokens.push({ text: visiblePart, type: token.type });
      }
      consumed += token.text.length;
    }

    this.renderedLines[this.renderedLines.length - 1] = {
      tokens: partialTokens,
      lineNum: this.renderedLines.length
    };
    this.scrollEditorToBottom();

    if (this.currentCharIdx >= fullText.length) {
      this.currentLineIdx++;
      this.currentCharIdx = 0;
      this.typeTimer = setTimeout(() => this.typeNextChar(), 80 + Math.random() * 60);
    } else {
      const ch = fullText[this.currentCharIdx - 1];
      let delay = 28 + Math.random() * 32;
      if (ch === ' ') delay = 15;
      if (ch === '(' || ch === ')' || ch === '.' || ch === ',') delay = 20;
      this.typeTimer = setTimeout(() => this.typeNextChar(), delay);
    }
  }

  private scrollEditorToBottom(): void {
    setTimeout(() => {
      const body = this.el('.editor-body');
      if (body) {
        body.scrollTop = body.scrollHeight;
      }
    }, 0);
  }

  private transitionToNextSnippet(): void {
    this.currentSnippetIdx = (this.currentSnippetIdx + 1) % this.CODE_SNIPPETS.length;
    const snippet = this.CODE_SNIPPETS[this.currentSnippetIdx];
    this.currentFile = snippet.fileName;
    this.currentLang = snippet.language;
    this.currentLangColor = snippet.langColor;
    this.renderedLines = [];
    this.currentLineIdx = 0;
    this.currentCharIdx = 0;
    this.typeNextChar();
  }

  getTokenClass(type: string): string {
    return 'tok-' + type;
  }

  // ====================
  // PROJECT DATA
  // ====================
  private loadData(): void {
    const t = (key: string) => this.translationService.translate(key);

    // Hero project (thesis — always first, shown as flagship card)
    this.heroProject = {
      id: 'thesis',
      title: t('proj.thesis_title'),
      subtitle: t('proj.thesis_subtitle'),
      description: t('proj.thesis_desc'),
      technologies: ['Python', 'OpenCV', 'NumPy', 'Alpha Shape', 'Background Subtraction', 'Keypoint Detection'],
      category: 'Computer Vision',
      status: 'completed',
      color: '#7C3AED',
      gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
      date: '2025',
      githubUrl: 'https://github.com/bertran',
      highlights: [t('proj.thesis_h1'), t('proj.thesis_h2'), t('proj.thesis_h3')]
    };

    // Grid projects (compact cards, no highlights shown)
    this.gridProjects = [
      {
        id: 'virtual-mouse',
        title: t('proj.vmouse_title'),
        subtitle: t('proj.vmouse_subtitle'),
        description: t('proj.vmouse_desc'),
        technologies: ['Python', 'OpenCV', 'MediaPipe', 'Threading'],
        category: 'Computer Vision',
        status: 'completed',
        color: '#2563EB',
        gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)',
        date: '2024',
        githubUrl: 'https://github.com/bertran'
      },
      {
        id: 'spendlens',
        title: 'SpendLens',
        subtitle: t('proj.spendlens_subtitle'),
        description: t('proj.spendlens_desc'),
        technologies: ['Android', 'Kotlin', 'ML Kit', 'Room DB', 'Jetpack Compose'],
        category: 'Mobile',
        status: 'in-progress',
        color: '#D97706',
        gradient: 'linear-gradient(135deg, #D97706, #F59E0B)',
        date: '2025'
      },
      {
        id: 'cell-segmentation',
        title: t('proj.cell_title'),
        subtitle: t('proj.cell_subtitle'),
        description: t('proj.cell_desc'),
        technologies: ['Python', 'OpenCV', 'Image Processing'],
        category: 'Computer Vision',
        status: 'completed',
        color: '#059669',
        gradient: 'linear-gradient(135deg, #059669, #10B981)',
        date: '2024',
        githubUrl: 'https://github.com/bertran'
      },
      {
        id: 'portfolio',
        title: t('proj.portfolio_title'),
        subtitle: t('proj.portfolio_subtitle'),
        description: t('proj.portfolio_desc'),
        technologies: ['Angular', 'TypeScript', 'CSS3', 'i18n'],
        category: 'Web',
        status: 'in-progress',
        color: '#0891B2',
        gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)',
        date: '2025',
        githubUrl: 'https://github.com/bertran'
      }
    ];
  }
}
