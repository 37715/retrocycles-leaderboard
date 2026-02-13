"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export function HubPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let squareSize = 40;
    let offsetX = 0;
    let offsetY = 0;
    let mousePos = { x: 0, y: 0 };
    let hovered: { x: number; y: number } | null = null;
    let mouseOver = false;

    const onResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      mouseOver = true;
    };

    const onMouseLeave = () => {
      mouseOver = false;
      hovered = null;
    };

    const draw = () => {
      offsetX = (offsetX - 0.3 + squareSize) % squareSize;
      offsetY = (offsetY - 0.3 + squareSize) % squareSize;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const startX = Math.floor(offsetX / squareSize) * squareSize;
      const startY = Math.floor(offsetY / squareSize) * squareSize;

      if (mouseOver) {
        hovered = {
          x: Math.floor((mousePos.x + offsetX - startX) / squareSize),
          y: Math.floor((mousePos.y + offsetY - startY) / squareSize)
        };
      }

      ctx.lineWidth = 0.5;
      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const squareX = x - (offsetX % squareSize);
          const squareY = y - (offsetY % squareSize);
          const gridX = Math.floor((x - startX) / squareSize);
          const gridY = Math.floor((y - startY) / squareSize);
          if (hovered && gridX === hovered.x && gridY === hovered.y) {
            ctx.fillStyle = "#444";
            ctx.fillRect(squareX, squareY, squareSize, squareSize);
          }
          ctx.strokeStyle = "#333";
          ctx.strokeRect(squareX, squareY, squareSize, squareSize);
        }
      }

      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
      );
      gradient.addColorStop(0, "rgba(6, 6, 6, 0)");
      gradient.addColorStop(0.6, "rgba(6, 6, 6, 0)");
      gradient.addColorStop(1, "rgba(6, 6, 6, 0.85)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      frameId = requestAnimationFrame(draw);
    };

    onResize();
    draw();
    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <>
      <canvas id="squares-background" ref={canvasRef}></canvas>
      <div className="hub-container">
        <div className="hub-content">
          <h1 className="hub-title">retrocycles league</h1>
          <p className="hub-subtitle">a hub for learning, competing, and mazing</p>
          <nav className="hub-navigation">
            <Link href="/leaderboard" className="hub-nav-link">
              <span className="hub-nav-text">leaderboard</span>
              <span className="hub-nav-border"></span>
              <span className="hub-nav-bg"></span>
            </Link>
            <Link href="/mazing" className="hub-nav-link">
              <span className="hub-nav-text">mazing</span>
              <span className="hub-nav-border"></span>
              <span className="hub-nav-bg"></span>
            </Link>
            <Link href="/tutorials" className="hub-nav-link">
              <span className="hub-nav-text">tutorials</span>
              <span className="hub-nav-border"></span>
              <span className="hub-nav-bg"></span>
            </Link>
          </nav>
          <div className="social-links">
            <a href="https://discord.gg/dcpaauj" className="social-link" aria-label="Join Discord" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a href="https://store.steampowered.com/app/1306180/Retrocycles/" className="social-link" aria-label="View on Steam" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                <path d="M12 2a10 10 0 0 1 10 10a10 10 0 0 1-10 10c-4.6 0-8.45-3.08-9.64-7.27l3.83 1.58a2.84 2.84 0 0 0 2.78 2.27c1.56 0 2.83-1.27 2.83-2.83v-.13l3.4-2.43h.08c2.08 0 3.77-1.69 3.77-3.77s-1.69-3.77-3.77-3.77s-3.78 1.69-3.78 3.77v.05l-2.37 3.46l-.16-.01c-.59 0-1.14.18-1.59.49L2 11.2C2.43 6.05 6.73 2 12 2M8.28 17.17c.8.33 1.72-.04 2.05-.84s-.05-1.71-.83-2.04l-1.28-.53c.49-.18 1.04-.19 1.56.03c.53.21.94.62 1.15 1.15c.22.52.22 1.1 0 1.62c-.43 1.08-1.7 1.6-2.78 1.15c-.5-.21-.88-.59-1.09-1.04l1.22.5m9.52-7.75c0 1.39-1.13 2.52-2.52 2.52a2.52 2.52 0 0 1-2.51-2.52a2.5 2.5 0 0 1 2.51-2.51a2.52 2.52 0 0 1 2.52 2.51m-4.4 0c0 1.04.84 1.89 1.89 1.89c1.04 0 1.88-.85 1.88-1.89s-.84-1.89-1.88-1.89c-1.05 0-1.89.85-1.89 1.89z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
