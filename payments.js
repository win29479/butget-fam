
const STORAGE_KEY = "family-budget-app-state-v1";

const currency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const stateDefaults = {
  income: 0,
  ratios: { need: 50, want: 30, save: 20 },
  buckets: {
    need: { categories: [] },
    want: { categories: [] },
    save: { categories: [] },
  },
};

const bucketLabels = {
  need: { title: "Need", color: "var(--need)", note: "ค่าใช้จ่ายจำเป็น" },
  want: { title: "Want", color: "var(--want)", note: "ค่าใช้จ่ายอยากได้" },
  save: { title: "Savings", color: "var(--save)", note: "เงินเก็บ" },
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(stateDefaults);
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(stateDefaults),
      ...parsed,
      ratios: { ...stateDefaults.ratios, ...(parsed.ratios || {}) },
      buckets: {
        need: { categories: parsed?.buckets?.need?.categories || [] },
        want: { categories: parsed?.buckets?.want?.categories || [] },
        save: { categories: parsed?.buckets?.save?.categories || [] },
      },
    };
  } catch {
    return structuredClone(stateDefaults);
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

function confetti(origin, count = 32) {
  const root = document.getElementById("confettiRoot");
  if (!root || prefersReducedMotion) return;
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

function calcBudget(state, key) {
  return Math.round(Number(state.income || 0) * (Number(state.ratios[key] || 0) / 100));
}

function spentInBucket(state, key) {
  return (state.buckets[key]?.categories || []).reduce((sum, cat) => {
    return sum + (cat.tasks || []).reduce((s, t) => s + Number(t.amount || 0), 0);
  }, 0);
}

function remainingInBucket(state, key) {
  return Math.max(0, calcBudget(state, key) - spentInBucket(state, key));
}

const els = {};
let activeBucket = null;
let activeCategoryId = null;
let newRowMarkers = new Set();

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderTabs() {
  const state = loadState();
  const root = els.bucketTabs;
  root.innerHTML = "";

  Object.keys(bucketLabels).forEach((key) => {
    const budget = calcBudget(state, key);
    const remaining = remainingInBucket(state, key);
    const btn = document.createElement("button");
    btn.className = `bucket-tab ${activeBucket === key ? "active" : ""}`;
    btn.type = "button";
    btn.innerHTML = `
      <span style="color:${bucketLabels[key].color}">${bucketLabels[key].title}</span>
      <strong>${money(remaining)}</strong>
      <small>จาก ${money(budget)}</small>
    `;
    btn.addEventListener("click", () => {
      const wasActive = activeBucket === key;
      const bucketView = document.getElementById("bucketView");
      if (wasActive) {
        activeBucket = null;
        bucketView.classList.add("hidden");
        renderTabs();
        return;
      }
      activeBucket = key;
      bucketView.classList.remove("hidden");
      renderBucket();
      renderTabs();
      bucketView.scrollIntoView({ behavior: "smooth", block: "start" });
      const freshTab = root.querySelector(".bucket-tab.active");
      if (freshTab) {
        freshTab.classList.remove("wiggle");
        void freshTab.offsetWidth;
        freshTab.classList.add("wiggle");
      }
      confetti(btn, 18);
    });
    root.appendChild(btn);
  });

  animateNumber(document.getElementById("topIncome"), state.income || 0);
  animateNumber(
    document.getElementById("totalRemaining"),
    remainingInBucket(state, "need") + remainingInBucket(state, "want") + remainingInBucket(state, "save")
  );
}

function renderBucket() {
  if (!activeBucket) return;
  const state = loadState();
  const label = bucketLabels[activeBucket];

  document.getElementById("bucketTitle").textContent = label.title;
  document.getElementById("bucketSubtitle").textContent = label.note;

  const budget = calcBudget(state, activeBucket);
  const spent = spentInBucket(state, activeBucket);
  const remaining = remainingInBucket(state, activeBucket);
  const progress = budget > 0 ? (spent / budget) * 100 : 0;

  animateNumber(document.getElementById("bucketBudget"), budget);
  document.getElementById("bucketRemaining").textContent = `เหลือ ${money(remaining)}`;
  document.getElementById("bucketProgress").style.width = `${Math.min(100, progress)}%`;

  const emptyState = document.getElementById("emptyState");
  const container = document.getElementById("categoriesContainer");
  const categories = state.buckets[activeBucket].categories || [];
  container.innerHTML = "";

  emptyState.classList.toggle("hidden", categories.length !== 0);

  categories.forEach((category) => {
    const catCard = document.createElement("article");
    catCard.className = "category-card";

    const taskCount = category.tasks?.length || 0;
    const categoryRemaining = Math.max(0, remainingInBucket(state, activeBucket) + (category.tasks || []).reduce((s, t) => s + Number(t.amount || 0), 0));

    catCard.innerHTML = `
      <div class="category-top">
        <label style="flex:1">
          <span>Rename card</span>
          <input type="text" value="${escapeHtml(category.name)}" maxlength="40" data-action="rename-card" data-category-id="${category.id}" />
        </label>
        <div style="text-align:right">
          <span class="muted">Tasks</span>
          <strong>${taskCount}</strong>
          <div class="muted small">Budget ใน card: ${money(categoryRemaining)}</div>
        </div>
      </div>

      <div class="category-actions">
        <button class="primary-btn" type="button" data-action="add-task" data-category-id="${category.id}">+ เพิ่ม task</button>
        <button class="ghost-btn" type="button" data-action="delete-card" data-category-id="${category.id}">ลบ card</button>
      </div>

      <div class="task-list" data-task-list="${category.id}"></div>
    `;

    const list = catCard.querySelector(`[data-task-list="${category.id}"]`);
    (category.tasks || []).forEach((task, idx) => {
      const row = document.createElement("div");
      row.className = `task-item ${task.done ? "done" : ""}`;
      if (newRowMarkers.has(task.id)) {
        row.style.animationDelay = "0s";
      } else {
        row.style.animationDelay = `${idx * 40}ms`;
      }
      row.innerHTML = `
        <input type="checkbox" ${task.done ? "checked" : ""} data-action="toggle-task" data-category-id="${category.id}" data-task-id="${task.id}" />
        <div>
          <strong>${escapeHtml(task.title)}</strong>
        </div>
        <div class="task-amount">${money(task.amount)}</div>
        <button class="icon-btn" type="button" data-action="delete-task" data-category-id="${category.id}" data-task-id="${task.id}">ลบ</button>
      `;
      list.appendChild(row);
    });

    container.appendChild(catCard);
  });

  newRowMarkers.clear();

  document.getElementById("addCategoryBtn").disabled = remaining <= 0;
  document.getElementById("addCategoryBtn").textContent = remaining <= 0 ? "Budget หมดแล้ว" : "+ เพิ่ม card";

  const addTaskButtons = document.querySelectorAll('[data-action="add-task"]');
  addTaskButtons.forEach((btn) => {
    btn.disabled = remaining <= 0;
  });

  wireBucketEvents();
}

function wireBucketEvents() {
  document.querySelectorAll('[data-action="rename-card"]').forEach((input) => {
    input.onchange = () => {
      const state = loadState();
      const catId = input.dataset.categoryId;
      const category = findCategory(state, activeBucket, catId);
      if (!category) return;
      category.name = input.value.trim() || "Untitled card";
      saveState(state);
      renderTabs();
      renderBucket();
    };
  });

  document.querySelectorAll('[data-action="add-task"]').forEach((btn) => {
    btn.onclick = () => {
      activeCategoryId = btn.dataset.categoryId;
      openTaskDialog();
    };
  });

  document.querySelectorAll('[data-action="delete-card"]').forEach((btn) => {
    btn.onclick = () => {
      const state = loadState();
      const catId = btn.dataset.categoryId;
      state.buckets[activeBucket].categories = state.buckets[activeBucket].categories.filter((c) => c.id !== catId);
      saveState(state);
      renderTabs();
      renderBucket();
    };
  });

  document.querySelectorAll('[data-action="toggle-task"]').forEach((checkbox) => {
    checkbox.onchange = () => {
      const state = loadState();
      const task = findTask(state, activeBucket, checkbox.dataset.categoryId, checkbox.dataset.taskId);
      if (!task) return;
      task.done = checkbox.checked;
      saveState(state);
      const row = checkbox.closest(".task-item");
      if (task.done && row && !prefersReducedMotion) {
        row.classList.remove("sparkle");
        void row.offsetWidth;
        row.classList.add("sparkle");
        setTimeout(() => row.classList.remove("sparkle"), 800);
      }
      renderTabs();
      renderBucket();
    };
  });

  document.querySelectorAll('[data-action="delete-task"]').forEach((btn) => {
    btn.onclick = () => {
      const state = loadState();
      const cat = findCategory(state, activeBucket, btn.dataset.categoryId);
      if (!cat) return;
      cat.tasks = (cat.tasks || []).filter((t) => t.id !== btn.dataset.taskId);
      saveState(state);
      renderTabs();
      renderBucket();
    };
  });
}

function findCategory(state, bucket, categoryId) {
  return state.buckets[bucket].categories.find((c) => c.id === categoryId);
}

function findTask(state, bucket, categoryId, taskId) {
  const cat = findCategory(state, bucket, categoryId);
  return cat?.tasks?.find((t) => t.id === taskId);
}

function openCategoryDialog() {
  const dialog = document.getElementById("categoryDialog");
  document.getElementById("categoryNameInput").value = "";
  dialog.showModal();
}

function openTaskDialog() {
  const state = loadState();
  const dialog = document.getElementById("taskDialog");
  const hint = document.getElementById("taskHint");
  const remaining = remainingInBucket(state, activeBucket);
  hint.textContent = `Budget เหลือในหมวดนี้ ${money(remaining)}. ใส่ task ใหม่ได้จนกว่าจะหมด`;
  document.getElementById("taskTitleInput").value = "";
  document.getElementById("taskAmountInput").value = "";
  dialog.showModal();
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initPayments() {
  const state = loadState();
  els.bucketTabs = document.getElementById("bucketTabs");
  activeBucket = null;

  if (!state.income) {
    document.getElementById("topIncome").textContent = money(0);
  }

  document.getElementById("addCategoryBtn").onclick = openCategoryDialog;

  document.getElementById("cancelCategoryBtn").onclick = () => document.getElementById("categoryDialog").close();
  document.getElementById("cancelTaskBtn").onclick = () => document.getElementById("taskDialog").close();

  document.getElementById("categoryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const state = loadState();
    const remaining = remainingInBucket(state, activeBucket);
    if (remaining <= 0) return;

    const name = document.getElementById("categoryNameInput").value.trim();
    if (!name) return;

    state.buckets[activeBucket].categories.push({
      id: uid(),
      name,
      tasks: [],
    });

    saveState(state);
    document.getElementById("categoryDialog").close();
    renderTabs();
    renderBucket();
  });

  document.getElementById("taskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const state = loadState();
    const category = findCategory(state, activeBucket, activeCategoryId);
    if (!category) return;

    const remaining = remainingInBucket(state, activeBucket);
    const title = document.getElementById("taskTitleInput").value.trim();
    const amount = Number(document.getElementById("taskAmountInput").value || 0);

    if (!title || amount <= 0) return;
    if (remaining <= 0) return;
    if (amount > remaining) {
      alert(`ยอดเกิน budget ที่เหลืออยู่ (${money(remaining)})`);
      return;
    }

    const newId = uid();
    category.tasks = category.tasks || [];
    category.tasks.push({
      id: newId,
      title,
      amount,
      done: false,
    });
    newRowMarkers.add(newId);

    saveState(state);
    document.getElementById("taskDialog").close();
    renderTabs();
    renderBucket();
    const addBtn = document.querySelector(`[data-action="add-task"][data-category-id="${activeCategoryId}"]`);
    confetti(addBtn || document.getElementById("bucketView"), 26);
  });

  document.getElementById("taskAmountInput").addEventListener("input", () => {
    const state = loadState();
    const remaining = remainingInBucket(state, activeBucket);
    document.getElementById("taskHint").textContent = `Budget เหลือในหมวดนี้ ${money(remaining)}. ใส่ task ใหม่ได้จนกว่าจะหมด`;
  });

  renderTabs();
}

initPayments();
