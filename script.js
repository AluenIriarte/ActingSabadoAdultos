import { defaultActors, defaultPlays } from './data.js';

// =====================================
// Variables globales
// =====================================
let draggedActor = null;
let assignments = {};
let actorCounter = 10;
let playCounter = 14;

// =====================================
// Initialización
// =====================================
function initializeDragAndDrop() {
    document.querySelectorAll('.actor-card').forEach(actor => {
        actor.addEventListener('dragstart', handleDragStart);
        actor.addEventListener('dragend', handleDragEnd);
    });

    document.querySelectorAll('.drop-zone').forEach(dropZone => {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragenter', handleDragEnter);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
    });
}

// =====================================
// Drag & Drop
// =====================================

function handleDragStart(e) {
    draggedActor = this;
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    if (draggedActor) {
        draggedActor.classList.remove('dragging');
        draggedActor = null;
    }
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('dragover');
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('dragover');
}

function handleDragLeave(e) {
    this.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    
    if (!draggedActor) return;
    
    const dropZone = e.target.closest('.drop-zone');
    if (!dropZone) return;
    
    const playId = dropZone.dataset.playId;
    const maxActors = parseInt(dropZone.dataset.maxActors);
    const actorId = draggedActor.dataset.actorId;
    
    const currentAssigned = dropZone.querySelectorAll('.assigned-actor').length;
    if (currentAssigned >= maxActors) {
        showMessage('No hay más espacio en esta obra');
        return;
    }
    
    assignActorToPlay(actorId, playId);
    updateStats();
}

// =====================================
// Gestión de Actores y Obras
// =====================================

function deleteActor(actorId) {
    const actor = document.querySelector(`[data-actor-id="${actorId}"]`);
    if (actor) {
        // Eliminar actor de todas las obras asignadas
        if (assignments[actorId]) {
            assignments[actorId].plays.forEach(playId => {
                removeActorFromPlay(actorId, playId);
            });
        }
        actor.remove();
        delete assignments[actorId];
        updateStats();
        saveToLocalStorage();
    }
}

function deletePlay(playId) {
    const play = document.querySelector(`[data-play-id="${playId}"]`);
    if (play) {
        // Actualizar assignments para los actores afectados
        Object.entries(assignments).forEach(([actorId, data]) => {
            if (data.plays.has(playId)) {
                data.plays.delete(playId);
                delete data.scenes[playId];
                updateActorStats(actorId);
            }
        });
        play.remove();
        updateStats();
        saveToLocalStorage();
    }
}

function addActor() {
    const name = prompt('Nombre del actor:');
    if (!name) return;
    
    const role = prompt('Rol del actor:', 'Estudiante');
    if (!role) return;
    
    actorCounter++;
    const actor = {
        id: actorCounter,
        name: name,
        role: role
    };
    
    const initials = name[0].toUpperCase();
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
    
    assignments[actor.id] = {
        plays: new Set(),
        stats: { total: 0, duo: 0, trio: 0 },
        scenes: {}
    };
    
    saveToLocalStorage();
}

function addPlay() {
    const title = prompt('Título de la obra:');
    if (!title) return;
    
    const info = prompt('Información adicional:', 'Nueva obra');
    if (!info) return;
    
    const maxActors = parseInt(prompt('Número máximo de actores:', '2')) || 2;
    
    playCounter++;
    const playId = `custom${playCounter}`;
    
    const playCard = document.createElement('div');
    playCard.className = 'play-card';
    playCard.dataset.playId = playId;
    playCard.innerHTML = `
        <div class="play-header">
            <div class="play-title-row">
                <h3 class="play-title">${title}</h3>
                <button class="delete-btn" onclick="deletePlay('${playId}')">×</button>
            </div>
            <div class="play-info">
                <span>${info}</span>
                <span class="capacity-badge" data-current="0" data-max="${maxActors}">0/${maxActors} actores</span>
            </div>
        </div>
        <div class="drop-zone" data-play-id="${playId}" data-max-actors="${maxActors}">
            <div class="assigned-actors" id="${playId}-actors"></div>
            <div class="empty-state">Arrastra actores aquí</div>
        </div>
    `;
    
    document.getElementById('playsGrid').appendChild(playCard);
    const dropZone = playCard.querySelector('.drop-zone');
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    saveToLocalStorage();
}

function removeActor(actorId, playId) {
    removeActorFromPlay(actorId, playId);
    updateStats();
    saveToLocalStorage();
}

// Hacer las funciones accesibles globalmente
globalThis.deleteActor = deleteActor;
globalThis.deletePlay = deletePlay;
globalThis.addActor = addActor;
globalThis.addPlay = addPlay;
globalThis.removeActor = removeActor;

// Format for assignments: { actorId: { plays: Set of playIds, stats: { total: number, duo: number, trio: number }, scenes: { playId: number } } }

// =====================================
// Navegación
// =====================================

// =====================================
// Funciones de ayuda
// =====================================

// Función para mostrar mensajes
function showMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 3000);
}

// Función para retornar un actor a la lista
function handleReturnActor(e) {
    e.preventDefault();
    if (!draggedActor || !draggedActor.classList.contains('assigned-actor')) return;

    const actorId = draggedActor.dataset.actorId;
    const playId = draggedActor.closest('.drop-zone').dataset.playId;
    
    removeActor(actorId, playId);
    saveToLocalStorage();
    updateStats();
    updateActorsSummary();
}

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

    // Intentar cargar datos guardados o usar valores por defecto
    const savedActors = localStorage.getItem('actorsData');
    const savedPlays = localStorage.getItem('playsData');
    
    if (!savedActors || !savedPlays || JSON.parse(savedActors).length === 0 || JSON.parse(savedPlays).length === 0) {
        // Si falta algún dato o están vacíos, inicializar con valores por defecto
        localStorage.clear(); // Limpiar datos parciales
        initializeDefaultData();
    } else {
        loadFromLocalStorage();
    }
    
    initializeDragAndDrop();
    updateStats();
});

// =====================================
// Helper Functions
// =====================================

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    
    if (!draggedActor) return;
    
    const dropZone = e.target.closest('.drop-zone');
    if (!dropZone) return;
    
    const playId = dropZone.dataset.playId;
    const maxActors = parseInt(dropZone.dataset.maxActors);
    const actorId = draggedActor.dataset.actorId;
    
    const currentAssigned = dropZone.querySelectorAll('.assigned-actor').length;
    if (currentAssigned >= maxActors) {
        showMessage('No hay más espacio en esta obra');
        return;
    }
    
    assignActorToPlay(actorId, playId);
    updateStats();
}

// =====================================
// Helper Functions
// =====================================

function saveToLocalStorage() {
    const actorsData = Array.from(document.querySelectorAll('.actor-card')).map(actor => ({
        id: parseInt(actor.dataset.actorId),
        name: actor.querySelector('.actor-name').textContent,
        role: actor.querySelector('.actor-role').textContent
    }));

    const playsData = Array.from(document.querySelectorAll('.play-card')).map(play => ({
        id: play.dataset.playId,
        title: play.querySelector('.play-title').textContent,
        info: play.querySelector('.play-info span').textContent,
        maxActors: parseInt(play.querySelector('.drop-zone').dataset.maxActors)
    }));

    localStorage.setItem('actorsData', JSON.stringify(actorsData));
    localStorage.setItem('playsData', JSON.stringify(playsData));
    localStorage.setItem('assignments', JSON.stringify(assignments));
}

function loadFromLocalStorage() {
    try {
        const actorsData = JSON.parse(localStorage.getItem('actorsData') || '[]');
        const playsData = JSON.parse(localStorage.getItem('playsData') || '[]');
        const savedAssignments = JSON.parse(localStorage.getItem('assignments') || '{}');
        
        // Actualizar contadores
        actorCounter = Math.max(...actorsData.map(a => parseInt(a.id)), 0);
        playCounter = Math.max(...playsData.map(p => {
            const numericId = parseInt(p.playId?.replace(/\D/g, '') || '0');
            return isNaN(numericId) ? 0 : numericId;
        }), 0);

        // Limpiar contenedores y estado
        document.getElementById('actorsList').innerHTML = '';
        document.getElementById('playsGrid').innerHTML = '';
        assignments = {};

        // Cargar actores y asignaciones
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
            actorCard.addEventListener('dragstart', handleDragStart);
            actorCard.addEventListener('dragend', handleDragEnd);

            // Restaurar asignaciones
            if (actor.assignments && Array.isArray(actor.assignments.plays)) {
                assignments[actor.id] = {
                    plays: new Set(actor.assignments.plays),
                    stats: actor.assignments.stats || { total: 0, duo: 0, trio: 0 },
                    scenes: actor.assignments.scenes || {}
                };
            }
        });

        // Cargar obras y asignaciones
        playsData.forEach(play => {
            const playCard = document.createElement('div');
            playCard.className = 'play-card';
            playCard.dataset.playId = play.playId || play.id;
            playCard.innerHTML = `
                <div class="play-header">
                    <div class="play-title-row">
                        <h3 class="play-title">${play.title}</h3>
                        <button class="delete-btn" onclick="deletePlay('${play.playId || play.id}')">×</button>
                    </div>
                    <div class="play-info">
                        <span>Escena 1</span>
                        <span class="capacity-badge" data-current="0" data-max="${play.maxActors || play.max}">0/${play.maxActors || play.max} actores</span>
                    </div>
                </div>
                <div class="drop-zone" data-play-id="${play.playId || play.id}" data-max-actors="${play.maxActors || play.max}">
                    <div class="assigned-actors" id="${play.playId || play.id}-actors"></div>
                    <div class="empty-state">Arrastra actores aquí</div>
                </div>
            `;
            document.getElementById('playsGrid').appendChild(playCard);

            const dropZone = playCard.querySelector('.drop-zone');
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('dragenter', handleDragEnter);
            dropZone.addEventListener('dragleave', handleDragLeave);
            dropZone.addEventListener('drop', handleDrop);

            // Restaurar asignaciones de actores
            if (play.assignedActors) {
                play.assignedActors.forEach(actorId => {
                    if (assignments[actorId] && assignments[actorId].plays.has(play.playId || play.id)) {
                        createAssignedActor(actorId, play.playId || play.id);
                    }
                });
            }
        });

        updateStats();
        if (document.querySelector('.nav-tab[data-section="summary"]').classList.contains('active')) {
            updateActorsSummary();
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        initializeDefaultData();
    }
}

function initializeDefaultData() {
    // Resetear contadores basados en los datos importados
    actorCounter = defaultActors.length;
    playCounter = defaultPlays.length;

    // Inicializar actores
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

        assignments[actor.id] = {
            plays: new Set(),
            stats: { total: 0, duo: 0, trio: 0 },
            scenes: {}
        };
    });

    // Inicializar obras
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

function assignActorToPlay(actorId, playId) {
    if (!assignments[actorId]) {
        assignments[actorId] = {
            plays: new Set(),
            stats: { total: 0, duo: 0, trio: 0 },
            scenes: {}
        };
    }

    if (!assignments[actorId].plays.has(playId)) {
        assignments[actorId].plays.add(playId);
        assignments[actorId].scenes[playId] = 1;
        createAssignedActor(actorId, playId);
        updateActorStats(actorId);
    }
}

function removeActorFromPlay(actorId, playId) {
    if (assignments[actorId]) {
        assignments[actorId].plays.delete(playId);
        delete assignments[actorId].scenes[playId];
        updateActorStats(actorId);
    }

    const assignedActor = document.querySelector(`#${playId}-actors [data-actor-id="${actorId}"]`);
    if (assignedActor) {
        assignedActor.remove();
    }

    updateCapacityBadge(playId);
}

function createAssignedActor(actorId, playId) {
    const actor = document.querySelector(`[data-actor-id="${actorId}"]`);
    if (!actor) return;

    const assignedActor = document.createElement('div');
    assignedActor.className = 'assigned-actor';
    assignedActor.dataset.actorId = actorId;
    assignedActor.innerHTML = `
        <div class="actor-avatar">${actor.querySelector('.actor-avatar').textContent}</div>
        <div class="actor-info">
            <div class="actor-name">${actor.querySelector('.actor-name').textContent}</div>
        </div>
        <button class="remove-btn" onclick="removeActor(${actorId}, '${playId}')">×</button>
    `;

    const assignedActorsContainer = document.getElementById(`${playId}-actors`);
    assignedActorsContainer.appendChild(assignedActor);
    updateCapacityBadge(playId);
}

function updateCapacityBadge(playId) {
    const dropZone = document.querySelector(`[data-play-id="${playId}"]`);
    if (!dropZone) return;

    const currentCount = dropZone.querySelectorAll('.assigned-actor').length;
    const maxActors = parseInt(dropZone.querySelector('.drop-zone').dataset.maxActors);
    const badge = dropZone.querySelector('.capacity-badge');
    
    badge.dataset.current = currentCount;
    badge.textContent = `${currentCount}/${maxActors} actores`;
}

function updateStats() {
    for (const [actorId, data] of Object.entries(assignments)) {
        updateActorStats(actorId);
    }
}

function updateActorStats(actorId) {
    if (!assignments[actorId]) return;

    const stats = { total: 0, duo: 0, trio: 0 };
    const plays = assignments[actorId].plays;

    plays.forEach(playId => {
        const play = document.querySelector(`[data-play-id="${playId}"]`);
        if (play) {
            const maxActors = parseInt(play.querySelector('.drop-zone').dataset.maxActors);
            stats.total++;
            if (maxActors === 2) stats.duo++;
            else if (maxActors === 3) stats.trio++;
        }
    });

    assignments[actorId].stats = stats;
}

function initializeDefaultData() {
    // Resetear contadores basados en los datos importados
    actorCounter = defaultActors.length;
    playCounter = defaultPlays.length;

    // Inicializar actores
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

    // Inicializar obras
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
// Persistencia
// =====================================

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
