// =====================================
// Variables globales
// =====================================
let draggedActor = null;
let assignments = {};
let actorCounter = 10;
let playCounter = 14;

// =====================================
// Inicialización
// =====================================
function initializeApp() {
    console.log('Inicializando aplicación...');
    setupNavigation();
    loadInitialData();
    initializeDragAndDrop();
    updateStats();
}

function setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSection = tab.dataset.section;
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.section').forEach(s => {
                s.style.display = s.id === targetSection ? 'block' : 'none';
            });
            
            if (targetSection === 'summary') {
                updateActorsSummary();
            }
        });
    });
}

// =====================================
// Drag & Drop
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
function addActor() {
    const name = prompt('Nombre del actor:');
    if (!name || name.trim() === '') return;
    
    const role = prompt('Rol del actor:', 'Estudiante');
    if (!role || role.trim() === '') return;
    
    actorCounter++;
    const actorId = actorCounter;
    
    const initials = name[0].toUpperCase();
    const actorCard = document.createElement('div');
    actorCard.className = 'actor-card';
    actorCard.draggable = true;
    actorCard.dataset.actorId = actorId;
    actorCard.innerHTML = `
        <div class="actor-avatar">${initials}</div>
        <div class="actor-info">
            <div class="actor-name">${name}</div>
            <div class="actor-role">${role}</div>
        </div>
        <button class="delete-btn" onclick="deleteActor(${actorId})">×</button>
    `;
    
    document.getElementById('actorsList').appendChild(actorCard);
    actorCard.addEventListener('dragstart', handleDragStart);
    actorCard.addEventListener('dragend', handleDragEnd);
    
    assignments[actorId] = {
        plays: new Set(),
        stats: { total: 0, duo: 0, trio: 0 }
    };
    
    saveToLocalStorage();
}

function addPlay() {
    const title = prompt('Título de la obra:');
    if (!title || title.trim() === '') return;
    
    const info = prompt('Información adicional:', 'Nueva obra');
    if (!info || info.trim() === '') return;
    
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

function deleteActor(actorId) {
    const actor = document.querySelector(`[data-actor-id="${actorId}"]`);
    if (!actor) return;
    
    const actorName = actor.querySelector('.actor-name').textContent;
    if (!confirm(`¿Seguro que querés eliminar a ${actorName}?`)) return;
    
    if (assignments[actorId]) {
        Array.from(assignments[actorId].plays).forEach(playId => {
            removeActorFromPlay(actorId, playId);
        });
        delete assignments[actorId];
    }
    
    actor.remove();
    updateStats();
    saveToLocalStorage();
}

function deletePlay(playId) {
    const play = document.querySelector(`[data-play-id="${playId}"]`);
    if (!play) return;
    
    const playName = play.querySelector('.play-title').textContent;
    if (!confirm(`¿Seguro que querés eliminar la obra "${playName}"?`)) return;
    
    // Actualizar assignments
    Object.entries(assignments).forEach(([actorId, data]) => {
        if (data.plays.has(playId)) {
            data.plays.delete(playId);
            updateActorStats(actorId);
        }
    });
    
    play.remove();
    updateStats();
    saveToLocalStorage();
}

function assignActorToPlay(actorId, playId) {
    if (!assignments[actorId]) {
        assignments[actorId] = {
            plays: new Set(),
            stats: { total: 0, duo: 0, trio: 0 }
        };
    }

    if (!assignments[actorId].plays.has(playId)) {
        assignments[actorId].plays.add(playId);
        createAssignedActor(actorId, playId);
        updateActorStats(actorId);
        saveToLocalStorage();
    }
}

function removeActorFromPlay(actorId, playId) {
    if (assignments[actorId]) {
        assignments[actorId].plays.delete(playId);
        updateActorStats(actorId);
    }

    const assignedActor = document.querySelector(`#${playId}-actors [data-actor-id="${actorId}"]`);
    if (assignedActor) {
        assignedActor.remove();
    }

    updateCapacityBadge(playId);
    saveToLocalStorage();
}

// =====================================
// Persistencia
// =====================================
function loadInitialData() {
    try {
        const savedActors = localStorage.getItem('actorsData');
        const savedPlays = localStorage.getItem('playsData');
        const savedAssignments = localStorage.getItem('assignments');
        
        if (savedActors && savedPlays && savedAssignments) {
            try {
                const actorsData = JSON.parse(savedActors);
                const playsData = JSON.parse(savedPlays);
                
                if (Array.isArray(actorsData) && Array.isArray(playsData) && 
                    actorsData.length > 0 && playsData.length > 0) {
                    loadFromLocalStorage();
                    return;
                }
            } catch (e) {
                console.error('Error al parsear datos guardados:', e);
            }
        }
        
        console.log('Usando datos por defecto');
        localStorage.clear();
        initializeDefaultData();
    } catch (error) {
        console.error('Error en la inicialización:', error);
        alert('Hubo un error al inicializar la aplicación. Por favor, recarga la página.');
    }
}

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

    // Guardar en localStorage como backup
    localStorage.setItem('actorsData', JSON.stringify(actorsData));
    localStorage.setItem('playsData', JSON.stringify(playsData));
    localStorage.setItem('assignments', JSON.stringify(assignments));

    // Guardar en data.js
    const fileContent = `// Datos actualizados ${new Date().toLocaleString()}\n\n` +
        `const defaultActors = ${JSON.stringify(actorsData, null, 2)};\n\n` +
        `const defaultPlays = ${JSON.stringify(playsData, null, 2)};\n`;

    // Usar fetch para guardar el archivo
    fetch('/saveData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fileContent })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessMessage('¡Cambios guardados correctamente!');
        } else {
            showErrorMessage('Error al guardar los cambios. Los datos están en localStorage como respaldo.');
        }
    })
    .catch(error => {
        console.error('Error al guardar:', error);
        showErrorMessage('Error al guardar los cambios. Los datos están en localStorage como respaldo.');
    });
}

function loadFromLocalStorage() {
    try {
        const actorsData = JSON.parse(localStorage.getItem('actorsData') || '[]');
        const playsData = JSON.parse(localStorage.getItem('playsData') || '[]');
        const savedAssignments = JSON.parse(localStorage.getItem('assignments') || '{}');

        document.getElementById('actorsList').innerHTML = '';
        document.getElementById('playsGrid').innerHTML = '';
        assignments = {};

        // Actualizar contadores
        actorCounter = Math.max(...actorsData.map(a => parseInt(a.id)), 10);
        playCounter = Math.max(...playsData.map(p => {
            const numericId = parseInt((p.id || '').replace(/\D/g, ''));
            return isNaN(numericId) ? 14 : numericId;
        }), 14);

        // Cargar actores
        actorsData.forEach(actor => {
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

        // Cargar obras
        playsData.forEach(play => {
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

        // Restaurar asignaciones
        assignments = Object.fromEntries(
            Object.entries(savedAssignments).map(([id, data]) => [
                id,
                {
                    plays: new Set(data.plays),
                    stats: data.stats || { total: 0, duo: 0, trio: 0 }
                }
            ])
        );

        // Recrear asignaciones visuales
        Object.entries(assignments).forEach(([actorId, data]) => {
            data.plays.forEach(playId => {
                createAssignedActor(actorId, playId);
            });
        });

        updateStats();
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        initializeDefaultData();
    }
}

function initializeDefaultData() {
    document.getElementById('actorsList').innerHTML = '';
    document.getElementById('playsGrid').innerHTML = '';
    assignments = {};
    
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
            stats: { total: 0, duo: 0, trio: 0 }
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

    saveToLocalStorage();
    updateStats();
}

// =====================================
// Funciones de ayuda
// =====================================
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
        <button class="remove-btn" onclick="removeActorFromPlay(${actorId}, '${playId}')">×</button>
    `;

    const assignedActorsContainer = document.getElementById(`${playId}-actors`);
    assignedActorsContainer.appendChild(assignedActor);
    updateCapacityBadge(playId);
}

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    // Posicionar el mensaje en la parte superior
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    // Aplicar estilos según el tipo
    if (type === 'success') {
        messageEl.style.background = '#10B981';
        messageEl.style.color = 'white';
    } else if (type === 'error') {
        messageEl.style.background = '#EF4444';
        messageEl.style.color = 'white';
    } else {
        messageEl.style.background = '#3B82F6';
        messageEl.style.color = 'white';
    }

    document.body.appendChild(messageEl);
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function updateCapacityBadge(playId) {
    const play = document.querySelector(`[data-play-id="${playId}"]`);
    if (!play) return;

    const currentCount = play.querySelectorAll('.assigned-actor').length;
    const maxActors = parseInt(play.querySelector('.drop-zone').dataset.maxActors);
    const badge = play.querySelector('.capacity-badge');
    
    badge.dataset.current = currentCount;
    badge.textContent = `${currentCount}/${maxActors} actores`;
}

// =====================================
// Estadísticas
// =====================================
function updateStats() {
    Object.entries(assignments).forEach(([actorId]) => {
        updateActorStats(actorId);
    });

    const totalActors = document.querySelectorAll('.actor-card').length;
    const assignedActors = Object.keys(assignments).length;

    document.getElementById('totalActors').textContent = totalActors;
    document.getElementById('assignedCount').textContent = assignedActors;
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

function updateActorsSummary() {
    const summaryContainer = document.getElementById('actorsSummary');
    summaryContainer.innerHTML = '';

    const plays = document.querySelectorAll('.play-card');
    const actors = document.querySelectorAll('.actor-card');
    
    actors.forEach(actor => {
        const actorId = actor.dataset.actorId;
        const actorName = actor.querySelector('.actor-name').textContent;
        const actorRole = actor.querySelector('.actor-role').textContent;
        const initials = actor.querySelector('.actor-avatar').textContent;

        const actorPlays = Array.from(plays)
            .filter(play => play.querySelector(`.assigned-actor[data-actor-id="${actorId}"]`))
            .map(play => ({
                id: play.dataset.playId,
                title: play.querySelector('.play-title').textContent,
                size: parseInt(play.querySelector('.drop-zone').dataset.maxActors)
            }));

        const stats = assignments[actorId]?.stats || { total: 0, duo: 0, trio: 0 };

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
                        <span class="play-tag ${play.size === 2 ? 'duo' : 'trio'}">
                            ${play.title}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;

        summaryContainer.appendChild(card);
    });
}

// =====================================
// Exportar funciones globales
// =====================================
window.addActor = addActor;
window.addPlay = addPlay;
window.deleteActor = deleteActor;
window.deletePlay = deletePlay;
window.removeActorFromPlay = removeActorFromPlay;

// =====================================
// Inicialización
// =====================================
window.addEventListener('DOMContentLoaded', initializeApp);