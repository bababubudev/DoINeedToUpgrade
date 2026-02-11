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
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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

      // Diagonal wave that wraps smoothly
      const maxDiag = cols + rows;
      const padding = 10;
      const totalRange = maxDiag + padding * 2;
      const wavePos = ((time * 0.25) % totalRange) - padding;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const diag = i + j;

          // Per-node offset for irregularity (deterministic hash from grid position)
          const hash = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
          const offset = (hash - Math.floor(hash)) * 3 - 1.5;

          // Check distance to wave, also considering the wrapped position
          const adjustedDiag = diag + offset;
          const dist = Math.min(
            Math.abs(adjustedDiag - wavePos),
            Math.abs(adjustedDiag - (wavePos + totalRange)),
            Math.abs(adjustedDiag - (wavePos - totalRange))
          );
          const intensity = Math.max(0, 1 - dist / 10);

          // Subtle ambient flicker independent of wave
          const flicker = Math.sin(time * 0.3 + i * 3.7 + j * 5.3) * 0.5 + 0.5;
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

      time += 0.15;
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
