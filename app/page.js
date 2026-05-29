"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadState, saveState } from "./lib/budget";
import { confetti } from "./lib/confetti";
import AnimatedMoney from "./components/AnimatedMoney";

const COLORS = { need: "#ef4444", want: "#f59e0b", save: "#10b981" };

export default function DashboardPage() {
  const [income, setIncome] = useState("");
  const [need, setNeed] = useState("50");
  const [want, setWant] = useState("30");
  const [save, setSave] = useState("20");

  useEffect(() => {
    const s = loadState();
    setIncome(s.income ? String(s.income) : "");
    setNeed(String(s.ratios.need));
    setWant(String(s.ratios.want));
    setSave(String(s.ratios.save));
  }, []);

  const incomeN = Number(income || 0);
  const needN = Number(need || 0);
  const wantN = Number(want || 0);
  const saveN = Number(save || 0);
  const total = needN + wantN + saveN;

  const amounts = {
    need: Math.round((incomeN * needN) / 100),
    want: Math.round((incomeN * wantN) / 100),
    save: Math.round((incomeN * saveN) / 100),
  };

  let pieBackground;
  if (total > 0) {
    const needDeg = (needN / total) * 360;
    const wantDeg = (wantN / total) * 360;
    pieBackground = `conic-gradient(${COLORS.need} 0 ${needDeg}deg, ${COLORS.want} ${needDeg}deg ${needDeg + wantDeg}deg, ${COLORS.save} ${needDeg + wantDeg}deg 360deg)`;
  } else {
    pieBackground = "conic-gradient(rgba(31,27,46,.10) 0 100%)";
  }

  function handleSave(e) {
    const s = loadState();
    s.income = Math.max(0, incomeN);
    s.ratios = {
      need: Math.max(0, needN),
      want: Math.max(0, wantN),
      save: Math.max(0, saveN),
    };
    saveState(s);
    if (s.income > 0) confetti(e.currentTarget);
  }

  function handleReset() {
    const s = loadState();
    s.ratios = { need: 50, want: 30, save: 20 };
    saveState(s);
    setNeed("50");
    setWant("30");
    setSave("20");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Family Budget</p>
          <h1>ตั้งงบแบบ 50 - 30 - 20</h1>
          <p className="muted">ใส่รายได้ต่อเดือน แล้วระบบจะคำนวณ Need / Want / Savings ให้ทันที</p>
        </div>
        <Link className="secondary-btn" href="/payments">ไปหน้า Payment Management</Link>
      </section>

      <section className="card grid-2">
        <div className="panel">
          <h2>ตั้งรายได้และสัดส่วน</h2>
          <div className="form-grid">
            <label>
              <span>รายได้ต่อเดือน</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="เช่น 30000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </label>

            <label>
              <span>Need %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
              />
            </label>

            <label>
              <span>Want %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={want}
                onChange={(e) => setWant(e.target.value)}
              />
            </label>

            <label>
              <span>Savings %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={save}
                onChange={(e) => setSave(e.target.value)}
              />
            </label>
          </div>

          <div className="actions">
            <button className="primary-btn" onClick={handleSave}>บันทึกและอัปเดต</button>
            <button className="ghost-btn" onClick={handleReset}>รีเซ็ตเป็น 50-30-20</button>
          </div>

          {total !== 100 && (
            <p className="warning">{`เปอร์เซ็นต์รวมตอนนี้ = ${total}% (ควรเป็น 100%)`}</p>
          )}
        </div>

        <div className="panel chart-panel">
          <h2>Pie chart</h2>
          <div className="pie-wrap">
            <div className="pie-chart" style={{ background: pieBackground }} aria-label="Budget pie chart" />
            <div className="pie-center">
              <AnimatedMoney as="strong" value={incomeN} />
              <span>ต่อเดือน</span>
            </div>
          </div>
          <div className="legend">
            <div><span className="dot need" />Need: <AnimatedMoney as="strong" value={amounts.need} /></div>
            <div><span className="dot want" />Want: <AnimatedMoney as="strong" value={amounts.want} /></div>
            <div><span className="dot save" />Savings: <AnimatedMoney as="strong" value={amounts.save} /></div>
          </div>
        </div>
      </section>

      <section className="card panel">
        <h2>สรุปงบแบบอ่านง่าย</h2>
        <div className="summary-grid">
          <article className="summary-item need"><h3>Need</h3><AnimatedMoney as="p" value={amounts.need} /></article>
          <article className="summary-item want"><h3>Want</h3><AnimatedMoney as="p" value={amounts.want} /></article>
          <article className="summary-item save"><h3>Savings</h3><AnimatedMoney as="p" value={amounts.save} /></article>
        </div>
      </section>
    </main>
  );
}
