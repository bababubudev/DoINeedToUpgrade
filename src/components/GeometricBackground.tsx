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
    let isMotionReduced = false;
    let lastFrameTime = 0;

    // FPS monitoring for performance hints
    let fpsDrawCount = 0;
    let fpsWindowStart = 0;
    let lowFpsStreak = 0;
    let hintDispatched = false;

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

    function applyMotionState() {
      isMotionReduced =
        document.documentElement.getAttribute("data-reduce-motion") === "true";
      if (isMotionReduced) {
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = "none";
      } else {
        canvas.style.display = "";
        if (!isPaused) {
          lastFrameTime = 0;
          animationId = requestAnimationFrame(loop);
        }
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "data-theme") colors = getColors();
        if (m.attributeName === "data-reduce-motion") applyMotionState();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-reduce-motion"],
    });

    // Flat arrays for better cache performance
    let px: Float32Array; // x positions
    let py: Float32Array; // y positions
    let pvx: Float32Array; // x velocities
    let pvy: Float32Array; // y velocities
    let count = 0;
    let w = 0;
    let h = 0;

    // Spatial grid for O(n) neighbor lookups
    let gridCols = 0;
    let gridRows = 0;
    let grid: Int16Array; // flat grid: each cell stores up to CELL_CAP indices
    const CELL_CAP = 8; // max particles per cell

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

      // Allocate spatial grid
      gridCols = Math.ceil(w / CONNECT_DIST) + 1;
      gridRows = Math.ceil(h / CONNECT_DIST) + 1;
      // Each cell: [count, idx0, idx1, ..., idx(CELL_CAP-1)]
      grid = new Int16Array(gridCols * gridRows * (CELL_CAP + 1));
    }

    function buildGrid() {
      grid.fill(0);
      const stride = CELL_CAP + 1;
      for (let i = 0; i < count; i++) {
        const col = Math.floor(px[i] / CONNECT_DIST);
        const row = Math.floor(py[i] / CONNECT_DIST);
        if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) continue;
        const cellBase = (col * gridRows + row) * stride;
        const cellCount = grid[cellBase];
        if (cellCount < CELL_CAP) {
          grid[cellBase + 1 + cellCount] = i;
          grid[cellBase]++;
        }
      }
    }

    // Track drawn pairs to avoid duplicates
    let pairSet: Uint8Array;
    let pairSetSize = 0;

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

      // Build spatial grid
      buildGrid();

      // Allocate/resize pair dedup set
      if (pairSetSize < count * count) {
        pairSetSize = count * count;
        pairSet = new Uint8Array(pairSetSize);
      } else {
        pairSet.fill(0);
      }

      // Draw connections using spatial grid
      ctx.lineWidth = 0.6;
      const mx = mouse.x;
      const my = mouse.y;
      const stride = CELL_CAP + 1;

      for (let i = 0; i < count; i++) {
        const ax = px[i];
        const ay = py[i];

        // Connect to mouse
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

        // Check neighboring cells (3x3 around particle's cell)
        const col = Math.floor(ax / CONNECT_DIST);
        const row = Math.floor(ay / CONNECT_DIST);
        const colMin = Math.max(0, col - 1);
        const colMax = Math.min(gridCols - 1, col + 1);
        const rowMin = Math.max(0, row - 1);
        const rowMax = Math.min(gridRows - 1, row + 1);

        for (let c = colMin; c <= colMax; c++) {
          for (let r = rowMin; r <= rowMax; r++) {
            const cellBase = (c * gridRows + r) * stride;
            const cellCount = grid[cellBase];
            for (let k = 0; k < cellCount; k++) {
              const j = grid[cellBase + 1 + k];
              if (j <= i) continue; // avoid self and duplicates (only draw i < j)

              // Dedup check
              const pairKey = i * count + j;
              if (pairSet[pairKey]) continue;
              pairSet[pairKey] = 1;

              const dx = ax - px[j];
              const dy = ay - py[j];
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
        }
      }

      // Draw all particles in one batch
      ctx.fillStyle = `rgba(${particle}, ${particleAlpha})`;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        ctx.moveTo(px[i] + PARTICLE_RADIUS, py[i]);
        ctx.arc(px[i], py[i], PARTICLE_RADIUS, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    function loop(timestamp: number) {
      if (isPaused || isMotionReduced) return;
      animationId = requestAnimationFrame(loop);
      if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = timestamp;
      draw();

      // Track FPS over 2-second windows
      if (!hintDispatched) {
        fpsDrawCount++;
        if (!fpsWindowStart) fpsWindowStart = timestamp;
        const elapsed = timestamp - fpsWindowStart;
        if (elapsed >= 2000) {
          const fps = (fpsDrawCount / elapsed) * 1000;
          if (fps < 15) {
            lowFpsStreak++;
            if (lowFpsStreak >= 2) {
              window.dispatchEvent(new CustomEvent("performancehint"));
              hintDispatched = true;
            }
          } else {
            lowFpsStreak = 0;
          }
          fpsDrawCount = 0;
          fpsWindowStart = timestamp;
        }
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(animationId);
      } else {
        isPaused = false;
        if (!isMotionReduced) {
          lastFrameTime = 0;
          animationId = requestAnimationFrame(loop);
        }
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
    applyMotionState();
    if (!isMotionReduced) {
      animationId = requestAnimationFrame(loop);
    }

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
