const STORAGE_KEY = "iseecode-history";
const MAX_HISTORY_ITEMS = 12;

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function truncatePreview(text, maxLength = 220) {
  const normalized = text.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

function createHistoryItem({ source, stdoutText, ok, errorText }) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    source,
    preview: truncatePreview(source),
    stdoutText: stdoutText || "",
    ok: Boolean(ok),
    errorText: errorText || "",
  };
}

export function createHistoryController() {
  function loadItems() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = safeJsonParse(raw, []);
    return Array.isArray(items) ? items : [];
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function getItems() {
    return loadItems();
  }

  function hasItems() {
    return loadItems().length > 0;
  }

  function saveRun(entry) {
    const items = loadItems();
    const nextItem = createHistoryItem(entry);

    const updated = [nextItem, ...items].slice(0, MAX_HISTORY_ITEMS);
    saveItems(updated);

    return nextItem;
  }

  function removeItem(id) {
    const items = loadItems();
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
    return updated;
  }

  function clearAll() {
    saveItems([]);
  }

  function getItem(id) {
    return loadItems().find((item) => item.id === id) || null;
  }

  function init() {
    return true;
  }

  return {
    init,
    getItems,
    getItem,
    hasItems,
    saveRun,
    removeItem,
    clearAll,
  };
}