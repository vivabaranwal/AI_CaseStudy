/* utils/animations.js — Confetti burst */

export function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#F4A7B9', '#F5A623', '#FFFFFF', '#f6c9d4', '#ffd280'];
  const particles = Array.from({ length: 60 }, () => ({
    x:     Math.random() * canvas.width,
    y:     -10 - Math.random() * 100,
    r:     Math.random() * 5 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vy:    Math.random() * 3 + 2,
    vx:    (Math.random() - 0.5) * 2.5,
    alpha: 1,
    rot:   Math.random() * 360,
    rotV:  (Math.random() - 0.5) * 5,
    shape: Math.random() > 0.45 ? 'rect' : 'circle',
    w:     Math.random() * 9 + 4,
    h:     Math.random() * 5 + 2,
  }));

  const start = performance.now();
  function draw(ts) {
    const elapsed = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.y += p.vy; p.x += p.vx; p.rot += p.rotV;
      if (elapsed > 1800) p.alpha -= 0.012;
      if (p.alpha <= 0) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle   = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      if (p.shape === 'rect') ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (alive && elapsed < 3500) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(draw);
}
