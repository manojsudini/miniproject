import { useEffect, useRef } from "react";

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;
    let stars = [];
    const STAR_COUNT = 250;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function createStars() {
      stars = [];

      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * canvas.width - canvas.width / 2,
          y: Math.random() * canvas.height - canvas.height / 2,
          z: Math.random() * canvas.width,
          size: Math.random() * 1.5 + 0.5,
        });
      }
    }

    function drawStar(star) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const perspective = 300;

      const scale = perspective / (perspective + star.z);
      const sx = star.x * scale + cx;
      const sy = star.y * scale + cy;
      const r = star.size * scale;

      if (sx < 0 || sx > canvas.width || sy < 0 || sy > canvas.height) return;

      const brightness = Math.min(1, (1 - star.z / canvas.width) * 1.5);
      const alpha = brightness * 0.9 + 0.1;

      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(r, 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56,189,248,${alpha})`;
      ctx.fill();

      if (brightness > 0.5) {
        ctx.beginPath();
        ctx.arc(sx, sy, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${alpha * 0.15})`;
        ctx.fill();
      }

      const trailLength = (1 - star.z / canvas.width) * 20;

      if (trailLength > 2) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);

        ctx.lineTo(
          sx - (star.x * scale * trailLength) / canvas.width,
          sy - (star.y * scale * trailLength) / canvas.height
        );

        ctx.strokeStyle = `rgba(56,189,248,${alpha * 0.3})`;
        ctx.lineWidth = Math.max(r * 0.5, 0.5);
        ctx.stroke();
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.z -= 1.5;

        if (star.z <= 0) {
          star.x = Math.random() * canvas.width - canvas.width / 2;
          star.y = Math.random() * canvas.height - canvas.height / 2;
          star.z = canvas.width;
          star.size = Math.random() * 1.5 + 0.5;
        }

        drawStar(star);
      }

      animationId = requestAnimationFrame(animate);
    }

    function handleResize() {
      resize();
      createStars();
    }

    resize();
    createStars();
    animate();

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="starfield-canvas"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
    />
  );
}
