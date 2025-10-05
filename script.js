// =====================================
// Variables globales
// =====================================
let draggedActor = null;
let assignments = {};
let actorCounter = 6;  // número inicial de actores
let playCounter = 4;   // número inicial de obras

// =====================================
// Inicialización
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos guardados si existen
    loadFromLocalStorage();
    initializeDragAndDrop();
    updateStats();
});

// =====================================
// Drag & Drop
// =====================================
function initializeDragAndDrop() {
    const actors = document.querySelectorAll('.actor-card');
    actors.forEach(actor => {
        actor.addEventListener('dragstart', handleDragStart);
        actor.addEventListener('dragend', handleDragEnd);
    });

    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragenter', handleDragEnter);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });

    const actorsList = document.getElementById('actorsList');
    actorsList.addEventListener('dragover', handleDragOver);
    actorsList.addEventListener('drop', handleReturnActor);
}

function handleDragStart(e) {
    draggedActor = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedActor = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('drop-zone')) {
        const maxActors = parseInt(e.target.dataset.maxActors);
        const currentActors = e.target.querySelectorAll('.assigned-actor').length;
        if (currentActors < maxActors) e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('drop-zone')) {
        e.target.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedActor) return;
    const dropZone = e.target.closest('.drop-zone');
    if (!dropZone) return;
    dropZone.classList.remove('drag-over');

    const playId = dropZone.dataset.playId;
    const maxActors = parseInt(dropZone.dataset.maxActors);
    const currentActors = dropZone.querySelectorAll('.assigned-actor').length;

    if (currentActors >= maxActors) return;

    const actorId = draggedActor.dataset.actorId;
    const actorName = draggedActor.querySelector('.actor-name').textContent;

    removeActorFromAllPlays(actorId);
    assignActorToPlay(actorId, actorName, playId);
    draggedActor.style.display = 'none';
    saveToLocalStorage();
    updateStats();
}

function handleReturnActor(e) {
    e.preventDefault();
    if (!draggedActor) return;

    const actorId = draggedActor.dataset.actorId;

    if (draggedActor.classList.contains('assigned-actor')) {
        removeActorFromAllPlays(actorId);
        const originalActor = document.querySelector(`[data-actor-id="${actorId}"]`);
        if (originalActor) originalActor.style.display = 'flex';
        saveToLocalStorage();
        updateStats();
    }
}

// =====================================
// Asignaciones
// =====================================
function assignActorToPlay(actorId, actorName, playId) {
    const assignedActorsContainer = document.getElementById(`${playId}-actors`);
    const emptyState = assignedActorsContainer.parentElement.querySelector('.empty-state');

    const assignedActor = document.createElement('div');
    assignedActor.className = 'assigned-actor';
    assignedActor.draggable = true;
    assignedActor.dataset.actorId = actorId;
    assignedActor.innerHTML = `
        <span>${actorName}</span>
        <button class="remove-actor" onclick="removeActor('${actorId}', '${playId}')">×</button>
    `;

    assignedActor.addEventListener('dragstart', handleDragStart);
    assignedActor.addEventListener('dragend', handleDragEnd);

    assignedActorsContainer.appendChild(assignedActor);

    if (emptyState) emptyState.style.display = 'none';

    updatePlayCapacity(playId);
    assignments[actorId] = playId;
}

function removeActor(actorId, playId) {
    removeActorFromAllPlays(actorId);
    const originalActor = document.querySelector(`[data-actor-id="${actorId}"]`);
    if (originalActor) originalActor.style.display = 'flex';
    saveToLocalStorage();
    updateStats();
}

function removeActorFromAllPlays(actorId) {
    const assignedActor = document.querySelector(`.assigned-actor[data-actor-id="${actorId}"]`);
    if (assignedActor) {
        const playContainer = assignedActor.closest('.drop-zone');
        const playId = playContainer.dataset.playId;

        assignedActor.remove();

        const assignedActorsContainer = document.getElementById(`${playId}-actors`);
        const emptyState = assignedActorsContainer.parentElement.querySelector('.empty-state');
        if (assignedActorsContainer.children.length === 0 && emptyState) emptyState.style.display = 'block';

        updatePlayCapacity(playId);
        delete assignments[actorId];
    }
}

// =====================================
// Actualización de UI
// =====================================
function updatePlayCapacity(playId) {
    const dropZone = document.querySelector(`[data-play-id="${playId}"]`);
    const maxActors = parseInt(dropZone.dataset.maxActors);
    const currentActors = dropZone.querySelectorAll('.assigned-actor').length;

    const capacityBadge = dropZone.parentElement.querySelector('.capacity-badge');
    capacityBadge.textContent = `${currentActors}/${maxActors} actores`;
    capacityBadge.dataset.current = currentActors;

    if (currentActors >= maxActors) {
        capacityBadge.classList.add('full');
        dropZone.classList.add('full');
    } else {
        capacityBadge.classList.remove('full');
        dropZone.classList.remove('full');
    }
}

function updateStats() {
    const totalActors = document.querySelectorAll('.actor-card').length;
    const assignedActors = Object.keys(assignments).length;

    document.getElementById('totalActors').textContent = totalActors;
    document.getElementById('assignedCount').textContent = assignedActors;
}

// =====================================
// Agregar dinámicamente
// =====================================
function addActor() {
    actorCounter++;
    const actorsList = document.getElementById('actorsList');

    const actorName = prompt('Nombre del actor:');
    if (!actorName) return;
    const actorRole = prompt('Rol del actor:') || 'Reparto';

    const initials = actorName.split(' ').map(n => n[0]).join('').toUpperCase();

    const actorCard = document.createElement('div');
    actorCard.className = 'actor-card';
    actorCard.draggable = true;
    actorCard.dataset.actorId = actorCounter;
    actorCard.innerHTML = `
        <div class="actor-avatar">${initials}</div>
        <div class="actor-info">
            <div class="actor-name">${actorName}</div>
            <div class="actor-role">${actorRole}</div>
        </div>
    `;

    actorsList.appendChild(actorCard);
    actorCard.addEventListener('dragstart', handleDragStart);
    actorCard.addEventListener('dragend', handleDragEnd);
    saveToLocalStorage();
    updateStats();
}

function addPlay() {
    playCounter++;
    const playsGrid = document.getElementById('playsGrid');

    const playName = prompt('Nombre de la obra:');
    if (!playName) return;
    const maxActors = parseInt(prompt('Cantidad máxima de actores:', '3')) || 3;

    const playId = `play-${playCounter}`;

    const playCard = document.createElement('div');
    playCard.className = 'play-card';
    playCard.innerHTML = `
        <div class="play-header">
            <h3 class="play-title">${playName}</h3>
            <div class="play-info">
                <span>Escena 1</span>
                <span class="capacity-badge" data-current="0" data-max="${maxActors}">0/${maxActors} actores</span>
            </div>
        </div>
        <div class="drop-zone" data-play-id="${playId}" data-max-actors="${maxActors}">
            <div class="assigned-actors" id="${playId}-actors"></div>
            <div class="empty-state">Arrastra actores aquí</div>
        </div>
    `;
    playsGrid.appendChild(playCard);

    const dropZone = playCard.querySelector('.drop-zone');
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    saveToLocalStorage();
}

// =====================================
// Persistencia
// =====================================
function saveToLocalStorage() {
    const actorCards = document.querySelectorAll('.actor-card');
    const actorsData = Array.from(actorCards).map(actor => ({
        id: actor.dataset.actorId,
        name: actor.querySelector('.actor-name').textContent,
        role: actor.querySelector('.actor-role').textContent,
        visible: actor.style.display !== 'none'
    }));

    const plays = document.querySelectorAll('.play-card');
    const playsData = Array.from(plays).map(play => {
        const dropZone = play.querySelector('.drop-zone');
        const assignedActors = Array.from(dropZone.querySelectorAll('.assigned-actor')).map(a => a.dataset.actorId);
        return {
            playId: dropZone.dataset.playId,
            title: play.querySelector('.play-title').textContent,
            max: dropZone.dataset.maxActors,
            assignedActors
        };
    });

    localStorage.setItem('actorsData', JSON.stringify(actorsData));
    localStorage.setItem('playsData', JSON.stringify(playsData));
}

function loadFromLocalStorage() {
    const actorsData = JSON.parse(localStorage.getItem('actorsData') || '[]');
    const playsData = JSON.parse(localStorage.getItem('playsData') || '[]');

    // Cargar actores
    actorsData.forEach(actor => {
        let actorCard = document.querySelector(`.actor-card[data-actor-id="${actor.id}"]`);
        if (!actorCard) {
            actorCard = document.createElement('div');
            actorCard.className = 'actor-card';
            actorCard.draggable = true;
            actorCard.dataset.actorId = actor.id;
            const initials = actor.name.split(' ').map(n => n[0]).join('').toUpperCase();
            actorCard.innerHTML = `
                <div class="actor-avatar">${initials}</div>
                <div class="actor-info">
                    <div class="actor-name">${actor.name}</div>
                    <div class="actor-role">${actor.role}</div>
                </div>
            `;
            document.getElementById('actorsList').appendChild(actorCard);
            actorCard.addEventListener('dragstart', handleDragStart);
            actorCard.addEventListener('dragend', handleDragEnd);
        }
        actorCard.style.display = actor.visible ? 'flex' : 'none';
        actorCounter = Math.max(actorCounter, parseInt(actor.id));
    });

    // Cargar obras y asignaciones
    playsData.forEach(play => {
        let dropZone = document.querySelector(`.drop-zone[data-play-id="${play.playId}"]`);
        if (!dropZone) {
            const playsGrid = document.getElementById('playsGrid');
            const playCard = document.createElement('div');
            playCard.className = 'play-card';
            playCard.innerHTML = `
                <div class="play-header">
                    <h3 class="play-title">${play.title}</h3>
                    <div class="play-info">
                        <span>Escena 1</span>
                        <span class="capacity-badge" data-current="0" data-max="${play.max}">0/${play.max} actores</span>
                    </div>
                </div>
                <div class="drop-zone" data-play-id="${play.playId}" data-max-actors="${play.max}">
                    <div class="assigned-actors" id="${play.playId}-actors"></div>
                    <div class="empty-state">Arrastra actores aquí</div>
                </div>
            `;
            playsGrid.appendChild(playCard);
            dropZone = playCard.querySelector('.drop-zone');
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('dragenter', handleDragEnter);
            dropZone.addEventListener('dragleave', handleDragLeave);
            dropZone.addEventListener('drop', handleDrop);
        }

        play.assignedActors.forEach(actorId => {
            const actorName = document.querySelector(`.actor-card[data-actor-id="${actorId}"] .actor-name`)?.textContent;
            if (actorName) {
                assignActorToPlay(actorId, actorName, play.playId);
                const actorCard = document.querySelector(`.actor-card[data-actor-id="${actorId}"]`);
                if (actorCard) actorCard.style.display = 'none';
            }
        });

        playCounter = Math.max(playCounter, parseInt(play.playId.replace(/\D/g, '')));
    });
}
