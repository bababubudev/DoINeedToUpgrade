"use client";

import { useEffect, useRef } from "react";

export default function GeometricBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let waveAngle = Math.random() * Math.PI * 2;
    let waveProgress = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const getColors = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      return {
        line: isDark ? "148, 163, 184" : "30, 41, 59",
        glow: isDark ? "56, 189, 248" : "8, 145, 178",
        lineAlpha: isDark ? 0.04 : 0.1,
        dotAlpha: isDark ? 0.06 : 0.15,
        glowMult: isDark ? 0.1 : 0.25,
        flickerMult: isDark ? 0.03 : 0.08,
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { line, glow, lineAlpha, dotAlpha, glowMult, flickerMult } = getColors();
      const spacing = 45;
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      // Draw grid lines
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let i = 0; i < cols; i++) {
        const x = i * spacing;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.strokeStyle = `rgba(${line}, ${lineAlpha})`;
        ctx.stroke();
      }

      // Horizontal lines
      for (let j = 0; j < rows; j++) {
        const y = j * spacing;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = `rgba(${line}, ${lineAlpha})`;
        ctx.stroke();
      }

      // Wave direction from current angle
      const dx = Math.cos(waveAngle);
      const dy = Math.sin(waveAngle);

      // Compute projection range for current angle
      const projections = [0, (cols - 1) * dx, (rows - 1) * dy, (cols - 1) * dx + (rows - 1) * dy];
      const minProj = Math.min(...projections);
      const maxProj = Math.max(...projections);
      const padding = 10;
      const totalRange = maxProj - minProj + padding * 2;

      const wavePos = minProj - padding + waveProgress * totalRange;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const proj = i * dx + j * dy;

          // Per-node offset for irregularity (deterministic hash from grid position)
          const hash = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
          const offset = (hash - Math.floor(hash)) * 3 - 1.5;

          const adjustedProj = proj + offset;
          const dist = Math.min(
            Math.abs(adjustedProj - wavePos),
            Math.abs(adjustedProj - (wavePos + totalRange)),
            Math.abs(adjustedProj - (wavePos - totalRange))
          );
          const intensity = Math.max(0, 1 - dist / 10);

          // Subtle ambient flicker independent of wave
          const flicker = Math.sin(waveProgress * 40 + i * 3.7 + j * 5.3) * 0.5 + 0.5;
          const flickerIntensity = flicker * flickerMult;

          const x = i * spacing;
          const y = j * spacing;

          if (intensity > 0) {
            // Glow dot at intersection
            ctx.beginPath();
            ctx.arc(x, y, 1.5 + intensity * 1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${glow}, ${intensity * glowMult + flickerIntensity})`;
            ctx.fill();
          } else if (flickerIntensity > 0.01) {
            // Ambient flicker on non-wave nodes
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${glow}, ${flickerIntensity})`;
            ctx.fill();
          }
        }
      }

      // Tiny dots at intersections
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          ctx.beginPath();
          ctx.arc(i * spacing, j * spacing, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${line}, ${dotAlpha})`;
          ctx.fill();
        }
      }

      // Advance wave; speed normalized so wave crosses at consistent pace
      waveProgress += 0.0015 / (totalRange / 30);
      if (waveProgress >= 1) {
        waveProgress -= 1;
        waveAngle = Math.random() * Math.PI * 2;
      }
      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
