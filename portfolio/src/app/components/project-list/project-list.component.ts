import { Component, OnInit, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
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

interface CodeLine {
  plainText: string;
  richHtml: string;
  delay: number;
  action: any;
}

interface VizNode {
  id: string;
  label: string;
  color: number[];
  x: number;
  y: number;
  z: number;
  size: number;
  bornAt: number;
}

interface VizEdge {
  from: string;
  to: string;
  bornAt: number;
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

  // Hero animation state
  private vizNodes: VizNode[] = [];
  private vizEdges: VizEdge[] = [];
  private vizRotating = false;
  private vizAngle = 0;
  private vizAngleY = 0.3;
  private animId: number | null = null;
  private abortTyping = false;
  private sleepIds: number[] = [];
  private heroStarted = false;

  constructor(
    private translationService: TranslationService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(() => this.loadData());
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.abortTyping = true;
    this.sleepIds.forEach(id => clearTimeout(id));
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
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
              if (id === 'hero' && !this.heroStarted) {
                this.heroStarted = true;
                setTimeout(() => this.initHeroAnimation(), 500);
              }
            }
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

  // ====================
  // HERO ANIMATION
  // ====================
  private getCodeLines(): CodeLine[] {
    return [
      {
        plainText: 'import Graph from "network"',
        richHtml: '<span class="s-kw">import</span> <span class="s-cls">Graph</span> <span class="s-kw">from</span> <span class="s-str">"network"</span>',
        delay: 300, action: null
      },
      {
        plainText: 'import Visualizer from "render3d"',
        richHtml: '<span class="s-kw">import</span> <span class="s-cls">Visualizer</span> <span class="s-kw">from</span> <span class="s-str">"render3d"</span>',
        delay: 400, action: null
      },
      { plainText: '', richHtml: '', delay: 150, action: null },
      {
        plainText: 'g = Graph(directed=False)',
        richHtml: '<span class="s-var">g</span> <span class="s-op">=</span> <span class="s-cls">Graph</span><span class="s-op">(</span><span class="s-fn">directed</span><span class="s-op">=</span><span class="s-num">False</span><span class="s-op">)</span>',
        delay: 500, action: 'init'
      },
      { plainText: '', richHtml: '', delay: 150, action: null },
      {
        plainText: '# Create processing nodes',
        richHtml: '<span class="s-cm"># Create processing nodes</span>',
        delay: 350, action: null
      },
      {
        plainText: 'g.add_node("Input", color="purple")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">add_node</span><span class="s-op">(</span><span class="s-str">"Input"</span><span class="s-op">,</span> <span class="s-fn">color</span><span class="s-op">=</span><span class="s-str">"purple"</span><span class="s-op">)</span>',
        delay: 400,
        action: { type: 'node', id: 'input', label: 'Input', color: [139, 92, 246], x: -55, y: -15, z: 60 }
      },
      {
        plainText: 'g.add_node("Filter", color="blue")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">add_node</span><span class="s-op">(</span><span class="s-str">"Filter"</span><span class="s-op">,</span> <span class="s-fn">color</span><span class="s-op">=</span><span class="s-str">"blue"</span><span class="s-op">)</span>',
        delay: 350,
        action: { type: 'node', id: 'filter', label: 'Filter', color: [59, 130, 246], x: -15, y: -50, z: -40 }
      },
      {
        plainText: 'g.add_node("Detect", color="cyan")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">add_node</span><span class="s-op">(</span><span class="s-str">"Detect"</span><span class="s-op">,</span> <span class="s-fn">color</span><span class="s-op">=</span><span class="s-str">"cyan"</span><span class="s-op">)</span>',
        delay: 350,
        action: { type: 'node', id: 'detect', label: 'Detect', color: [6, 182, 212], x: 50, y: -25, z: 45 }
      },
      {
        plainText: 'g.add_node("Segment", color="green")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">add_node</span><span class="s-op">(</span><span class="s-str">"Segment"</span><span class="s-op">,</span> <span class="s-fn">color</span><span class="s-op">=</span><span class="s-str">"green"</span><span class="s-op">)</span>',
        delay: 350,
        action: { type: 'node', id: 'segment', label: 'Segment', color: [34, 197, 94], x: 35, y: 35, z: -55 }
      },
      {
        plainText: 'g.add_node("Track", color="amber")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">add_node</span><span class="s-op">(</span><span class="s-str">"Track"</span><span class="s-op">,</span> <span class="s-fn">color</span><span class="s-op">=</span><span class="s-str">"amber"</span><span class="s-op">)</span>',
        delay: 400,
        action: { type: 'node', id: 'track', label: 'Track', color: [245, 158, 11], x: -40, y: 45, z: -30 }
      },
      { plainText: '', richHtml: '', delay: 200, action: null },
      {
        plainText: '# Build pipeline',
        richHtml: '<span class="s-cm"># Build pipeline</span>',
        delay: 300, action: null
      },
      {
        plainText: 'g.connect("Input", "Filter")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">connect</span><span class="s-op">(</span><span class="s-str">"Input"</span><span class="s-op">,</span> <span class="s-str">"Filter"</span><span class="s-op">)</span>',
        delay: 350, action: { type: 'edge', from: 'input', to: 'filter' }
      },
      {
        plainText: 'g.connect("Filter", "Detect")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">connect</span><span class="s-op">(</span><span class="s-str">"Filter"</span><span class="s-op">,</span> <span class="s-str">"Detect"</span><span class="s-op">)</span>',
        delay: 300, action: { type: 'edge', from: 'filter', to: 'detect' }
      },
      {
        plainText: 'g.connect("Detect", "Segment")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">connect</span><span class="s-op">(</span><span class="s-str">"Detect"</span><span class="s-op">,</span> <span class="s-str">"Segment"</span><span class="s-op">)</span>',
        delay: 300, action: { type: 'edge', from: 'detect', to: 'segment' }
      },
      {
        plainText: 'g.connect("Segment", "Track")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">connect</span><span class="s-op">(</span><span class="s-str">"Segment"</span><span class="s-op">,</span> <span class="s-str">"Track"</span><span class="s-op">)</span>',
        delay: 300, action: { type: 'edge', from: 'segment', to: 'track' }
      },
      {
        plainText: 'g.connect("Input", "Detect")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">connect</span><span class="s-op">(</span><span class="s-str">"Input"</span><span class="s-op">,</span> <span class="s-str">"Detect"</span><span class="s-op">)</span>',
        delay: 300, action: { type: 'edge', from: 'input', to: 'detect' }
      },
      {
        plainText: 'g.connect("Track", "Input")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">connect</span><span class="s-op">(</span><span class="s-str">"Track"</span><span class="s-op">,</span> <span class="s-str">"Input"</span><span class="s-op">)</span>',
        delay: 400, action: { type: 'edge', from: 'track', to: 'input' }
      },
      { plainText: '', richHtml: '', delay: 200, action: null },
      {
        plainText: '# Satellite nodes',
        richHtml: '<span class="s-cm"># Satellite nodes</span>',
        delay: 300, action: null
      },
      {
        plainText: 'for n in ["GPU","Cache","Log"]:',
        richHtml: '<span class="s-kw">for</span> <span class="s-var">n</span> <span class="s-kw">in</span> <span class="s-op">[</span><span class="s-str">"GPU"</span><span class="s-op">,</span><span class="s-str">"Cache"</span><span class="s-op">,</span><span class="s-str">"Log"</span><span class="s-op">]:</span>',
        delay: 350, action: null
      },
      {
        plainText: '    g.add_node(n, size="sm")',
        richHtml: '    <span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">add_node</span><span class="s-op">(</span><span class="s-var">n</span><span class="s-op">,</span> <span class="s-fn">size</span><span class="s-op">=</span><span class="s-str">"sm"</span><span class="s-op">)</span>',
        delay: 500,
        action: {
          type: 'batch_nodes', nodes: [
            { id: 'gpu', label: 'GPU', color: [236, 72, 153], x: -70, y: 50, z: 50 },
            { id: 'cache', label: 'Cache', color: [99, 102, 241], x: 70, y: -50, z: 35 },
            { id: 'log', label: 'Log', color: [168, 162, 158], x: 72, y: 42, z: -45 }
          ]
        }
      },
      { plainText: '', richHtml: '', delay: 150, action: null },
      {
        plainText: 'g.connect_many("GPU>Detect","Cache>Filter")',
        richHtml: '<span class="s-var">g</span><span class="s-op">.</span><span class="s-fn">connect_many</span><span class="s-op">(</span><span class="s-str">"GPU\u2192Detect"</span><span class="s-op">,</span><span class="s-str">"Cache\u2192Filter"</span><span class="s-op">)</span>',
        delay: 500,
        action: {
          type: 'batch_edges', edges: [
            { from: 'gpu', to: 'detect' },
            { from: 'cache', to: 'filter' },
            { from: 'log', to: 'track' },
            { from: 'gpu', to: 'segment' }
          ]
        }
      },
      { plainText: '', richHtml: '', delay: 250, action: null },
      {
        plainText: 'Visualizer.render(g, rotate=True)',
        richHtml: '<span class="s-cls">Visualizer</span><span class="s-op">.</span><span class="s-fn">render</span><span class="s-op">(</span><span class="s-var">g</span><span class="s-op">,</span> <span class="s-fn">rotate</span><span class="s-op">=</span><span class="s-num">True</span><span class="s-op">)</span>',
        delay: 0, action: 'start_rotate'
      }
    ];
  }

  private initHeroAnimation(): void {
    this.initCanvas();
    this.ngZone.runOutsideAngular(() => {
      this.renderViz();
    });
    this.typeLines();
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.initCanvas();
  };

  private initCanvas(): void {
    const canvas = document.getElementById('heroVizCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  // ====================
  // 3D RENDERING
  // ====================
  private renderViz = (): void => {
    const canvas = document.getElementById('heroVizCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const now = Date.now();

    ctx.clearRect(0, 0, w, h);

    if (this.vizRotating) this.vizAngle += 0.005;

    const ax = this.vizAngle;
    const ay = this.vizAngleY + Math.sin(now * 0.0004) * 0.15;
    const cosAx = Math.cos(ax), sinAx = Math.sin(ax);
    const cosAy = Math.cos(ay), sinAy = Math.sin(ay);
    const focalLen = 280;

    const projected = this.vizNodes.map(n => {
      const t = Math.min(1, (now - n.bornAt) / 700);
      const ease = 1 - Math.pow(1 - t, 3);
      let x = n.x * ease, y = n.y * ease, z = n.z * ease;

      const x1 = x * cosAx - z * sinAx;
      const z1 = x * sinAx + z * cosAx;
      const y1 = y * cosAy - z1 * sinAy;
      const z2 = y * sinAy + z1 * cosAy;
      const perspective = focalLen / (focalLen + z2);
      const px = cx + x1 * perspective * 2.2;
      const py = cy + y1 * perspective * 2.2;

      return { ...n, px, py, z2, perspective, ease: t < 1 ? ease : 1 };
    });

    const sorted = [...projected].sort((a, b) => a.z2 - b.z2);

    // Shadows
    projected.forEach(n => {
      if (n.ease <= 0) return;
      const shadowY = cy + 85 * n.perspective;
      const shadowAlpha = 0.06 * n.ease * n.perspective;
      const shadowSize = (n.size || 6) * n.perspective * 3;
      ctx.beginPath();
      ctx.ellipse(n.px, shadowY, shadowSize * 1.5, shadowSize * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
      ctx.fill();
    });

    // Edges
    this.vizEdges.forEach(e => {
      const from = projected.find(n => n.id === e.from);
      const to = projected.find(n => n.id === e.to);
      if (!from || !to) return;

      const t = Math.min(1, (now - e.bornAt) / 600);
      const ease = 1 - Math.pow(1 - t, 3);
      if (ease <= 0) return;

      const endX = from.px + (to.px - from.px) * ease;
      const endY = from.py + (to.py - from.py) * ease;
      const avgP = (from.perspective + to.perspective) / 2;
      const depthAlpha = 0.08 + avgP * 0.18;

      ctx.beginPath();
      ctx.moveTo(from.px, from.py); ctx.lineTo(endX, endY);
      ctx.strokeStyle = `rgba(139,92,246,${depthAlpha * 0.3 * ease})`;
      ctx.lineWidth = 5 * avgP;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(from.px, from.py); ctx.lineTo(endX, endY);
      ctx.strokeStyle = `rgba(139,92,246,${depthAlpha * ease})`;
      ctx.lineWidth = 1.8 * avgP;
      ctx.stroke();

      if (ease >= 1) {
        const pulseT = ((now * 0.0015 + e.bornAt * 0.1) % 1);
        const dotX = from.px + (to.px - from.px) * pulseT;
        const dotY = from.py + (to.py - from.py) * pulseT;
        const pulseSize = 3 * avgP;
        const g = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, pulseSize * 3);
        g.addColorStop(0, `rgba(139,92,246,${0.7 * avgP})`);
        g.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.beginPath();
        ctx.arc(dotX, dotY, pulseSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dotX, dotY, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.8 * avgP})`;
        ctx.fill();
      }
    });

    // Nodes
    sorted.forEach(n => {
      if (n.ease <= 0) return;
      const [r, g, b] = n.color;
      const baseSize = (n.size || 6) * n.perspective * n.ease;
      const depthAlpha = (0.35 + n.perspective * 0.65) * n.ease;

      const glowR = baseSize * 7;
      const grad = ctx.createRadialGradient(n.px, n.py, 0, n.px, n.py, glowR);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.18 * depthAlpha})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.05 * depthAlpha})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(n.px, n.py, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      const sphereGrad = ctx.createRadialGradient(
        n.px - baseSize * 0.3, n.py - baseSize * 0.3, baseSize * 0.1,
        n.px, n.py, baseSize
      );
      sphereGrad.addColorStop(0, `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},${depthAlpha})`);
      sphereGrad.addColorStop(0.6, `rgba(${r},${g},${b},${depthAlpha})`);
      sphereGrad.addColorStop(1, `rgba(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)},${depthAlpha})`);
      ctx.beginPath();
      ctx.arc(n.px, n.py, baseSize, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.px - baseSize * 0.25, n.py - baseSize * 0.25, baseSize * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.4 * depthAlpha})`;
      ctx.fill();

      if (n.ease > 0.5 && n.label) {
        const fontSize = Math.round(11 * n.perspective);
        ctx.font = `600 ${fontSize}px 'Space Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(${r},${g},${b},${0.85 * depthAlpha})`;
        ctx.fillText(n.label, n.px, n.py + baseSize + 13 * n.perspective);
      }
    });

    const statNodes = document.getElementById('heroStatNodes');
    const statEdges = document.getElementById('heroStatEdges');
    if (statNodes) statNodes.textContent = String(this.vizNodes.length);
    if (statEdges) statEdges.textContent = String(this.vizEdges.length);

    this.animId = requestAnimationFrame(this.renderViz);
  };

  // ====================
  // ACTION HANDLER
  // ====================
  private handleAction(action: any): void {
    if (!action || action === 'init') return;
    if (action === 'start_rotate') { this.vizRotating = true; return; }

    if (action.type === 'node') {
      this.vizNodes.push({
        id: action.id, label: action.label, color: action.color,
        x: action.x, y: action.y, z: action.z || 0,
        size: 7, bornAt: Date.now()
      });
    }
    if (action.type === 'edge') {
      this.vizEdges.push({ from: action.from, to: action.to, bornAt: Date.now() });
    }
    if (action.type === 'batch_nodes') {
      action.nodes.forEach((n: any, i: number) => {
        const id = window.setTimeout(() => {
          if (this.abortTyping) return;
          this.vizNodes.push({
            id: n.id, label: n.label, color: n.color,
            x: n.x, y: n.y, z: n.z || 0,
            size: 5, bornAt: Date.now()
          });
        }, i * 220);
        this.sleepIds.push(id);
      });
    }
    if (action.type === 'batch_edges') {
      action.edges.forEach((e: any, i: number) => {
        const id = window.setTimeout(() => {
          if (this.abortTyping) return;
          this.vizEdges.push({ from: e.from, to: e.to, bornAt: Date.now() });
        }, i * 180);
        this.sleepIds.push(id);
      });
    }
  }

  // ====================
  // TYPING ENGINE
  // ====================
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      const id = window.setTimeout(resolve, ms);
      this.sleepIds.push(id);
    });
  }

  private async typeLines(): Promise<void> {
    const body = document.getElementById('heroEditorBody');
    if (!body) return;
    body.innerHTML = '';

    const lines = this.getCodeLines();
    await this.sleep(600);

    for (let li = 0; li < lines.length; li++) {
      if (this.abortTyping) return;

      const line = lines[li];
      const lineEl = document.createElement('div');
      lineEl.className = 'code-line active-line';
      lineEl.innerHTML = `<span class="line-num">${li + 1}</span><span class="line-content"><span class="typing-cursor"></span></span>`;
      body.appendChild(lineEl);

      lineEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const contentEl = lineEl.querySelector('.line-content')!;

      if (line.plainText.length === 0) {
        await this.sleep(line.delay);
        lineEl.classList.remove('active-line');
        contentEl.innerHTML = '';
        continue;
      }

      const chars = line.plainText;
      const textNode = document.createTextNode('');
      contentEl.insertBefore(textNode, contentEl.querySelector('.typing-cursor'));

      for (let ci = 0; ci < chars.length; ci++) {
        if (this.abortTyping) return;
        textNode.textContent += chars[ci];
        const ch = chars[ci];
        let charDelay = 22 + Math.random() * 22;
        if (ch === ' ') charDelay = 15;
        if ('(),.'.includes(ch)) charDelay = 30 + Math.random() * 20;
        if (ch === '"') charDelay = 35;
        await this.sleep(charDelay);
      }

      contentEl.innerHTML = line.richHtml;
      lineEl.classList.remove('active-line');

      if (line.action) this.handleAction(line.action);
      await this.sleep(line.delay);
    }
  }

  // ====================
  // PROJECT DATA
  // ====================
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
        highlights: [t('proj.thesis_h1'), t('proj.thesis_h2'), t('proj.thesis_h3')]
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
        highlights: [t('proj.vmouse_h1'), t('proj.vmouse_h2'), t('proj.vmouse_h3')]
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
        highlights: [t('proj.cell_h1'), t('proj.cell_h2'), t('proj.cell_h3')]
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
        highlights: [t('proj.spendlens_h1'), t('proj.spendlens_h2'), t('proj.spendlens_h3')]
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
        highlights: [t('proj.portfolio_h1'), t('proj.portfolio_h2'), t('proj.portfolio_h3')]
      }
    ];
  }
}
