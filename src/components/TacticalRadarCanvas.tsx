'use client';

import React, { useEffect, useRef } from 'react';

interface TacticalRadarCanvasProps {
  visionMode?: 'stealth' | 'nvg' | 'flir';
}

export function TacticalRadarCanvas({ visionMode = 'stealth' }: TacticalRadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse target with lerp
    let mouse = { x: width * 0.5, y: height * 0.4, targetX: width * 0.5, targetY: height * 0.4 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Tactical nodes (Bolivia base coordinates & floating satellites)
    const nodes: { x: number; y: number; vx: number; vy: number; label: string; size: number }[] = [
      { x: width * 0.3, y: height * 0.35, vx: 0.2, vy: 0.1, label: 'HQ-CBBA', size: 3 },
      { x: width * 0.7, y: height * 0.3, vx: -0.15, vy: 0.2, label: 'SAT-01', size: 2 },
      { x: width * 0.25, y: height * 0.65, vx: 0.1, vy: -0.15, label: 'DEPOT-04', size: 2 },
      { x: width * 0.78, y: height * 0.6, vx: -0.2, vy: -0.1, label: 'NODE-LPZ', size: 2.5 },
      { x: width * 0.52, y: height * 0.75, vx: 0.15, vy: 0.1, label: 'DRONE-09', size: 2 },
      { x: width * 0.45, y: height * 0.2, vx: -0.1, vy: 0.15, label: 'ORBIT-2', size: 2 },
    ];

    let radarAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Color scheme based on vision mode
      let primaryColor = 'rgba(200, 169, 97, '; // Gold
      let pulseColor = 'rgba(222, 192, 122, ';
      if (visionMode === 'nvg') {
        primaryColor = 'rgba(34, 197, 94, '; // NVG Green
        pulseColor = 'rgba(74, 222, 128, ';
      } else if (visionMode === 'flir') {
        primaryColor = 'rgba(6, 182, 212, '; // FLIR Cyan
        pulseColor = 'rgba(249, 115, 22, '; // Heat Orange
      }

      const centerX = width * 0.5;
      const centerY = height * 0.45;
      const maxRadius = Math.min(width, height) * 0.55;

      // 1. Concentric Radar Rings
      ctx.lineWidth = 1;
      const ringSteps = [0.25, 0.5, 0.75, 1];
      ringSteps.forEach((step) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * step, 0, Math.PI * 2);
        ctx.strokeStyle = primaryColor + '0.08)';
        ctx.stroke();
      });

      // Axis cross
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.strokeStyle = primaryColor + '0.06)';
      ctx.stroke();

      // 2. Radar Sweep Line
      radarAngle += 0.015;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(radarAngle);

      // Sweep gradient fan
      const sweepGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, maxRadius);
      sweepGradient.addColorStop(0, primaryColor + '0.2)');
      sweepGradient.addColorStop(0.8, primaryColor + '0.04)');
      sweepGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxRadius, -0.4, 0);
      ctx.closePath();
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // Sweep leading line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(maxRadius, 0);
      ctx.strokeStyle = primaryColor + '0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // 3. Connect nodes with distance check
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;

        // Bounce on boundaries
        if (nodeA.x < 50 || nodeA.x > width - 50) nodeA.vx *= -1;
        if (nodeA.y < 50 || nodeA.y > height - 50) nodeA.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(nodeA.x, nodeA.y, nodeA.size, 0, Math.PI * 2);
        ctx.fillStyle = pulseColor + '0.8)';
        ctx.fill();

        // Node label
        ctx.font = '9px monospace';
        ctx.fillStyle = primaryColor + '0.45)';
        ctx.fillText(nodeA.label, nodeA.x + 8, nodeA.y + 3);

        // Connections between nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
          if (dist < 220) {
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.strokeStyle = primaryColor + `${0.15 * (1 - dist / 220)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Connection to mouse reticle if close
        const distMouse = Math.hypot(nodeA.x - mouse.x, nodeA.y - mouse.y);
        if (distMouse < 180) {
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = pulseColor + `${0.25 * (1 - distMouse / 180)})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 4. Interactive Tactical Crosshair on Mouse
      ctx.save();
      ctx.translate(mouse.x, mouse.y);

      // Rotating reticle ring
      ctx.rotate(-radarAngle * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.strokeStyle = primaryColor + '0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner reticle ticks
      const tickDist = 18;
      ctx.beginPath();
      ctx.moveTo(-tickDist, 0); ctx.lineTo(-tickDist + 6, 0);
      ctx.moveTo(tickDist, 0); ctx.lineTo(tickDist - 6, 0);
      ctx.moveTo(0, -tickDist); ctx.lineTo(0, -tickDist + 6);
      ctx.moveTo(0, tickDist); ctx.lineTo(0, tickDist - 6);
      ctx.strokeStyle = pulseColor + '0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = pulseColor + '0.9)';
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [visionMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
    />
  );
}
