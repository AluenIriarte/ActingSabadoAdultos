// Default actors with their information
const defaultActors = [
    { id: 1, name: "Ana Martínez", role: "Protagonista" },
    { id: 2, name: "Carlos García", role: "Secundario" },
    { id: 3, name: "Laura Rodríguez", role: "Protagonista" },
    { id: 4, name: "Miguel Fernández", role: "Reparto" },
    { id: 5, name: "Sofía Pérez", role: "Secundario" },
    { id: 6, name: "Javier López", role: "Reparto" }
];

// Default plays with their configurations
const defaultPlays = [
    { 
        id: "romeo",
        title: "Romeo y Julieta",
        maxActors: 3,
        info: "Acto I, Escena 1"
    },
    { 
        id: "hamlet",
        title: "Hamlet",
        maxActors: 4,
        info: "Acto II, Escena 2"
    },
    { 
        id: "bernarda",
        title: "La Casa de Bernarda Alba",
        maxActors: 2,
        info: "Acto I, Escena 3"
    },
    { 
        id: "donjuan",
        title: "Don Juan Tenorio",
        maxActors: 5,
        info: "Acto III, Escena 1"
    }
];

export { defaultActors, defaultPlays };