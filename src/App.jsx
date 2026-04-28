import React, { useState, useEffect, useRef } from "react";
import { Activity, ShieldAlert, Terminal as TerminalIcon, Cpu, Globe, Crosshair, Lock, Zap, Mic, MicOff, Newspaper, TrendingUp, Hash, Landmark, Volume2, Play, Move, Maximize2, Camera, Brain, MapPin, LayoutGrid, MessageSquare, Code2, Compass, Bug, CloudRain, Calendar, RefreshCw, Phone, Mail, Building, Flag } from "lucide-react";
import { AddressLookup, ContactValidator, NewsOutletsScraper, SocialMediaBriefing } from "./components/OSINTDashboard.jsx";

// --- CSS STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  .jarvis-theme {
    font-family: 'Share Tech Mono', monospace;
    background: radial-gradient(circle at center, #0a0f1c 0%, #02050a 100%);
    color: #00f0ff;
    min-height: 100vh;
    overflow: hidden;
    position: relative;
    user-select: none;
  }

  .cyber-grid {
    position: absolute;
    inset: -50%;
    pointer-events: none;
    z-index: 0;
    background-image: 
      linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center center;
  }

  .glass-panel {
    background: rgba(2, 5, 10, 0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(0, 240, 255, 0.2);
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.05), inset 0 0 20px rgba(0, 240, 255, 0.02);
    border-radius: 8px;
    position: absolute;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.1s, height 0.1s;
  }

  .auto-arranging {
    transition: left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), 
                top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), 
                width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), 
                height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .glass-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,240,255,0.8), transparent);
    z-index: 10;
  }
  
  .panel-header {
    background: linear-gradient(90deg, rgba(0, 240, 255, 0.1), transparent);
    border-bottom: 1px solid rgba(0, 240, 255, 0.1);
    cursor: move;
  }

  .panel-content {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    z-index: 20;
    background: linear-gradient(135deg, transparent 50%, rgba(0, 240, 255, 0.4) 50%);
  }

  .scanline {
    width: 100%;
    height: 100px;
    background: linear-gradient(0deg, transparent, rgba(0,240,255,0.1), transparent);
    position: absolute;
    top: -100px;
    animation: scan 6s linear infinite;
    pointer-events: none;
    z-index: 5;
  }

  @keyframes scan {
    0% { top: -100px; }
    100% { top: 100%; }
  }

  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .sci-fi-scroll::-webkit-scrollbar { width: 8px; }
  .sci-fi-scroll::-webkit-scrollbar-track { background: rgba(0, 240, 255, 0.05); }
  .sci-fi-scroll::-webkit-scrollbar-thumb { background: rgba(0, 240, 255, 0.3); border-radius: 4px; }

  @keyframes scrollFeed {
    0% { transform: translateY(100%); }
    100% { transform: translateY(-100%); }
  }
`;

// --- DRAGGABLE WINDOW MANAGER ---
const DraggablePanel = ({ id, title, icon: Icon, defaultPos, zIndex, onFocus, isAutoArranging, children }) => {
  const [pos, setPos] = useState(defaultPos);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isAutoArranging) setPos(defaultPos);
  }, [defaultPos, isAutoArranging]);

  const handlePointerDownDrag = (e) => {
    onFocus(id);
    dragRef.current = { x: e.pageX - pos.x, y: e.pageY - pos.y };
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e) => {
    if (!isDragging) return;
    setPos(p => ({ ...p, x: e.pageX - dragRef.current.x, y: e.pageY - dragRef.current.y }));
  };

  const handlePointerUpDrag = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const handlePointerDownResize = (e) => {
    onFocus(id);
    dragRef.current = { w: pos.w, h: pos.h, startX: e.pageX, startY: e.pageY };
    setIsResizing(true);
    e.target.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handlePointerMoveResize = (e) => {
    if (!isResizing) return;
    const newW = Math.max(250, dragRef.current.w + (e.pageX - dragRef.current.startX));
    const newH = Math.max(200, dragRef.current.h + (e.pageY - dragRef.current.startY));
    setPos(p => ({ ...p, w: newW, h: newH }));
  };

  const handlePointerUpResize = (e) => {
    setIsResizing(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      className={`glass-panel ${isAutoArranging ? 'auto-arranging' : ''}`}
      style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h, zIndex: zIndex }}
      onPointerDown={() => onFocus(id)}
    >
      <div 
        className="panel-header px-3 py-2 flex items-center justify-between select-none"
        onPointerDown={handlePointerDownDrag}
        onPointerMove={handlePointerMoveDrag}
        onPointerUp={handlePointerUpDrag}
        onPointerCancel={handlePointerUpDrag}
      >
        <div className="flex items-center gap-2 text-xs opacity-80 tracking-widest pointer-events-none font-bold text-cyan-300">
          <Icon size={14} /> {title}
        </div>
        <Move size={12} className="opacity-50 pointer-events-none hover:text-cyan-400" />
      </div>
      <div className="panel-content">{children}</div>
      <div 
        className="resize-handle"
        onPointerDown={handlePointerDownResize}
        onPointerMove={handlePointerMoveResize}
        onPointerUp={handlePointerUpResize}
        onPointerCancel={handlePointerUpResize}
      />
    </div>
  );
};

// --- DUMMY COMPONENTS (from original) ---
const Radar = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let angle = 0, animationFrameId;

    const draw = () => {
      const parent = canvas.parentElement;
      if (parent && (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight)) {
        canvas.width = parent.clientWidth; canvas.height = parent.clientHeight;
      }
      const w = canvas.width, h = canvas.height;
      if (w <= 0 || h <= 0) { animationFrameId = requestAnimationFrame(draw); return; }

      const cx = w / 2, cy = h / 2, r = Math.max(0, Math.min(w, h) / 2 - 10);

      ctx.fillStyle = "rgba(2, 5, 10, 0.1)"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.15)"; ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, r * (i / 4), 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();

      ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r, 0);
      ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = "#00f0ff"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, 0, -0.4, true);
      const grad = ctx.createLinearGradient(0, 0, r, 0);
      grad.addColorStop(0, "rgba(0, 240, 255, 0)"); grad.addColorStop(1, "rgba(0, 240, 255, 0.3)");
      ctx.fillStyle = grad; ctx.fill(); ctx.restore();

      if (Math.random() > 0.97) {
        const blipR = Math.random() * r * 0.8, blipAngle = Math.random() * Math.PI * 2;
        ctx.beginPath(); ctx.arc(cx + Math.cos(blipAngle) * blipR, cy + Math.sin(blipAngle) * blipR, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ff003c"; ctx.shadowBlur = 10; ctx.shadowColor = "#ff003c"; ctx.fill();
      }
      angle += 0.03; animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0" />;
};

const SystemStatus = () => {
  const [stats, setStats] = useState({ cpu: 45, ram: 62, net: 28 });
  useEffect(() => {
    const interval = setInterval(() => setStats({ cpu: Math.floor(Math.random()*30)+30, ram: Math.floor(Math.random()*20)+60, net: Math.floor(Math.random()*60)+20 }), 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="p-4 h-full flex flex-col justify-center relative">
      <div className="scanline" style={{animationDelay: '0.5s'}} />
      {['CPU ALLOCATION', 'MEM BANDWIDTH', 'NET TRAFFIC'].map((lbl, i) => {
        const val = i===0 ? stats.cpu : i===1 ? stats.ram : stats.net;
        return (
          <div key={lbl} className="mb-2">
            <div className="flex justify-between text-[10px] mb-1 opacity-70"><span>{lbl}</span><span>{val}%</span></div>
            <div className="h-1 w-full bg-cyan-950 rounded-full overflow-hidden"><div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${val}%` }}/></div>
          </div>
        )
      })}
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [windows, setWindows] = useState([
    { id: 'radar', title: 'TACTICAL RADAR', icon: Crosshair, pos: { x: 20, y: 80, w: 280, h: 280 }, z: 1, component: Radar },
    { id: 'status', title: 'SECURITY PROTOCOLS', icon: Lock, pos: { x: 320, y: 80, w: 250, h: 220 }, z: 2, component: SystemStatus },
    
    { id: 'address', title: 'GEOLOCATION LOOKUP', icon: MapPin, pos: { x: 590, y: 80, w: 350, h: 380 }, z: 3, component: AddressLookup },
    { id: 'contact', title: 'CONTACT VALIDATOR', icon: Phone, pos: { x: 960, y: 80, w: 350, h: 380 }, z: 4, component: ContactValidator },
    
    { id: 'news', title: 'NEWS OUTLETS SCRAPER', icon: Newspaper, pos: { x: 20, y: 380, w: 560, h: 360 }, z: 5, component: NewsOutletsScraper },
    { id: 'social', title: 'SOCIAL MEDIA BRIEFING', icon: TrendingUp, pos: { x: 1330, y: 80, w: 320, h: 660 }, z: 6, component: SocialMediaBriefing }
  ]);

  const [topZ, setTopZ] = useState(7);
  const [isAutoArranging, setIsAutoArranging] = useState(false);

  const arrangeLayout = () => {
    setIsAutoArranging(true);
    const W = window.innerWidth;
    const H = Math.max(window.innerHeight, 1000);
    const pad = 12;
    const topOffset = 64;
    let newLayout;

    if (W < 1200) {
      newLayout = windows.map((w, i) => ({ ...w, pos: { x: pad, y: topOffset + i * 400, w: W - 2*pad, h: 380 } }));
    } else {
      const colW = Math.floor((W - 5 * pad) / 4);
      const rowH = 300;

      const map = {
        'radar':     { x: pad, y: topOffset, w: colW, h: rowH },
        'status':    { x: pad*2 + colW, y: topOffset, w: colW - pad, h: 220 },
        'address':   { x: pad*3 + colW*2, y: topOffset, w: colW, h: rowH },
        'contact':   { x: pad*4 + colW*3, y: topOffset, w: colW, h: rowH },
        'news':      { x: pad, y: topOffset + rowH + pad, w: colW*2.5, h: 340 },
        'social':    { x: pad*4 + colW*2.5, y: topOffset, w: colW + pad, h: rowH*1.3 + 40 }
      };
      newLayout = windows.map(w => ({ ...w, pos: map[w.id] || w.pos }));
    }

    setWindows(newLayout);
    setTimeout(() => setIsAutoArranging(false), 500);
  };

  useEffect(() => {
    arrangeLayout();
    window.addEventListener('resize', arrangeLayout);
    return () => window.removeEventListener('resize', arrangeLayout);
  }, []);

  const bringToFront = (id) => {
    setTopZ(z => z + 1);
    setWindows(wins => wins.map(w => w.id === id ? { ...w, z: topZ + 1 } : w));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="jarvis-theme w-screen h-screen">
        <div className="cyber-grid" />
        
        <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-[rgba(0,240,255,0.1)] to-transparent border-b border-cyan-500/20 z-50 flex items-center justify-between px-6 pointer-events-none">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-[0.4em] text-cyan-100 drop-shadow-[0_0_10px_#00f0ff]">
              J.A.R.V.I.S. OSINT
            </h1>
            <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-bold flex items-center gap-1 hidden md:flex">
                <Zap size={10} /> NEURAL NET OPERATIONAL
            </span>
          </div>
          <div className="text-right pointer-events-auto flex items-center gap-4">
             <button 
                onClick={arrangeLayout}
                className="flex items-center gap-2 text-xs text-cyan-100 bg-cyan-900/50 hover:bg-cyan-500/30 px-3 py-1.5 rounded border border-cyan-500/30 transition-colors"
                title="Automatically organize layout to fit screen"
             >
                <LayoutGrid size={14} /> AUTO ARRANGE
             </button>
             <div className="text-xs text-cyan-500 tracking-widest hidden md:block">OSINT OPERATIONS ACTIVE</div>
          </div>
        </div>

        <div className="absolute inset-0 pt-14 overflow-y-auto overflow-x-hidden sci-fi-scroll">
          <div className="relative w-full" style={{ minHeight: '900px' }}>
            {windows.map(win => {
              const WinComponent = win.component; 
              return (
                <DraggablePanel key={win.id} id={win.id} title={win.title} icon={win.icon} defaultPos={win.pos} zIndex={win.z} onFocus={bringToFront} isAutoArranging={isAutoArranging}>
                  <WinComponent />
                </DraggablePanel>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
