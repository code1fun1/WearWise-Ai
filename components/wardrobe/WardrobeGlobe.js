"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

// ── Deterministic star positions (avoids SSR hydration mismatch) ──
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 7919 + 31) % 1000) / 10,
  y: ((i * 6271 + 17) % 1000) / 10,
  size: (i * 3457 + 7) % 10 < 2 ? 2 : 1,
  opacity: 0.15 + (((i * 2311) % 100) / 100) * 0.45,
}));

// ── Fibonacci sphere: evenly distributes N points on a unit sphere ─
function buildPositions(count) {
  const golden = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.399 rad (golden angle)
  return Array.from({ length: count }, (_, i) => {
    const yy = 1 - (i / Math.max(count - 1, 1)) * 2; // -1 to 1
    const r  = Math.sqrt(Math.max(0, 1 - yy * yy));
    const th = golden * i;
    // CSS transform: rotateY(rotY) rotateX(rotX) translateZ(R)
    // places card at world pos (R·cos(rotX)·sin(rotY), -R·sin(rotX), R·cos(rotX)·cos(rotY))
    // Solving for rotX, rotY given target (x,y,z) on unit sphere:
    //   -sin(rotX) = yy  →  rotX = -asin(yy)
    //   atan2(x, z)      →  rotY
    return {
      rotX: -Math.asin(yy) * (180 / Math.PI),
      rotY: Math.atan2(Math.cos(th) * r, Math.sin(th) * r) * (180 / Math.PI),
    };
  });
}

// ── Adaptive radius / card size based on item count ───────────────
function getGeometry(count) {
  if (count <= 5)  return { radius: 160, w: 130, h: 164 };
  if (count <= 10) return { radius: 200, w: 116, h: 148 };
  if (count <= 20) return { radius: 260, w: 100, h: 128 };
  if (count <= 40) return { radius: 320, w: 84,  h: 108 };
  return                   { radius: 380, w: 68,  h: 88  };
}

// ── Depth: approximate world-Z of a card given current globe rotation
// Uses the composition: globe(rotateX·rotateY) ∘ card(rotateY·rotateX)
// Simplified dot-product approximation — accurate enough for opacity.
function calcDepth(cardRotX, cardRotY, globeRotX, globeRotY) {
  const cxr = (cardRotX * Math.PI) / 180;
  const cyr = (cardRotY * Math.PI) / 180;
  const gxr = (globeRotX * Math.PI) / 180;
  const gyr = (globeRotY * Math.PI) / 180;

  // Card's outward normal in globe-local space
  const nx = Math.cos(cxr) * Math.sin(cyr);
  const ny = -Math.sin(cxr);
  const nz = Math.cos(cxr) * Math.cos(cyr);

  // Rotate normal by globe rotation (rotateX first, then rotateY)
  const ny2 = ny * Math.cos(gxr) - nz * Math.sin(gxr);
  const nz2 = ny * Math.sin(gxr) + nz * Math.cos(gxr);
  const nx3 = nx * Math.cos(gyr) + nz2 * Math.sin(gyr);
  const nz3 = -nx * Math.sin(gyr) + nz2 * Math.cos(gyr);

  return nz3; // Z component = how much the card faces the viewer (-1 to 1)
}

// ─────────────────────────────────────────────────────────────────
export default function WardrobeGlobe({ items, onDelete }) {
  const rotXRef   = useRef(18);
  const rotYRef   = useRef(0);
  const velXRef   = useRef(0);
  const velYRef   = useRef(0);
  const dragging  = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });

  const [globeRot, setGlobeRot] = useState({ x: 18, y: 0 });

  const positions = useMemo(() => buildPositions(items.length), [items.length]);
  const { radius, w: cardW, h: cardH } = useMemo(() => getGeometry(items.length), [items.length]);

  // ── Animation loop ──────────────────────────────────────────────
  useEffect(() => {
    let rafId;
    function tick() {
      if (!dragging.current) {
        velXRef.current *= 0.92;
        velYRef.current *= 0.92;
        rotXRef.current = Math.max(-72, Math.min(72,
          rotXRef.current + velXRef.current,
        ));
        rotYRef.current += 0.13 + velYRef.current;
      }
      setGlobeRot({ x: rotXRef.current, y: rotYRef.current });
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Pointer helpers ─────────────────────────────────────────────
  function onDown(x, y) {
    dragging.current = true;
    lastPos.current = { x, y };
    velXRef.current = 0;
    velYRef.current = 0;
  }
  function onMove(x, y) {
    if (!dragging.current) return;
    const dx = x - lastPos.current.x;
    const dy = y - lastPos.current.y;
    velYRef.current = dx * 0.22;
    velXRef.current = dy * 0.22;
    rotYRef.current += dx * 0.22;
    rotXRef.current = Math.max(-72, Math.min(72, rotXRef.current + dy * 0.22));
    lastPos.current = { x, y };
  }
  function onUp() { dragging.current = false; }

  return (
    <div
      className="relative w-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none rounded-3xl overflow-hidden"
      style={{ height: 680, perspective: 1100 }}
      onMouseDown={(e) => onDown(e.clientX, e.clientY)}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={(e) => onDown(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={onUp}
    >
      {/* ── Space-inspired background ─────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0a2e_0%,_#0d0d1a_60%,_#000_100%)]" />

      {/* Star field */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${s.x}%`,
            top:  `${s.y}%`,
            width:  s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}

      {/* Ambient glow rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-purple-500/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-purple-400/5 pointer-events-none" />

      {/* ── Globe ─────────────────────────────────────────────── */}
      <div
        style={{
          width: 1,
          height: 1,
          transformStyle: "preserve-3d",
          transform: `rotateX(${globeRot.x}deg) rotateY(${globeRot.y}deg)`,
        }}
      >
        {items.map((item, i) => {
          const pos     = positions[i];
          const depth   = calcDepth(pos.rotX, pos.rotY, globeRot.x, globeRot.y);
          const opacity = Math.max(0.08, Math.min(1, 0.08 + 0.92 * (depth + 1) / 2));
          const interactive = depth > -0.15;

          return (
            <div
              key={item._id}
              style={{
                position: "absolute",
                transformStyle: "preserve-3d",
                transform: `rotateY(${pos.rotY}deg) rotateX(${pos.rotX}deg) translateZ(${radius}px)`,
              }}
            >
              <GlobeCard
                item={item}
                onDelete={onDelete}
                width={cardW}
                height={cardH}
                opacity={opacity}
                interactive={interactive}
              />
            </div>
          );
        })}
      </div>

      {/* ── Drag hint ─────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
        <span className="text-[11px] text-white/30 tracking-wide">Drag to rotate</span>
      </div>

      {/* ── Item count badge ──────────────────────────────────── */}
      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/60 pointer-events-none">
        {items.length} item{items.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

// ── Individual card on the sphere ─────────────────────────────────
function GlobeCard({ item, onDelete, width, height, opacity, interactive }) {
  return (
    <div
      className="group absolute rounded-2xl overflow-hidden shadow-2xl"
      style={{
        width,
        height,
        transform: "translate(-50%, -50%)",
        opacity,
        pointerEvents: interactive ? "auto" : "none",
        transition: "opacity 0.08s linear",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(2px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {/* Clothing image */}
      <Image
        src={item.imageUrl}
        alt={item.customName || item.type}
        fill
        className="object-cover"
        sizes={`${width}px`}
        draggable={false}
      />

      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

      {/* Info reveal on hover */}
      <div
        className="absolute inset-x-0 bottom-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
      >
        <p className="text-white text-[11px] font-semibold capitalize truncate leading-tight">
          {item.customName || item.type}
        </p>
        <p className="text-white/55 text-[10px] capitalize mt-0.5">
          {item.color}{item.season ? ` · ${item.season}` : ""}
        </p>
      </div>

      {/* Delete button */}
      <GlobeDeleteButton itemId={item._id} onDelete={onDelete} />
    </div>
  );
}

// ── Delete button ─────────────────────────────────────────────────
function GlobeDeleteButton({ itemId, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm("Remove this item from your wardrobe?")) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/wardrobe/${itemId}`);
      toast.success("Item removed");
      onDelete(itemId);
    } catch {
      toast.error("Failed to remove item");
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="absolute top-1.5 right-1.5 p-1.5 rounded-xl bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 hover:text-red-300 disabled:opacity-40"
    >
      <Trash2 className="w-3 h-3" />
    </button>
  );
}
