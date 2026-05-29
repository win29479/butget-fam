const CONFETTI_COLORS = ["#F97316", "#EC4899", "#8B5CF6", "#22C55E", "#f59e0b"];

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function confetti(origin, count = 32) {
  if (typeof document === "undefined") return;
  const root = document.getElementById("confettiRoot");
  if (!root || reducedMotion()) return;

  const rect = origin
    ? origin.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distX = Math.cos(angle) * (120 + Math.random() * 180);
    const distY = Math.sin(angle) * (80 + Math.random() * 80) + 220 + Math.random() * 120;
    const rot = Math.random() * 720 - 360 + "deg";
    piece.style.setProperty("--start-x", `${cx}px`);
    piece.style.setProperty("--start-y", `${cy}px`);
    piece.style.setProperty("--cx", `${distX}px`);
    piece.style.setProperty("--cy", `${distY}px`);
    piece.style.setProperty("--cr", rot);
    piece.style.setProperty("--dur", `${1.1 + Math.random() * 0.7}s`);
    piece.style.background = color;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    root.appendChild(piece);
    setTimeout(() => piece.remove(), 1900);
  }
}
