// Ordre politique gauche -> droite des groupes de l'Assemblée nationale,
// avec couleur de famille politique et camp d'appartenance.
export const GROUP_ORDER = [
  { groupe: "Gauche Démocrate et Républicaine", color: "#c53030", family: "Gauche" },
  { groupe: "La France insoumise - Nouveau Front Populaire", color: "#ef4444", family: "Gauche" },
  { groupe: "Socialistes et apparentés", color: "#f472b6", family: "Gauche" },
  { groupe: "Écologiste et Social", color: "#34d399", family: "Gauche" },
  { groupe: "Libertés, Indépendants, Outre-mer et Territoires", color: "#94a3b8", family: "Centre" },
  { groupe: "Les Démocrates", color: "#fb923c", family: "Centre" },
  { groupe: "Ensemble pour la République", color: "#fbbf24", family: "Centre" },
  { groupe: "Horizons & Indépendants", color: "#38bdf8", family: "Droite" },
  { groupe: "Droite Républicaine", color: "#3b82f6", family: "Droite" },
  { groupe: "Union des droites pour la République", color: "#1e40af", family: "Droite" },
  { groupe: "Rassemblement National", color: "#4a5fb0", family: "Droite" },
  { groupe: "Députés non inscrits", color: "#6b7280", family: "—" },
];

export const SHORT_NAMES = {
  "Rassemblement National": "RN",
  "Ensemble pour la République": "EPR",
  "La France insoumise - Nouveau Front Populaire": "LFI-NFP",
  "Socialistes et apparentés": "SOC",
  "Droite Républicaine": "DR",
  "Écologiste et Social": "ECOS",
  "Les Démocrates": "DÉM",
  "Horizons & Indépendants": "HOR",
  "Libertés, Indépendants, Outre-mer et Territoires": "LIOT",
  "Gauche Démocrate et Républicaine": "GDR",
  "Union des droites pour la République": "UDR",
  "Députés non inscrits": "NI",
};