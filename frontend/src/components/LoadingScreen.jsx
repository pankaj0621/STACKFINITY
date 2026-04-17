// =============================================================================
//  LoadingScreen — Original theme, text fixed
//  FIX: loading-step was var(--text4)=#334155 — invisible → now var(--text3)
// =============================================================================

import { LOADING_STEPS } from "../utils/constants.js";

const loadingStyles = `
  .loading-wrap {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 60vh; gap: 28px;
  }

  .loader-ring {
    width: 60px; height: 60px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.05);
    border-top-color: var(--amber);
    animation: spin 0.9s linear infinite;
  }

  /* FIX: was defaulting to inherit — now explicit */
  .loading-title {
    font-family: var(--font-mono); font-size: 12px;
    color: var(--text2);
    letter-spacing: 0.12em; text-transform: uppercase;
  }

  .loading-steps { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }

  /* FIX: was var(--text4)=#334155 — nearly invisible on #0c0e14
     Now var(--text3)=#7a9ab0 which is clearly readable */
  .loading-step {
    font-family: var(--font-mono); font-size: 11px;
    color: var(--text3);
    letter-spacing: 0.05em; transition: color 0.4s;
    display: flex; align-items: center; gap: 10px;
  }

  .loading-step::before { content: '○'; font-size: 10px; }

  /* Active = cyan, clearly visible */
  .loading-step.active { color: var(--cyan); }
  .loading-step.active::before { content: '◉'; color: var(--cyan); }

  /* Done = amber, clearly visible */
  .loading-step.done { color: var(--amber); }
  .loading-step.done::before { content: '✓'; color: var(--amber); }
`;

export default function LoadingScreen({ loadingStep }) {
  return (
    <>
      <style>{loadingStyles}</style>
      <div className="loading-wrap">
        <div className="loader-ring"/>
        <div className="loading-title">Analyzing Financial Data</div>
        <div className="loading-steps">
          {LOADING_STEPS.map((s,i) => (
            <div key={i} className={`loading-step ${i<loadingStep?"done":i===loadingStep?"active":""}`}>
              {s}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
