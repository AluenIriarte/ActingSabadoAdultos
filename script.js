// Gestor de Teatro - main logic
document.addEventListener('DOMContentLoaded', () => {
  const plays = window.defaultPlays || [];
  const actors = window.defaultActors || [];

  // Cached DOM
  const actorsList = document.getElementById('actorsList');
  const playsList = document.getElementById('playsList');
  const actorSearch = document.getElementById('actorSearch');
  const playsSort = document.getElementById('playsSort');
  const attendanceList = document.getElementById('attendanceList');
  const generateBtn = document.getElementById('generateClase');
  const reshuffleBtn = document.getElementById('reshuffleClase');
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
    const obrasDuo = plays.filter(p => p.maxActors===2 && p.actores.includes(actorName)).map(p=>p.title);
    const obrasTrio = plays.filter(p => p.maxActors===3 && p.actores.includes(actorName)).map(p=>p.title);
    return {duos: obrasDuo.length, trios: obrasTrio.length, total: obrasDuo.length + obrasTrio.length, obrasDuo, obrasTrio};
  }

  // Render actors overview
  function renderActorsOverview(filter=''){
    actorsList.innerHTML='';
    const names = actors.map(a=>a.name).filter(n=>n.toLowerCase().includes(filter.toLowerCase()));
    names.forEach(name => {
      const s = getActorStats(name);
      const el = document.createElement('article');
      el.className='actor-card';
      // Build colored play chips showing if play is duo or trio, ordered: 2 then 3
      const twoPlays = plays.filter(p=>p.maxActors===2 && p.actores.includes(name)).map(p=>`<div class="play-chip chip-two">${p.title}</div>`);
      const threePlays = plays.filter(p=>p.maxActors===3 && p.actores.includes(name)).map(p=>`<div class="play-chip chip-three">${p.title}</div>`);
      const playChips = [...twoPlays, ...threePlays];

      el.innerHTML = `
        <div class="actor-top">
          <div class="actor-name">${name}</div>
          <div>
            <span class="count-badge two">${s.duos}</span>
            <span class="count-badge three" style="margin-left:6px">${s.trios}</span>
          </div>
        </div>
        <div class="actor-stats">
          <div class="stat">Total: ${s.total}</div>
        </div>
        <div style="margin-top:12px">
          <div style="font-weight:600;margin-bottom:6px">Obras</div>
          <div class="play-list">${playChips.join('') || '<div class="play-chip">—</div>'}</div>
          <div style="margin-top:8px;color:var(--muted);font-size:13px">Obras de a 2: ${s.duos} · Obras de a 3: ${s.trios}</div>
        </div>
      `;
      actorsList.appendChild(el);
    });
  }

  // Render plays overview
  function renderPlaysOverview(sort='default'){
    playsList.innerHTML='';
    let list = [...plays];
    if(sort==='genre') list.sort((a,b)=> a.genre.localeCompare(b.genre));
    if(sort==='actors') list.sort((a,b)=> a.maxActors - b.maxActors);

    const twos = list.filter(p=>p.maxActors===2);
    const threes = list.filter(p=>p.maxActors===3);

    const blockTwo = document.createElement('div');
    blockTwo.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-weight:700">Obras de a 2</div><div style="color:var(--muted)">Total: ${twos.length}</div></div>`;
    const gridTwo = document.createElement('div');
    gridTwo.className='plays-subgrid';
    twos.forEach(p=>{
      const el = document.createElement('article');
      el.className='play-card two';
      const badgeClass = p.genre === 'comedy' ? 'comedy' : 'drama';
      el.innerHTML = `
        <div class="play-title">${p.title}</div>
        <div><span class="badge ${badgeClass}">${p.genre}</span></div>
        <div style="margin-top:8px">Actores: <strong>${p.actores.length}</strong></div>
        <div class="actor-list">${p.actores.join(', ')}</div>
        <div class="play-count-pill two">2</div>
      `;
      gridTwo.appendChild(el);
    });
    playsList.appendChild(blockTwo);
    playsList.appendChild(gridTwo);

    const blockThree = document.createElement('div');
    blockThree.style.marginTop='18px';
    blockThree.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-weight:700">Obras de a 3</div><div style="color:var(--muted)">Total: ${threes.length}</div></div>`;
    const gridThree = document.createElement('div');
    gridThree.className='plays-subgrid';
    threes.forEach(p=>{
      const el = document.createElement('article');
      el.className='play-card three';
      const badgeClass = p.genre === 'comedy' ? 'comedy' : 'drama';
      el.innerHTML = `
        <div class="play-title">${p.title}</div>
        <div><span class="badge ${badgeClass}">${p.genre}</span></div>
        <div style="margin-top:8px">Actores: <strong>${p.actores.length}</strong></div>
        <div class="actor-list">${p.actores.join(', ')}</div>
        <div class="play-count-pill three">3</div>
      `;
      gridThree.appendChild(el);
    });
    playsList.appendChild(blockThree);
    playsList.appendChild(gridThree);
  }

  // Render Clase De Hoy attendance list
  function renderAttendance(){
    attendanceList.innerHTML='';
    actors.forEach(a => {
      const id = `att-${a.id}`;
      const item = document.createElement('div');
      item.className='attendance-item';
      const initials = a.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
      item.innerHTML = `
        <div class="att-left">
          <div class="avatar initials">${initials}</div>
          <div>${a.name}</div>
        </div>
        <div><input id="${id}" class="toggle-input" type="checkbox" data-name="${a.name}" checked /></div>
      `;
      attendanceList.appendChild(item);
    });
    updateClaseStats();
  }

  // Render the whole "Clase de Hoy" tab (public)
  function renderClaseDeHoy(){
    renderAttendance();
    claseResult.innerHTML = '<div style="color:var(--muted)">Pulse "Generar Clase" para crear una combinación aleatoria considerando la asistencia.</div>';
    updateClaseStats(0);
  }

  function getPresentActors(){
    return Array.from(attendanceList.querySelectorAll('input[type=checkbox]')).filter(i=>i.checked).map(i=>i.dataset.name);
  }

  function updateClaseStats(selectedCount=0){
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
  function fingerprintCover(arr){
    if(!arr) return '';
    return arr.map(p=>p.id).sort().join('|');
  }

  function generateRandomClase(mode='init'){
    const present = getPresentActors();
    if(present.length===0){
      claseResult.innerHTML = `<div class="clase-empty">No hay actores presentes.</div>`;
      updateClaseStats(0);
      return [];
    }

    // mode: 'init' => allow any result (reset previous fingerprint)
    // mode: 'reshuffle' => try to find a different result than lastClaseFingerprint
    if(mode === 'init') lastClaseFingerprint = '';

    const adhocEnabled = document.getElementById('adhocToggle') ? document.getElementById('adhocToggle').checked : true;

    // If adhoc is enabled, create partitions of present actors into groups of 3 and 2 to cover all
    if(adhocEnabled){
      // Attempt several randomized partitions until we find one that fits group sizes of 3 and 2
      const maxAttempts = 200;
      for(let attempt=0; attempt<maxAttempts; attempt++){
        const shuffled = present.slice().sort(()=>Math.random()-0.5);
        const groups = [];
        // greedily try to make groups of 3 first, then 2
        let i = 0;
        while(i < shuffled.length){
          const remaining = shuffled.length - i;
          if(remaining === 1){
            // single actor left - make a solo scene
            groups.push([shuffled[i]]); i+=1;
          } else if(remaining % 3 === 0 || remaining > 4){
            groups.push(shuffled.slice(i, i+3)); i+=3;
          } else {
            groups.push(shuffled.slice(i, i+2)); i+=2;
          }
        }
        // build display with randomized roles and scene names
        const scenes = groups.map((grp, idx) => {
          // assign random characters if GamesData available
          const roles = (window.GamesData && window.GamesData.characters) ? grp.map(a=>({name:a, role: window.GamesData.characters[Math.floor(Math.random()*window.GamesData.characters.length)]})) : grp.map(a=>({name:a}));
          const situation = (window.GamesData && window.GamesData.situations) ? window.GamesData.situations[Math.floor(Math.random()*window.GamesData.situations.length)] : `Escena ${idx+1}`;
          return ({
            id: 'adhoc-'+Date.now()+'-'+idx+'-'+Math.floor(Math.random()*1000),
            title: `${situation} — Grupo ${idx+1}`,
            actores: grp.slice(),
            roles,
            genre: Math.random()>0.5 ? 'comedy' : 'drama'
          });
        });
        const fp = scenes.map(s=>s.actores.join(',')).join('|');
        if(fp !== lastClaseFingerprint){
          lastClaseFingerprint = fp;
          claseResult.innerHTML = renderCoverToHTML(scenes);
          updateClaseStats(scenes.length);
          return scenes;
        }
      }
      // if all attempts produce same fingerprint (very unlikely), fall through to exact-play matching
    }

    // Candidate plays must be subset of present actors
    const candidates = plays.filter(p => p.actores.every(a => present.includes(a)));

    // Try to find an exact cover
    // Try multiple times if we get the same fingerprint
    let cover = null;
    const maxTrials = 6;
    for(let t=0;t<maxTrials;t++){
      cover = findExactCover(present, candidates, 300);
      const fp = fingerprintCover(cover);
      if(fp && fp !== lastClaseFingerprint) { lastClaseFingerprint = fp; break; }
      // else retry to get a different combination
      cover = null;
    }
    if(!cover){
      // fallback: show message and offer best-effort greedy
      claseResult.innerHTML = `<div class="clase-empty">No se encontró una combinación que use a todos los actores presentes con las obras existentes.</div>`;
      // fallback greedy to show at least something
      const greedy = (()=>{
        const used = new Set(); const sel = [];
        candidates.slice().sort(()=>Math.random()-0.5).forEach(p=>{
          if(p.actores.some(a=>used.has(a))) return;
          p.actores.forEach(a=>used.add(a)); sel.push(p);
        });
        return sel;
      })();
      claseResult.innerHTML += renderCoverToHTML(greedy);
      updateClaseStats(greedy.length);
      lastClaseFingerprint = fingerprintCover(greedy);
      return greedy;
    }

    claseResult.innerHTML = renderCoverToHTML(cover);
    updateClaseStats(cover.length);
    lastClaseFingerprint = fingerprintCover(cover);
    return cover;
  }

  function renderCoverToHTML(selected){
    const container = document.createElement('div');
    container.style.marginTop = '10px';
    selected.forEach((s, idx) => {
      const scene = document.createElement('div');
      scene.className = 'clase-scene';
      const personas = s.roles ? s.roles.map(r=>`<strong>${r.name}</strong> <span style="color:var(--muted)">(${r.role})</span>`).join('<br/>') : (s.actores? s.actores.map(a=>`<strong>${a}</strong>`).join('<br/>') : '');
      scene.innerHTML = `
        <div class="left">
          <div class="title">${s.title}</div>
          <div class="meta">${personas}</div>
        </div>
      `;
      container.appendChild(scene);
    });

    // attach event delegation for copy/regen
    setTimeout(()=>{
      container.querySelectorAll('button[data-action]').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
          const action = btn.dataset.action;
          const idx = parseInt(btn.dataset.idx,10);
          const scene = selected[idx];
          if(action==='copy'){
            const text = scene.roles ? scene.roles.map(r=>`${r.name} - ${r.role}`).join('\n') : (scene.actores? scene.actores.join('\n') : '');
            navigator.clipboard && navigator.clipboard.writeText(text);
            btn.textContent = 'Copiado';
            setTimeout(()=> btn.textContent = 'Copiar reparto', 1200);
          }
          if(action==='regen'){
            // small regen: re-run full generation to change entire set
            generateRandomClase();
          }
        });
      });
    },50);

    return container.outerHTML;
  }

  // Event wiring
  actorSearch.addEventListener('input', e => renderActorsOverview(e.target.value));
  playsSort.addEventListener('change', e => renderPlaysOverview(e.target.value));
  generateBtn.addEventListener('click', () => {
    // explicit full regenerate and allow same fingerprint to be replaced
    generateRandomClase('init');
  });

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
+
    // fallback: run generateRandomClase with 'reshuffle' which tries to produce a different cover
    generateRandomClase('reshuffle');
  });

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
