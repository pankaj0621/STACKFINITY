// =============================================================================
//  AnalysisForm — Original Deep Slate + Amber theme
//  TEXT FIXES ONLY:
//  1. hero-tag: var(--text3) was #475569 invisible → now var(--text3)=#7a9ab0
//  2. hero h2 em: gradient text needs color fallback
//  3. hero-sub, form labels, demo-label: all explicit/var(--text2)/var(--text3)
//  4. input placeholder: was var(--text4) invisible → var(--text3) subtle
//  5. select option: needs explicit bg+color
//  6. upload zone p: explicit var(--text2)
//  7. upload-status: explicit var(--text2)
// =============================================================================

import { DEMOS, INDUSTRIES, API_BASE } from "../utils/constants.js";

const formStyles = `
  /* ── Hero ── */
  .hero { padding: 60px 0 40px; text-align: center; }

  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
    border-radius: 20px; padding: 5px 14px;
    font-family: var(--font-mono); font-size: 11px;
    color: var(--amber);
    letter-spacing: 0.06em; margin-bottom: 24px;
  }

  /* FIX: explicit color — never rely on body inherit inside styled component */
  .hero h2 {
    font-family: var(--font-display);
    font-size: clamp(32px, 5vw, 58px);
    font-weight: 800; line-height: 1.08;
    letter-spacing: -0.03em;
    color: var(--text);
    margin-bottom: 18px;
  }

  /* FIX: gradient text — add color fallback so it always shows even if
     -webkit-background-clip isn't supported */
  .hero h2 em {
    font-style: normal;
    color: var(--amber);  /* fallback — always visible */
    background: linear-gradient(135deg, #f59e0b 0%, #06b6d4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* FIX: explicit var(--text2) for readable subtitle */
  .hero-sub {
    font-size: 15px; color: var(--text2);
    max-width: 540px; margin: 0 auto; line-height: 1.75;
  }

  .hero-tags {
    display: flex; flex-wrap: wrap;
    gap: 8px; justify-content: center; margin-top: 20px;
  }

  /* FIX: was var(--text3)=#475569 — invisible on dark bg.
     Now var(--text3)=#7a9ab0 — clearly readable */
  .hero-tag {
    padding: 4px 12px;
    background: var(--glass); border: 1px solid var(--glass-border);
    border-radius: 20px;
    font-family: var(--font-mono); font-size: 10px;
    color: var(--text3);
    letter-spacing: 0.05em;
  }

  /* ── Mode tabs ── */
  .mode-tabs {
    display: flex; gap: 4px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--glass-border);
    border-radius: var(--r-sm); padding: 4px;
    margin-bottom: 24px; width: fit-content;
  }

  .mode-tab {
    padding: 8px 18px; border-radius: 7px;
    font-family: var(--font-mono); font-size: 11px;
    color: var(--text2);
    background: none; border: none; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.05em;
  }

  .mode-tab:hover { color: var(--text); }

  /* FIX: active tab bg is amber — text must be dark (#0c0e14) not white */
  .mode-tab.active {
    background: var(--amber);
    color: #0c0e14;
    font-weight: 700;
    box-shadow: 0 0 20px rgba(245,158,11,0.3);
  }

  /* ── Demo strip ── */
  .demo-strip {
    display: flex; gap: 8px; margin-bottom: 20px;
    align-items: center; flex-wrap: wrap;
  }

  /* FIX: was var(--text3) old value — now readable */
  .demo-label {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--text3);
    letter-spacing: 0.08em;
  }

  .demo-chip {
    padding: 5px 14px;
    background: var(--glass); border: 1px solid var(--glass-border);
    border-radius: 20px;
    font-family: var(--font-mono); font-size: 11px;
    color: var(--text2);
    cursor: pointer; transition: all 0.2s;
  }

  .demo-chip:hover {
    background: rgba(6,182,212,0.08);
    border-color: rgba(6,182,212,0.3);
    color: var(--cyan);
  }

  /* ── Form blocks ── */
  .form-block { margin-bottom: 20px; }

  .form-block-label {
    display: flex; align-items: center; gap: 10px;
    font-family: var(--font-mono); font-size: 10px;
    color: var(--cyan);
    letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px;
  }

  .form-block-label::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(6,182,212,0.25) 0%, transparent 100%);
  }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media(max-width:600px) { .form-grid { grid-template-columns: 1fr; } }

  .field { display: flex; flex-direction: column; gap: 6px; }

  /* FIX: labels were var(--text3) old = invisible */
  .field label {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--text3);
    letter-spacing: 0.07em; text-transform: uppercase;
  }

  /* FIX: explicit color on inputs — always show text clearly */
  .field input, .field select {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--text);
    padding: 11px 14px; border-radius: var(--r-sm);
    font-family: var(--font-mono); font-size: 13px;
    outline: none; transition: all 0.2s; -webkit-appearance: none;
  }

  .field input:focus, .field select:focus {
    border-color: rgba(245,158,11,0.4);
    background: rgba(245,158,11,0.03);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.06);
  }

  /* FIX: placeholder was var(--text4)=#334155 — invisible.
     Now var(--text3)=#7a9ab0 — subtly visible as expected for placeholder */
  .field input::placeholder { color: var(--text3); opacity: 0.6; }

  /* FIX: select dropdown options need explicit bg+color */
  .field select option { background: #141720; color: var(--text); }

  /* ── CTA ── */
  .btn-cta {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #0c0e14;
    border: none; border-radius: var(--r-sm);
    font-family: var(--font-display); font-size: 15px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.01em;
    transition: all 0.25s; margin-top: 8px;
    box-shadow: 0 0 30px rgba(245,158,11,0.25);
  }

  .btn-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(245,158,11,0.35); }
  .btn-cta:active { transform: translateY(0); }
  .btn-cta:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ── Error ── */
  .error-pill {
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.2);
    border-radius: var(--r-sm); padding: 12px 16px;
    font-family: var(--font-mono); font-size: 12px;
    color: var(--rose);
    margin-bottom: 20px;
  }

  /* ── Upload ── */
  .upload-zone {
    border: 2px dashed rgba(255,255,255,0.08); border-radius: var(--r);
    padding: 60px 40px; text-align: center; cursor: pointer;
    transition: all 0.3s; position: relative; overflow: hidden;
    background: rgba(255,255,255,0.015); margin-bottom: 20px;
  }

  .upload-zone:hover, .upload-zone.drag-over {
    border-color: rgba(245,158,11,0.35);
    background: rgba(245,158,11,0.025);
  }

  .upload-zone input[type="file"] {
    position: absolute; inset: 0; opacity: 0; cursor: pointer;
    width: 100%; height: 100%;
  }

  .upload-icon { font-size: 44px; margin-bottom: 16px; }

  /* FIX: explicit heading color */
  .upload-zone h3 {
    font-family: var(--font-display); font-size: 20px; font-weight: 700;
    margin-bottom: 8px; color: var(--text);
  }

  /* FIX: was defaulting to body color sometimes — explicit */
  .upload-zone p { color: var(--text2); font-size: 14px; }

  .upload-bar-track {
    height: 2px; background: rgba(255,255,255,0.06);
    border-radius: 1px; overflow: hidden; margin: 20px 0 8px;
  }

  .upload-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--amber), var(--cyan));
    border-radius: 1px; transition: width 0.3s;
  }

  /* FIX: explicit var(--text2) */
  .upload-status {
    font-family: var(--font-mono); font-size: 11px;
    color: var(--text2);
  }

  .extracted-preview {
    background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border);
    border-radius: var(--r-sm); padding: 18px; margin-top: 14px; text-align: left;
  }

  .extracted-title {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--cyan);
    letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px;
  }

  .extracted-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

  .extracted-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px;
  }

  .extracted-item:last-child { border-bottom: none; }
  /* FIX: extracted key explicit var(--text3) */
  .extracted-key { color: var(--text3); font-family: var(--font-mono); font-size: 10px; }
  .extracted-val { color: var(--amber); font-family: var(--font-mono); font-size: 11px; font-weight: 500; }

  /* ── Year tabs ── */
  .year-tabs { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }

  .year-tab {
    padding: 6px 14px; background: var(--glass); border: 1px solid var(--glass-border);
    border-radius: 20px; font-family: var(--font-mono); font-size: 11px;
    color: var(--text2);
    cursor: pointer; transition: all 0.2s;
  }

  .year-tab.active {
    background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.35);
    color: var(--amber);
  }

  .add-year-btn {
    padding: 6px 14px; background: none;
    border: 1px dashed rgba(255,255,255,0.1); border-radius: 20px;
    font-family: var(--font-mono); font-size: 11px;
    color: var(--text3);
    cursor: pointer; transition: all 0.2s;
  }

  .add-year-btn:hover { border-color: var(--cyan); color: var(--cyan); }

  .form-wrap { padding-bottom: 80px; }
`;

export default function AnalysisForm({
  inputMode, setInputMode, form, setForm,
  yearlyData, setYearlyData, activeYear, setActiveYear,
  uploadState, setUploadState, isDragOver, setIsDragOver,
  error, canAnalyze, onAnalyze, setError,
}) {
  const set          = (k,v) => setForm(f => ({...f,[k]:v}));
  const setYearField = (idx,k,v) => setYearlyData(p => p.map((y,i) => i===idx ? {...y,[k]:v} : y));

  const addYear = () => {
    const last = yearlyData[yearlyData.length-1];
    const ni   = yearlyData.length;
    setYearlyData(p => [...p,{year:String((parseInt(last.year)||2024)+1),revenue:"",netProfit:"",totalAssets:"",totalLiabilities:"",currentAssets:"",currentLiabilities:"1",inventory:"",operatingExpenses:""}]);
    setActiveYear(ni);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadState({status:"processing",progress:10,extracted:null});
    const tick = setInterval(() => setUploadState(p => ({...p,progress:Math.min(88,p.progress+14)})),200);
    try {
      const fd  = new FormData(); fd.append("file",file);
      const res = await fetch(`${API_BASE}/api/extract-document`,{method:"POST",body:fd});
      const data = await res.json();
      clearInterval(tick);
      if (!res.ok) throw new Error(data.detail||"Extraction failed");
      setUploadState({status:"done",progress:100,extracted:data.data});
      setForm(f => ({...f,...data.data}));
    } catch(e) {
      clearInterval(tick);
      setUploadState({status:"error",progress:0,extracted:null});
      setError(`Extraction failed: ${e.message}`);
    }
  };

  return (
    <>
      <style>{formStyles}</style>
      <div className="hero">
        <div className="hero-eyebrow">⬡ Powered by Groq LLaMA 3.3 70B</div>
        <h2>AI-Powered Financial<br/><em>Health Scoring</em> for SMEs</h2>
        <p className="hero-sub">Upload financial statements or enter data manually. Get instant AI insights, Altman Z-Score, SHAP explainability & 12-month forecasting.</p>
        <div className="hero-tags">
          {["Altman Z-Score","SHAP Explainability","Industry Benchmarks","Scenario Simulation","12-Month Forecast","AI Chat"].map(t=>(
            <span className="hero-tag" key={t}>{t}</span>
          ))}
        </div>
      </div>

      <div className="form-wrap">
        {error && <div className="error-pill">⚠ {error}</div>}
        <div className="mode-tabs">
          {[["manual","Manual Entry"],["upload","Upload Doc"],["multiyear","Multi-Year"]].map(([m,l]) => (
            <button key={m} className={`mode-tab ${inputMode===m?"active":""}`} onClick={() => setInputMode(m)}>{l}</button>
          ))}
        </div>
        <div className="demo-strip">
          <span className="demo-label">Try demo:</span>
          {Object.keys(DEMOS).map(k => (
            <button key={k} className="demo-chip" onClick={() => { setForm(DEMOS[k]); setInputMode("manual"); }}>{k}</button>
          ))}
        </div>

        {inputMode==="upload" && (
          <>
            <div
              className={`upload-zone ${isDragOver?"drag-over":""}`}
              onDragOver={e=>{e.preventDefault();setIsDragOver(true);}}
              onDragLeave={()=>setIsDragOver(false)}
              onDrop={e=>{e.preventDefault();setIsDragOver(false);const f=e.dataTransfer.files[0];if(f)handleFileUpload(f);}}
            >
              <input type="file" accept=".pdf,.xlsx,.xls,.csv" onChange={e=>handleFileUpload(e.target.files[0])}/>
              <div className="upload-icon">📄</div>
              <h3>Upload Financial Statement</h3>
              <p>PDF, Excel, or CSV — AI extracts data automatically</p>
              {uploadState.status!=="idle" && (
                <div style={{marginTop:20}}>
                  <div className="upload-bar-track"><div className="upload-bar-fill" style={{width:uploadState.progress+"%"}}/></div>
                  <div className="upload-status">
                    {uploadState.status==="processing" ? "Extracting with AI..." :
                     uploadState.status==="done" ? `✓ Extracted ${uploadState.extracted?.fieldsExtracted||0} fields (${uploadState.extracted?.confidence||0}% confidence)` :
                     uploadState.status==="error" ? "✗ Extraction failed" : ""}
                  </div>
                </div>
              )}
            </div>
            {uploadState.extracted && (
              <div className="extracted-preview">
                <div className="extracted-title">Extracted Data</div>
                <div className="extracted-grid">
                  {Object.entries(uploadState.extracted)
                    .filter(([k]) => !["confidence","fieldsExtracted"].includes(k))
                    .map(([k,v]) => (
                      <div className="extracted-item" key={k}>
                        <span className="extracted-key">{k}</span>
                        <span className="extracted-val">{typeof v==="number" ? v.toLocaleString() : String(v)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {inputMode==="manual" && (
          <>
            <div className="form-block">
              <div className="form-block-label">Company Info</div>
              <div className="form-grid">
                <div className="field"><label>Company Name</label><input placeholder="e.g. Acme Pvt Ltd" value={form.companyName} onChange={e=>set("companyName",e.target.value)}/></div>
                <div className="field"><label>Industry</label><select value={form.industry} onChange={e=>set("industry",e.target.value)}>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></div>
              </div>
            </div>
            <div className="form-block">
              <div className="form-block-label">Income Statement (₹)</div>
              <div className="form-grid">
                <div className="field"><label>Revenue (Current Year)</label><input type="number" placeholder="5000000" value={form.revenue} onChange={e=>set("revenue",e.target.value)}/></div>
                <div className="field"><label>Revenue (Previous Year)</label><input type="number" placeholder="4200000" value={form.prevRevenue} onChange={e=>set("prevRevenue",e.target.value)}/></div>
                <div className="field"><label>Net Profit / Loss</label><input type="number" placeholder="750000" value={form.netProfit} onChange={e=>set("netProfit",e.target.value)}/></div>
                <div className="field"><label>Operating Expenses</label><input type="number" placeholder="3800000" value={form.operatingExpenses} onChange={e=>set("operatingExpenses",e.target.value)}/></div>
              </div>
            </div>
            <div className="form-block">
              <div className="form-block-label">Balance Sheet (₹)</div>
              <div className="form-grid">
                <div className="field"><label>Total Assets</label><input type="number" placeholder="8000000" value={form.totalAssets} onChange={e=>set("totalAssets",e.target.value)}/></div>
                <div className="field"><label>Total Liabilities</label><input type="number" placeholder="2400000" value={form.totalLiabilities} onChange={e=>set("totalLiabilities",e.target.value)}/></div>
                <div className="field"><label>Current Assets</label><input type="number" placeholder="3200000" value={form.currentAssets} onChange={e=>set("currentAssets",e.target.value)}/></div>
                <div className="field"><label>Current Liabilities</label><input type="number" placeholder="1500000" value={form.currentLiabilities} onChange={e=>set("currentLiabilities",e.target.value)}/></div>
                <div className="field"><label>Inventory</label><input type="number" placeholder="400000" value={form.inventory} onChange={e=>set("inventory",e.target.value)}/></div>
              </div>
            </div>
          </>
        )}

        {inputMode==="multiyear" && (
          <>
            <div className="form-block">
              <div className="form-block-label">Company Info</div>
              <div className="form-grid">
                <div className="field"><label>Company Name</label><input placeholder="Acme Pvt Ltd" value={form.companyName} onChange={e=>set("companyName",e.target.value)}/></div>
                <div className="field"><label>Industry</label><select value={form.industry} onChange={e=>set("industry",e.target.value)}>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></div>
              </div>
            </div>
            <div className="form-block">
              <div className="form-block-label">Yearly Data</div>
              <div className="year-tabs">
                {yearlyData.map((y,i) => (
                  <button key={i} className={`year-tab ${activeYear===i?"active":""}`} onClick={() => setActiveYear(i)}>FY {y.year}</button>
                ))}
                <button className="add-year-btn" onClick={addYear}>+ Add Year</button>
              </div>
              {yearlyData.map((y,i) => i!==activeYear ? null : (
                <div className="form-grid" key={i}>
                  <div className="field"><label>Year</label><input placeholder="2024" value={y.year} onChange={e=>setYearField(i,"year",e.target.value)}/></div>
                  <div className="field"><label>Revenue</label><input type="number" value={y.revenue} onChange={e=>setYearField(i,"revenue",e.target.value)}/></div>
                  <div className="field"><label>Net Profit</label><input type="number" value={y.netProfit} onChange={e=>setYearField(i,"netProfit",e.target.value)}/></div>
                  <div className="field"><label>Total Assets</label><input type="number" value={y.totalAssets} onChange={e=>setYearField(i,"totalAssets",e.target.value)}/></div>
                  <div className="field"><label>Total Liabilities</label><input type="number" value={y.totalLiabilities} onChange={e=>setYearField(i,"totalLiabilities",e.target.value)}/></div>
                  <div className="field"><label>Current Assets</label><input type="number" value={y.currentAssets} onChange={e=>setYearField(i,"currentAssets",e.target.value)}/></div>
                  <div className="field"><label>Current Liabilities</label><input type="number" value={y.currentLiabilities} onChange={e=>setYearField(i,"currentLiabilities",e.target.value)}/></div>
                  <div className="field"><label>Inventory</label><input type="number" value={y.inventory} onChange={e=>setYearField(i,"inventory",e.target.value)}/></div>
                  <div className="field"><label>Operating Expenses</label><input type="number" value={y.operatingExpenses} onChange={e=>setYearField(i,"operatingExpenses",e.target.value)}/></div>
                </div>
              ))}
            </div>
          </>
        )}

        <button className="btn-cta" onClick={onAnalyze} disabled={!canAnalyze}>
          Analyze Financial Health →
        </button>
      </div>
    </>
  );
}
