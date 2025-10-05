// =====================================
// Variables globales
// =====================================
let draggedActor = null;
let assignments = {}; // Format: { actorId: { plays: Set of playIds, stats: { total: number, duo: number, trio: number }, scenes: { playId: number } } }
let actorCounter = 6;  // número inicial de actores
let playCounter = 4;   // número inicial de obras

// Hacer las funciones accesibles globalmente
window.deleteActor = deleteActor;
window.deletePlay = deletePlay;
window.addActor = addActor;
window.addPlay = addPlay;
window.removeActor = removeActor;

// =====================================
// Navegación
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    // Configurar navegación
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSection = tab.dataset.section;
            
            // Actualizar tabs
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Actualizar secciones
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');

            // Si estamos en la sección de resumen, actualizar las estadísticas
            if (targetSection === 'summary') {
                updateActorsSummary();
            }
        });
    });

    // Limpiar datos guardados y comenzar con los valores por defecto
    localStorage.clear();
    initializeDefaultData();
    
    initializeDragAndDrop();
    updateStats();
});

// =====================================
// Datos por defecto
// =====================================
function initializeDefaultData() {
    // Actores por defecto
    const defaultActors = [
        { id: 1, name: "Euge", role: "Actor" },
        { id: 2, name: "Guille", role: "Actor" },
        { id: 3, name: "Alan", role: "Actor" },
        { id: 4, name: "Ayelen", role: "Actor" },
        { id: 5, name: "Franco", role: "Actor" },
        { id: 6, name: "Axel", role: "Actor" },
        { id: 7, name: "Euge", role: "Actor" },
        { id: 8, name: "Lorenzo", role: "Actor" },
        { id: 9, name: "Camila", role: "Actor" }
    ];

    // Obras por defecto con sus cantidades correctas
    const defaultPlays = [
        { id: "mudanza", title: "Mudanza", maxActors: 2, info: "Obra 1" },
        { id: "monja", title: "Monja Sicaria", maxActors: 2, info: "Obra 2" },
        { id: "fantasma", title: "Fantasma", maxActors: 2, info: "Obra 3" },
        { id: "banco", title: "Robo al Banco", maxActors: 3, info: "Obra 4" },
        { id: "accidente", title: "Accidente", maxActors: 2, info: "Obra 5" },
        { id: "director", title: "Director y Actrices", maxActors: 3, info: "Obra 6" },
        { id: "cumple", title: "Cumpleaños Sorpresa", maxActors: 3, info: "Obra 7" },
        { id: "interrogatorio", title: "Interrogatorio", maxActors: 2, info: "Obra 8" },
        { id: "herencia", title: "Herencia Nazi", maxActors: 3, info: "Obra 9" },
        { id: "companeros", title: "Compañeros de Trabajo", maxActors: 2, info: "Obra 10" },
        { id: "trencito", title: "Trencito de la Alegria", maxActors: 3, info: "Obra 11" },
        { id: "extraterrestres", title: "Extraterrestres", maxActors: 3, info: "Obra 12" },
        { id: "confesion", title: "Confesión", maxActors: 2, info: "Obra 13" },
        { id: "cita", title: "Cita a Ciegas", maxActors: 2, info: "Obra 14" }
    ];

    // Crear actores
    defaultActors.forEach(actor => {
        const initials = actor.name[0].toUpperCase();
        const actorCard = document.createElement('div');
        actorCard.className = 'actor-card';
        actorCard.draggable = true;
        actorCard.dataset.actorId = actor.id;
        actorCard.innerHTML = `
            <div class="actor-avatar">${initials}</div>
            <div class="actor-info">
                <div class="actor-name">${actor.name}</div>
                <div class="actor-role">${actor.role}</div>
            </div>
            <button class="delete-btn" onclick="deleteActor(${actor.id})">×</button>
        `;
        document.getElementById('actorsList').appendChild(actorCard);
        actorCard.addEventListener('dragstart', handleDragStart);
        actorCard.addEventListener('dragend', handleDragEnd);
    });

    // Crear obras
    defaultPlays.forEach(play => {
        const playCard = document.createElement('div');
        playCard.className = 'play-card';
        playCard.dataset.playId = play.id;
        playCard.innerHTML = `
            <div class="play-header">
                <div class="play-title-row">
                    <h3 class="play-title">${play.title}</h3>
                    <button class="delete-btn" onclick="deletePlay('${play.id}')">×</button>
                </div>
                <div class="play-info">
                    <span>${play.info}</span>
                    <span class="capacity-badge" data-current="0" data-max="${play.maxActors}">0/${play.maxActors} actores</span>
                </div>
            </div>
            <div class="drop-zone" data-play-id="${play.id}" data-max-actors="${play.maxActors}">
                <div class="assigned-actors" id="${play.id}-actors"></div>
                <div class="empty-state">Arrastra actores aquí</div>
            </div>
        `;
        document.getElementById('playsGrid').appendChild(playCard);
        const dropZone = playCard.querySelector('.drop-zone');
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragenter', handleDragEnter);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
    });

    // Guardar estado inicial
    saveToLocalStorage();
}

// =====================================
// Drag & Drop
// =====================================
function initializeDragAndDrop() {
    // Remover eventos existentes primero
    const allDroppables = document.querySelectorAll('.drop-zone, .actor-card, .assigned-actor');
    allDroppables.forEach(element => {
        element.removeEventListener('dragstart', handleDragStart);
        element.removeEventListener('dragend', handleDragEnd);
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragenter', handleDragEnter);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
    });

    // Agregar eventos a actores
    const actors = document.querySelectorAll('.actor-card');
    actors.forEach(actor => {
        actor.addEventListener('dragstart', handleDragStart);
        actor.addEventListener('dragend', handleDragEnd);
    });

    // Agregar eventos a actores asignados
    const assignedActors = document.querySelectorAll('.assigned-actor');
    assignedActors.forEach(actor => {
        actor.addEventListener('dragstart', handleDragStart);
        actor.addEventListener('dragend', handleDragEnd);
    });

    // Agregar eventos a zonas de drop
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragenter', handleDragEnter);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });

    // Agregar eventos a la lista de actores
    const actorsList = document.getElementById('actorsList');
    if (actorsList) {
        actorsList.addEventListener('dragover', handleDragOver);
        actorsList.addEventListener('drop', handleReturnActor);
    }
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

    // Si el drop fue en un elemento dentro de drop-zone, buscar el drop-zone padre
    const dropZone = e.target.closest('.drop-zone');
    if (!dropZone) return;

    // Limpiar el estado de drag-over
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    
    const playId = dropZone.dataset.playId;
    if (!playId) return;

    // Verificar límites de actores
    const maxActors = parseInt(dropZone.dataset.maxActors);
    const assignedActorsContainer = document.getElementById(`${playId}-actors`);
    if (!assignedActorsContainer) return;

    const currentActors = assignedActorsContainer.querySelectorAll('.assigned-actor').length;
    if (currentActors >= maxActors) return;

    // Obtener información del actor
    const actorId = draggedActor.dataset.actorId;
    const actorName = draggedActor.querySelector('.actor-name')?.textContent;
    if (!actorName) return;

    // Verificar si el actor ya está en esta obra
    if (assignments[actorId]?.plays.has(playId)) return;

    // Asignar el actor a la obra
    assignActorToPlay(actorId, actorName, playId);

    saveToLocalStorage();
    updateStats();
    updateActorsSummary();
}

// =====================================
// Asignaciones
// =====================================
function assignActorToPlay(actorId, actorName, playId) {
    const assignedActorsContainer = document.getElementById(`${playId}-actors`);
    if (!assignedActorsContainer) return;

    const emptyState = assignedActorsContainer.parentElement.querySelector('.empty-state');
    
    // Crear el elemento del actor asignado
    const assignedActor = document.createElement('div');
    assignedActor.className = 'assigned-actor';
    assignedActor.draggable = true;
    assignedActor.dataset.actorId = actorId;
    assignedActor.innerHTML = `
        <span>${actorName}</span>
        <button class="remove-actor" onclick="removeActor('${actorId}', '${playId}')">×</button>
    `;

    // Agregar eventos de drag al actor asignado
    assignedActor.addEventListener('dragstart', handleDragStart);
    assignedActor.addEventListener('dragend', handleDragEnd);

    // Agregar el actor a la obra
    assignedActorsContainer.appendChild(assignedActor);
    if (emptyState) emptyState.style.display = 'none';

    // Actualizar estado
    updatePlayCapacity(playId);
    
    // Actualizar asignaciones
    if (!assignments[actorId]) {
        assignments[actorId] = { 
            plays: new Set(), 
            stats: { total: 0, duo: 0, trio: 0 }
        };
    }
    assignments[actorId].plays.add(playId);
    
    // Actualizar estadísticas
    const maxActors = parseInt(assignedActorsContainer.parentElement.dataset.maxActors);
    assignments[actorId].stats.total = assignments[actorId].plays.size;
    if (maxActors === 2) assignments[actorId].stats.duo++;
    if (maxActors === 3) assignments[actorId].stats.trio++;
}

function removeActor(actorId, playId) {
    // Encontrar al actor específicamente en esta obra
    const assignedActor = document.querySelector(`.assigned-actor[data-actor-id="${actorId}"]`);
    if (!assignedActor) return;

    // Verificar que el actor pertenezca a la obra correcta
    const playContainer = assignedActor.closest('.drop-zone');
    if (!playContainer || playContainer.dataset.playId !== playId) return;

    const maxActors = parseInt(playContainer.dataset.maxActors);
    
    // Actualizar estadísticas solo para esta obra
    if (assignments[actorId]) {
        assignments[actorId].plays.delete(playId);
        assignments[actorId].stats.total = assignments[actorId].plays.size;
        if (maxActors === 2) assignments[actorId].stats.duo--;
        if (maxActors === 3) assignments[actorId].stats.trio--;

        // Si el actor ya no está en ninguna obra, limpiarlo de assignments
        if (assignments[actorId].plays.size === 0) {
            delete assignments[actorId];
        }
    }

    assignedActor.remove();
    
    const assignedActorsContainer = document.getElementById(`${playId}-actors`);
    const emptyState = assignedActorsContainer?.parentElement.querySelector('.empty-state');
    if (assignedActorsContainer?.children.length === 0 && emptyState) {
        emptyState.style.display = 'block';
    }

    updatePlayCapacity(playId);
    saveToLocalStorage();
    updateStats();
}

function removeActorFromAllPlays(actorId) {
    // Buscar en todas las obras por si el actor está asignado en alguna
    const assignedActors = document.querySelectorAll(`.assigned-actor[data-actor-id="${actorId}"]`);
    assignedActors.forEach(assignedActor => {
        const playContainer = assignedActor.closest('.drop-zone');
        if (!playContainer) return;

        const playId = playContainer.dataset.playId;
        assignedActor.remove();

        const assignedActorsContainer = document.getElementById(`${playId}-actors`);
        const emptyState = assignedActorsContainer?.parentElement.querySelector('.empty-state');
        if (assignedActorsContainer?.children.length === 0 && emptyState) {
            emptyState.style.display = 'block';
        }

        updatePlayCapacity(playId);
    });

    delete assignments[actorId];
}

function removeActorFromPlay(actorId, playId) {
    const assignedActor = document.querySelector(`.assigned-actor[data-actor-id="${actorId}"][data-play-id="${playId}"]`);
    if (!assignedActor) return;

    const playContainer = assignedActor.closest('.drop-zone');
    if (!playContainer) return;

    const maxActors = parseInt(playContainer.dataset.maxActors);
    
    // Actualizar estadísticas
    if (assignments[actorId]) {
        assignments[actorId].plays.delete(playId);
        assignments[actorId].stats.total = assignments[actorId].plays.size;
        if (maxActors === 2) assignments[actorId].stats.duo--;
        if (maxActors === 3) assignments[actorId].stats.trio--;
    }

    assignedActor.remove();
    
    const assignedActorsContainer = document.getElementById(`${playId}-actors`);
    const emptyState = assignedActorsContainer?.parentElement.querySelector('.empty-state');
    if (assignedActorsContainer?.children.length === 0 && emptyState) {
        emptyState.style.display = 'block';
    }

    updatePlayCapacity(playId);
}

// =====================================
// Actualización de UI
// =====================================
function updatePlayCapacity(playId) {
    const dropZone = document.querySelector(`.drop-zone[data-play-id="${playId}"]`);
    if (!dropZone) return; // Agregar esta validación

    const maxActors = parseInt(dropZone.dataset.maxActors);
    const currentActors = dropZone.querySelectorAll('.assigned-actor').length;

    const capacityBadge = dropZone.parentElement.querySelector('.capacity-badge');
    if (!capacityBadge) return; // Agregar esta validación

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
        <button class="delete-btn" onclick="deleteActor(${actorCounter})">×</button>
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

    // Crear un ID único usando el nombre de la obra y el contador
    const playId = `play_${playName.toLowerCase().replace(/\s+/g, '_')}_${playCounter}`;

    const playCard = document.createElement('div');
    playCard.className = 'play-card';
    playCard.dataset.playId = playId;
    playCard.innerHTML = `
        <div class="play-header">
            <div class="play-title-row">
                <h3 class="play-title">${playName}</h3>
                <button class="delete-btn" onclick="deletePlay('${playId}')">×</button>
            </div>
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

    // Configurar eventos de la zona de drop
    const dropZone = playCard.querySelector('.drop-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragenter', handleDragEnter);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
    }

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
        visible: actor.style.display !== 'none',
        assignments: assignments[actor.dataset.actorId] || { plays: [], stats: { total: 0, duo: 0, trio: 0 }, scenes: {} }
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

    // Limpiar contenedores y estado
    document.getElementById('actorsList').innerHTML = '';
    document.getElementById('playsGrid').innerHTML = '';
    assignments = {};

    // Cargar actores y sus asignaciones
    actorsData.forEach(actor => {
        let actorCard = document.createElement('div');
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
            <button class="delete-btn" onclick="deleteActor(${actor.id})">×</button>
        `;
        document.getElementById('actorsList').appendChild(actorCard);
        actorCard.style.display = actor.visible ? 'flex' : 'none';
        actorCounter = Math.max(actorCounter, parseInt(actor.id));

        // Restaurar asignaciones
        if (actor.assignments) {
            assignments[actor.id] = {
                plays: new Set(actor.assignments.plays),
                stats: actor.assignments.stats,
                scenes: actor.assignments.scenes || {}
            };
        }
    });

    // Cargar obras
    playsData.forEach(play => {
        const playsGrid = document.getElementById('playsGrid');
        const playCard = document.createElement('div');
        playCard.className = 'play-card';
        playCard.dataset.playId = play.playId;
        playCard.innerHTML = `
            <div class="play-header">
                <div class="play-title-row">
                    <h3 class="play-title">${play.title}</h3>
                    <button class="delete-btn" onclick="deletePlay('${play.playId}')">×</button>
                </div>
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

        // Restaurar asignaciones de actores
        play.assignedActors.forEach(actorId => {
            const actorName = document.querySelector(`.actor-card[data-actor-id="${actorId}"] .actor-name`)?.textContent;
            if (actorName) {
                assignActorToPlay(actorId, actorName, play.playId);
            }
        });

        playCounter = Math.max(playCounter, parseInt(play.playId.replace(/\D/g, '')));
    });

    // Reinicializar eventos después de cargar todo
    initializeDragAndDrop();
    
    // Actualizar la vista de resumen si está activa
    if (document.querySelector('.nav-tab[data-section="summary"]').classList.contains('active')) {
        updateActorsSummary();
    }
}

function deleteActor(actorId) {
    const actor = document.querySelector(`.actor-card[data-actor-id="${actorId}"]`);
    if (!actor) return;

    const actorName = actor.querySelector('.actor-name').textContent;
    if (confirm(`¿Seguro que querés eliminar a ${actorName}?`)) {
        removeActorFromAllPlays(actorId);
        actor.remove();
        updateStats();
        saveToLocalStorage();
    }
}

function deletePlay(playId) {
    const play = document.querySelector(`.play-card[data-play-id="${playId}"]`);
    if (!play) return;

    const playName = play.querySelector('.play-title').textContent;
    if (confirm(`¿Seguro que querés eliminar la obra "${playName}"?`)) {
        // Restaurar actores asignados a esta obra
        const assignedActors = play.querySelectorAll('.assigned-actor');
        assignedActors.forEach(assigned => {
            const actorId = assigned.dataset.actorId;
            const originalActor = document.querySelector(`.actor-card[data-actor-id="${actorId}"]`);
            if (originalActor) originalActor.style.display = 'flex';
            delete assignments[actorId];
        });

        play.remove();
        updateStats();
        saveToLocalStorage();
    }
}

// =====================================
// Estadísticas y Resumen
// =====================================
function updateActorsSummary() {
    const summaryContainer = document.getElementById('actorsSummary');
    summaryContainer.innerHTML = '';

    // Obtener todas las obras y actores
    const plays = document.querySelectorAll('.play-card');
    const actors = document.querySelectorAll('.actor-card');
    
    // Procesar cada actor
    actors.forEach(actor => {
        const actorId = actor.dataset.actorId;
        const actorName = actor.querySelector('.actor-name').textContent;
        const actorRole = actor.querySelector('.actor-role').textContent;
        const initials = actorName.split(' ').map(n => n[0]).join('').toUpperCase();

        // Encontrar todas las obras del actor
        const actorPlays = [];
        plays.forEach(play => {
            const isAssigned = play.querySelector(`.assigned-actor[data-actor-id="${actorId}"]`);
            if (isAssigned) {
                const playId = play.dataset.playId;
                const maxActors = parseInt(play.querySelector('.drop-zone').dataset.maxActors);
                const playTitle = play.querySelector('.play-title').textContent;
                actorPlays.push({ 
                    id: playId, 
                    title: playTitle, 
                    size: maxActors
                });
            }
        });

        // Calcular estadísticas
        const stats = {
            total: actorPlays.length,
            duo: actorPlays.filter(p => p.size === 2).length,
            trio: actorPlays.filter(p => p.size === 3).length
        };

        // Crear tarjeta de resumen
        const card = document.createElement('div');
        card.className = 'actor-summary-card';
        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <div class="actor-avatar">${initials}</div>
                <div>
                    <div class="actor-name">${actorName}</div>
                    <div class="actor-role">${actorRole}</div>
                </div>
            </div>
            <div class="actor-stats">
                <div class="stat-item">
                    <span>Total de obras:</span>
                    <span class="stat-value">${stats.total}</span>
                </div>
                <div class="stat-item">
                    <span>Obras de a 2:</span>
                    <span class="stat-value">${stats.duo}</span>
                </div>
                <div class="stat-item">
                    <span>Obras de a 3:</span>
                    <span class="stat-value">${stats.trio}</span>
                </div>
            </div>
            <div class="actor-plays-list">
                <h4>Obras asignadas:</h4>
                <div style="display:flex; flex-wrap:wrap; gap:4px;">
                    ${actorPlays.map(play => `
                        <span class="play-tag ${play.size === 2 ? 'duo' : play.size === 3 ? 'trio' : ''}">
                            ${play.title}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;

        summaryContainer.appendChild(card);
    });
}
