// Data model provided by the user
window.defaultPlays = [
  { id: "mudanza", title: "Mudanza", maxActors: 2, info: "Obra 1", actores: ["Alan", "Ayelen"], genre: 'comedy'},
  { id: "monja", title: "Monja Sicaria", maxActors: 2, info: "Obra 2", actores: ["Alan", "Camila"], genre: 'drama'},
  { id: "fantasma", title: "Fantasma", maxActors: 2, info: "Obra 3", actores: ["Alan", "Juan Cruz"], genre: 'drama'},
  { id: "banco", title: "Robo al Banco", maxActors: 3, info: "Obra 4", actores: ["Alan", "Lorenzo", "Axel"], genre: 'comedy'},
  { id: "accidente", title: "Accidente", maxActors: 2, info: "Obra 5", actores: ["Alan", "Euge"], genre: 'drama'},
  { id: "director", title: "Director y Actrices", maxActors: 3, info: "Obra 6", actores: ["Juan Cruz", "Camila", "Guille"], genre: 'comedy'},
  { id: "cumple", title: "Cumpleaños Sorpresa", maxActors: 3, info: "Obra 7", actores: ["Ayelen", "Juan Cruz", "Guille"], genre: 'comedy'},
  { id: "interrogatorio", title: "Interrogatorio", maxActors: 2, info: "Obra 8", actores: ["Guille", "Lorenzo"], genre: 'drama'},
  { id: "herencia", title: "Herencia Nazi", maxActors: 3, info: "Obra 9", actores: ["Ayelen", "Camila", "Axel"], genre: 'drama'},
  { id: "companeros", title: "Compañeros de Trabajo", maxActors: 2, info: "Obra 10", actores: ["Juan Cruz", "Franco"], genre: 'comedy'},
  { id: "trencito", title: "Trencito de la Alegría", maxActors: 3, info: "Obra 11", actores: ["Franco", "Euge", "Lorenzo"], genre: 'comedy'},
  { id: "extraterrestres", title: "Extraterrestres", maxActors: 3, info: "Obra 12", actores: ["Franco", "Euge", "Lorenzo"], genre: 'drama'},
  { id: "confesion", title: "Confesión", maxActors: 2, info: "Obra 13", actores: ["Juan Cruz", "Guille"], genre: 'drama'},
  { id: "cita", title: "Cita a Ciegas", maxActors: 2, info: "Obra 14", actores: ["Euge", "Axel"], genre: 'comedy'}
];

window.defaultActors = Array.from(new Set(window.defaultPlays.flatMap(p => p.actores))).map((name, i) => ({
  id: i + 1, name, role: 'Actor'
}));
