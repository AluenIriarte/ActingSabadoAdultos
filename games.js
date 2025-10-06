// Juegos de Actuación — Next Level
// Módulo único para la sección "Juegos". Diseñado para ser modular, estético y pedagógicamente robusto.
// Incluye: TarjetaRandom, CambioEmocion, ObjetosImaginarios, CadenaHistorias, ImproConflicto
// Funcionalidades: generador aleatorio, niveles de intensidad, timer integrado, guardar/copiar/compartir, progresión de dificultad

(function(){
  // --- Data pools (bases) -------------------------------------------------
  const GamesData = {
    situations: [
      'Una cena familiar que se arruina',
      'En la estación de tren esperando un viaje importante',
      'Un robo fallido',
      'Una cita a ciegas que sale mal',
      'Reunión de trabajo con sorpresa',
      'Un entierro con secretos',
      'Una casa rodante que se detiene en medio del desierto',
      'Un cumpleaños que nadie recuerda',
      'Una entrega equivocada de paquetes',
      'Un paciente que se enamora de su doctor'
    ],
    characters: [
      'Un taxista sentimental',
      'Una diva en apuros',
      'Un abuelo bromista',
      'Una periodista impaciente',
      'Un extraterrestre confundido',
      'Un profesor neurótico',
      'Una bailarina cansada',
      'Un cartero soñador',
      'Una chef temperamental',
      'Un oficinista con doble vida'
    ],
    emotions: [
      'ira contenida','alegría exuberante','miedo paralizante','tristeza melancólica','confusión cómica','nerviosismo exagerado','euforia controlada','vergüenza','celos','resignación'
    ],
    actions: ['susurrar','gritar','bailar en silencio','hacer mímica','romper algo accidentalmente','ignorar','seducir con la mirada','escribir frenéticamente','reír a carcajadas','llorar en voz baja'],
    objects: ['una maleta imaginaria','un paraguas roto','una llave sin cerradura','un teléfono de juguete','un sombrero gigante','una radio antigua','una pelota desinflada','un mapa arrugado'],
    words: ['manzana','luna','rojo','promesa','crujido','fuego','eco','silencio','puerta','ventana'],
    conflicts: ['traición','error profesional','secreto revelado','deuda impaga','celos','robo de identidad','malentendido histórico']
  };

  // Utility helpers -------------------------------------------------------
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function sample(arr, n){ const copy = arr.slice(); const out = []; while(out.length<n && copy.length){ out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]); } return out; }
  function uid(prefix='id'){ return prefix + '-' + Math.random().toString(36).slice(2,9); }

  // Small animation helper
  function pulse(el){ el.classList.add('pulse'); setTimeout(()=>el.classList.remove('pulse'),600); }

  // Storage for saved prompts (localStorage)
  const GAMES_SAVE_KEY = 'teatro_games_saves_v1';
  function loadSaves(){ try{ return JSON.parse(localStorage.getItem(GAMES_SAVE_KEY) || '[]'); }catch(e){ return []; } }
  function savePrompt(obj){ const arr = loadSaves(); arr.unshift(obj); localStorage.setItem(GAMES_SAVE_KEY, JSON.stringify(arr.slice(0,50))); }

  // Modal util (self-contained, accessible)
  function openModal({title='', html='', actions=[]}){
    const backdrop = document.createElement('div'); backdrop.className='modal-backdrop fade-in'; backdrop.setAttribute('role','dialog'); backdrop.setAttribute('aria-modal','true');
    const modal = document.createElement('div'); modal.className='modal game-modal';
    modal.innerHTML = `
      <div class="modal-header"><div style="font-weight:700">${title}</div><button class="close-btn" aria-label="Cerrar">✕</button></div>
      <div class="modal-body">${html}</div>
      <div class="modal-actions"></div>
    `;
    const actionsEl = modal.querySelector('.modal-actions');
    actions.forEach(a=>{
      const b = document.createElement('button'); b.className='btn'; b.textContent = a.label; b.addEventListener('click', ()=> a.onClick && a.onClick()); actionsEl.appendChild(b);
    });

    backdrop.appendChild(modal); document.body.appendChild(backdrop);

    // accessibility
    const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusEls = modal.querySelectorAll(focusable);
    const firstFocusable = focusEls[0]; const lastFocusable = focusEls[focusEls.length-1];
    const prevFocus = document.activeElement;
    function trap(e){ if(e.key==='Tab'){ if(e.shiftKey && document.activeElement === firstFocusable){ e.preventDefault(); lastFocusable.focus(); } else if(!e.shiftKey && document.activeElement === lastFocusable){ e.preventDefault(); firstFocusable.focus(); } } if(e.key==='Escape'){ close(); } }
    function close(){ document.removeEventListener('keydown', trap); backdrop.remove(); prevFocus && prevFocus.focus(); }
    modal.querySelectorAll('.close-btn').forEach(b=>b.addEventListener('click', close));
    backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) close(); });
    document.addEventListener('keydown', trap);
    setTimeout(()=>{ if(firstFocusable) firstFocusable.focus(); else modal.focus(); },50);
    return { close };
  }

  // UI renderer for Games section -----------------------------------------
  function initGamesUI(){
    const container = document.getElementById('gamesContainer');
    if(!container) return;
    container.innerHTML = '';

    // Header / controls bar
    const header = document.createElement('div'); header.className = 'games-header';
    header.innerHTML = `
      <div class="games-title"><h2>Juegos de Actuación — PlayLab</h2><div class="games-sub">Improvisación, emoción, cuerpo y voz — genera, juega, guarda</div></div>
      <div class="games-controls">
        <label class="control-inline">Intensidad: <select id="gameIntensity"><option value="1">Suave</option><option value="2">Medio</option><option value="3">Alto</option></select></label>
        <label class="control-inline">Rol: <select id="roleMode"><option value="single">Individual</option><option value="pair">Parejas</option><option value="group">Grupo</option></select></label>
        <button id="openSaves" class="btn">Mis consignas</button>
      </div>
    `;
    container.appendChild(header);

    // Games grid
    const grid = document.createElement('div'); grid.className = 'games-grid';
    container.appendChild(grid);

    // Small factory: create a card for a game
    function makeGameCard({id, name, desc, renderControls}){
      const card = document.createElement('div'); card.className = 'game-card nextlevel';
      card.innerHTML = `
        <div class="game-card-header"><div class="game-name">${name}</div><div class="game-desc">${desc}</div></div>
        <div class="game-card-body" id="body-${id}"></div>
        <div class="game-card-footer"></div>
      `;
      const body = card.querySelector('.game-card-body');
      const footer = card.querySelector('.game-card-footer');
      // Render controls provided by game
      const controls = renderControls({renderTo: body, onSave: (obj)=>{ savePrompt(obj); pulse(card); }});
      footer.appendChild(controls);
      grid.appendChild(card);
    }

    // --- Game implementations ---------------------------------------------

    // 1. Tarjeta Random de Actor
    makeGameCard({ id:'tarjeta-random', name:'Tarjeta Random de Actor', desc:'Genera personaje, situación y emoción para improvisar.', renderControls: ({renderTo, onSave})=>{
      const wrap = document.createElement('div'); wrap.className='game-controls-row';
      const out = document.createElement('div'); out.className='game-output'; out.textContent = 'Pulsa Generar';
      const gen = document.createElement('button'); gen.className='small-btn'; gen.textContent='Generar';
      const copy = document.createElement('button'); copy.className='small-btn ghost'; copy.textContent='Copiar';
      const save = document.createElement('button'); save.className='small-btn'; save.textContent='Guardar';

      function renderVal(v){ out.innerHTML = `
        <div class="glow-title">${v.personaje}</div>
        <div class="muted">${v.situacion}</div>
        <div style="margin-top:8px"><strong>Emoción:</strong> ${v.emocion} · <strong>Acción:</strong> ${v.accion}</div>
      `; }

      gen.addEventListener('click', ()=>{
        const intensity = parseInt(document.getElementById('gameIntensity').value,10)||1;
        const personaje = pick(GamesData.characters);
        const situacion = pick(GamesData.situations);
        let emocion = pick(GamesData.emotions);
        // intensity affects emotional wording (simple heuristic)
        if(intensity===3) emocion += ' (amplificada)';
        const accion = pick(GamesData.actions);
        const val = { id: uid('tar'), personaje, situacion, emocion, accion, meta:{type:'tarjeta', intensity} };
        renderVal(val); pulse(gen);
        copy.onclick = ()=>{ navigator.clipboard && navigator.clipboard.writeText(`${personaje}\n${situacion}\n${emocion} · ${accion}`); copy.textContent='Copiado'; setTimeout(()=>copy.textContent='Copiar',900); };
        save.onclick = ()=>{ onSave({type:'tarjeta', created:Date.now(), payload:val}); save.textContent='Guardado'; setTimeout(()=>save.textContent='Guardar',900); };
      });

      wrap.appendChild(out); wrap.appendChild(gen); wrap.appendChild(copy); wrap.appendChild(save);
      renderTo.appendChild(wrap);
      return wrap;
    }});

    // 2. Cambio de Emocion en Escena
    makeGameCard({ id:'cambio-emocion', name:'Cambio de Emoción en Escena', desc:'Indica cambios de emoción durante una improvisación para trabajar transiciones.', renderControls: ({renderTo, onSave})=>{
      const wrap = document.createElement('div'); wrap.className='game-controls-row';
      const out = document.createElement('div'); out.className='game-output'; out.textContent = 'Genera una secuencia de emociones';
      const gen = document.createElement('button'); gen.className='small-btn'; gen.textContent='Generar secuencia';
      const lenInput = document.createElement('input'); lenInput.type='number'; lenInput.min='2'; lenInput.value='4'; lenInput.style.width='64px';
      const playTimer = document.createElement('button'); playTimer.className='small-btn ghost'; playTimer.textContent='Start timer';
      let seq = [];
      gen.addEventListener('click', ()=>{
        const n = Math.max(2, Math.min(8, parseInt(lenInput.value,10)||4));
        seq = Array.from({length:n}, ()=> pick(GamesData.emotions));
        out.innerHTML = `<div style="font-weight:700">Secuencia:</div> <ol>${seq.map(s=>`<li>${s}</li>`).join('')}</ol>`;
        pulse(gen);
      });
      // simple timer to cue emotion changes (30s default)
      playTimer.addEventListener('click', ()=>{
        const secs = 30; let i=0; if(!seq.length) return alert('Genera la secuencia primero');
        const modal = openModal({ title:'Timer de Cambios', html:`<div style="font-weight:700">Cambios cada ${secs}s</div><div id="change-output" style="margin-top:10px;font-size:18px">${seq[0]}</div>`, actions:[{label:'Cerrar', onClick: ()=>{}}] });
        const interval = setInterval(()=>{ i=(i+1)%seq.length; const el = document.getElementById('change-output'); if(el) el.textContent = seq[i]; }, secs*1000);
        // ensure interval cleared when modal closes
        const origClose = modal.close; modal.close = ()=>{ clearInterval(interval); origClose(); };
      });

      const save = document.createElement('button'); save.className='small-btn'; save.textContent='Guardar';
      save.addEventListener('click', ()=>{ if(!seq.length) return pulse(save); onSave({type:'cambio', created:Date.now(), payload:seq}); save.textContent='Guardado'; setTimeout(()=>save.textContent='Guardar',900); });
      wrap.appendChild(out); wrap.appendChild(lenInput); wrap.appendChild(gen); wrap.appendChild(playTimer); wrap.appendChild(save);
      renderTo.appendChild(wrap);
      return wrap;
    }});

    // 3. Escena con Objetos Imaginarios
    makeGameCard({ id:'objetos-imaginarios', name:'Escena con Objetos Imaginarios', desc:'Asigna un objeto y una acción para trabajar con cuerpo y voz.', renderControls: ({renderTo, onSave})=>{
      const wrap = document.createElement('div'); wrap.className='game-controls-row';
      const out = document.createElement('div'); out.className='game-output'; out.textContent='Pulsa Generar';
      const gen = document.createElement('button'); gen.className='small-btn'; gen.textContent='Generar objeto';
      const intensitySelect = document.createElement('select'); intensitySelect.innerHTML = '<option value="1">Suave</option><option value="2">Medio</option><option value="3">Intenso</option>';
      gen.addEventListener('click', ()=>{
        const obj = pick(GamesData.objects);
        const uso = pick(GamesData.actions);
        const instru = 'Definan el objeto en 30s luego integren su uso en la escena.';
        out.innerHTML = `<div style="font-weight:700">${obj}</div><div style="color:var(--muted)">Uso sugerido: ${uso}</div><div style="margin-top:6px;color:var(--muted)">${instru}</div>`;
        pulse(gen);
      });
      const copy = document.createElement('button'); copy.className='small-btn ghost'; copy.textContent='Copiar';
      copy.addEventListener('click', ()=>{ navigator.clipboard && navigator.clipboard.writeText(out.textContent||''); copy.textContent='Copiado'; setTimeout(()=>copy.textContent='Copiar',900); });
      const save = document.createElement('button'); save.className='small-btn'; save.textContent='Guardar'; save.addEventListener('click', ()=>{ onSave({type:'objeto', created:Date.now(), payload:out.textContent}); save.textContent='Guardado'; setTimeout(()=>save.textContent='Guardar',900); });
      wrap.appendChild(out); wrap.appendChild(intensitySelect); wrap.appendChild(gen); wrap.appendChild(copy); wrap.appendChild(save);
      renderTo.appendChild(wrap); return wrap;
    }});

    // 4. Cadena de Historias
    makeGameCard({ id:'cadena-historias', name:'Cadena de Historias', desc:'Genera una palabra inicial para una cadena narrativa en grupo.', renderControls: ({renderTo, onSave})=>{
      const wrap = document.createElement('div'); wrap.className='game-controls-row';
      const out = document.createElement('div'); out.className='game-output'; out.textContent='Pulsa Generar';
      const gen = document.createElement('button'); gen.className='small-btn'; gen.textContent='Generar inicio';
      const constraint = document.createElement('select'); constraint.innerHTML = '<option value="none">Sin restricción</option><option value="accion">Usar acción</option><option value="emoción">Usar emoción</option>';
      gen.addEventListener('click', ()=>{
        const start = pick(GamesData.words);
        const constr = constraint.value;
        out.innerHTML = `<div style="font-weight:700">Inicio: ${start}</div><div style="color:var(--muted)">Restricción: ${constr}</div>`;
        pulse(gen);
      });
      const save = document.createElement('button'); save.className='small-btn'; save.textContent='Guardar'; save.addEventListener('click', ()=>{ onSave({type:'cadena', created:Date.now(), payload:out.textContent}); save.textContent='Guardado'; setTimeout(()=>save.textContent='Guardar',900); });
      wrap.appendChild(out); wrap.appendChild(constraint); wrap.appendChild(gen); wrap.appendChild(save);
      renderTo.appendChild(wrap); return wrap;
    }});

    // 5. Improvisación de Conflicto
    makeGameCard({ id:'impro-conflicto', name:'Improvisación de Conflicto', desc:'Genera conflictos y roles para explorar oposición y resolución.', renderControls: ({renderTo, onSave})=>{
      const wrap = document.createElement('div'); wrap.className='game-controls-row';
      const out = document.createElement('div'); out.className='game-output'; out.textContent='Pulsa Generar';
      const gen = document.createElement('button'); gen.className='small-btn'; gen.textContent='Generar conflicto';
      gen.addEventListener('click', ()=>{
        const conflicto = pick(GamesData.conflicts);
        const roles = sample(GamesData.characters, 2);
        out.innerHTML = `<div style="font-weight:700">Conflicto: ${conflicto}</div><div style="color:var(--muted)">Roles: ${roles.join(' vs ')}</div>`;
        pulse(gen);
      });
      const save = document.createElement('button'); save.className='small-btn'; save.textContent='Guardar'; save.addEventListener('click', ()=>{ onSave({type:'conflicto', created:Date.now(), payload:out.textContent}); save.textContent='Guardado'; setTimeout(()=>save.textContent='Guardar',900); });
      wrap.appendChild(out); wrap.appendChild(gen); wrap.appendChild(save);
      renderTo.appendChild(wrap); return wrap;
    }});

    // Footer / saves panel
    const savesBtn = header.querySelector('#openSaves');
    savesBtn.addEventListener('click', ()=>{
      const saves = loadSaves();
      if(!saves.length) return alert('No hay consignas guardadas');
      const html = `<div style="max-height:60vh;overflow:auto">${saves.map(s=>`<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.02);margin-bottom:6px"><div style="font-weight:700">${s.type}</div><div style="color:var(--muted);font-size:13px">${new Date(s.created).toLocaleString()}</div><pre style="white-space:pre-wrap;margin-top:6px">${typeof s.payload==='string'? s.payload : JSON.stringify(s.payload,null,2)}</pre><div style="margin-top:6px;display:flex;gap:8px"><button class="small-btn" data-idx="${s.created}">Copiar</button><button class="small-btn ghost" data-del="${s.created}">Eliminar</button></div></div>`).join('')}</div>`;
      const modal = openModal({ title:'Mis consignas guardadas', html, actions:[] });
      // wire copy/delete
      setTimeout(()=>{
        document.querySelectorAll('[data-idx]').forEach(b=> b.addEventListener('click', (e)=>{ const idx = b.dataset.idx; const item = loadSaves().find(x=>x.created==idx); if(item){ navigator.clipboard && navigator.clipboard.writeText(typeof item.payload==='string'? item.payload : JSON.stringify(item.payload)); alert('Copiado'); } }));
        document.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', (e)=>{ const id = b.dataset.del; const arr = loadSaves().filter(x=>x.created!=id); localStorage.setItem(GAMES_SAVE_KEY, JSON.stringify(arr)); alert('Eliminado'); modal.close(); }));
      },50);
    });

    // initial micro-entrance animation
    setTimeout(()=> grid.classList.add('in'), 30);
  }

  // expose initializer
  window.initGamesUI = initGamesUI;

})();
