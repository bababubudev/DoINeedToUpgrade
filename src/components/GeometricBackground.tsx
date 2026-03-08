"use client";

import { useEffect, useRef } from "react";

export default function GeometricBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    let animationId: number;
    let isPaused = false;
    let lastFrameTime = 0;

    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;
    const CONNECT_DIST = 150;
    const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;
    const DENSITY = 8000;
    const VELOCITY = 0.4;
    const PARTICLE_RADIUS = 1.5;

    const getColors = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      return {
        particle: isDark ? "148, 163, 184" : "80, 80, 80",
        line: isDark ? "148, 163, 184" : "80, 80, 80",
        particleAlpha: isDark ? 0.5 : 0.4,
        lineBaseAlpha: isDark ? 0.15 : 0.12,
      };
    };

    let colors = getColors();
    const observer = new MutationObserver(() => {
      colors = getColors();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Flat arrays for better cache performance
    let px: Float32Array; // x positions
    let py: Float32Array; // y positions
    let pvx: Float32Array; // x velocities
    let pvy: Float32Array; // y velocities
    let count = 0;
    let w = 0;
    let h = 0;

    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      count = Math.floor((w * h) / DENSITY);
      px = new Float32Array(count);
      py = new Float32Array(count);
      pvx = new Float32Array(count);
      pvy = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        px[i] = Math.random() * w;
        py[i] = Math.random() * h;
        pvx[i] = (Math.random() - 0.5) * VELOCITY;
        pvy[i] = (Math.random() - 0.5) * VELOCITY;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const { particle, line, particleAlpha, lineBaseAlpha } = colors;
      const invDist = 1 / CONNECT_DIST;

      // Update positions
      for (let i = 0; i < count; i++) {
        px[i] += pvx[i];
        py[i] += pvy[i];
        if (px[i] < -20) px[i] = w + 20;
        else if (px[i] > w + 20) px[i] = -20;
        if (py[i] < -20) py[i] = h + 20;
        else if (py[i] > h + 20) py[i] = -20;
      }

      // Draw connections — batch by alpha bands to reduce strokeStyle changes
      ctx.lineWidth = 0.6;
      const mx = mouse.x;
      const my = mouse.y;

      for (let i = 0; i < count; i++) {
        const ax = px[i];
        const ay = py[i];

        // Connect to mouse (squared distance check)
        const mdx = ax - mx;
        const mdy = ay - my;
        const mDistSq = mdx * mdx + mdy * mdy;
        if (mDistSq < CONNECT_DIST_SQ) {
          const mDist = Math.sqrt(mDistSq);
          const alpha = (1 - mDist * invDist) * lineBaseAlpha * 2;
          ctx.strokeStyle = `rgba(${line}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }

        // Connect to other particles
        for (let j = i + 1; j < count; j++) {
          const dx = ax - px[j];
          // Early exit: if dx alone exceeds distance, skip
          if (dx > CONNECT_DIST || dx < -CONNECT_DIST) continue;
          const dy = ay - py[j];
          if (dy > CONNECT_DIST || dy < -CONNECT_DIST) continue;
          const distSq = dx * dx + dy * dy;
          if (distSq < CONNECT_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist * invDist) * lineBaseAlpha;
            ctx.strokeStyle = `rgba(${line}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(px[j], py[j]);
            ctx.stroke();
          }
        }
      }

      // Draw particles in one batch
      ctx.fillStyle = `rgba(${particle}, ${particleAlpha})`;
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.arc(px[i], py[i], PARTICLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(timestamp: number) {
      if (isPaused) return;
      animationId = requestAnimationFrame(loop);
      if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = timestamp;
      draw();
    }

    function handleVisibility() {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(animationId);
      } else {
        isPaused = false;
        lastFrameTime = 0;
        animationId = requestAnimationFrame(loop);
      }
    }

    function handleMouse(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function handleMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    resize();
    animationId = requestAnimationFrame(loop);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mouseleave", handleMouseLeave);
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
