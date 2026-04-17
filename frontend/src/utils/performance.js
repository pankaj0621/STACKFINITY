// =============================================================================
//  FinSight — Performance Utilities
//  GPU-optimized animation & interaction helpers
// =============================================================================

// ── CSS transition strings — specific properties ONLY (no "all") ─────────────
// "transition: all" forces browser to check every property on every frame.
// Specific properties let browser skip unchanged ones.
export const TRANSITION = {
  border:    "border-color 0.2s ease",
  transform: "transform 0.2s ease",
  opacity:   "opacity 0.2s ease",
  color:     "color 0.15s ease",
  bg:        "background-color 0.2s ease",
  // Combine specific ones
  hover:     "border-color 0.2s ease, transform 0.2s ease",
  button:    "background-color 0.15s ease, color 0.15s ease",
  full:      "border-color 0.2s ease, background-color 0.2s ease, color 0.15s ease",
};

// ── GPU-composited card hover style ─────────────────────────────────────────
// translateY using translate3d forces GPU layer — no main thread repaints
export const CARD_HOVER_STYLE = {
  base: {
    transform:  "translate3d(0,0,0)",      // GPU promote
    transition: TRANSITION.hover,
    willChange: "transform, border-color", // hint browser early
  },
  hover: {
    transform: "translate3d(0,-2px,0)",    // GPU move — no layout
  },
};

// ── Intersection Observer — animate only when visible ───────────────────────
// Cards outside viewport won't animate → saves GPU cycles
export const OBSERVE_OPTIONS = {
  threshold:   0.1,
  rootMargin: "0px 0px -40px 0px",
};

// ── Debounce — throttle expensive handlers ───────────────────────────────────
export function debounce(fn, delay = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── RAF wrapper — smooth state updates on next frame ────────────────────────
export function onNextFrame(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

// ── Smooth number counter — uses rAF not setInterval ────────────────────────
// setInterval causes jank when tab is inactive. rAF auto-pauses.
export function animateNumber(start, end, duration, onUpdate, onComplete) {
  const startTime = performance.now();
  const diff = end - start;

  function tick(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic — feels natural
    const eased = 1 - Math.pow(1 - progress, 3);
    onUpdate(Math.round(start + diff * eased));
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  }

  requestAnimationFrame(tick);
}
