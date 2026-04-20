"use client";

import { useEffect, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────
const SAMPLE_STEP  = 4;    // sample every N px — lower = denser
const PARTICLE_MIN = 1.2;  // dot radius min
const PARTICLE_MAX = 2.0;  // dot radius max
const REPEL_R      = 90;   // mouse repel radius (px)
const REPEL_FORCE  = 5;    // repel strength
const SPRING       = 0.072; // spring back strength
const DAMPING      = 0.82;  // velocity damping

// Purple (#7c3aed) → Pink (#ec4899) gradient stops
function particleColor(x, w, isLine2) {
  const t = Math.max(0, Math.min(1, x / w));
  if (isLine2) {
    const r = Math.round(124 + (236 - 124) * t);
    const g = Math.round(58  + (72  - 58 ) * t);
    const b = Math.round(237 + (153 - 237) * t);
    return `rgb(${r},${g},${b})`;
  }
  // Line 1: white → soft purple
  const r = Math.round(255 - 40  * t);
  const g = Math.round(255 - 80  * t);
  const b = 255;
  return `rgb(${r},${g},${b})`;
}

// ─────────────────────────────────────────────────────────────────
export default function ParticleHeadline({ line1 = "Your wardrobe,", line2 = "styled by AI" }) {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    async function init() {
      // Wait for web fonts so Inter is available when sampling
      await document.fonts.ready;

      const W = canvas.offsetWidth  || 800;
      const H = canvas.offsetHeight || 240;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      // ── Render text to offscreen canvas for pixel sampling ────
      const off  = document.createElement("canvas");
      off.width  = W;
      off.height = H;
      const oc   = off.getContext("2d");

      const fs1 = Math.min(Math.round(W / 9), 68);
      const fs2 = Math.min(Math.round(W / 6), 90);

      oc.textAlign    = "center";
      oc.textBaseline = "middle";
      oc.fillStyle    = "#fff";

      oc.font = `800 ${fs1}px Inter, system-ui, sans-serif`;
      oc.fillText(line1, W / 2, H * 0.30);

      oc.font = `800 ${fs2}px Inter, system-ui, sans-serif`;
      oc.fillText(line2, W / 2, H * 0.72);

      // ── Build particle list from sampled pixels ───────────────
      const { data } = oc.getImageData(0, 0, W, H);
      const particles = [];

      for (let y = 0; y < H; y += SAMPLE_STEP) {
        for (let x = 0; x < W; x += SAMPLE_STEP) {
          const alpha = data[(y * W + x) * 4 + 3];
          if (alpha > 120) {
            particles.push({
              tx: x, ty: y,                              // target (resting) position
              cx: Math.random() * W,                     // current position — starts scattered
              cy: -20 + Math.random() * (H + 40),
              vx: 0, vy: 0,
              color: particleColor(x, W, y > H * 0.48),
              sz: PARTICLE_MIN + Math.random() * (PARTICLE_MAX - PARTICLE_MIN),
            });
          }
        }
      }

      // ── Animation loop ────────────────────────────────────────
      function tick() {
        ctx.clearRect(0, 0, W, H);

        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;

        for (const p of particles) {
          // Mouse repulsion
          const dx = p.cx - mx;
          const dy = p.cy - my;
          const d2 = dx * dx + dy * dy;

          if (d2 < REPEL_R * REPEL_R && d2 > 0) {
            const d = Math.sqrt(d2);
            const f = (REPEL_R - d) / REPEL_R * REPEL_FORCE;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }

          // Spring toward resting position
          p.vx += (p.tx - p.cx) * SPRING;
          p.vy += (p.ty - p.cy) * SPRING;

          // Apply damping + integrate
          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.cx += p.vx;
          p.cy += p.vy;

          // Draw dot
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, p.sz, 0, Math.PI * 2);
          ctx.fill();
        }

        rafRef.current = requestAnimationFrame(tick);
      }

      tick();
    }

    init();

    // ── Mouse / touch tracking ────────────────────────────────
    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function onTouch(e) {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    }
    function onLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("touchend", onLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchend", onLeave);
    };
  }, [line1, line2]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-3xl mx-auto block"
      style={{ height: 240, pointerEvents: "auto" }}
      aria-label={`${line1} ${line2}`}
    />
  );
}
