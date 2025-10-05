// script.js

// --- VARIABLES ---
const actorsList = document.getElementById("actorsList");
const playsGrid = document.getElementById("playsGrid");
const totalActorsElem = document.getElementById("totalActors");
const assignedCountElem = document.getElementById("assignedCount");

let actors = Array.from(actorsList.querySelectorAll(".actor-card"));

// --- FUNCIONES UTILES ---
function updateStats() {
    const total = actors.length;
    let assigned = 0;
    document.querySelectorAll(".drop-zone").forEach(zone => {
        assigned += zone.querySelectorAll(".assigned-actor").length;
    });
    totalActorsElem.textContent = total;
    assignedCountElem.textContent = assigned;
}

// --- DRAG & DROP ---
let draggedActor = null;

actorsList.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("actor-card")) {
        draggedActor = e.target;
        e.target.classList.add("dragging");
    }
});

actorsList.addEventListener("dragend", (e) => {
    if (e.target.classList.contains("actor-card")) {
        e.target.classList.remove("dragging");
        draggedActor = null;
    }
});

document.querySelectorAll(".drop-zone").forEach(zone => {
    zone.addEventListener("dragover", (e) => e.preventDefault());
    zone.addEventListener("dragenter", (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));

    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        if (!draggedActor) return;

        const assignedActors = zone.querySelector(".assigned-actors");
        const emptyState = zone.querySelector(".empty-state");
        const maxActors = parseInt(zone.dataset.maxActors);
        if (assignedActors.children.length >= maxActors) return alert("Esta obra ya está llena.");

        // Clonar el actor si viene de la lista principal
        const actorId = draggedActor.dataset.actorId;
        const actorClone = draggedActor.cloneNode(true);

        // Botón de eliminar dentro de obra
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-actor";
        removeBtn.innerHTML = "×";
        removeBtn.onclick = () => {
            assignedActors.removeChild(actorClone);
            updateStats();
        };
        actorClone.appendChild(removeBtn);
        actorClone.setAttribute("draggable", "false"); // no draggable dentro de obra

        assignedActors.appendChild(actorClone);
        emptyState.style.display = "none";
        updateStats();
    });
});

// --- PANEL DE CONTROL ---
function resetAssignments() {
    document.querySelectorAll(".drop-zone").forEach(zone => {
        const assignedActors = zone.querySelector(".assigned-actors");
        assignedActors.innerHTML = "";
        const emptyState = zone.querySelector(".empty-state");
        emptyState.style.display = "block";
    });
    updateStats();
}

function editActors() {
    if (!confirm("¿Seguro que querés eliminar un actor de la lista principal?")) return;

    const actorName = prompt("Ingresa el nombre exacto del actor a eliminar:");
    if (!actorName) return;

    const actorElem = actorsList.querySelector(`.actor-card .actor-name:contains('${actorName}')`);
    if (!actorElem) {
        alert("No se encontró el actor.");
        return;
    }

    const card = actorElem.closest(".actor-card");
    card.remove();
    actors = Array.from(actorsList.querySelectorAll(".actor-card"));
    updateStats();
}

function editPlays() {
    if (!confirm("¿Seguro que querés eliminar una obra?")) return;

    const playTitle = prompt("Ingresa el título exacto de la obra a eliminar:");
    if (!playTitle) return;

    let found = false;
    playsGrid.querySelectorAll(".play-card").forEach(card => {
        const titleElem = card.querySelector(".play-title");
        if (titleElem.textContent.trim() === playTitle.trim()) {
            card.remove();
            found = true;
        }
    });

    if (!found) alert("No se encontró la obra.");
    updateStats();
}

// --- AGREGAR ACTOR / OBRA ---
function addActor() {
    const name = prompt("Nombre del nuevo actor:");
    if (!name) return;

    const initials = name.split(" ").map(n => n[0].toUpperCase()).join("");
    const role = prompt("Rol del actor (Protagonista/Secundario/Reparto):") || "Reparto";

    const newActor = document.createElement("div");
    newActor.className = "actor-card";
    newActor.draggable = true;
    newActor.dataset.actorId = Date.now(); // id único

    newActor.innerHTML = `
        <div class="actor-avatar">${initials}</div>
        <div class="actor-info">
            <div class="actor-name">${name}</div>
            <div class="actor-role">${role}</div>
        </div>
    `;
    actorsList.appendChild(newActor);
    actors.push(newActor);

    // Agregar drag listeners al nuevo actor
    newActor.addEventListener("dragstart", (e) => {
        draggedActor = e.target;
        e.target.classList.add("dragging");
    });
    newActor.addEventListener("dragend", (e) => {
        e.target.classList.remove("dragging");
        draggedActor = null;
    });

    updateStats();
}

function addPlay() {
    const title = prompt("Título de la nueva obra:");
    if (!title) return;

    const maxActors = parseInt(prompt("Capacidad máxima de actores:", "3")) || 3;
    const playId = title.toLowerCase().replace(/\s+/g, "-");

    const playCard = document.createElement("div");
    playCard.className = "play-card";

    playCard.innerHTML = `
        <div class="play-header">
            <h3 class="play-title">${title}</h3>
            <div class="play-info">
                <span>Nuevo</span>
                <span class="capacity-badge" data-current="0" data-max="${maxActors}">0/${maxActors} actores</span>
            </div>
        </div>
        <div class="drop-zone" data-play-id="${playId}" data-max-actors="${maxActors}">
            <div class="assigned-actors" id="${playId}-actors"></div>
            <div class="empty-state">Arrastra actores aquí</div>
        </div>
    `;

    playsGrid.appendChild(playCard);

    // Agregar drag & drop listeners a la nueva obra
    const zone = playCard.querySelector(".drop-zone");
    zone.addEventListener("dragover", (e) => e.preventDefault());
    zone.addEventListener("dragenter", (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        if (!draggedActor) return;

        const assignedActors = zone.querySelector(".assigned-actors");
        const emptyState = zone.querySelector(".empty-state");
        if (assignedActors.children.length >= maxActors) return alert("Esta obra ya está llena.");

        const actorClone = draggedActor.cloneNode(true);
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-actor";
        removeBtn.innerHTML = "×";
        removeBtn.onclick = () => {
            assignedActors.removeChild(actorClone);
            updateStats();
        };
        actorClone.appendChild(removeBtn);
        actorClone.setAttribute("draggable", "false");

        assignedActors.appendChild(actorClone);
        emptyState.style.display = "none";
        updateStats();
    });
    updateStats();
}

// Inicializar estadísticas al cargar
updateStats();
