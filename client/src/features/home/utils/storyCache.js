export const CACHE_KEY = 'stories_cache';
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minuti

export const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { stories, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return stories;
  } catch {
    return null;
  }
};

export const writeCache = (stories) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ stories, timestamp: Date.now() }));
  } catch {
    // sessionStorage potrebbe essere disabilitato: ignoriamo silenziosamente
  }
};

export const getStoryColor = (id) => {
  const colors = ["bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-purple-200"];
  const sum = String(id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return colors[sum % colors.length];
};