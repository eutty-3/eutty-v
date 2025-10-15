/* eu-ai.js
  EU AI client script
  - Renders floating orb + chat window
  - Sends user messages to /api/euai (server proxy)
  - Uses Web Speech API for voice output
  - Allows user to pick voices, pitch, rate
*/

/* CONFIG */
const EU_API_ENDPOINT = 'http://localhost:3000/api/euai';
const ASSISTANT_NAME = 'EU AI';

/* BUILD UI */
(function(){
  if (document.getElementById('euai-root')) return; // already injected

  const root = document.createElement('div');
  root.id = 'euai-root';
  root.innerHTML = `
    <div class="euai-orb" id="euai-orb" title="${ASSISTANT_NAME}">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 6px 18px rgba(255,180,60,0.08));">
        <circle cx="12" cy="12" r="10" stroke="rgba(255,210,120,0.35)" stroke-width="1.2" fill="url(#g)"/>
        <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.06"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0.08"/></linearGradient></defs>
      </svg>
    </div>

    <div class="euai-window" id="euai-window" role="dialog" aria-label="EU AI chat">
      <div class="euai-header">
        <div class="euai-title">
          <div class="euai-logo">EU</div>
          <div>
            <div class="euai-name">${ASSISTANT_NAME}</div>
            <div class="euai-sub">Ask me anything — I can speak and text.</div>
          </div>
        </div>
        <div class="euai-controls">
          <button class="euai-btn" id="euai-mode">Partial</button>
          <button class="euai-btn" id="euai-close">✕</button>
        </div>
      </div>

      <div class="euai-body">
        <div class="euai-chat">
          <div class="euai-messages" id="euai-messages" aria-live="polite"></div>
          <div class="euai-inputbar">
            <input id="euai-input" class="euai-input" placeholder="Type a message..." />
            <button id="euai-send" class="euai-send">Send</button>
          </div>
        </div>

        <aside class="euai-side">
          <h4>Voice & TTS</h4>
          <div id="euai-voices" class="euai-voice-list"></div>
          <div style="margin-top:8px">
            <label>Pitch <input id="euai-pitch" type="range" min="0.5" max="2" step="0.1" value="1" class="euai-slider"></label>
            <label>Rate <input id="euai-rate" type="range" min="0.6" max="2" step="0.1" value="1" class="euai-slider"></label>
          </div>

          <h4 style="margin-top:12px">Options</h4>
          <div class="euai-toggle"><label><input id="euai-tts-toggle" type="checkbox" checked> Voice</label></div>
          <div style="margin-top:8px"><button id="euai-clear" class="euai-btn">Clear</button></div>
        </aside>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  /* elements */
  const orb = document.getElementById('euai-orb');
  const win = document.getElementById('euai-window');
  const closeBtn = document.getElementById('euai-close');
  const sendBtn = document.getElementById('euai-send');
  const input = document.getElementById('euai-input');
  const messagesEl = document.getElementById('euai-messages');
  const voicesEl = document.getElementById('euai-voices');
  const ttsToggle = document.getElementById('euai-tts-toggle');
  const pitchEl = document.getElementById('euai-pitch');
  const rateEl = document.getElementById('euai-rate');
  const modeBtn = document.getElementById('euai-mode');
  const clearBtn = document.getElementById('euai-clear');

  /* state */
  let isOpen = false;
  let partial = true;
  let history = []; // simple local chat history; consider server storage for persistence
  let selectedVoice = null;
  let voices = [];

  /* helpers: TTS */
  function loadVoices(){
    voices = window.speechSynthesis.getVoices().filter(v=>v.lang && v.name);
    voicesEl.innerHTML = '';
    if(voices.length === 0){
      const p = document.createElement('div'); p.textContent = 'No system voices available'; voicesEl.appendChild(p); return;
    }
    voices.forEach((v, i) => {
      const item = document.createElement('div'); item.className='euai-voice';
      item.textContent = `${v.name} — ${v.lang}`;
      item.onclick = () => { selectVoice(i); };
      voicesEl.appendChild(item);
    });
    // pick a golden-sounding default if possible
    selectVoice(0);
  }
  function selectVoice(i){
    const nodes = voicesEl.querySelectorAll('.euai-voice');
    nodes.forEach(n=>n.classList.remove('active'));
    if(voices[i]) nodes[i].classList.add('active');
    selectedVoice = voices[i];
  }
  function speakText(text){
    if(!ttsToggle.checked) return;
    if(!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    if(selectedVoice) u.voice = selectedVoice;
    u.pitch = Number(pitchEl.value);
    u.rate = Number(rateEl.value);
    window.speechSynthesis.cancel(); // stop previous
    window.speechSynthesis.speak(u);
  }

  /* UI helpers */
  function appendMessage(text, who='bot'){
    const el = document.createElement('div');
    el.className = 'euai-msg ' + (who==='user' ? 'user' : 'bot');
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function setWindowVisible(v){
    if(v){
      win.style.display='block';
      setTimeout(()=> win.classList.add('open'), 30);
    } else {
      win.style.display='none';
      win.classList.remove('open');
    }
  }

  /* open/close */
  orb.addEventListener('click', ()=> {
    isOpen = !isOpen;
    setWindowVisible(isOpen);
    if(isOpen) input.focus();
  });
  closeBtn.addEventListener('click', ()=> { isOpen=false; setWindowVisible(false); });

  /* partial / full toggle */
  modeBtn.addEventListener('click', ()=> {
    partial = !partial;
    if(partial) {
      win.classList.remove('partial');
      modeBtn.textContent = 'Partial';
    } else {
      win.classList.add('partial');
      modeBtn.textContent = 'Full';
    }
  });

  /* send message */
  async function sendMessage(text){
    if(!text || !text.trim()) return;
    appendMessage(text.trim(), 'user');
    input.value='';
    messagesEl.appendChild(document.createElement('div')); // small gap
    const placeholder = document.createElement('div'); placeholder.className='euai-msg bot'; placeholder.textContent='…';
    messagesEl.appendChild(placeholder);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    history.push({role:'user', content:text});
    try {
      // call proxy endpoint - server must add your API key
      const res = await fetch(EU_API_ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: text, history })
      });
      if(!res.ok) throw new Error('Server error: ' + res.status);
      const data = await res.json();
      const reply = data.reply || data.text || 'Sorry, no response.';
      // replace placeholder
      placeholder.textContent = reply;
      speakText(reply);
      history.push({role:'assistant', content:reply});
      messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (err){
      console.error(err);
      placeholder.textContent = 'Error: could not reach AI.';
      speakText('Sorry, I could not reach the AI service.');
    }
  }

  sendBtn.addEventListener('click', ()=> sendMessage(input.value));
  input.addEventListener('keydown', (e)=> { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(input.value); }});

  /* clear */
  clearBtn.addEventListener('click', ()=> { messagesEl.innerHTML=''; history=[]; });

  /* voice loading - handle async voice list */
  if (typeof speechSynthesis !== 'undefined') {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    voicesEl.textContent = 'No speech synthesis support.';
  }

  /* pointer-follow micro effect for orb */
  let lastMove = 0;
  window.addEventListener('mousemove', (e) => {
    const t = Date.now();
    if(t - lastMove < 40) return;
    lastMove = t;
    const x = (e.clientX / window.innerWidth - 0.5) * 12;
    const y = (e.clientY / window.innerHeight - 0.5) * 8;
    orb.style.transform = `translate3d(0,0,0) rotateX(${ -y }deg) rotateY(${ x }deg)`;
  });

  /* simple init greeting */
  setTimeout(()=> {
    appendMessage('Hello! I’m EU AI — ask me about services, booking, or anything else.', 'bot');
  }, 800);

  /* expose quick open for debugging */
  window.EUAI = { open: ()=> { isOpen=true; setWindowVisible(true); }, send: sendMessage };
})();