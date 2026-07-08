import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface CombatClashOverlayProps {
  onComplete: () => void;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'ember' | 'slash-line';
}

export const CombatClashOverlay: React.FC<CombatClashOverlayProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Shake the screen
    const root = document.getElementById('root') || document.body;
    root.classList.add('clash-shake-active');

    const shakeTimer = setTimeout(() => {
      root.classList.remove('clash-shake-active');
    }, 500);

    // 2. Play sound/vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // 3. Setup canvas particle simulation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const particles: Spark[] = [];
    const centerX = width / 2;
    const centerY = height / 2;

    const colors = [
      '#ffffff', // Bright white hot center
      '#ffe600', // Yellow
      '#ff8400', // Orange
      '#ff3c00', // Hot red-orange
      '#e50914', // Blood red
    ];

    // Generate initial heavy sparks burst at center
    const sparkCount = 120;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 25;
      const spreadX = (Math.random() - 0.5) * 50;
      const spreadY = (Math.random() - 0.5) * 50;

      particles.push({
        x: centerX + spreadX,
        y: centerY + spreadY,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 5,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 5 - 4, // Slight upward bias
        size: 1.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        life: 0,
        maxLife: 40 + Math.random() * 50,
        type: 'spark',
      });
    }

    // Add some random wandering embers
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 8,
        vy: -2 - Math.random() * 6,
        size: 1 + Math.random() * 2,
        color: '#ff5500',
        alpha: 0.9,
        life: 0,
        maxLife: 80 + Math.random() * 60,
        type: 'ember',
      });
    }

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint glowing center shockwave
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        width * 0.4
      );
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
      gradient.addColorStop(0.2, 'rgba(239, 68, 68, 0.05)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render & Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const progress = p.life / p.maxLife;
        p.alpha = 1 - progress;

        // Apply physics
        if (p.type === 'spark') {
          p.vy += 0.28; // Gravity
          p.vx *= 0.95; // Drag
          p.vy *= 0.95;
        } else if (p.type === 'ember') {
          p.vy -= 0.02; // Rise slightly
          p.vx += (Math.random() - 0.5) * 0.4; // Wind sway
        }

        p.x += p.vx;
        p.y += p.vy;

        // Draw particle with glow effect
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = p.type === 'spark' ? 6 : 2;
        ctx.shadowColor = p.color;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.type === 'spark') {
          // Draw elongated sparks (motion blur lines)
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 1) {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size;
            ctx.lineCap = 'round';
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.6, p.y - p.vy * 0.6);
            ctx.stroke();
          } else {
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    // Auto-complete unmount after 2 seconds
    const completionTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(completionTimer);
      clearTimeout(shakeTimer);
      window.removeEventListener('resize', handleResize);
      root.classList.remove('clash-shake-active');
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden select-none flex items-center justify-center">
      {/* Dynamic shake & flash keyframe definition inside a style tag to prevent external coupling */}
      <style>{`
        @keyframes clash-shake {
          0% { transform: translate(2px, 1px) rotate(0deg); }
          10% { transform: translate(-2px, -2px) rotate(-1deg); }
          20% { transform: translate(-4px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 3px) rotate(0deg); }
          40% { transform: translate(3px, -1px) rotate(1deg); }
          50% { transform: translate(-2px, 3px) rotate(-1deg); }
          60% { transform: translate(-4px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 2px) rotate(-1deg); }
          80% { transform: translate(-1px, -2px) rotate(1deg); }
          90% { transform: translate(3px, 3px) rotate(0deg); }
          100% { transform: translate(1px, -1px) rotate(0deg); }
        }
        .clash-shake-active {
          animation: clash-shake 0.45s cubic-bezier(.36,.07,.19,.97) both;
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>

      {/* Screen flash light overlay */}
      <motion.div
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="absolute inset-0 bg-red-600 mix-blend-color-dodge pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.6, times: [0, 0.15, 1] }}
        className="absolute inset-0 bg-white mix-blend-overlay pointer-events-none"
      />

      {/* Canvas for visceral spark animation */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Visceral Sword Slash SVGs */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Left-to-Right Slash */}
        <motion.path
          d="M-50,150 L110%,110%"
          stroke="url(#slash-grad-1)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1], 
            opacity: [0, 1, 1, 0] 
          }}
          transition={{ 
            duration: 0.35, 
            times: [0, 0.2, 0.7, 1],
            ease: 'easeInOut' 
          }}
        />

        {/* Right-to-Left Slash (Staggered by 100ms) */}
        <motion.path
          d="M110%,-10 L-10,110%"
          stroke="url(#slash-grad-2)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1], 
            opacity: [0, 1, 1, 0] 
          }}
          transition={{ 
            duration: 0.35, 
            delay: 0.1,
            times: [0, 0.2, 0.7, 1],
            ease: 'easeInOut' 
          }}
        />

        <defs>
          <linearGradient id="slash-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 60, 0, 0)" />
            <stop offset="20%" stopColor="#ff4d00" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="80%" stopColor="#ff9a00" />
            <stop offset="100%" stopColor="rgba(255, 60, 0, 0)" />
          </linearGradient>
          <linearGradient id="slash-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 60, 0, 0)" />
            <stop offset="20%" stopColor="#e50914" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="80%" stopColor="#ffcc00" />
            <stop offset="100%" stopColor="rgba(255, 60, 0, 0)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Central Impact Seal & Kanji for "Clash/Blade" */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Glowing impact ring */}
        <motion.div
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.2, 1.8, 2.5], opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute w-44 h-44 rounded-full border-4 border-rose-500 shadow-[0_0_50px_rgba(239,68,68,0.8)]"
        />

        {/* Central crossed swords icons or bold typography */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -25 }}
          animate={{ 
            scale: [0.3, 1.2, 1.0], 
            opacity: [0, 1, 1],
            rotate: [-25, 5, 0]
          }}
          transition={{ duration: 0.4, times: [0, 0.7, 1], ease: 'backOut' }}
          className="bg-stone-950/95 border-2 border-rose-600 px-6 py-3 rounded-md shadow-[0_0_30px_rgba(229,9,20,0.6)] flex flex-col items-center justify-center space-y-1 relative"
        >
          {/* Blood splat / ink splash shadow */}
          <div className="absolute inset-0 bg-rose-950/20 mix-blend-multiply rounded filter blur-sm pointer-events-none" />

          <span className="text-stone-500 font-mono text-[9px] uppercase tracking-widest font-semibold">Tactical Combat</span>
          <h2 className="text-rose-500 font-serif font-black text-xl tracking-wider uppercase flex items-center space-x-2">
            <span>⚔️ CLASH!</span>
          </h2>
          <span className="text-stone-400 font-mono text-[10px]">Blades Have Crossed</span>
        </motion.div>
      </div>
    </div>
  );
};
