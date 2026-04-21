"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

/**
 * WardrobeGlobe — displays clothing items in a rotating orbital layout.
 * Items are arranged in concentric rings that slowly auto-rotate.
 */
export default function WardrobeGlobe({ items }) {
  const [hovered, setHovered] = useState(null);
  const [angle, setAngle] = useState(0);
  const rafRef = useRef(null);

  // Slow auto-rotate
  useEffect(() => {
    let last = performance.now();
    function tick(now) {
      const dt = now - last;
      last = now;
      setAngle((a) => (a + dt * 0.01) % 360);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!items.length) return null;

  // Distribute items across rings
  const rings = buildRings(items);

  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ height: 480 }}>
      {/* Glow background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl" />
      </div>

      {/* Rings */}
      {rings.map((ring, ri) => (
        <Ring
          key={ri}
          items={ring.items}
          radius={ring.radius}
          baseAngle={angle + ring.offset}
          direction={ring.direction}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}

      {/* Centre label */}
      <div className="absolute flex flex-col items-center pointer-events-none">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">{items.length}</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">items</span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 shadow-lg text-center pointer-events-none"
        >
          <p className="text-xs font-semibold text-gray-800 dark:text-white capitalize">
            {hovered.customName || hovered.type}
          </p>
          <p className="text-[10px] text-gray-400 capitalize">{hovered.color} · {hovered.style}</p>
        </motion.div>
      )}
    </div>
  );
}

function Ring({ items, radius, baseAngle, direction, hovered, setHovered }) {
  if (!items.length) return null;
  const step = 360 / items.length;

  return (
    <>
      {items.map((item, i) => {
        const deg = (baseAngle * direction + step * i) % 360;
        const rad = (deg * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius * 0.38; // flatten into ellipse
        const scale = 0.7 + 0.3 * ((Math.sin(rad) + 1) / 2); // depth illusion
        const opacity = 0.5 + 0.5 * ((Math.sin(rad) + 1) / 2);
        const isHovered = hovered?._id === item._id;
        const size = radius > 160 ? 52 : radius > 100 ? 44 : 36;

        return (
          <div
            key={item._id}
            onMouseEnter={() => setHovered(item)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${isHovered ? scale * 1.2 : scale})`,
              opacity: isHovered ? 1 : opacity,
              zIndex: Math.round(scale * 10),
              transition: "transform 0.2s, opacity 0.2s",
              cursor: "pointer",
            }}
          >
            <div
              style={{ width: size, height: size }}
              className={`rounded-xl overflow-hidden border-2 shadow-md ${
                isHovered
                  ? "border-purple-400 dark:border-purple-400 ring-2 ring-purple-300"
                  : "border-white dark:border-gray-700"
              }`}
            >
              <div className="relative w-full h-full bg-gray-100 dark:bg-gray-700">
                <Image
                  src={item.imageUrl}
                  alt={item.customName || item.type}
                  fill
                  className="object-cover"
                  sizes={`${size}px`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function buildRings(items) {
  // Ring config: radius, max items, rotation offset, direction
  const configs = [
    { radius: 90,  max: 6,  offset: 0,   direction: 1  },
    { radius: 155, max: 10, offset: 20,  direction: -1 },
    { radius: 215, max: 16, offset: 10,  direction: 1  },
    { radius: 270, max: 22, offset: 35,  direction: -1 },
  ];

  const rings = [];
  let idx = 0;

  for (const cfg of configs) {
    if (idx >= items.length) break;
    const slice = items.slice(idx, idx + cfg.max);
    if (slice.length) {
      rings.push({ ...cfg, items: slice });
      idx += slice.length;
    }
  }

  return rings;
}
