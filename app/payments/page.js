"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_STATE,
  loadState,
  saveState,
  money,
  uid,
  calcBudget,
  spentInBucket,
  remainingInBucket,
  bucketLabels,
} from "../lib/budget";
import { confetti } from "../lib/confetti";
import AnimatedMoney from "../components/AnimatedMoney";

const BUCKET_KEYS = ["need", "want", "save"];

export default function PaymentsPage() {
  const [state, setState] = useState(() => structuredClone(DEFAULT_STATE));
  const [activeBucket, setActiveBucket] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [wiggle, setWiggle] = useState(false);
  const [sparkleId, setSparkleId] = useState(null);

  const [catName, setCatName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAmount, setTaskAmount] = useState("");

  const bucketViewRef = useRef(null);
  const categoryDialogRef = useRef(null);
  const taskDialogRef = useRef(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (activeBucket && bucketViewRef.current) {
      bucketViewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeBucket]);

  function commit(next) {
    setState(next);
    saveState(next);
  }

  const totalRemaining =
    remainingInBucket(state, "need") +
    remainingInBucket(state, "want") +
    remainingInBucket(state, "save");

  function handleTabClick(key, e) {
    if (activeBucket === key) {
      setActiveBucket(null);
      return;
    }
    setActiveBucket(key);
    setWiggle(false);
    requestAnimationFrame(() => setWiggle(true));
    setTimeout(() => setWiggle(false), 520);
    confetti(e.currentTarget, 18);
  }

  // Derived values for the active bucket
  const label = activeBucket ? bucketLabels[activeBucket] : null;
  const budget = activeBucket ? calcBudget(state, activeBucket) : 0;
  const spent = activeBucket ? spentInBucket(state, activeBucket) : 0;
  const remaining = activeBucket ? remainingInBucket(state, activeBucket) : 0;
  const progress = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const categories = activeBucket ? state.buckets[activeBucket].categories : [];

  function renameCategory(catId, name) {
    const next = structuredClone(state);
    const cat = next.buckets[activeBucket].categories.find((c) => c.id === catId);
    if (!cat) return;
    cat.name = name;
    commit(next);
  }

  function normalizeCategoryName(catId) {
    const next = structuredClone(state);
    const cat = next.buckets[activeBucket].categories.find((c) => c.id === catId);
    if (!cat) return;
    cat.name = cat.name.trim() || "Untitled card";
    commit(next);
  }

  function deleteCategory(catId) {
    const next = structuredClone(state);
    next.buckets[activeBucket].categories = next.buckets[activeBucket].categories.filter(
      (c) => c.id !== catId
    );
    commit(next);
  }

  function openTaskDialog(catId) {
    setActiveCategoryId(catId);
    setTaskTitle("");
    setTaskAmount("");
    taskDialogRef.current?.showModal();
  }

  function toggleTask(catId, taskId, checked) {
    const next = structuredClone(state);
    const cat = next.buckets[activeBucket].categories.find((c) => c.id === catId);
    const task = cat?.tasks?.find((t) => t.id === taskId);
    if (!task) return;
    task.done = checked;
    commit(next);
    if (checked) {
      setSparkleId(taskId);
      setTimeout(() => setSparkleId((id) => (id === taskId ? null : id)), 800);
    }
  }

  function deleteTask(catId, taskId) {
    const next = structuredClone(state);
    const cat = next.buckets[activeBucket].categories.find((c) => c.id === catId);
    if (!cat) return;
    cat.tasks = (cat.tasks || []).filter((t) => t.id !== taskId);
    commit(next);
  }

  function openCategoryDialog() {
    setCatName("");
    categoryDialogRef.current?.showModal();
  }

  function submitCategory(e) {
    e.preventDefault();
    if (remaining <= 0) return;
    const name = catName.trim();
    if (!name) return;
    const next = structuredClone(state);
    next.buckets[activeBucket].categories.push({ id: uid(), name, tasks: [] });
    commit(next);
    categoryDialogRef.current?.close();
  }

  function submitTask(e) {
    e.preventDefault();
    const next = structuredClone(state);
    const cat = next.buckets[activeBucket].categories.find((c) => c.id === activeCategoryId);
    if (!cat) return;
    const title = taskTitle.trim();
    const amount = Number(taskAmount || 0);
    if (!title || amount <= 0) return;
    if (remaining <= 0) return;
    if (amount > remaining) {
      alert(`ยอดเกิน budget ที่เหลืออยู่ (${money(remaining)})`);
      return;
    }
    cat.tasks = cat.tasks || [];
    cat.tasks.push({ id: uid(), title, amount, done: false });
    commit(next);
    taskDialogRef.current?.close();
    confetti(bucketViewRef.current, 26);
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Payment Management</p>
          <h1>จัดการเงินตามหมวด</h1>
          <p className="muted">คลิก Need / Want / Savings เพื่อเข้าไปจัดการการ์ดค่าใช้จ่ายและ task ภายในหมวดนั้น</p>
        </div>
        <Link className="secondary-btn" href="/">กลับหน้า Dashboard</Link>
      </section>

      <section className="card panel">
        <div className="top-stats">
          <div>
            <span className="muted">รายได้ต่อเดือน</span>
            <AnimatedMoney as="strong" value={state.income || 0} />
          </div>
          <div>
            <span className="muted">Budget คงเหลือรวม</span>
            <AnimatedMoney as="strong" value={totalRemaining} />
          </div>
        </div>
        <div className="bucket-tabs">
          {BUCKET_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`bucket-tab ${activeBucket === key ? "active" : ""} ${
                activeBucket === key && wiggle ? "wiggle" : ""
              }`}
              onClick={(e) => handleTabClick(key, e)}
            >
              <span style={{ color: bucketLabels[key].color }}>{bucketLabels[key].title}</span>
              <strong>{money(remainingInBucket(state, key))}</strong>
              <small>จาก {money(calcBudget(state, key))}</small>
            </button>
          ))}
        </div>
      </section>

      {activeBucket && (
        <section ref={bucketViewRef} className="card panel">
          <div className="bucket-header">
            <div>
              <h2>{label.title}</h2>
              <p className="muted">{label.note}</p>
            </div>
            <div className="bucket-balance">
              <span>Budget</span>
              <AnimatedMoney as="strong" value={budget} />
              <small>เหลือ {money(remaining)}</small>
            </div>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="actions row">
            <button className="primary-btn" onClick={openCategoryDialog} disabled={remaining <= 0}>
              {remaining <= 0 ? "Budget หมดแล้ว" : "+ เพิ่ม card"}
            </button>
          </div>

          {categories.length === 0 && (
            <div className="empty-state" style={{ marginTop: 20 }}>
              ยังไม่มี card ในหมวดนี้
            </div>
          )}

          <div className="category-grid" style={{ marginTop: 20 }}>
            {categories.map((category) => {
              const taskCount = category.tasks?.length || 0;
              const categoryRemaining = Math.max(
                0,
                remaining + (category.tasks || []).reduce((s, t) => s + Number(t.amount || 0), 0)
              );
              return (
                <article key={category.id} className="category-card">
                  <div className="category-top">
                    <label style={{ flex: 1 }}>
                      <span>Rename card</span>
                      <input
                        type="text"
                        maxLength={40}
                        value={category.name}
                        onChange={(e) => renameCategory(category.id, e.target.value)}
                        onBlur={() => normalizeCategoryName(category.id)}
                      />
                    </label>
                    <div style={{ textAlign: "right" }}>
                      <span className="muted">Tasks</span>
                      <strong>{taskCount}</strong>
                      <div className="muted small">Budget ใน card: {money(categoryRemaining)}</div>
                    </div>
                  </div>

                  <div className="category-actions">
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() => openTaskDialog(category.id)}
                      disabled={remaining <= 0}
                    >
                      + เพิ่ม task
                    </button>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => deleteCategory(category.id)}
                    >
                      ลบ card
                    </button>
                  </div>

                  <div className="task-list">
                    {(category.tasks || []).map((task, idx) => (
                      <div
                        key={task.id}
                        className={`task-item ${task.done ? "done" : ""} ${
                          sparkleId === task.id ? "sparkle" : ""
                        }`}
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={(e) => toggleTask(category.id, task.id, e.target.checked)}
                        />
                        <div>
                          <strong>{task.title}</strong>
                        </div>
                        <div className="task-amount">{money(task.amount)}</div>
                        <button
                          className="icon-btn"
                          type="button"
                          onClick={() => deleteTask(category.id, task.id)}
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <dialog ref={categoryDialogRef} className="dialog">
        <form onSubmit={submitCategory} className="dialog-card" autoComplete="off">
          <h3>เพิ่ม card ใหม่</h3>
          <label>
            <span>ชื่อ card</span>
            <input
              type="text"
              maxLength={40}
              placeholder="เช่น ค่าอาหาร"
              required
              autoComplete="off"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
          </label>
          <div className="dialog-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => categoryDialogRef.current?.close()}
            >
              ยกเลิก
            </button>
            <button type="submit" className="primary-btn">สร้าง card</button>
          </div>
        </form>
      </dialog>

      <dialog ref={taskDialogRef} className="dialog">
        <form onSubmit={submitTask} className="dialog-card" autoComplete="off">
          <h3>เพิ่ม task</h3>
          <label>
            <span>ค่าใช้จ่ายอะไร</span>
            <input
              type="text"
              maxLength={60}
              placeholder="เช่น ข้าวกลางวัน"
              required
              autoComplete="off"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </label>
          <label>
            <span>ยอด</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="เช่น 120"
              required
              autoComplete="off"
              value={taskAmount}
              onChange={(e) => setTaskAmount(e.target.value)}
            />
          </label>
          <p className="muted small">
            Budget เหลือในหมวดนี้ {money(remaining)}. ใส่ task ใหม่ได้จนกว่าจะหมด
          </p>
          <div className="dialog-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => taskDialogRef.current?.close()}
            >
              ยกเลิก
            </button>
            <button type="submit" className="primary-btn">เพิ่ม task</button>
          </div>
        </form>
      </dialog>
    </main>
  );
}
