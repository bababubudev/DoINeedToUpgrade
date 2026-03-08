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
    let lastFrameTime = 0;
    let isPaused = false;

    const TARGET_FPS = 12;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;
    const SPACING = 45;

    // Pre-computed hash offsets (recomputed on resize)
    let offsets: Float32Array;
    let gridCols = 0;
    let gridRows = 0;

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

    // Cache colors, update on theme change
    let cachedColors = getColors();
    const observer = new MutationObserver(() => {
      cachedColors = getColors();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Pre-compute deterministic hash offsets
      gridCols = Math.ceil(canvas.width / SPACING) + 1;
      gridRows = Math.ceil(canvas.height / SPACING) + 1;
      offsets = new Float32Array(gridCols * gridRows);
      for (let i = 0; i < gridCols; i++) {
        for (let j = 0; j < gridRows; j++) {
          const hash = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
          offsets[i * gridRows + j] = (hash - Math.floor(hash)) * 3 - 1.5;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { line, glow, lineAlpha, dotAlpha, glowMult, flickerMult } = cachedColors;
      const cols = Math.ceil(canvas.width / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;

      // Draw grid lines
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = `rgba(${line}, ${lineAlpha})`;

      for (let i = 0; i < cols; i++) {
        const x = i * SPACING;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let j = 0; j < rows; j++) {
        const y = j * SPACING;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
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

      // Merged loop: base dots + wave/flicker effects
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING;
          const y = j * SPACING;

          // Base tiny dot at intersection
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${line}, ${dotAlpha})`;
          ctx.fill();

          // Wave/flicker calculations
          const proj = i * dx + j * dy;
          const offset = offsets[i * gridRows + j];
          const adjustedProj = proj + offset;
          const dist = Math.min(
            Math.abs(adjustedProj - wavePos),
            Math.abs(adjustedProj - (wavePos + totalRange)),
            Math.abs(adjustedProj - (wavePos - totalRange))
          );
          const intensity = Math.max(0, 1 - dist / 10);

          const flicker = Math.sin(waveProgress * 40 + i * 3.7 + j * 5.3) * 0.5 + 0.5;
          const flickerIntensity = flicker * flickerMult;

          if (intensity > 0) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5 + intensity * 1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${glow}, ${intensity * glowMult + flickerIntensity})`;
            ctx.fill();
          } else if (flickerIntensity > 0.01) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${glow}, ${flickerIntensity})`;
            ctx.fill();
          }
        }
      }

      // Advance wave (time-based: ~0.09 per second, equivalent to old 0.0015 * 60fps)
      waveProgress += 0.09 / TARGET_FPS / (totalRange / 30);
      if (waveProgress >= 1) {
        waveProgress -= 1;
        waveAngle = Math.random() * Math.PI * 2;
      }
    };

    const loop = (timestamp: number) => {
      if (isPaused) return;
      animationId = requestAnimationFrame(loop);
      if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = timestamp;
      draw();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(animationId);
      } else {
        isPaused = false;
        lastFrameTime = 0;
        animationId = requestAnimationFrame(loop);
      }
    };

    resize();
    animationId = requestAnimationFrame(loop);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
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
