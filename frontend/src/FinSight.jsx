// =============================================================================
//  FinSight v4 — Main Orchestrator
//  Original Deep Slate + Amber Gold theme
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";

import Header           from "./components/Header.jsx";
import AnalysisForm     from "./components/AnalysisForm.jsx";
import LoadingScreen    from "./components/LoadingScreen.jsx";
import ResultsDashboard from "./components/ResultsDashboard.jsx";
import { API_BASE, EMPTY_FORM, LOADING_STEPS } from "./utils/constants.js";
import "./styles/globals.css";

const shellStyles = `
  .app { min-height: 100vh; background: var(--bg); position: relative; overflow-x: clip; }

  .mesh-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 80% 60% at 70% -10%, rgba(124,58,237,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at -10% 80%, rgba(6,182,212,0.05) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 50% 50%, rgba(245,158,11,0.03) 0%, transparent 60%);
  }

  .noise {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.2;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
  }

  .page-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }
`;

export default function FinSight() {
  const [view,        setView]        = useState("form");
  const [inputMode,   setInputMode]   = useState("manual");
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [yearlyData,  setYearlyData]  = useState([{year:"2024",revenue:"",netProfit:"",totalAssets:"",totalLiabilities:"",currentAssets:"",currentLiabilities:"1",inventory:"",operatingExpenses:""}]);
  const [activeYear,  setActiveYear]  = useState(0);
  const [result,      setResult]      = useState(null);
  const [animScore,   setAnimScore]   = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [uploadState, setUploadState] = useState({status:"idle",progress:0,extracted:null});
  const [isDragOver,  setIsDragOver]  = useState(false);
  const [apiStatus,   setApiStatus]   = useState("checking");
  const [error,       setError]       = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.ok ? setApiStatus("ok") : setApiStatus("err"))
      .catch(() => setApiStatus("err"));
  }, []);

  useEffect(() => {
    if (view==="result" && result) {
      let s = 0; const end = result.totalScore;
      const step = () => { s+=2; setAnimScore(Math.min(s,end)); if(s<end) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
  }, [view, result]);

  const canAnalyze =
    inputMode==="upload"    ? uploadState.status==="done" :
    inputMode==="multiyear" ? yearlyData.some(y=>y.revenue) :
                              !!form.revenue && !!form.totalAssets;

  const getActiveForm = () =>
    inputMode==="upload" && uploadState.extracted ? {...form,...uploadState.extracted} :
    inputMode==="multiyear" ? {...form,...yearlyData[yearlyData.length-1]} : form;

  const analyze = async () => {
    setError(""); setView("loading"); setLoadingStep(0);
    const si = setInterval(() => setLoadingStep(p => Math.min(LOADING_STEPS.length-1,p+1)), 1200);
    const af = getActiveForm();
    if (parseFloat(af.revenue) < 0 || parseFloat(af.totalAssets) <= 0) {
      clearInterval(si);
      setError("Invalid Input: Revenue cannot be negative and Total Assets must be greater than zero.");
      setView("form"); return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          financialData:{
            companyName:af.companyName||"SME Company", industry:af.industry||"General",
            revenue:parseFloat(af.revenue)||0, prevRevenue:parseFloat(af.prevRevenue)||null,
            netProfit:parseFloat(af.netProfit)||0, totalAssets:parseFloat(af.totalAssets)||0,
            totalLiabilities:parseFloat(af.totalLiabilities)||0, currentAssets:parseFloat(af.currentAssets)||0,
            currentLiabilities:parseFloat(af.currentLiabilities)||1, inventory:parseFloat(af.inventory)||0,
            operatingExpenses:parseFloat(af.operatingExpenses)||null,
          },
          yearlyData: yearlyData.filter(y=>y.revenue).map(y=>({
            year:y.year, revenue:parseFloat(y.revenue)||0, netProfit:parseFloat(y.netProfit)||0,
            totalAssets:parseFloat(y.totalAssets)||0, totalLiabilities:parseFloat(y.totalLiabilities)||0,
            currentAssets:parseFloat(y.currentAssets)||0, currentLiabilities:parseFloat(y.currentLiabilities)||1,
            inventory:parseFloat(y.inventory)||0, operatingExpenses:parseFloat(y.operatingExpenses)||0,
          })),
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail||`Error ${res.status}`); }
      const data = await res.json();
      clearInterval(si);
      setResult(data); setAnimScore(0);
      setTimeout(() => setView("result"), 300);
    } catch(e) {
      clearInterval(si);
      setError(`Analysis failed: ${e.message}`);
      setView("form");
    }
  };

  const downloadPDF = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const af = getActiveForm();
      const response = await fetch(`${API_BASE}/api/generate-report`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          results:result,
          formData:{companyName:af.companyName||"SME", industry:af.industry||"General"},
          charts:{},
        }),
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href=url; a.download=`FinSight_Report_${af.companyName||"SME"}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch(e) { alert(`PDF error: ${e.message}`); }
    finally { setDownloading(false); }
  };

  return (
    <>
      <style>{shellStyles}</style>
      <div className="app">
        <div className="mesh-bg"/><div className="noise"/>
        <div className="page-wrap">
          <Header apiStatus={apiStatus}/>
          {view==="form" && (
            <AnalysisForm
              inputMode={inputMode} setInputMode={setInputMode}
              form={form} setForm={setForm}
              yearlyData={yearlyData} setYearlyData={setYearlyData}
              activeYear={activeYear} setActiveYear={setActiveYear}
              uploadState={uploadState} setUploadState={setUploadState}
              isDragOver={isDragOver} setIsDragOver={setIsDragOver}
              error={error} canAnalyze={canAnalyze}
              onAnalyze={analyze} setError={setError}
            />
          )}
          {view==="loading" && <LoadingScreen loadingStep={loadingStep}/>}
          {view==="result" && result && (
            <ResultsDashboard
              result={result} animScore={animScore}
              form={form} inputMode={inputMode}
              uploadState={uploadState} yearlyData={yearlyData}
              downloading={downloading}
              onBack={() => setView("form")}
              onDownloadPDF={downloadPDF}
            />
          )}
        </div>
      </div>
    </>
  );
}
