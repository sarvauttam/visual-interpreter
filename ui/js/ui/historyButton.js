export function updateHistoryButtonState(dom, history) {
  dom.historyBtn?.classList.toggle("has-history", history.hasItems());
}