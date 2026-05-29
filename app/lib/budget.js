export const STORAGE_KEY = "family-budget-app-state-v1";

export const DEFAULT_STATE = {
  income: 0,
  ratios: { need: 50, want: 30, save: 20 },
  buckets: {
    need: { categories: [] },
    want: { categories: [] },
    save: { categories: [] },
  },
};

export const bucketLabels = {
  need: { title: "Need", color: "var(--need)", note: "ค่าใช้จ่ายจำเป็น" },
  want: { title: "Want", color: "var(--want)", note: "ค่าใช้จ่ายอยากได้" },
  save: { title: "Savings", color: "var(--save)", note: "เงินเก็บ" },
};

const currency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export function money(value) {
  return currency.format(Number(value || 0));
}

export function loadState() {
  if (typeof window === "undefined") return structuredClone(DEFAULT_STATE);
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

export function saveState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function calcBudget(state, key) {
  return Math.round(Number(state.income || 0) * (Number(state.ratios[key] || 0) / 100));
}

export function spentInBucket(state, key) {
  return (state.buckets[key]?.categories || []).reduce((sum, cat) => {
    return sum + (cat.tasks || []).reduce((s, t) => s + Number(t.amount || 0), 0);
  }, 0);
}

export function remainingInBucket(state, key) {
  return Math.max(0, calcBudget(state, key) - spentInBucket(state, key));
}
