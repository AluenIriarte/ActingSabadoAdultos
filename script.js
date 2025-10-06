// Gestor de Teatro - main logic
document.addEventListener('DOMContentLoaded', () => {
  const plays = window.defaultPlays || [];
  const actors = window.defaultActors || [];

  // Cached DOM
  const actorsList = document.getElementById('actorsList');
  const playsList = document.getElementById('playsList');
  const actorSearch = document.getElementById('actorSearch');
  const playsSort = document.getElementById('playsSort');
  const playsSearch = document.getElementById('playsSearch');
  const attendanceList = document.getElementById('attendanceList');
  const generateBtn = document.getElementById('generateClase');
  const claseResult = document.getElementById('claseResult');
  const claseStats = document.getElementById('claseStats');

  // Tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.hidden = p.id !== tab;
      });
      // when opening tabs, re-render relevant panels
      if(tab==='actores'){ renderActorsOverview(actorSearch.value); }
      if(tab==='obras'){ renderPlaysOverview(playsSort.value); }
      if(tab==='clase'){ renderClaseDeHoy(); }
      if(tab==='juegos'){ if(typeof initGamesUI==='function') initGamesUI(); }
    });
  });

  // Helper: get actor stats
  function getActorStats(actorName){
    const obrasUno = plays.filter(p => p.maxActors===1 && p.actores.includes(actorName)).map(p=>p.title);
    const obrasDuo = plays.filter(p => p.maxActors===2 && p.actores.includes(actorName)).map(p=>p.title);
    const obrasTrio = plays.filter(p => p.maxActors===3 && p.actores.includes(actorName)).map(p=>p.title);
    const total = obrasUno.length + obrasDuo.length + obrasTrio.length;
    return { ones: obrasUno.length, duos: obrasDuo.length, trios: obrasTrio.length, total, obrasUno, obrasDuo, obrasTrio };
  }

  // Render actors overview
  function renderActorsOverview(filter=''){
    actorsList.innerHTML='';
    const names = actors.map(a=>a.name).filter(n=>n.toLowerCase().includes(filter.toLowerCase()));
    names.forEach(name => {
      const s = getActorStats(name);
      const el = document.createElement('article');
      el.className='actor-card';
  // Build colored play chips showing if play is solo, duo or trio (1,2,3)
  const onePlays = plays.filter(p=>p.maxActors===1 && p.actores.includes(name)).map(p=>`<div class="play-chip chip-one">${p.title}</div>`);
  const twoPlays = plays.filter(p=>p.maxActors===2 && p.actores.includes(name)).map(p=>`<div class="play-chip chip-two">${p.title}</div>`);
  const threePlays = plays.filter(p=>p.maxActors===3 && p.actores.includes(name)).map(p=>`<div class="play-chip chip-three">${p.title}</div>`);
  const playChips = [...onePlays, ...twoPlays, ...threePlays];

      el.innerHTML = `
        <div class="actor-top">
          <div class="actor-name">${name}</div>
          <div>
            <span class="count-badge one">${s.ones}</span>
            <span class="count-badge two" style="margin-left:6px">${s.duos}</span>
            <span class="count-badge three" style="margin-left:6px">${s.trios}</span>
          </div>
        </div>
        <div class="actor-stats">
          <div class="stat">Total: ${s.total}</div>
        </div>
        <div style="margin-top:12px">
          <div style="font-weight:600;margin-bottom:6px">Obras</div>
          <div class="play-list">${playChips.join('') || '<div class="play-chip">—</div>'}</div>
          <div style="margin-top:8px;color:var(--muted);font-size:13px">Solo: ${s.ones} · Obras de a 2: ${s.duos} · Obras de a 3: ${s.trios}</div>
        </div>
      `;
      actorsList.appendChild(el);
    });
  }

  // Render plays overview (shows solos, parejas y trios; cards are color-coded by size)
  function renderPlaysOverview(sort='default'){
    playsList.innerHTML='';
    let list = [...plays];
    const search = playsSearch ? playsSearch.value.trim().toLowerCase() : '';
    if(sort==='genre') list.sort((a,b)=> a.genre.localeCompare(b.genre));
    if(sort==='actors') list.sort((a,b)=> a.maxActors - b.maxActors);
    if(search){
      list = list.filter(p => p.title.toLowerCase().includes(search) || p.actores.join(' ').toLowerCase().includes(search));
    }

    const ones = list.filter(p=>p.maxActors===1);
    const twos = list.filter(p=>p.maxActors===2);
    const threes = list.filter(p=>p.maxActors===3);

    function makeCard(p){
      const el = document.createElement('article');
      const cls = p.maxActors===1 ? 'one' : (p.maxActors===2 ? 'two' : 'three');
      el.className = `play-card ${cls}`;
      const badgeClass = p.genre === 'comedy' ? 'comedy' : 'drama';
      const soloBadge = p.maxActors===1 ? `<span class="play-meta-solo">SOLO</span>` : '';
      el.innerHTML = `\n        <div class="left">\n          <div class="play-title">${p.title} ${soloBadge}</div>\n          <div style="margin-top:6px"><span class="badge ${badgeClass}">${p.genre}</span> · Actores: <strong>${p.actores.length}</strong></div>\n          <div class="actor-list">${p.actores.join(', ')}</div>\n        </div>\n      `;
      return el;
    }

    // Render solos (1 actor)
    if(ones.length){
      const blockOne = document.createElement('div');
      blockOne.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-weight:700">Obras de 1 (Solo)</div><div style="color:var(--muted)">Total: ${ones.length}</div></div>`;
      const gridOne = document.createElement('div');
      gridOne.className='plays-subgrid';
      ones.forEach(p=> gridOne.appendChild(makeCard(p)));
      playsList.appendChild(blockOne);
      playsList.appendChild(gridOne);
    }

    // Render parejas (2)
    const blockTwo = document.createElement('div');
    blockTwo.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-weight:700">Obras de a 2</div><div style="color:var(--muted)">Total: ${twos.length}</div></div>`;
    const gridTwo = document.createElement('div');
    gridTwo.className='plays-subgrid';
    twos.forEach(p=> gridTwo.appendChild(makeCard(p)));
    playsList.appendChild(blockTwo);
    playsList.appendChild(gridTwo);

    // Render trios (3)
    const blockThree = document.createElement('div');
    blockThree.style.marginTop='18px';
    blockThree.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-weight:700">Obras de a 3</div><div style="color:var(--muted)">Total: ${threes.length}</div></div>`;
    const gridThree = document.createElement('div');
    gridThree.className='plays-subgrid';
    threes.forEach(p=> gridThree.appendChild(makeCard(p)));
    playsList.appendChild(blockThree);
    playsList.appendChild(gridThree);
  }

  // Render Clase De Hoy attendance list
  function renderAttendance(){
    attendanceList.innerHTML='';
    actors.forEach(a => {
      const item = document.createElement('div');
      item.className='attendance-item selected';
      item.dataset.name = a.name;
      const initials = a.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
      item.innerHTML = `
        <div class="initials">${initials}</div>
        <div class="name">${a.name}</div>
        <div class="meta">${plays.filter(p=>p.actores.includes(a.name)).length} obras</div>
      `;
      // click toggles selection
      item.addEventListener('click', ()=>{
        item.classList.toggle('selected');
        updateClaseStats();
      });
      // tooltip on hover (title)
      item.title = plays.filter(p=>p.actores.includes(a.name)).map(p=>p.title).join('\n') || '—';
      attendanceList.appendChild(item);
    });
    updateClaseStats();
  }

  // Render the whole "Clase de Hoy" tab (public)
  function renderClaseDeHoy(){
    renderAttendance();
    // Auto-generate the class using present actors by default
    const res = generateRandomClase('init');
    if(res) updateLastGenInfo();
  }

  function openPlayDetailModal(p){
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="modal-header"><div style="font-weight:700">${p.title}</div><button class="close-btn">Cerrar</button></div>
      <div class="modal-body">
        <div style="margin-bottom:8px;color:var(--muted)"><strong>Género:</strong> ${p.genre} · <strong>Actores:</strong> ${p.actores.length}</div>
        <div style="font-weight:600;margin-bottom:6px">Reparto</div>
        <div style="margin-bottom:10px">${p.actores.join('<br/>')}</div>
        <div style="margin-top:8px;color:var(--muted)">${p.info || ''}</div>
      </div>
    `;
    openAccessibleModal(content);
  }

  // Accessible modal helper: receives a content element (HTMLElement) and shows modal with focus trap and ESC close
  function openAccessibleModal(contentEl){
    const backdrop = document.createElement('div'); backdrop.className='modal-backdrop fade-in'; backdrop.setAttribute('role','dialog'); backdrop.setAttribute('aria-modal','true');
    const modal = document.createElement('div'); modal.className='modal';
    // ensure content has close button
    const close = contentEl.querySelector('.close-btn');
    if(!close){
      const btn = document.createElement('button'); btn.className='close-btn'; btn.textContent='Cerrar';
      const header = contentEl.querySelector('.modal-header'); if(header) header.appendChild(btn); else contentEl.insertBefore(btn, contentEl.firstChild);
    }
    modal.appendChild(contentEl);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const focusable = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusEls = modal.querySelectorAll(focusable);
    const firstFocusable = focusEls[0]; const lastFocusable = focusEls[focusEls.length-1];
    function trap(e){
      if(e.key === 'Tab'){
        if(e.shiftKey && document.activeElement === firstFocusable){ e.preventDefault(); lastFocusable.focus(); }
        else if(!e.shiftKey && document.activeElement === lastFocusable){ e.preventDefault(); firstFocusable.focus(); }
      }
      if(e.key === 'Escape'){ closeModal(); }
    }
    function closeModal(){ document.removeEventListener('keydown', trap); backdrop.remove(); prevFocus && prevFocus.focus(); }
    const prevFocus = document.activeElement;
    document.addEventListener('keydown', trap);
    // close buttons and backdrop click
    modal.querySelectorAll('.close-btn').forEach(b=> b.addEventListener('click', closeModal));
    backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) closeModal(); });
    // focus first
    setTimeout(()=>{ if(firstFocusable) firstFocusable.focus(); else modal.focus(); },50);
  }

  // Print-friendly export for clase result
  function exportClasePrint(){
    const w = window.open('','_blank');
    w.document.write('<html><head><title>Reparto - Clase</title>');
    w.document.write('<style>body{font-family:Arial,Helvetica,sans-serif;padding:20px} .clase-scene{margin-bottom:12px;padding:10px;border:1px solid #ddd;border-radius:8px}</style>');
    w.document.write('</head><body>');
    w.document.write('<h2>Reparto - Clase</h2>');
    w.document.write(claseResult.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  }

  function getPresentActors(){
    // read from attendance-item.selected elements
    const nodes = Array.from(attendanceList.querySelectorAll('.attendance-item.selected'));
    if(nodes.length) return nodes.map(n=>n.dataset.name);
    // fallback to actors list if none selected
    return actors.map(a=>a.name);
  }

  function updateClaseStats(selectedCount=0){
    // claseStats element may have been removed from the layout; guard it
    if(!claseStats) return;
    const present = getPresentActors().length || actors.length;
    claseStats.innerHTML = `<div class="stat-pill">Actores presentes: ${present}</div><div class="stat-pill">Obras seleccionadas hoy: ${selectedCount}</div>`;
  }

  // Try to find an exact cover (use all present actors exactly once) using randomized backtracking
  function findExactCover(presentArr, candidates, maxAttempts=200){
    // presentArr: array of actor names
    const presentSet = new Set(presentArr);
    // candidates filtered to those fully within presentSet
    const pool = candidates.filter(p => p.actores.every(a => presentSet.has(a)));

    // map actor -> plays that include them
    const actorToPlays = {};
    presentArr.forEach(a => actorToPlays[a]=[]);
    pool.forEach(p => p.actores.forEach(a => { if(actorToPlays[a]) actorToPlays[a].push(p); }));

    // Backtracking search: choose an actor with fewest options first
    function search(remainingSet, chosen){
      if(remainingSet.size===0) return chosen.slice();
      // pick actor with fewest candidate plays
      let pick = null; let options = null;
      for(const a of remainingSet){
        const opts = actorToPlays[a].filter(p => p.actores.every(x=>remainingSet.has(x)));
        if(opts.length===0) return null; // dead end
        if(pick===null || opts.length < options.length){ pick = a; options = opts; }
      }

      // randomize evaluation order
      const shuffled = options.slice().sort(()=>Math.random()-0.5);
      for(const p of shuffled){
        // choose p
        const nextRemaining = new Set(remainingSet);
        p.actores.forEach(a=>nextRemaining.delete(a));
        chosen.push(p);
        const res = search(nextRemaining, chosen);
        if(res) return res;
        chosen.pop();
      }
      return null;
    }

    // Try multiple randomized attempts to get different covers
    for(let attempt=0; attempt<maxAttempts; attempt++){
      // shuffle pool to vary actorToPlays ordering
      pool.sort(()=>Math.random()-0.5);
      // rebuild actorToPlays optionally randomized
      presentArr.forEach(a => actorToPlays[a] = pool.filter(p=>p.actores.includes(a)));
      const result = search(new Set(presentArr), []);
      if(result) return result;
    }
    return null;
  }

  // Generate random class combos following the rule: use ALL present actors exactly once if possible
  // Keep a fingerprint of last result to try to generate different covers on repeated clicks
  let lastClaseFingerprint = '';
  // Scenes the user chose to preserve (locked)
  let lockedScenes = [];
  // Last rendered scenes (objects) for handler lookup
  let lastRenderedScenes = [];
  function fingerprintCover(arr){
    if(!arr) return '';
    return arr.map(p=>p.id).sort().join('|');
  }
  function generateRandomClase(mode='init', preserveLocked=true){
    const present = getPresentActors();
    if(present.length===0){
      claseResult.innerHTML = `<div class="clase-empty">No hay actores presentes.</div>`;
      updateClaseStats(0);
      return [];
    }

    if(mode === 'init') lastClaseFingerprint = '';

    // Determine locked actors to preserve (if any)
    const lockedActorSet = new Set();
    if(preserveLocked && lockedScenes && lockedScenes.length){
      lockedScenes.forEach(s=> s.actores && s.actores.forEach(a=> lockedActorSet.add(a)));
    }

    // Build candidate pools
    const candidatesAll = plays.filter(p => p.actores.every(a => present.includes(a)));
    const remainingPresent = present.filter(a => !lockedActorSet.has(a));
    const candidatesRemaining = plays.filter(p => p.actores.every(a => remainingPresent.includes(a)));

    // Try exact cover on remaining actors (or on all if none locked)
    const pool = (lockedActorSet.size ? candidatesRemaining : candidatesAll);
    const target = (lockedActorSet.size ? remainingPresent : present);

    let cover = null; const maxTrials = 6;
    for(let t=0;t<maxTrials;t++){
      cover = findExactCover(target, pool, 300);
      const fp = fingerprintCover(cover);
      if(fp && fp !== lastClaseFingerprint){ lastClaseFingerprint = fp; break; }
      cover = null;
    }

  if(!cover){
      // Best-effort greedy on pool
      const greedyRes = (()=>{
        const used = new Set(); const sel = [];
        pool.slice().sort(()=>Math.random()-0.5).forEach(p=>{
          if(p.actores.some(a=>used.has(a))) return;
          p.actores.forEach(a=>used.add(a)); sel.push(p);
        });
        return { sel, used };
      })();

      // Missing actors after greedy
      const usedSet = greedyRes.used || new Set();
      const missing = target.filter(a => !usedSet.has(a));

      // If missing, optionally build adhoc partitions preferring 5/4 when odd — only when allowAdhoc is checked
      const adhocScenes = [];
      const allowAdhocEl = document.getElementById('allowAdhoc');
      const allowAdhoc = allowAdhocEl ? !!allowAdhocEl.checked : false;
      if(missing.length && allowAdhoc){
        const makePartitions = (arr)=>{
          const s = arr.slice(); const groups = [];
          while(s.length){
            const rem = s.length;
            if(rem === 5 || rem === 9 || rem === 13) groups.push(s.splice(0,5));
            else if(rem % 4 === 0 || rem > 6) groups.push(s.splice(0,4));
            else if(rem === 3) groups.push(s.splice(0,3));
            else groups.push(s.splice(0,2));
          }
          return groups;
        };
        const parts = makePartitions(missing);
        parts.forEach((grp, idx)=>{
          adhocScenes.push({ id: 'adhoc-'+Date.now()+'-'+idx, title: `Escena ${idx+1}`, actores: grp.slice(), roles: grp.map(a=>({name:a})), genre: 'drama' });
        });
      }

      if(missing.length && !allowAdhoc){
        // Inform user that some actors couldn't be covered and adhoc is disabled
        claseResult.innerHTML += `<div class="clase-empty">No se pudieron cubrir ${missing.length} actor(es) con las obras existentes. Activa "Permitir escenas nuevas" para generar escenas ad-hoc.</div>`;
      }

      const finalSel = (greedyRes.sel || []).concat(adhocScenes);
      const resultScenes = (lockedScenes && lockedScenes.length) ? lockedScenes.concat(finalSel) : finalSel;
      lastRenderedScenes = resultScenes.slice();
      claseResult.innerHTML = renderCoverToHTML(resultScenes);
      attachSceneHandlers();
      updateClaseStats(resultScenes.length);
      lastClaseFingerprint = fingerprintCover(resultScenes);
      // Clear one-time locks after generation (they only apply during the generation event)
      setTimeout(()=>{
        lockedScenes = [];
        document.querySelectorAll('#claseResult .clase-scene.locked').forEach(n=> n.classList.remove('locked'));
      }, 80);
      return resultScenes;
    }

    // success: we have an exact cover for target; combine with locked scenes
    const coverScenes = cover;
    const resultScenes = (lockedScenes && lockedScenes.length) ? lockedScenes.concat(coverScenes) : coverScenes;
    lastRenderedScenes = resultScenes.slice();
    claseResult.innerHTML = renderCoverToHTML(resultScenes);
    attachSceneHandlers();
    updateClaseStats(resultScenes.length);
    lastClaseFingerprint = fingerprintCover(resultScenes);
    // Clear one-time locks after generation
    setTimeout(()=>{
      lockedScenes = [];
      document.querySelectorAll('#claseResult .clase-scene.locked').forEach(n=> n.classList.remove('locked'));
    }, 80);
    return coverScenes;
  }

  function renderCoverToHTML(selected){
    const container = document.createElement('div');
    container.style.marginTop = '10px';
    selected.forEach((s, idx) => {
      const scene = document.createElement('div');
      scene.className = 'clase-scene';
      // mark locked if present
      if(lockedScenes.find(ls=> ls.id === s.id)) scene.classList.add('locked');
      scene.setAttribute('data-id', s.id);
      const personas = s.roles ? s.roles.map(r=>`<strong>${r.name}</strong> <span style="color:var(--muted)">(${r.role})</span>`).join('<br/>') : (s.actores? s.actores.map(a=>`<strong>${a}</strong>`).join('<br/>') : '');
      scene.innerHTML = `
        <div class="left">
          <div class="title">${s.title}</div>
          <div class="meta">${personas}</div>
        </div>
      `;
      container.appendChild(scene);
    });

    return container.outerHTML;


  // Attach click handlers to scenes rendered in #claseResult: toggle lock on click
  function attachSceneHandlers(){
    const nodes = Array.from(document.querySelectorAll('#claseResult .clase-scene'));
    nodes.forEach(n => {
      n.style.cursor = 'pointer';
      n.onclick = () => {
        const id = n.getAttribute('data-id');
        // find scene object in lastRenderedScenes
        const sceneObj = lastRenderedScenes.find(s=> s.id === id);
        if(!sceneObj) return;
        const idx = lockedScenes.findIndex(ls=> ls.id === id);
        if(idx === -1){
          lockedScenes.push(sceneObj);
        } else {
          lockedScenes.splice(idx,1);
        }
        // re-generate preserving locked scenes
        generateRandomClase('init', true);
      };
    });
  }
    return container.outerHTML;
  }

  // Event wiring
  actorSearch.addEventListener('input', e => renderActorsOverview(e.target.value));
  playsSort.addEventListener('change', e => renderPlaysOverview(e.target.value));
  if(playsSearch) playsSearch.addEventListener('input', ()=> renderPlaysOverview(playsSort.value));
  generateBtn.addEventListener('click', () => {
    // explicit full regenerate and allow same fingerprint to be replaced
    const res = generateRandomClase('init');
    if(res) updateLastGenInfo();
  });

  // Select all / deselect all attendance button
  const selectAllBtn = document.getElementById('selectAllAttendance');
  if(selectAllBtn){
    // initialize label
    selectAllBtn.textContent = 'Seleccionar todos';
    selectAllBtn.addEventListener('click', ()=>{
      const anyUnselected = Array.from(attendanceList.querySelectorAll('.attendance-item')).some(n=>!n.classList.contains('selected'));
      attendanceList.querySelectorAll('.attendance-item').forEach(n=> n.classList.toggle('selected', anyUnselected));
      selectAllBtn.textContent = anyUnselected ? 'Deseleccionar todos' : 'Seleccionar todos';
      updateClaseStats();
    });
  }

  // Timer (classTimerToggle) - digital hh:mm:ss
  let classTimerId = null; let classSeconds = 0; let classRunning = false;
  const classTimerDisplay = document.getElementById('classTimerDisplay');
  const classTimerToggle = document.getElementById('classTimerToggle');
  const classDurationEl = document.getElementById('classDuration');

  function formatTime(sec){ const h = Math.floor(sec/3600); const m = Math.floor((sec%3600)/60); const s = sec%60; return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}` }

  function tickClassTimer(){ classSeconds++; classTimerDisplay.textContent = formatTime(classSeconds); }

  if(classTimerToggle){
    classTimerToggle.addEventListener('click', ()=>{
      const presetEl = document.getElementById('timerPreset');
      const preset = presetEl ? parseInt(presetEl.value,10) : null;
      if(!classRunning){
        // start: if preset provided, run countdown; else free-run
        classRunning = true; classTimerToggle.setAttribute('aria-pressed','true');
        if(preset){
          // run countdown for preset minutes
          classSeconds = 0;
          let remaining = preset * 60;
          classTimerDisplay.textContent = formatTime(remaining);
          classTimerId = setInterval(()=>{
            remaining -= 1;
            classTimerDisplay.textContent = formatTime(remaining);
            if(remaining<=0){ clearInterval(classTimerId); classTimerId=null; classRunning=false; classTimerToggle.setAttribute('aria-pressed','false'); classDurationEl.textContent = 'Finalizado ✅'; }
          },1000);
        } else {
          classTimerId = setInterval(tickClassTimer,1000);
        }
      } else {
        // stop any running timer
        classRunning = false; classTimerToggle.setAttribute('aria-pressed','false');
        if(classTimerId) clearInterval(classTimerId); classTimerId = null;
        classDurationEl.textContent = 'Duración total: ' + Math.floor(classSeconds/60) + ' min';
      }
    });
  }

  // Ensure actors render on first load (don't require clicking tab)
  renderActorsOverview();

  reshuffleBtn.addEventListener('click', () => {
    // try to produce a visibly different result from lastClaseFingerprint.
    // Strategy: if last result was adhoc groups, just reshuffle roles inside scenes;
    // otherwise force another exact-cover search with a higher randomness seed.
    // We'll attempt a local reshuffle first to avoid repeating the same output.
    const currentHTML = claseResult.innerHTML;
    // if we have lastClaseFingerprint and claseResult contains scenes, try to permute roles locally
    if(currentHTML && currentHTML.indexOf('clase-scene') !== -1){
      try{
        // parse DOM fragment and shuffle roles within each scene if present
        const wrapper = document.createElement('div'); wrapper.innerHTML = currentHTML;
        const scenes = wrapper.querySelectorAll('.clase-scene');
        let changed = false;
        scenes.forEach(sceneEl => {
          const meta = sceneEl.querySelector('.meta');
          if(meta && meta.innerHTML.indexOf('<strong>')!==-1){
            // pick lines and shuffle order
            const lines = meta.innerHTML.split('<br/>');
            if(lines.length>1){
              const shuffled = lines.sort(()=>Math.random()-0.5).join('<br/>');
              meta.innerHTML = shuffled; changed = true;
            }
          }
        });
        if(changed){ claseResult.innerHTML = wrapper.innerHTML; return; }
      }catch(e){ /* ignore and fallback */ }
    }

    // fallback: run generateRandomClase with 'reshuffle' which tries to produce a different cover
    const res = generateRandomClase('reshuffle');
    if(res) updateLastGenInfo();
  });

  // Export button removed from UI (handled by removal in HTML)

  // Templates (localStorage)
  const templatesKey = 'teatro_templates_v1';
  const templatesListEl = document.getElementById('templatesList');
  function loadTemplates(){
    const raw = localStorage.getItem(templatesKey);
    try{ return raw ? JSON.parse(raw) : []; }catch(e){return []}
  }
  function saveTemplates(arr){ localStorage.setItem(templatesKey, JSON.stringify(arr)); renderTemplates(); }
  function renderTemplates(){
    const tpls = loadTemplates();
    templatesListEl.innerHTML='';
    tpls.forEach((t, i)=>{
      const b = document.createElement('div'); b.className='tpl'; b.textContent = t.name;
      b.addEventListener('click', ()=>{
        // apply template: set timer minutes and other flags
        if(t.minutes) document.getElementById('timerMinutes').value = t.minutes;
      });
      const rm = document.createElement('button'); rm.className='small-btn ghost'; rm.textContent='x'; rm.style.marginLeft='8px';
      rm.addEventListener('click',(e)=>{ e.stopPropagation(); const arr = loadTemplates(); arr.splice(i,1); saveTemplates(arr); });
      b.appendChild(rm);
      templatesListEl.appendChild(b);
    });
  }
  // Save template UI removed (buttons removed). Templates still load/save via functions if needed.
  renderTemplates();

  // Last generation info
  function updateLastGenInfo(){
    const el = document.getElementById('lastGenInfo'); if(!el) return;
    const now = new Date(); el.textContent = 'Última generación: ' + now.toLocaleString();
  }

  // Timer
  let timerId = null; let remaining = 0;
  const startTimerBtn = document.getElementById('startTimer');
  const stopTimerBtn = document.getElementById('stopTimer');
  function tick(){
    if(remaining<=0){ clearInterval(timerId); timerId=null; alert('Tiempo terminado'); return; }
    remaining--; const m = Math.floor(remaining/60); const s = remaining%60; stopTimerBtn.textContent = `${m}:${s.toString().padStart(2,'0')}`;
  }
  if(startTimerBtn){ startTimerBtn.addEventListener('click', ()=>{
    const mins = parseInt(document.getElementById('timerMinutes').value,10) || 10; remaining = mins*60; if(timerId) clearInterval(timerId);
    timerId = setInterval(tick,1000); tick();
  }); }
  if(stopTimerBtn) stopTimerBtn.addEventListener('click', ()=>{ if(timerId) clearInterval(timerId); timerId=null; stopTimerBtn.textContent='Detener'; });

  // Initialize
  renderActorsOverview();
  renderPlaysOverview();
  renderClaseDeHoy();

  // Expose helper for debugging
  window.getActorStats = getActorStats;
  window.generateRandomClase = generateRandomClase;
  window.renderActorsOverview = renderActorsOverview;
  window.renderPlaysOverview = renderPlaysOverview;
  window.renderClaseDeHoy = renderClaseDeHoy;
});
