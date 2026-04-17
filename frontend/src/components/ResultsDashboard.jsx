// =============================================================================
//  ResultsDashboard — Original Deep Slate + Amber theme
//  TEXT FIXES ONLY:
//  1. All var(--text3)/var(--text4) usage now maps to new readable values
//  2. Chart ticks: explicit hex fills (SVG ignores CSS vars)
//  3. Custom tooltip component — always light text, no black bug
//  4. sim-subtitle, slider-name, forecast-note all visible
//  5. Chat messages, placeholders, quick buttons explicit
//  6. card-lbl-dot gets default background
// =============================================================================

import { useState, useRef } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  ReferenceLine, Area, AreaChart, CartesianGrid, Line,
} from "recharts";
import { gradeCol, barCol, typeCol, BENCH_LABELS, API_BASE } from "../utils/constants.js";

// Custom tooltip — guarantees white text, no black bug possible
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"rgba(16,18,26,0.97)",
      border:"1px solid rgba(245,158,11,0.2)",
      borderRadius:8, padding:"10px 14px",
      fontFamily:"'Fira Code',monospace", fontSize:11,
      color:"#f0f4f8",
      boxShadow:"0 8px 32px rgba(0,0,0,0.6)"
    }}>
      {label && <p style={{color:"#b8ccd8",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{color:"#f0f4f8"}}>{p.name}: <span style={{color:"#f59e0b",fontWeight:600}}>{p.value}</span></p>
      ))}
    </div>
  );
};

// Explicit hex tick fill — SVG ignores CSS custom properties
const TICK = { fill:"#7a9ab0", fontSize:10, fontFamily:"'Fira Code',monospace" };

const dashStyles = `
  .results-wrap { padding-bottom: 120px; animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1); }

  .topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 26px; flex-wrap: wrap; }

  .btn-back {
    display: flex; align-items: center; gap: 7px;
    background: var(--glass); border: 1px solid var(--glass-border);
    color: var(--text2);
    padding: 9px 16px; border-radius: var(--r-sm);
    font-family: var(--font-mono); font-size: 11px; cursor: pointer; transition: all 0.2s;
  }
  .btn-back:hover { border-color: rgba(255,255,255,0.15); color: var(--text); }

  .btn-pdf {
    display: flex; align-items: center; gap: 7px;
    background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25);
    color: var(--amber);
    padding: 9px 16px; border-radius: var(--r-sm);
    font-family: var(--font-mono); font-size: 11px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-pdf:hover { background: rgba(245,158,11,0.18); }
  .btn-pdf:disabled { opacity: 0.4; cursor: not-allowed; }

  /* FIX: section divider text readable */
  .sdiv {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--text3);
    letter-spacing: 0.15em; text-transform: uppercase;
    display: flex; align-items: center; gap: 12px;
    margin: 30px 0 14px;
  }
  .sdiv::before, .sdiv::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.06); }

  /* Bento grids */
  .bento3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .bento2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  @media(max-width:900px){ .bento3 { grid-template-columns: 1fr 1fr; } }
  @media(max-width:600px){ .bento3,.bento2 { grid-template-columns: 1fr; } }

  /* Glass card */
  .card {
    border-radius: var(--r); padding: 22px;
    background: var(--glass); border: 1px solid var(--glass-border);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    position: relative; overflow: hidden;
    transition: border-color 0.25s, transform 0.2s;
  }
  .card::before {
    content: ''; position: absolute; inset: 0; border-radius: inherit;
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 55%);
    pointer-events: none;
  }
  .card:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-1px); }
  .card.span2 { grid-column: span 2; }
  .card.span3 { grid-column: span 3; }
  @media(max-width:900px){ .card.span2 { grid-column: span 2; } .card.span3 { grid-column: span 2; } }
  @media(max-width:600px){ .card.span2,.card.span3 { grid-column: span 1; } }

  /* FIX: card-lbl was var(--text3)=invisible. Now readable */
  .card-lbl {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--text3);
    letter-spacing: 0.12em; text-transform: uppercase;
    margin-bottom: 16px; display: flex; align-items: center; gap: 7px;
  }

  /* FIX: dot had no default bg — now amber by default */
  .card-lbl-dot {
    width: 4px; height: 4px; border-radius: 50%;
    flex-shrink: 0; background: var(--amber);
  }

  /* Score hero */
  .score-card {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; min-height: 240px; text-align: center;
    transition: border-color 0.5s, box-shadow 0.5s;
  }
  .score-card.grade-A { border-color: rgba(245,158,11,0.35); box-shadow: 0 0 60px rgba(245,158,11,0.1); }
  .score-card.grade-B { border-color: rgba(6,182,212,0.3);   box-shadow: 0 0 60px rgba(6,182,212,0.08); }
  .score-card.grade-C { border-color: rgba(249,115,22,0.3);  box-shadow: 0 0 60px rgba(249,115,22,0.08); }
  .score-card.grade-D { border-color: rgba(244,63,94,0.3);   box-shadow: 0 0 60px rgba(244,63,94,0.08); }

  .score-ring-wrap {
    position: relative; width: 110px; height: 110px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .score-ring-wrap svg { position: absolute; inset: 0; transform: rotate(-90deg); }
  .score-ring-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 6; }
  .score-ring-fill {
    fill: none; stroke-width: 6; stroke-linecap: round;
    transition: stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1);
    filter: drop-shadow(0 0 8px currentColor);
  }

  /* FIX: score number explicit */
  .score-num {
    font-family: var(--font-mono); font-size: 30px; font-weight: 600;
    color: var(--text);
    line-height: 1; text-align: center; position: relative; z-index: 1;
  }
  .score-num span { font-size: 11px; color: var(--text3); font-weight: 400; display: block; margin-top: 2px; }

  .grade-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 20px;
    font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
  }
  .grade-pill.grade-A { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
  .grade-pill.grade-B { background: rgba(6,182,212,0.12);  color: #06b6d4; border: 1px solid rgba(6,182,212,0.25); }
  .grade-pill.grade-C { background: rgba(249,115,22,0.12); color: #f97316; border: 1px solid rgba(249,115,22,0.25); }
  .grade-pill.grade-D { background: rgba(244,63,94,0.12);  color: #f43f5e; border: 1px solid rgba(244,63,94,0.25); }

  /* FIX: company name + summary explicit */
  .company-name { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .hero-summary { font-size: 11px; color: var(--text2); line-height: 1.65; max-width: 200px; }

  /* Altman */
  .altman-score { font-family: var(--font-mono); font-size: 48px; font-weight: 600; line-height: 1; margin: 8px 0; }
  .altman-zone { font-family: var(--font-mono); font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 4px; display: inline-block; }
  .altman-bar { height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin: 16px 0 6px; }
  .altman-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #f43f5e, #f97316, #f59e0b); transition: width 1.5s cubic-bezier(0.22,1,0.36,1); }
  /* FIX: marker text */
  .altman-markers { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 9px; color: var(--text3); }

  /* Invest */
  .invest-big { font-family: var(--font-mono); font-size: 56px; font-weight: 600; line-height: 1; }
  .invest-bar { height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin: 12px 0 6px; }
  .invest-bar-fill { height: 100%; border-radius: 3px; transition: width 1.4s cubic-bezier(0.22,1,0.36,1); }
  /* FIX: verdict text explicit */
  .invest-verdict { font-size: 12px; color: var(--text2); line-height: 1.6; margin-top: 8px; }

  /* Metric tiles */
  .metrics-bento { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px,1fr)); gap: 10px; margin-bottom: 12px; }
  .metric-tile {
    background: var(--glass); border: 1px solid var(--glass-border);
    border-radius: var(--r-sm); padding: 16px 14px;
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .metric-tile:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-1px); }

  /* FIX: tile labels and sub all var(--text3) = readable */
  .mt-label { font-family: var(--font-mono); font-size: 9px; color: var(--text3); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
  .mt-value { font-family: var(--font-mono); font-size: 22px; font-weight: 600; line-height: 1; margin-bottom: 4px; }
  .mt-sub   { font-size: 10px; color: var(--text3); margin-bottom: 10px; }
  .mt-bar   { height: 2px; background: rgba(255,255,255,0.06); border-radius: 1px; overflow: hidden; }
  .mt-bar-fill { height: 100%; border-radius: 1px; transition: width 1s cubic-bezier(0.22,1,0.36,1); }

  /* SHAP */
  .shap-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  /* FIX: shap label explicit var(--text2) */
  .shap-lbl { font-family: var(--font-mono); font-size: 11px; color: var(--text2); width: 120px; flex-shrink: 0; text-align: right; }
  .shap-bar-area { flex: 1; height: 18px; position: relative; display: flex; align-items: center; }
  .shap-zero-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.08); }
  .shap-bar-pos { position: absolute; left: 50%; height: 12px; border-radius: 2px; background: linear-gradient(90deg, rgba(245,158,11,0.5), rgba(245,158,11,0.9)); }
  .shap-bar-neg { position: absolute; right: 50%; height: 12px; border-radius: 2px; background: linear-gradient(90deg, rgba(244,63,94,0.9), rgba(244,63,94,0.5)); }
  .shap-pts { font-family: var(--font-mono); font-size: 11px; width: 52px; flex-shrink: 0; text-align: right; }

  /* Insights */
  .insight-row {
    display: flex; gap: 12px; padding: 14px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04); align-items: flex-start;
  }
  .insight-row:last-child { border-bottom: none; padding-bottom: 0; }
  .insight-bar { width: 3px; border-radius: 2px; flex-shrink: 0; align-self: stretch; min-height: 36px; }
  /* FIX: insight text explicit */
  .insight-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
  .insight-text  { font-size: 12px; color: var(--text2); line-height: 1.6; }

  /* Groq badge */
  .groq-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(6,182,212,0.06); border: 1px solid rgba(6,182,212,0.2);
    border-radius: 20px; padding: 4px 12px;
    font-family: var(--font-mono); font-size: 10px;
    color: var(--cyan);
    letter-spacing: 0.06em; margin-bottom: 16px;
  }
  .groq-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--cyan); animation: pulse 1.5s infinite; }

  /* Benchmark */
  .bm-row { display: flex; align-items: center; gap: 6px; }
  /* FIX: bm-who explicit var(--text3) */
  .bm-who { font-family: var(--font-mono); font-size: 9px; color: var(--text3); width: 22px; flex-shrink: 0; }
  .bm-track { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
  .bm-fill { height: 100%; border-radius: 2px; transition: width 1s; }
  .bm-val { font-family: var(--font-mono); font-size: 9px; color: var(--text3); width: 28px; text-align: right; flex-shrink: 0; }
  .bm-status { font-family: var(--font-mono); font-size: 9px; padding: 2px 7px; border-radius: 3px; flex-shrink: 0; }
  .bm-better { background: rgba(245,158,11,0.1);  color: #f59e0b; }
  .bm-onpar  { background: rgba(6,182,212,0.1);   color: #06b6d4; }
  .bm-worse  { background: rgba(244,63,94,0.1);   color: #f43f5e; }
  /* FIX: benchmark name explicit */
  .benchmark-name { font-family: var(--font-mono); font-size: 11px; color: var(--text2); width: 120px; flex-shrink: 0; }
  .benchmark-bars-wrap { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 100px; }
  .benchmark-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
  /* FIX: industry label explicit */
  .bm-industry-label { font-size: 11px; color: var(--text3); margin-bottom: 14px; }

  /* Recommendations */
  .rec-item {
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
    border-left: 3px solid transparent; border-radius: var(--r-sm);
    padding: 14px; margin-bottom: 10px; transition: all 0.2s;
  }
  .rec-item:last-child { margin-bottom: 0; }
  .rec-item:hover { background: rgba(255,255,255,0.04); }
  .rec-item.high   { border-left-color: var(--rose); }
  .rec-item.medium { border-left-color: var(--orange); }
  .rec-item.low    { border-left-color: var(--amber); }
  .rec-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .rec-badge { font-family: var(--font-mono); font-size: 9px; padding: 2px 8px; border-radius: 3px; letter-spacing: 0.06em; font-weight: 600; flex-shrink: 0; }
  .rec-badge.high   { background: rgba(244,63,94,0.12);  color: var(--rose); }
  .rec-badge.medium { background: rgba(249,115,22,0.12); color: var(--orange); }
  .rec-badge.low    { background: rgba(245,158,11,0.12); color: var(--amber); }
  /* FIX: action + detail explicit */
  .rec-action { font-size: 13px; font-weight: 600; color: var(--text); }
  .rec-detail { font-size: 12px; color: var(--text2); line-height: 1.6; margin-bottom: 7px; }
  .rec-impact { font-family: var(--font-mono); font-size: 10px; color: var(--cyan); display: flex; align-items: center; gap: 5px; }
  .rec-impact::before { content: '→'; opacity: 0.5; }

  /* Simulator */
  .sim-panel {
    border-radius: var(--r); padding: 24px;
    background: linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(6,182,212,0.03) 100%);
    border: 1px solid rgba(124,58,237,0.2);
    backdrop-filter: blur(20px); margin-bottom: 12px; position: relative; overflow: hidden;
  }
  .sim-panel::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent);
  }
  .sim-title { font-family: var(--font-mono); font-size: 10px; color: #a78bfa; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 7px; }
  .sim-title-dot { width: 4px; height: 4px; border-radius: 50%; background: #a78bfa; box-shadow: 0 0 6px #a78bfa; }
  /* FIX: was var(--text3) old = invisible */
  .sim-subtitle { font-size: 12px; color: var(--text2); margin-bottom: 22px; }
  .sim-sliders { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 18px; }
  @media(max-width:700px){ .sim-sliders { grid-template-columns: 1fr; } }
  .sim-slider-item { display: flex; flex-direction: column; gap: 8px; }
  .sim-slider-header { display: flex; justify-content: space-between; align-items: center; }
  /* FIX: slider name text readable */
  .sim-slider-name { font-family: var(--font-mono); font-size: 10px; color: var(--text2); letter-spacing: 0.06em; text-transform: uppercase; }
  .sim-slider-val  { font-family: var(--font-mono); font-size: 18px; font-weight: 600; line-height: 1; }

  input[type="range"].slider {
    -webkit-appearance: none; width: 100%; height: 4px;
    background: rgba(255,255,255,0.06); border-radius: 2px; cursor: pointer; outline: none;
  }
  input[type="range"].slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
    background: #7c3aed; border: 2px solid rgba(255,255,255,0.2);
    box-shadow: 0 0 12px rgba(124,58,237,0.6); cursor: pointer; transition: transform 0.15s;
  }
  input[type="range"].slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
  input[type="range"].slider::-moz-range-thumb {
    width: 16px; height: 16px; border-radius: 50%;
    background: #7c3aed; border: 2px solid rgba(255,255,255,0.2); cursor: pointer;
  }
  /* FIX: slider ticks text readable */
  .slider-ticks { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 9px; color: var(--text3); margin-top: 2px; }
  .btn-sim {
    padding: 10px 24px;
    background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.1));
    border: 1px solid rgba(124,58,237,0.4); color: #c4b5fd;
    border-radius: var(--r-sm); font-family: var(--font-mono); font-size: 11px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .btn-sim:hover { background: rgba(124,58,237,0.28); box-shadow: 0 0 24px rgba(124,58,237,0.3); }
  .btn-sim:disabled { opacity: 0.4; cursor: not-allowed; }
  .sim-result {
    background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);
    border-radius: var(--r-sm); padding: 18px;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(120px,1fr));
    gap: 14px; margin-top: 14px;
  }
  .sim-stat { display: flex; flex-direction: column; gap: 4px; }
  /* FIX: stat label readable */
  .sim-stat-label { font-family: var(--font-mono); font-size: 9px; color: var(--text3); letter-spacing: 0.08em; text-transform: uppercase; }
  .sim-stat-value { font-family: var(--font-mono); font-size: 18px; font-weight: 600; color: #a5b4fc; }
  .sim-delta { font-family: var(--font-mono); font-size: 10px; }

  /* FIX: forecast note explicit */
  .forecast-note { font-family: var(--font-mono); font-size: 10px; color: var(--text3); margin-top: 10px; display: flex; gap: 12px; flex-wrap: wrap; }
  .forecast-note span { color: var(--orange); }

  /* Chat FAB */
  .chat-fab {
    position: fixed; bottom: 28px; right: 28px;
    width: 50px; height: 50px; border-radius: 50%;
    background: linear-gradient(135deg, var(--cyan) 0%, #0891b2 100%);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; box-shadow: 0 4px 24px rgba(6,182,212,0.4);
    transition: all 0.25s; z-index: 200;
  }
  .chat-fab:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(6,182,212,0.5); }

  .chat-panel {
    position: fixed; bottom: 90px; right: 28px;
    width: 350px; max-height: 490px;
    background: rgba(10,12,18,0.97);
    border: 1px solid rgba(6,182,212,0.2);
    border-radius: var(--r); backdrop-filter: blur(32px);
    display: flex; flex-direction: column; z-index: 200;
    box-shadow: 0 24px 60px rgba(0,0,0,0.6);
    animation: slideUp 0.25s cubic-bezier(0.22,1,0.36,1);
    overflow: hidden;
  }
  @media(max-width:480px){ .chat-panel { left:16px; right:16px; width:auto; bottom:80px; } }

  .chat-header {
    padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex; align-items: center; gap: 10px;
  }
  .chat-icon {
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3);
    display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
  }
  /* FIX: chat header text explicit */
  .chat-header-title { font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--text); }
  .chat-header-sub   { font-family: var(--font-mono); font-size: 10px; color: var(--text3); }
  .chat-close { margin-left: auto; background: none; border: none; color: var(--text3); cursor: pointer; font-size: 16px; padding: 4px; transition: color 0.2s; }
  .chat-close:hover { color: var(--text); }
  .chat-msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; max-height: 270px; }
  .chat-msg { padding: 10px 13px; border-radius: 10px; font-size: 12px; line-height: 1.6; max-width: 88%; }
  /* FIX: user msg explicit color */
  .chat-msg.user {
    background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15);
    color: var(--text);
    align-self: flex-end; font-family: var(--font-mono); font-size: 11px;
  }
  /* FIX: ai msg explicit color */
  .chat-msg.ai { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: var(--text2); align-self: flex-start; }
  .chat-msg.loading { opacity: 0.5; font-style: italic; font-family: var(--font-mono); font-size: 11px; color: var(--text3); }
  .chat-quick { display: flex; gap: 5px; flex-wrap: wrap; padding: 0 14px 10px; }
  /* FIX: quick btns explicit color */
  .chat-qbtn {
    padding: 4px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px; font-family: var(--font-mono); font-size: 10px;
    color: var(--text3);
    cursor: pointer; transition: all 0.2s;
  }
  .chat-qbtn:hover { border-color: var(--cyan); color: var(--cyan); }
  .chat-input-wrap { padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 8px; }
  /* FIX: input explicit color */
  .chat-input {
    flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    color: var(--text);
    padding: 9px 12px; border-radius: var(--r-xs);
    font-family: var(--font-mono); font-size: 12px; outline: none; transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: rgba(6,182,212,0.4); }
  /* FIX: placeholder was var(--text4) invisible → var(--text3) subtle */
  .chat-input::placeholder { color: var(--text3); opacity: 0.6; }
  /* FIX: send btn text explicit dark on cyan bg */
  .chat-send {
    padding: 9px 14px; background: var(--cyan); color: #0c0e14;
    border: none; border-radius: var(--r-xs); font-family: var(--font-mono);
    font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .chat-send:hover { background: #22d3ee; }
  .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Copy toast */
  .copy-toast {
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%) translateY(60px);
    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
    color: var(--emerald);
    padding: 10px 20px; border-radius: 30px;
    font-family: var(--font-mono); font-size: 12px;
    transition: all 0.3s ease; z-index: 300;
    opacity: 0; visibility: hidden; pointer-events: none;
  }
  .copy-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; visibility: visible; }
`;

// Benchmark rows
function BenchmarkRows({ benchmarks }) {
  if (!benchmarks) return null;
  const pct = (v, max) => Math.min(100, (v / Math.max(max, 0.01)) * 100);
  return (
    <>
      {Object.entries(benchmarks).map(([key, data]) => {
        const max = Math.max(data.yours, data.industry, 0.01) * 1.2;
        const st  = data.status?.replace("-","");
        return (
          <div className="benchmark-row" key={key}>
            <div className="benchmark-name">{BENCH_LABELS[key]||key}</div>
            <div className="benchmark-bars-wrap">
              <div className="bm-row">
                <div className="bm-who" style={{color:"#f59e0b"}}>You</div>
                <div className="bm-track"><div className="bm-fill" style={{width:pct(data.yours,max)+"%",background:"#f59e0b"}}/></div>
                <div className="bm-val">{data.yours}</div>
              </div>
              <div className="bm-row">
                <div className="bm-who">Avg</div>
                <div className="bm-track"><div className="bm-fill" style={{width:pct(data.industry,max)+"%",background:"rgba(255,255,255,0.18)"}}/></div>
                <div className="bm-val">{data.industry}</div>
              </div>
            </div>
            <div className={`bm-status ${st==="better"?"bm-better":st==="onpar"?"bm-onpar":"bm-worse"}`}>
              {st==="better"?"▲ BETTER":st==="onpar"?"≈ PAR":"▼ BELOW"}
            </div>
          </div>
        );
      })}
    </>
  );
}

// Scenario Simulator
function ScenarioSim({ originalResult, originalForm }) {
  const [sc, setSc] = useState({revenueChange:0,expenseChange:0,debtChange:0});
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/simulate`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          financialData:{
            companyName:        originalForm.companyName||"SME",
            industry:           originalForm.industry||"General",
            revenue:            parseFloat(originalForm.revenue)||0,
            prevRevenue:        parseFloat(originalForm.prevRevenue)||null,
            netProfit:          parseFloat(originalForm.netProfit)||0,
            totalAssets:        parseFloat(originalForm.totalAssets)||0,
            totalLiabilities:   parseFloat(originalForm.totalLiabilities)||0,
            currentAssets:      parseFloat(originalForm.currentAssets)||0,
            currentLiabilities: parseFloat(originalForm.currentLiabilities)||1,
            inventory:          parseFloat(originalForm.inventory)||0,
            operatingExpenses:  parseFloat(originalForm.operatingExpenses)||null,
          },
          scenarios: sc,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const delta = (nv, ov) => {
    const d = nv - ov;
    if (Math.abs(d) < 0.5) return null;
    return <span className="sim-delta" style={{color:d>0?"#f59e0b":"#f43f5e"}}>{d>0?"▲":"▼"}{Math.abs(d).toFixed(1)}</span>;
  };

  const sliderColors = {revenueChange:"#f59e0b", expenseChange:"#f97316", debtChange:"#f43f5e"};

  return (
    <div className="sim-panel">
      <div className="sim-title"><div className="sim-title-dot"/>SCENARIO SIMULATOR</div>
      <div className="sim-subtitle">Adjust levers to model how business changes affect your health score.</div>
      <div className="sim-sliders">
        {[{key:"revenueChange",label:"Revenue Delta"},{key:"expenseChange",label:"Expense Delta"},{key:"debtChange",label:"Debt Delta"}].map(({key,label}) => (
          <div className="sim-slider-item" key={key}>
            <div className="sim-slider-header">
              <span className="sim-slider-name">{label}</span>
              <span className="sim-slider-val" style={{color:sliderColors[key]}}>{sc[key]>0?"+":""}{sc[key]}%</span>
            </div>
            <input type="range" className="slider" min="-50" max="50" step="5"
              value={sc[key]} onChange={e => setSc(s => ({...s,[key]:parseInt(e.target.value)}))}
              style={{accentColor:sliderColors[key]}}
            />
            <div className="slider-ticks"><span>-50%</span><span>0</span><span>+50%</span></div>
          </div>
        ))}
      </div>
      <button className="btn-sim" onClick={run} disabled={loading}>{loading?"COMPUTING...":"▶ RUN SIMULATION"}</button>
      {simResult && (
        <div className="sim-result">
          {[
            {label:"Health Score", val:simResult.totalScore+"/100", old:originalResult.totalScore, cur:simResult.totalScore},
            {label:"Grade", val:simResult.grade, old:null, cur:null},
            {label:"Debt Ratio", val:simResult.metrics?.debtRatio, old:parseFloat(originalResult.metrics?.debtRatio), cur:parseFloat(simResult.metrics?.debtRatio)},
            {label:"Net Margin", val:simResult.metrics?.netProfitMargin, old:parseFloat(originalResult.metrics?.netProfitMargin), cur:parseFloat(simResult.metrics?.netProfitMargin)},
            {label:"Invest Score", val:simResult.investScore+"/100", old:originalResult.investScore, cur:simResult.investScore},
          ].map(({label,val,old,cur},i) => (
            <div className="sim-stat" key={i}>
              <div className="sim-stat-label">{label}</div>
              <div className="sim-stat-value">{val}</div>
              {old!==null && i===0 && delta(cur,old)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Chat Widget
function ChatWidget({ analysisContext, visible, onClose }) {
  const [messages, setMessages] = useState([{role:"ai",text:"Hi! I'm FinSight AI. Ask me anything about your financial health."}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const send = async (text) => {
    const msg = text||input.trim();
    if (!msg) return;
    setInput("");
    setMessages(m => [...m,{role:"user",text:msg}]);
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg,analysisContext})});
      const data = await res.json();
      setMessages(m => [...m,{role:"ai",text:data.answer||"Sorry, couldn't process that."}]);
    } catch(e) {
      setMessages(m => [...m,{role:"ai",text:"Connection error. Try again."}]);
    } finally { setLoading(false); }
    setTimeout(() => endRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };

  if (!visible) return null;
  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-icon">🤖</div>
        <div>
          <div className="chat-header-title">FinSight AI</div>
          <div className="chat-header-sub">Groq LLaMA · Real-time</div>
        </div>
        <button className="chat-close" onClick={onClose}>✕</button>
      </div>
      <div className="chat-msgs">
        {messages.map((m,i) => <div className={`chat-msg ${m.role}`} key={i}>{m.text}</div>)}
        {loading && <div className="chat-msg ai loading">Thinking...</div>}
        <div ref={endRef}/>
      </div>
      <div className="chat-quick">
        {["Why is my score this?","How to reduce debt?","Is my growth healthy?","What's my biggest risk?"].map((q,i) => (
          <button key={i} className="chat-qbtn" onClick={() => send(q)} disabled={loading}>{q}</button>
        ))}
      </div>
      <div className="chat-input-wrap">
        <input className="chat-input" placeholder="Ask about your finances..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter"&&!loading&&send()} disabled={loading}
        />
        <button className="chat-send" onClick={() => send()} disabled={loading||!input.trim()}>
          {loading?"...":"SEND"}
        </button>
      </div>
    </div>
  );
}

// Main
export default function ResultsDashboard({ result, animScore, form, inputMode, uploadState, yearlyData, downloading, onBack, onDownloadPDF }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const gColor = gradeCol(result.grade);
  const circumference = 2 * Math.PI * 52;
  const dashOffset    = circumference - (animScore/100) * circumference;

  const radarData = Object.entries(result.scores).map(([k,v]) => ({
    subject: k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase()),
    value: v, fullMark: 100,
  }));

  const barData = [
    {name:"Liquidity",score:result.scores.liquidity},
    {name:"Quick",    score:result.scores.quickRatio},
    {name:"Debt",     score:result.scores.debtHealth},
    {name:"Profit",   score:result.scores.profitability},
    {name:"Growth",   score:result.scores.growth},
    {name:"Efficiency",score:result.scores.efficiency},
  ];

  const maxShap = Math.max(...(result.shapValues||[]).map(s=>Math.abs(s.contribution)),1);

  const activeForm =
    inputMode==="upload"    && uploadState.extracted ? {...form,...uploadState.extracted} :
    inputMode==="multiyear" ? {...form,...yearlyData[yearlyData.length-1]} : form;

  const analysisCtx = {
    companyName:result.companyName||form.companyName, industry:result.industry||form.industry,
    totalScore:result.totalScore, grade:result.grade, riskLevel:result.riskLevel,
    investScore:result.investScore, metrics:result.metrics, altman:result.altman, summary:result.summary,
  };

  const copySummary = () => {
    const txt = `FinSight Report — ${result.companyName||form.companyName}\nScore: ${result.totalScore}/100 (Grade ${result.grade})\nRisk: ${result.riskLevel}\n\n${result.summary}`;
    navigator.clipboard.writeText(txt).then(() => { setCopyToast(true); setTimeout(()=>setCopyToast(false),2500); });
  };

  return (
    <>
      <style>{dashStyles}</style>
      <div className="results-wrap">
        <div className="topbar">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <button className="btn-pdf" onClick={onDownloadPDF} disabled={downloading}>{downloading?"Generating...":"↓ Download PDF"}</button>
          <button className="btn-back" style={{marginLeft:"auto"}} onClick={copySummary}>⧉ Copy Summary</button>
        </div>

        <div className="sdiv">Overview</div>
        <div className="bento3">
          <div className={`card score-card grade-${result.grade}`}>
            <div className="score-ring-wrap">
              <svg viewBox="0 0 120 120" width="110" height="110">
                <circle className="score-ring-track" cx="60" cy="60" r="52"/>
                <circle className="score-ring-fill" cx="60" cy="60" r="52"
                  stroke={gColor} strokeDasharray={circumference} strokeDashoffset={dashOffset}/>
              </svg>
              <div className="score-num">{animScore}<span>/100</span></div>
            </div>
            <div className="company-name">{result.companyName||form.companyName||"Company"}</div>
            <div className={`grade-pill grade-${result.grade}`}>GRADE {result.grade} · {result.riskLevel}</div>
            <p className="hero-summary">{result.summary}</p>
          </div>

          <div className="card">
            <div className="card-lbl"><div className="card-lbl-dot" style={{background:result.altman.zoneColor}}/>Altman Z-Score</div>
            <div className="altman-score" style={{color:result.altman.zoneColor}}>{result.altman.Z}</div>
            <div className="altman-zone" style={{background:result.altman.zoneColor+"22",color:result.altman.zoneColor}}>{result.altman.zone}</div>
            <div style={{marginTop:20}}>
              <div className="altman-bar"><div className="altman-bar-fill" style={{width:result.altman.percent+"%"}}/></div>
              <div className="altman-markers"><span>Distress</span><span>Grey</span><span>Safe</span></div>
            </div>
            <p style={{fontSize:11,color:"var(--text2)",lineHeight:1.6,marginTop:14}}>{result.bankruptcyRisk}</p>
          </div>

          <div className="card">
            <div className="card-lbl"><div className="card-lbl-dot" style={{background:"#f59e0b"}}/>Investment Score</div>
            <div className="invest-big" style={{color:result.investScore>=70?"#f59e0b":result.investScore>=50?"#06b6d4":"#f97316"}}>{result.investScore}</div>
            <div className="invest-bar">
              <div className="invest-bar-fill" style={{width:result.investScore+"%",background:result.investScore>=70?"#f59e0b":result.investScore>=50?"#06b6d4":"#f97316"}}/>
            </div>
            <div style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--font-mono)",marginBottom:8}}>out of 100</div>
            <p className="invest-verdict">{result.investmentVerdict||"Analysis based on computed financial metrics."}</p>
          </div>
        </div>

        <div className="sdiv">Financial Metrics</div>
        <div className="metrics-bento">
          {[
            {label:"Current Ratio",  value:result.metrics.currentRatio,    score:result.scores.liquidity,     sub:"Liquidity"},
            {label:"Quick Ratio",    value:result.metrics.quickRatio,      score:result.scores.quickRatio,    sub:"Acid Test"},
            {label:"Debt Ratio",     value:result.metrics.debtRatio,       score:result.scores.debtHealth,    sub:"Leverage"},
            {label:"Net Margin",     value:result.metrics.netProfitMargin, score:result.scores.profitability, sub:"Profitability"},
            {label:"Rev. Growth",    value:result.metrics.revenueGrowth,   score:result.scores.growth,        sub:"YoY"},
            {label:"Asset Turnover", value:result.metrics.assetTurnover,   score:result.scores.efficiency,    sub:"Efficiency"},
            {label:"EBITDA Margin",  value:result.metrics.ebitdaMargin,    score:Math.min(100,parseFloat(result.metrics.ebitdaMargin)||0), sub:"Operational"},
            {label:"Working Capital",value:result.metrics.workingCapital,  score:50, sub:"Buffer"},
            {label:"Monthly Burn",   value:result.metrics.burnRate,        score:50, sub:"Burn Rate"},
          ].map((m,i) => (
            <div className="metric-tile" key={i}>
              <div className="mt-label">{m.label}</div>
              <div className="mt-value" style={{color:barCol(m.score)}}>{m.value}</div>
              <div className="mt-sub">{m.sub}</div>
              <div className="mt-bar"><div className="mt-bar-fill" style={{width:m.score+"%",background:barCol(m.score)}}/></div>
            </div>
          ))}
        </div>

        <div className="sdiv">Score Analysis</div>
        <div className="bento3">
          <div className="card">
            <div className="card-lbl"><div className="card-lbl-dot"/>Radar Breakdown</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)"/>
                {/* FIX: explicit hex fill — SVG ignores CSS vars */}
                <PolarAngleAxis dataKey="subject" tick={TICK}/>
                <Radar dataKey="value" stroke={gColor} fill={gColor} fillOpacity={0.1} strokeWidth={2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-lbl"><div className="card-lbl-dot"/>Component Scores</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={24}>
                <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={TICK} axisLine={false} tickLine={false}/>
                {/* FIX: custom tooltip — no black text possible */}
                <Tooltip content={<CustomTooltip/>} cursor={{fill:"rgba(255,255,255,0.03)"}}/>
                <Bar dataKey="score" radius={[4,4,0,0]}>
                  {barData.map((e,i) => <Cell key={i} fill={barCol(e.score)}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-lbl"><div className="card-lbl-dot"/>SHAP Attribution</div>
            <p style={{fontSize:11,color:"var(--text3)",marginBottom:14,lineHeight:1.5}}>
              Score = {result.totalScore}/100. Factor impact vs baseline of 50pts.
            </p>
            {(result.shapValues||[]).map((sv,i) => {
              const isPos = sv.contribution>=0;
              const bw    = Math.abs(sv.contribution)/maxShap*50;
              return (
                <div className="shap-row" key={i}>
                  <div className="shap-lbl">{sv.label}</div>
                  <div className="shap-bar-area">
                    <div className="shap-zero-line"/>
                    {isPos ? <div className="shap-bar-pos" style={{width:bw+"%"}}/> : <div className="shap-bar-neg" style={{width:bw+"%"}}/>}
                  </div>
                  <div className="shap-pts" style={{color:isPos?"#f59e0b":"#f43f5e"}}>{isPos?"+":""}{sv.contribution}p</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sdiv">AI Insights & Benchmarking</div>
        <div className="bento2">
          <div className="card">
            <div className="groq-badge"><div className="groq-dot"/>GROQ LLAMA 3.3 70B · LIVE ANALYSIS</div>
            <div className="card-lbl"><div className="card-lbl-dot" style={{background:"#06b6d4"}}/>Explainable Insights</div>
            {(result.insights||[]).map((ins,i) => (
              <div className="insight-row" key={i}>
                <div className="insight-bar" style={{background:typeCol(ins.type)}}/>
                <div>
                  <div className="insight-title" style={{color:typeCol(ins.type)}}>{ins.title}</div>
                  <div className="insight-text">{ins.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-lbl"><div className="card-lbl-dot" style={{background:"#f97316"}}/>Industry Benchmark</div>
            <div className="bm-industry-label">vs {result.industry||form.industry} averages</div>
            <BenchmarkRows benchmarks={result.benchmarks}/>
          </div>
        </div>

        {result.forecastData?.length>0 && (
          <>
            <div className="sdiv">12-Month Forecast</div>
            <div className="card span3" style={{marginBottom:12}}>
              <div className="card-lbl"><div className="card-lbl-dot" style={{background:"#f97316"}}/>Health Score Trajectory</div>
              <div style={{fontSize:11,color:"var(--text3)",marginBottom:16}}>Historical + Groq-projected scores with confidence bands</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.forecastData} margin={{top:10,right:10,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="period" tick={TICK} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={TICK} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <ReferenceLine y={65} stroke="#06b6d4" strokeDasharray="4 4" strokeOpacity={0.3}/>
                  <ReferenceLine y={45} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.25}/>
                  <Area type="monotone" dataKey="confidence_hi" stroke="none" fill="url(#cg)"/>
                  <Area type="monotone" dataKey="confidence_lo" stroke="none" fill="transparent"/>
                  <Line type="monotone" dataKey="score" stroke={gColor} strokeWidth={2}
                    dot={(p) => {
                      const{cx,cy,payload,index}=p;
                      return payload.type==="forecast"
                        ?<circle key={index} cx={cx} cy={cy} r={3} fill="#f97316" stroke="#0c0e14" strokeWidth={1.5}/>
                        :<circle key={index} cx={cx} cy={cy} r={4} fill={gColor} stroke="#0c0e14" strokeWidth={1.5}/>;
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="forecast-note">
                <span style={{color:gColor}}>● Historical</span>
                <span>● <span>Groq Forecasted</span></span>
                <span style={{opacity:0.6}}>Shaded = confidence band</span>
              </div>
            </div>
          </>
        )}

        {result.recommendations?.length>0 && (
          <>
            <div className="sdiv">Actionable Recommendations</div>
            <div className="card" style={{marginBottom:12}}>
              <div className="card-lbl"><div className="card-lbl-dot" style={{background:"#f43f5e"}}/>Priority Actions</div>
              {result.recommendations.map((rec,i) => (
                <div className={`rec-item ${rec.priority}`} key={i}>
                  <div className="rec-header">
                    <span className={`rec-badge ${rec.priority}`}>{rec.priority?.toUpperCase()}</span>
                    <span className="rec-action">{rec.action}</span>
                  </div>
                  <p className="rec-detail">{rec.detail}</p>
                  <div className="rec-impact">{rec.impact}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="sdiv">Scenario Simulator</div>
        <ScenarioSim originalResult={result} originalForm={activeForm}/>
      </div>

      <ChatWidget analysisContext={analysisCtx} visible={chatOpen} onClose={() => setChatOpen(false)}/>
      <button className="chat-fab" onClick={() => setChatOpen(o=>!o)} title="Chat with your data">
        {chatOpen?"✕":"💬"}
      </button>
      <div className={`copy-toast ${copyToast?"show":""}`}>✓ Summary copied to clipboard</div>
    </>
  );
}
