// Juegos de Actuación - modular generators and UI
// Data pools for generators
const GamesData = {
  situations: [
    'Una cena familiar que se arruina', 'En la estación de tren esperando un viaje importante', 'Un robo fallido', 'Una cita a ciegas que sale mal', 'Reunión de trabajo con sorpresa'
  ],
  characters: [
    'Un taxista sentimental', 'Una diva en apuros', 'Un abuelo bromista', 'Una periodista impaciente', 'Un extraterrestre confundido'
  ],
  emotions: ['ira contenida','alegría exuberante','miedo paralizante','tristeza melancólica','confusión cómica','nerviosismo exagerado'],
  actions: ['susurrar', 'gritar', 'bailar en silencio', 'hacer mímica', 'romper algo accidentalmente'],
  objects: ['una maleta imaginaria','un paraguas roto','una llave sin cerradura','un teléfono de juguete','un sombrero gigante'],
  words: ['manzana','luna','rojo','promesa','crujido','fuego']
};

// Utility: random pick
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// Base Game class
class GameBase{
  constructor(name, description, objective){
    this.name = name; this.description = description; this.objective = objective;
    this.instructions = '';
  }
  // override
  generate(){ return {}; }
}

// 1. Tarjeta Random de Actor
class TarjetaRandom extends GameBase{
  constructor(){
    super('Tarjeta Random de Actor', 'Genera situación, personaje y emoción/acción para una escena corta.', 'Improvisación, adaptabilidad, expresión emocional.');
    this.instructions = `Cómo jugar:\n1) Toma la tarjeta y lee la situación en voz alta.\n2) Asume el personaje asignado y la emoción.\n3) Improvisa una escena de 1-3 minutos, concentrándote en la escucha y la verdad actuaciónal.\n4) Feedback: compártan observaciones concretas.`;
  }
  generate(){
    return {
      situacion: pick(GamesData.situations),
      personaje: pick(GamesData.characters),
      emocion: pick(GamesData.emotions),
      accion: pick(GamesData.actions)
    };
  }
}

// 2. Cambio de Emoción en Escena
class CambioEmocion extends GameBase{
  constructor(){
    super('Cambio de Emoción en Escena','Indica emociones aleatorias para cambiar durante una escena.','Versatilidad emocional y reacción.');
    this.instructions = `Cómo jugar:\n1) Inicien una escena breve con objetivos claros.\n2) Cada vez que se indique, cambien instantáneamente la emoción y mantengan la acción.\n3) Trabajen la transición física y el subtexto.`;
  }
  generate(){
    // produce a sequence of emotions (3-6 changes)
    const count = 3 + Math.floor(Math.random()*4);
    const seq = Array.from({length:count}, ()=> pick(GamesData.emotions));
    return { sequence: seq };
  }
}

// 3. Escena en Objetos Imaginarios
class ObjetosImaginarios extends GameBase{
  constructor(){ super('Escena en Objetos Imaginarios','Genera un objeto para que los actores lo definan y usen con cuerpo y voz.','Creatividad y expresividad corporal.'); }
  generate(){ const o = pick(GamesData.objects); return { objeto: o, uso: pick(GamesData.actions), instru: `Definan el objeto en 30s, luego integren su uso en la escena.` }; }
}

// 4. Cadena de Historias
class CadenaHistorias extends GameBase{
  constructor(){ super('Cadena de Historias','Genera una palabra o frase inicial para iniciar una cadena.','Narrativa, escucha activa y cooperación.'); }
  generate(){ return { start: pick(GamesData.words), constraint: pick(GamesData.actions), instru: 'Cada actor añade una frase y sigue la lógica emocional.' }; }
}

// 5. Improvisación de Conflicto
class ImproConflicto extends GameBase{
  constructor(){ super('Improvisación de Conflicto','Genera un conflicto entre personajes con roles definidos.','Exploración de conflicto y resolución.'); }
  generate(){ return { conflicto: pick(['traición','error profesional','secreto revelado','deuda impaga','celos']), roles: [pick(GamesData.characters), pick(GamesData.characters)], instru: 'Explora deseo y oposición. Mantén objetivos claros.' }; }
}

// Export list of game instances
const GamesList = [new TarjetaRandom(), new CambioEmocion(), new ObjetosImaginarios(), new CadenaHistorias(), new ImproConflicto()];

// UI wiring for Juegos tab
function initGamesUI(){
  const container = document.getElementById('gamesContainer');
  if(!container) return;
  container.innerHTML = '';
  GamesList.forEach((g, idx) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-header"><h3>${g.name}</h3><div class="game-meta">${g.objective}</div></div>
      <div class="card-body">
        <div id="game-body-${idx}" class="game-output">Pulsa "Generar" para obtener una consigna</div>
        <div class="game-actions"><button class="small-btn" id="gen-${idx}">Generar</button></div>
      </div>
    `;
    container.appendChild(card);

    const body = card.querySelector(`#game-body-${idx}`);
    const genBtn = card.querySelector(`#gen-${idx}`);
    const saveBtn = card.querySelector(`#save-${idx}`);
    function render(obj){
      // richer rendering: show description, objective and instructions
      const header = `<div style="font-weight:700;margin-bottom:6px">${g.name}</div><div style="color:var(--muted);font-size:13px;margin-bottom:8px">${g.description}<br/><strong>Objetivo:</strong> ${g.objective}</div>`;
      let content = '';
      if(g.constructor.name === 'TarjetaRandom'){
        content = `<div style="font-weight:700">${obj.personaje}</div><div style="font-size:14px;color:var(--muted)">${obj.situacion}</div><div style="margin-top:8px"><strong>Emoción:</strong> ${obj.emocion} · <strong>Acción:</strong> ${obj.accion}</div>`;
      } else if(g.constructor.name === 'CambioEmocion'){
        content = `<div><strong>Secuencia de cambios:</strong><ol style="padding-left:18px;margin:0">${obj.sequence.map(s=>`<li>${s}</li>`).join('')}</ol></div>`;
      } else if(g.constructor.name === 'ObjetosImaginarios'){
        content = `<div style="font-weight:700">${obj.objeto}</div><div style="color:var(--muted)">Uso sugerido: ${obj.uso}</div><div style="margin-top:6px;color:var(--muted)">${obj.instru || ''}</div>`;
      } else if(g.constructor.name === 'CadenaHistorias'){
        content = `<div><strong>Inicio:</strong> ${obj.start}</div><div style="color:var(--muted)"><strong>Restricción:</strong> ${obj.constraint}</div><div style="margin-top:6px;color:var(--muted)">${obj.instru || ''}</div>`;
      } else if(g.constructor.name === 'ImproConflicto'){
        content = `<div><strong>Conflicto:</strong> ${obj.conflicto}</div><div style="color:var(--muted)">Roles: ${obj.roles.join(' vs ')}</div><div style="margin-top:6px;color:var(--muted)">${obj.instru || ''}</div>`;
      } else {
        content = '<pre style="white-space:pre-wrap;font-family:inherit">'+JSON.stringify(obj, null, 2)+'</pre>';
      }
      // instructions from the game class
      const instr = g.instructions ? `<div style="margin-top:8px;color:var(--muted)"><strong>Instrucciones:</strong><br/>${g.instructions.replace(/\n/g,'<br/>')}</div>` : '';
      body.innerHTML = header + content + instr;
    }
    genBtn.addEventListener('click', ()=>{
      const val = g.generate(); render(val);
    });
    // save button removed — no persistent saves in this UI
  });
}
