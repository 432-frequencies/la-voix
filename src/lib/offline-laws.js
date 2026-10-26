const KEY = "la-voix:saved-laws:v1";
const MAX_ITEMS = 20;
const MAX_TEXT_LENGTH = 100_000;

export function savedLaws() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function savedLaw(id) {
  return savedLaws().find((law) => law.id === id) || null;
}

export function saveLaw(law) {
  const snapshot = {
    id: law.id,
    title: law.title,
    description: law.description,
    full_text: String(law.full_text || "").slice(0, MAX_TEXT_LENGTH),
    truncated: String(law.full_text || "").length > MAX_TEXT_LENGTH,
    category: law.category,
    status: law.status,
    vote_date: law.vote_date,
    arguments_for: law.arguments_for || [],
    arguments_against: law.arguments_against || [],
    assembly_result: law.assembly_result,
    saved_at: new Date().toISOString(),
  };
  const next = [snapshot, ...savedLaws().filter((item) => item.id !== law.id)].slice(0, MAX_ITEMS);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function removeSavedLaw(id) {
  localStorage.setItem(KEY, JSON.stringify(savedLaws().filter((law) => law.id !== id)));
}
