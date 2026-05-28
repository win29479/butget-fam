
const STORAGE_KEY = "family-budget-app-state-v1";

const DEFAULT_STATE = {
  income: 0,
  ratios: { need: 50, want: 30, save: 20 },
  buckets: {
    need: { categories: [] },
    want: { categories: [] },
    save: { categories: [] },
  },
};

const currency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(DEFAULT_STATE);
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      ratios: { ...DEFAULT_STATE.ratios, ...(parsed.ratios || {}) },
      buckets: {
        need: { categories: parsed?.buckets?.need?.categories || [] },
        want: { categories: parsed?.buckets?.want?.categories || [] },
        save: { categories: parsed?.buckets?.save?.categories || [] },
      },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return currency.format(Number(value || 0));
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateNumber(el, to, duration = 650) {
  if (!el) return;
  const from = Number(el.dataset.numValue || 0);
  const target = Number(to || 0);
  if (prefersReducedMotion || from === target) {
    el.dataset.numValue = String(target);
    el.textContent = money(target);
    return;
  }
  const start = performance.now();
  el.dataset.numValue = String(target);
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const v = from + (target - from) * easeOutCubic(t);
    el.textContent = money(Math.round(v));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const CONFETTI_COLORS = ["#F97316", "#EC4899", "#8B5CF6", "#22C55E", "#f59e0b"];

function confetti(origin) {
  const root = document.getElementById("confettiRoot");
  if (!root || prefersReducedMotion) return;
  const rect = origin
    ? origin.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const count = 32;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distX = (Math.cos(angle) * (120 + Math.random() * 180));
    const distY = (Math.sin(angle) * (80 + Math.random() * 80)) + 220 + Math.random() * 120;
    const rot = (Math.random() * 720 - 360) + "deg";
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

function calcAmounts(state) {
  const income = Number(state.income || 0);
  const { need, want, save } = state.ratios;
  return {
    need: Math.round(income * (Number(need) / 100)),
    want: Math.round(income * (Number(want) / 100)),
    save: Math.round(income * (Number(save) / 100)),
  };
}

function updateDashboard() {
  const state = loadState();
  const incomeInput = document.getElementById("incomeInput");
  const needInput = document.getElementById("needInput");
  const wantInput = document.getElementById("wantInput");
  const saveInput = document.getElementById("saveInput");
  const warning = document.getElementById("ratioWarning");
  const pieChart = document.getElementById("pieChart");

  if (!incomeInput || !pieChart) return;

  if (incomeInput.value === "") incomeInput.value = state.income || "";
  needInput.value = state.ratios.need;
  wantInput.value = state.ratios.want;
  saveInput.value = state.ratios.save;

  const income = Number(incomeInput.value || 0);
  const need = Number(needInput.value || 0);
  const want = Number(wantInput.value || 0);
  const save = Number(saveInput.value || 0);
  const total = need + want + save;
  const amounts = {
    need: Math.round(income * need / 100),
    want: Math.round(income * want / 100),
    save: Math.round(income * save / 100),
  };

  animateNumber(document.getElementById("incomeLabel"), income);
  animateNumber(document.getElementById("needAmount"), amounts.need);
  animateNumber(document.getElementById("wantAmount"), amounts.want);
  animateNumber(document.getElementById("saveAmount"), amounts.save);
  animateNumber(document.getElementById("needSummary"), amounts.need);
  animateNumber(document.getElementById("wantSummary"), amounts.want);
  animateNumber(document.getElementById("saveSummary"), amounts.save);

  const colors = {
    need: "#ef4444",
    want: "#f59e0b",
    save: "#10b981",
  };

  if (total > 0) {
    const needDeg = (need / total) * 360;
    const wantDeg = (want / total) * 360;
    const segments = [
      `${colors.need} 0 ${needDeg}deg`,
      `${colors.want} ${needDeg}deg ${needDeg + wantDeg}deg`,
      `${colors.save} ${needDeg + wantDeg}deg 360deg`,
    ];
    pieChart.style.background = `conic-gradient(${segments.join(", ")})`;
  } else {
    pieChart.style.background = "conic-gradient(rgba(31,27,46,.10) 0 100%)";
  }

  warning.classList.toggle("hidden", total === 100);
  warning.textContent = total === 100
    ? ""
    : `เปอร์เซ็นต์รวมตอนนี้ = ${total}% (ควรเป็น 100%)`;
}

function initDashboard() {
  const state = loadState();
  const incomeInput = document.getElementById("incomeInput");
  const needInput = document.getElementById("needInput");
  const wantInput = document.getElementById("wantInput");
  const saveInput = document.getElementById("saveInput");

  if (!incomeInput) return;

  incomeInput.value = state.income || "";
  needInput.value = state.ratios.need;
  wantInput.value = state.ratios.want;
  saveInput.value = state.ratios.save;

  [incomeInput, needInput, wantInput, saveInput].forEach((input) => {
    input.addEventListener("input", updateDashboard);
  });

  document.getElementById("saveBtn").addEventListener("click", (e) => {
    const newState = loadState();
    newState.income = Math.max(0, Number(incomeInput.value || 0));
    newState.ratios.need = Math.max(0, Number(needInput.value || 0));
    newState.ratios.want = Math.max(0, Number(wantInput.value || 0));
    newState.ratios.save = Math.max(0, Number(saveInput.value || 0));
    saveState(newState);
    updateDashboard();
    if (newState.income > 0) confetti(e.currentTarget);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    const newState = loadState();
    newState.ratios = { need: 50, want: 30, save: 20 };
    saveState(newState);
    updateDashboard();
  });

  updateDashboard();
}

initDashboard();
