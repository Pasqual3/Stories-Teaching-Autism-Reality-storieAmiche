// Hook helper: esegue una funzione quando il browser è idle (requestIdleCallback fallback)
export const runWhenIdle = (fn, options = {}) => {
  if (typeof window === 'undefined') return;
  const cb = () => {
    try {
      fn();
    } catch (e) {
      console.error('Idle callback error', e);
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(cb, options);
  } else {
    // Fallback: attendi un breve intervallo
    setTimeout(cb, options.timeout || 500);
  }
};

export default runWhenIdle;
