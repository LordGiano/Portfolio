import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

// ══════════════════════════════════════
//  INTERFACES
// ══════════════════════════════════════

interface BpRect    { kind: 'rect';      x: number; y: number; opacity: number; w: number; h: number; rotation: number; }
interface BpCircle  { kind: 'circle';    x: number; y: number; opacity: number; r: number; }
interface BpDim     { kind: 'dimension'; x: number; y: number; opacity: number; length: number; angle: number; value: number; }
interface BpCross   { kind: 'cross';     x: number; y: number; opacity: number; size: number; }
interface BpAngle   { kind: 'angle';     x: number; y: number; opacity: number; r: number; startAngle: number; sweep: number; }
type BlueprintElement = BpRect | BpCircle | BpDim | BpCross | BpAngle;

interface Gear { x: number; y: number; radius: number; teeth: number; angle: number; speed: number; color: string; opacity: number; }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
interface Occupied { x: number; y: number; r: number; }
interface StackedBlock { x: number; y: number; color: string; settled: number; }
interface CraneBlock { color: string; targetX: number; targetY: number; }
type CranePhase = 'lowerPickup' | 'raisePickup' | 'moveRight' | 'lower' | 'place' | 'raise' | 'moveLeft';

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './under-construction.component.html',
  styleUrl: './under-construction.component.css'
})
export class UnderConstructionComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('constructionCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private langSub!: Subscription;
  private animationId = 0;
  private resizeHandler!: () => void;
  private W = 0;
  private H = 0;
  private t = 0;

  // Background
  private blueprintElements: BlueprintElement[] = [];
  private gears: Gear[] = [];
  private sparks: Spark[] = [];
  private occupied: Occupied[] = [];
  private readonly PAD = 18;
  private readonly GEAR_COLORS = ['#2563EB', '#4F46E5', '#7C3AED', '#1D4ED8'];

  // Crane
  private craneStack: StackedBlock[] = [];
  private craneBlock: CraneBlock | null = null;
  private cranePhase: CranePhase = 'lowerPickup';
  private trolleyX = 0;
  private ropeLen = 25;
  private pauseT = 0;
  private craneW = 220;
  private craneH = 220;
  private craneOffsetX = 0;
  private craneOffsetY = 0;
  private BLOCK_W = 30;
  private BLOCK_H = 12;
  private BASE_Y = 0;
  private PICKUP_X = 35;
  private BOOM_Y = 28;
  private readonly PICKUP_ROPE = 55;
  private readonly SHORT_ROPE = 25;
  private readonly BLOCK_COLORS = ['#2563EB', '#4F46E5', '#7C3AED', '#1D4ED8', '#3B82F6', '#6366F1', '#818CF8', '#A78BFA', '#60A5FA', '#34D399'];

  // Pyramid slot positions (pre-calculated on init)
  private pyramidSlots: { x: number; y: number }[] = [];
  private readonly PYRAMID_ROWS = [4, 3, 2, 1]; // bottom to top

  constructor(private translationService: TranslationService, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.langSub = this.translationService.language$.subscribe(() => {});
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => this.initCanvas());
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeHandler);
  }

  // ═══ Canvas Init ═══

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    this.resizeHandler = () => {
      const dpr = window.devicePixelRatio || 1;
      this.W = canvas.offsetWidth;
      this.H = canvas.offsetHeight;
      canvas.width = this.W * dpr;
      canvas.height = this.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.occupied = [];
      this.initCraneDimensions();
      this.initAll();
    };
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);

    const animate = () => { this.drawFrame(ctx); this.animationId = requestAnimationFrame(animate); };
    animate();
  }

  // ═══ Collision ═══

  private collides(x: number, y: number, r: number): boolean {
    for (const o of this.occupied) { if (Math.hypot(x - o.x, y - o.y) < o.r + r + this.PAD) return true; }
    return false;
  }
  private register(x: number, y: number, r: number): void { this.occupied.push({ x, y, r }); }

  private bpBound(kind: string, p: any): number {
    switch (kind) {
      case 'rect': return Math.hypot(p.w, p.h) / 2 + 8;
      case 'circle': return p.r * 1.25;
      case 'dimension': return p.length / 2 + 10;
      case 'cross': return p.size * 1.1;
      case 'angle': return p.r * 1.35;
      default: return 40;
    }
  }

  private elOpacity(x: number, y: number, min: number, max: number): number {
    const dist = Math.hypot(x - this.W / 2, y - this.H / 2);
    const maxD = Math.hypot(this.W / 2, this.H / 2);
    const fade = Math.min(1, dist / (maxD * 0.4));
    return (min + Math.random() * (max - min)) * (0.3 + 0.7 * fade);
  }

  // ═══ Crane Dimensions ═══

  private initCraneDimensions(): void {
    this.craneW = 220;
    this.craneH = 220;
    this.craneOffsetX = this.W / 2 - this.craneW / 2;
    this.craneOffsetY = this.H / 2 - 280;
    this.BASE_Y = this.craneH - 30;

    // Calculate pyramid slot positions (bottom-up, left-to-right)
    this.pyramidSlots = [];
    const gap = 2; // horizontal gap between blocks
    const rowH = this.BLOCK_H + 2; // vertical step
    const centerX = this.craneW / 2 + 15; // pyramid center (slightly right of crane center)

    for (let row = 0; row < this.PYRAMID_ROWS.length; row++) {
      const count = this.PYRAMID_ROWS[row];
      const totalW = count * this.BLOCK_W + (count - 1) * gap;
      const startX = centerX - totalW / 2 + this.BLOCK_W / 2;
      const y = this.BASE_Y - row * rowH;

      for (let col = 0; col < count; col++) {
        this.pyramidSlots.push({
          x: startX + col * (this.BLOCK_W + gap),
          y
        });
      }
    }
  }

  // ═══ Init All ═══

  private initAll(): void {
    this.blueprintElements = [];
    this.gears = [];
    this.sparks = [];

    const bpN = Math.max(10, Math.floor((this.W * this.H) / 50000));
    const gN = Math.max(5, Math.floor((this.W * this.H) / 90000));
    const maxAtt = 800;

    for (let a = 0, p = 0; a < maxAtt && p < gN; a++) {
      const x = -40 + Math.random() * (this.W + 80), y = -40 + Math.random() * (this.H + 80);
      const r = 25 + Math.random() * 50, br = r * 1.15;
      if (this.collides(x, y, br)) continue;
      this.gears.push({ x, y, radius: r, teeth: Math.floor(6 + Math.random() * 10), angle: Math.random() * Math.PI * 2,
        speed: (0.001 + Math.random() * 0.004) * (Math.random() < 0.5 ? 1 : -1),
        color: this.GEAR_COLORS[Math.floor(Math.random() * this.GEAR_COLORS.length)], opacity: this.elOpacity(x, y, 0.15, 0.32) });
      this.register(x, y, br); p++;
    }

    for (let a = 0, p = 0; a < maxAtt && p < bpN; a++) {
      const x = Math.random() * this.W, y = Math.random() * this.H;
      const tp = Math.random(); let kind: string; let params: any;
      if (tp < 0.3) { kind = 'rect'; params = { w: 40 + Math.random() * 120, h: 25 + Math.random() * 80, rotation: Math.random() < 0.3 ? (Math.random() - 0.5) * 0.15 : 0 }; }
      else if (tp < 0.55) { kind = 'circle'; params = { r: 15 + Math.random() * 40 }; }
      else if (tp < 0.75) { kind = 'dimension'; params = { length: 60 + Math.random() * 120, angle: Math.random() < 0.5 ? 0 : Math.PI / 2, value: Math.floor(20 + Math.random() * 200) }; }
      else if (tp < 0.9) { kind = 'cross'; params = { size: 8 + Math.random() * 16 }; }
      else { kind = 'angle'; params = { r: 20 + Math.random() * 30, startAngle: Math.random() * Math.PI, sweep: 0.3 + Math.random() * 1.2 }; }
      const br = this.bpBound(kind, params);
      if (this.collides(x, y, br)) continue;
      this.blueprintElements.push({ kind, x, y, opacity: this.elOpacity(x, y, 0.22, 0.45), ...params } as BlueprintElement);
      this.register(x, y, br); p++;
    }

    this.craneStack = []; this.cranePhase = 'lowerPickup'; this.trolleyX = this.PICKUP_X; this.ropeLen = this.SHORT_ROPE; this.pauseT = 0;
    this.nextCraneBlock();
  }

  private nextCraneBlock(): void {
    if (this.craneStack.length >= this.pyramidSlots.length) this.craneStack = [];
    const slot = this.pyramidSlots[this.craneStack.length];
    this.craneBlock = {
      color: this.BLOCK_COLORS[this.craneStack.length % this.BLOCK_COLORS.length],
      targetX: slot.x,
      targetY: slot.y
    };
  }

  // ═══ Draw Frame ═══

  private drawFrame(ctx: CanvasRenderingContext2D): void {
    this.t++;
    ctx.clearRect(0, 0, this.W, this.H);
    this.drawGrid(ctx);
    this.drawBpElements(ctx);
    this.drawGears(ctx);
    if (this.t % 8 === 0) this.spawnSparks();
    this.drawSparks(ctx);
    this.updateCrane();
    ctx.save(); ctx.translate(this.craneOffsetX, this.craneOffsetY); this.drawCrane(ctx); ctx.restore();
  }

  // ═══ Grid ═══

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(37,99,235,0.07)'; ctx.lineWidth = 0.5;
    for (let x = 0; x < this.W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.H); ctx.stroke(); }
    for (let y = 0; y < this.H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.W, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(37,99,235,0.12)'; ctx.lineWidth = 1;
    for (let x = 0; x < this.W; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.H); ctx.stroke(); }
    for (let y = 0; y < this.H; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.W, y); ctx.stroke(); }
  }

  // ═══ Blueprint Elements ═══

  private drawBpElements(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const el of this.blueprintElements) {
      const pulse = 0.8 + 0.2 * Math.sin(this.t * 0.008 + el.x * 0.01 + el.y * 0.01);
      const a = el.opacity * pulse;
      ctx.strokeStyle = `rgba(70,155,255,${a})`; ctx.fillStyle = `rgba(70,155,255,${a * 0.6})`; ctx.lineWidth = 1.2;
      switch (el.kind) {
        case 'rect': this.drawBpRect(ctx, el, a); break;
        case 'circle': this.drawBpCircle(ctx, el, a); break;
        case 'dimension': this.drawBpDim(ctx, el, a); break;
        case 'cross': this.drawBpCross(ctx, el); break;
        case 'angle': this.drawBpAngle(ctx, el, a); break;
      }
    }
  }

  private drawBpRect(c: CanvasRenderingContext2D, e: BpRect, a: number): void {
    c.save(); c.translate(e.x, e.y); c.rotate(e.rotation);
    c.setLineDash([4,3]); c.strokeRect(-e.w/2,-e.h/2,e.w,e.h); c.setLineDash([]);
    const m=6; ([[-1,-1],[1,-1],[1,1],[-1,1]] as [number,number][]).forEach(([sx,sy])=>{
      const cx=sx*e.w/2,cy=sy*e.h/2; c.beginPath(); c.moveTo(cx-sx*m,cy); c.lineTo(cx,cy); c.lineTo(cx,cy-sy*m); c.stroke();
    });
    c.font="9px 'JetBrains Mono',monospace"; c.fillStyle=`rgba(70,155,255,${a*0.7})`; c.textAlign='center';
    c.fillText(`${Math.round(e.w)}`,0,-e.h/2-5); c.restore();
  }
  private drawBpCircle(c: CanvasRenderingContext2D, e: BpCircle, a: number): void {
    c.setLineDash([3,3]); c.beginPath(); c.arc(e.x,e.y,e.r,0,Math.PI*2); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(e.x-4,e.y); c.lineTo(e.x+4,e.y); c.moveTo(e.x,e.y-4); c.lineTo(e.x,e.y+4); c.stroke();
    c.beginPath(); c.moveTo(e.x,e.y); c.lineTo(e.x+e.r*0.707,e.y-e.r*0.707); c.stroke();
    c.font="8px 'JetBrains Mono',monospace"; c.fillStyle=`rgba(70,155,255,${a*0.7})`;
    c.fillText(`R${Math.round(e.r)}`,e.x+e.r*0.4,e.y-e.r*0.4-4);
  }
  private drawBpDim(c: CanvasRenderingContext2D, e: BpDim, a: number): void {
    const dx=Math.cos(e.angle)*e.length/2,dy=Math.sin(e.angle)*e.length/2;
    const x1=e.x-dx,y1=e.y-dy,x2=e.x+dx,y2=e.y+dy;
    c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke();
    const px=-Math.sin(e.angle)*6,py=Math.cos(e.angle)*6;
    c.beginPath(); c.moveTo(x1+px,y1+py); c.lineTo(x1-px,y1-py); c.moveTo(x2+px,y2+py); c.lineTo(x2-px,y2-py); c.stroke();
    c.save(); c.translate(e.x,e.y); c.rotate(e.angle);
    c.font="9px 'JetBrains Mono',monospace"; c.fillStyle=`rgba(70,155,255,${a*0.8})`; c.textAlign='center';
    c.fillText(`${e.value}mm`,0,-5); c.restore();
  }
  private drawBpCross(c: CanvasRenderingContext2D, e: BpCross): void {
    const s=e.size; c.beginPath(); c.moveTo(e.x-s,e.y); c.lineTo(e.x+s,e.y); c.moveTo(e.x,e.y-s); c.lineTo(e.x,e.y+s); c.stroke();
    c.beginPath(); c.arc(e.x,e.y,s*0.6,0,Math.PI*2); c.stroke();
  }
  private drawBpAngle(c: CanvasRenderingContext2D, e: BpAngle, a: number): void {
    c.beginPath(); c.arc(e.x,e.y,e.r,e.startAngle,e.startAngle+e.sweep); c.stroke();
    c.beginPath(); c.moveTo(e.x,e.y); c.lineTo(e.x+Math.cos(e.startAngle)*e.r*1.2,e.y+Math.sin(e.startAngle)*e.r*1.2);
    c.moveTo(e.x,e.y); c.lineTo(e.x+Math.cos(e.startAngle+e.sweep)*e.r*1.2,e.y+Math.sin(e.startAngle+e.sweep)*e.r*1.2); c.stroke();
    const mid=e.startAngle+e.sweep/2;
    c.font="8px 'JetBrains Mono',monospace"; c.fillStyle=`rgba(70,155,255,${a*0.7})`;
    c.fillText(`${Math.round(e.sweep*180/Math.PI)}°`,e.x+Math.cos(mid)*(e.r+12),e.y+Math.sin(mid)*(e.r+12));
  }

  // ═══ Gears + Sparks ═══

  private drawGears(ctx: CanvasRenderingContext2D): void { for (const g of this.gears) { g.angle += g.speed; this.drawGear(ctx, g); } }

  private drawGear(ctx: CanvasRenderingContext2D, g: Gear): void {
    ctx.save(); ctx.translate(g.x,g.y); ctx.rotate(g.angle); ctx.globalAlpha=g.opacity; ctx.strokeStyle=g.color; ctx.lineWidth=2;
    const iR=g.radius*0.7,oR=g.radius,ta=(Math.PI*2)/g.teeth,ht=ta*0.3;
    ctx.beginPath();
    for(let i=0;i<g.teeth;i++){const a=i*ta;
      ctx.lineTo(Math.cos(a-ht)*iR,Math.sin(a-ht)*iR); ctx.lineTo(Math.cos(a-ht*0.5)*oR,Math.sin(a-ht*0.5)*oR);
      ctx.lineTo(Math.cos(a+ht*0.5)*oR,Math.sin(a+ht*0.5)*oR); ctx.lineTo(Math.cos(a+ht)*iR,Math.sin(a+ht)*iR);
    }
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,g.radius*0.3,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,2.5,0,Math.PI*2); ctx.fillStyle=g.color; ctx.fill();
    ctx.globalAlpha=1; ctx.restore();
  }

  private spawnSparks(): void {
    if(!this.gears.length)return; const s=this.gears[Math.floor(Math.random()*this.gears.length)];
    for(let i=0;i<2;i++){const a=Math.random()*Math.PI*2;
      this.sparks.push({x:s.x+Math.cos(a)*s.radius,y:s.y+Math.sin(a)*s.radius,vx:Math.cos(a)*(1+Math.random()*2),vy:Math.sin(a)*(1+Math.random()*2),
        life:0,maxLife:30+Math.floor(Math.random()*40),color:Math.random()<0.5?'#3B82F6':'#7C3AED',size:1.5+Math.random()*2.5});}
  }

  private drawSparks(ctx: CanvasRenderingContext2D): void {
    for(let i=this.sparks.length-1;i>=0;i--){
      const s=this.sparks[i];const al=1-s.life/s.maxLife;
      const r=parseInt(s.color.slice(1,3),16),g=parseInt(s.color.slice(3,5),16),b=parseInt(s.color.slice(5,7),16);
      ctx.beginPath();ctx.arc(s.x,s.y,s.size*al,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${al*0.95})`;ctx.fill();
      ctx.beginPath();ctx.arc(s.x,s.y,s.size*al*2.5,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${al*0.15})`;ctx.fill();
      s.x+=s.vx;s.y+=s.vy;s.vy+=0.03;s.life++;
      if(s.life>=s.maxLife)this.sparks.splice(i,1);
    }
  }

  // ═══ Crane Update ═══

  private updateCrane(): void {
    if(!this.craneBlock)return; const e=0.05;
    switch(this.cranePhase){
      case 'lowerPickup':
        this.trolleyX+=(this.PICKUP_X-this.trolleyX)*e; this.ropeLen+=(this.PICKUP_ROPE-this.ropeLen)*e;
        if(Math.abs(this.ropeLen-this.PICKUP_ROPE)<1&&Math.abs(this.trolleyX-this.PICKUP_X)<1){this.cranePhase='raisePickup';this.pauseT=15;} break;
      case 'raisePickup':
        this.pauseT--; if(this.pauseT<=0){this.ropeLen+=(this.SHORT_ROPE-this.ropeLen)*0.06;if(Math.abs(this.ropeLen-this.SHORT_ROPE)<1)this.cranePhase='moveRight';} break;
      case 'moveRight':
        this.trolleyX+=(this.craneBlock!.targetX-this.trolleyX)*0.04; if(Math.abs(this.trolleyX-this.craneBlock!.targetX)<1.5)this.cranePhase='lower'; break;
      case 'lower':
        const tr=this.craneBlock.targetY-this.BOOM_Y-5-this.BLOCK_H/2; this.ropeLen+=(tr-this.ropeLen)*e;
        if(Math.abs(this.ropeLen-tr)<1){this.cranePhase='place';this.pauseT=20;} break;
      case 'place':
        this.pauseT--; if(this.pauseT<=0){this.craneStack.push({x:this.craneBlock!.targetX,y:this.craneBlock!.targetY,color:this.craneBlock!.color,settled:0});this.cranePhase='raise';} break;
      case 'raise':
        this.ropeLen+=(this.SHORT_ROPE-this.ropeLen)*0.06; if(Math.abs(this.ropeLen-this.SHORT_ROPE)<1)this.cranePhase='moveLeft'; break;
      case 'moveLeft':
        this.trolleyX+=(this.PICKUP_X-this.trolleyX)*0.04; if(Math.abs(this.trolleyX-this.PICKUP_X)<1.5){this.nextCraneBlock();this.cranePhase='lowerPickup';} break;
    }
  }

  // ═══ Crane Draw ═══

  private drawCrane(ctx: CanvasRenderingContext2D): void {
    const mastX=30,mastTop=20,mastBot=this.BASE_Y+this.BLOCK_H,boomR=this.craneW-15,bY=this.BOOM_Y,cEnd=mastX-15;

    // Tower
    ctx.strokeStyle='rgba(70,155,255,0.4)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(mastX-6,mastBot);ctx.lineTo(mastX-4,mastTop);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mastX+6,mastBot);ctx.lineTo(mastX+4,mastTop);ctx.stroke();
    ctx.strokeStyle='rgba(70,155,255,0.2)';ctx.lineWidth=0.8;
    for(let i=0;i<=8;i++){const ty=mastTop+(mastBot-mastTop)*i/8,tw=5+i/8;
      ctx.beginPath();ctx.moveTo(mastX-tw,ty);ctx.lineTo(mastX+tw,ty);ctx.stroke();
      if(i<8){const ty2=mastTop+(mastBot-mastTop)*(i+1)/8,tw2=5+(i+1)/8;ctx.beginPath();ctx.moveTo(mastX-tw,ty);ctx.lineTo(mastX+tw2,ty2);ctx.stroke();}}

    // Boom
    ctx.strokeStyle='rgba(70,155,255,0.4)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(mastX,bY);ctx.lineTo(boomR,bY);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mastX,bY+5);ctx.lineTo(boomR,bY+5);ctx.stroke();
    ctx.strokeStyle='rgba(70,155,255,0.15)';ctx.lineWidth=0.7;
    for(let i=0;i<=10;i++){const bx=mastX+(boomR-mastX)*i/10;ctx.beginPath();ctx.moveTo(bx,bY);ctx.lineTo(bx,bY+5);ctx.stroke();
      if(i<10){const bx2=mastX+(boomR-mastX)*(i+1)/10;ctx.beginPath();ctx.moveTo(bx,bY);ctx.lineTo(bx2,bY+5);ctx.stroke();}}

    // Counterweight + cables
    ctx.strokeStyle='rgba(70,155,255,0.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(mastX,bY+2);ctx.lineTo(cEnd,bY+2);ctx.stroke();
    ctx.fillStyle='rgba(37,99,235,0.2)';ctx.fillRect(cEnd-6,bY-2,12,10);ctx.strokeRect(cEnd-6,bY-2,12,10);
    const pY=mastTop-8;ctx.strokeStyle='rgba(70,155,255,0.25)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(mastX,mastTop);ctx.lineTo(mastX,pY);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mastX,pY);ctx.lineTo(cEnd,bY);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mastX,pY);ctx.lineTo(boomR-10,bY);ctx.stroke();

    // Trolley
    ctx.fillStyle='#64748B';ctx.fillRect(this.trolleyX-6,bY,12,6);
    ctx.fillStyle='#94A3B8';ctx.beginPath();ctx.arc(this.trolleyX-4,bY+1,1.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(this.trolleyX+4,bY+1,1.5,0,Math.PI*2);ctx.fill();

    // Rope (always visible)
    ctx.strokeStyle='rgba(148,163,184,0.6)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(this.trolleyX,bY+6);ctx.lineTo(this.trolleyX,bY+6+this.ropeLen);ctx.stroke();

    // Hook
    const hkY=bY+6+this.ropeLen;
    ctx.strokeStyle='rgba(148,163,184,0.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(this.trolleyX,hkY+3,3,0,Math.PI);ctx.stroke();

    // Hanging block
    const hasB=(this.cranePhase==='raisePickup'&&this.pauseT<=0)||this.cranePhase==='moveRight'||this.cranePhase==='lower'||this.cranePhase==='place';
    if(hasB&&this.craneBlock){
      const bx=this.trolleyX-this.BLOCK_W/2,by=hkY+2;
      ctx.fillStyle=this.craneBlock.color;ctx.globalAlpha=0.85;ctx.fillRect(bx,by,this.BLOCK_W,this.BLOCK_H);
      ctx.globalAlpha=1;ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=0.8;ctx.strokeRect(bx,by,this.BLOCK_W,this.BLOCK_H);
      ctx.strokeStyle='rgba(148,163,184,0.4)';ctx.beginPath();
      ctx.moveTo(this.trolleyX-2,hkY+4);ctx.lineTo(bx+3,by);ctx.moveTo(this.trolleyX+2,hkY+4);ctx.lineTo(bx+this.BLOCK_W-3,by);ctx.stroke();
    }

    // Stacked blocks
    for(const blk of this.craneStack){blk.settled=Math.min(1,blk.settled+0.04);const bx=blk.x-this.BLOCK_W/2;
      ctx.fillStyle=blk.color;ctx.globalAlpha=0.45+0.5*blk.settled;ctx.fillRect(bx,blk.y,this.BLOCK_W,this.BLOCK_H);
      ctx.globalAlpha=1;ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=0.8;ctx.strokeRect(bx,blk.y,this.BLOCK_W,this.BLOCK_H);
      if(blk.settled<0.4){ctx.fillStyle=`rgba(59,130,246,${0.12*(1-blk.settled*2.5)})`;ctx.fillRect(bx-3,blk.y-3,this.BLOCK_W+6,this.BLOCK_H+6);}}

    // Ground
    ctx.strokeStyle='rgba(70,155,255,0.15)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(10,this.BASE_Y+this.BLOCK_H+2);ctx.lineTo(this.craneW-10,this.BASE_Y+this.BLOCK_H+2);ctx.stroke();ctx.setLineDash([]);
  }
}
