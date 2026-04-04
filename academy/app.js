// ═══════════════════════════════════════════════════════════
//  MarquisTeacher Academy — app.js
//  Claude AI · Firebase Auth · Firestore · Games · Dashboard
// ═══════════════════════════════════════════════════════════

// Claude API key — injected via Render environment variable
// In production this call goes through your backend proxy
const CLAUDE_KEY = window.CLAUDE_KEY || null;

// ── DEMO MODE (no Firebase needed for testing) ────────────
let DEMO_MODE = false;

// ── CURRENT USER ─────────────────────────────────────────
let currentUser  = null; // Firebase Auth user
let userProfile  = null; // Firestore { name, role, score, streak, ... }

// ── APP STATE ─────────────────────────────────────────────
const S = {
  channel:'welcome',
  gameMode:'vocab',
  vocabIdx:0, fillIdx:0, scrambleIdx:0,
  scrambleAnswer:[], scrambleUsed:[], _scrLetters:[], _scrWord:'',
  answered:false,
  tutorMsgs:[], writingMsgs:[], grammarMsgs:[], generalMsgs:[],
  allStudents:[],
};

// ── GAME DATA ─────────────────────────────────────────────
const VOCAB = [
  {word:"Ephemeral",  hint:"Think: morning dew",               meaning:"Lasting for only a very short time",         options:["Extremely large","Lasting for only a very short time","Full of energy","Dark and mysterious"],       correct:1,level:"Advanced"},
  {word:"Benevolent", hint:"Describes a truly caring person",  meaning:"Well meaning, kind, and generous",           options:["Cruel and harsh","Easily frightened","Well meaning, kind, and generous","Very loud"],               correct:2,level:"Intermediate"},
  {word:"Diligent",   hint:"The opposite of lazy",             meaning:"Showing great care and effort in work",      options:["Careless","Very talkative","Showing great care and effort in work","Quick to anger"],               correct:2,level:"Beginner"},
  {word:"Eloquent",   hint:"A great speaker is this",          meaning:"Fluent and persuasive in speech or writing", options:["Clumsy in expression","Very forgetful","Too quiet","Fluent and persuasive in speech or writing"],   correct:3,level:"Intermediate"},
  {word:"Tenacious",  hint:"Like a bulldog's grip",            meaning:"Persistent and determined; never giving up", options:["Persistent and determined; never giving up","Easily distracted","Timid","Generous"],                correct:0,level:"Advanced"},
  {word:"Candid",     hint:"What a true friend always is",     meaning:"Truthful and straightforward; honest",       options:["Truthful and straightforward; honest","Hidden","Rude","Extremely cautious"],                       correct:0,level:"Beginner"},
  {word:"Ambiguous",  hint:"When something means two things",  meaning:"Open to more than one interpretation",      options:["Crystal clear","Very confident","Extremely brief","Open to more than one interpretation"],          correct:3,level:"Intermediate"},
  {word:"Resilient",  hint:"Bamboo bends but doesn't break",   meaning:"Able to recover quickly from hardship",      options:["Fragile","Unable to adapt","Very stubborn","Able to recover quickly from hardship"],                correct:3,level:"Intermediate"},
  {word:"Meticulous", hint:"A great watchmaker is this",       meaning:"Showing great attention to detail",          options:["Showing great attention to detail","Reckless","Always in a hurry","Very loud"],                    correct:0,level:"Advanced"},
  {word:"Serene",     hint:"A quiet lake on a still morning",  meaning:"Calm, peaceful, and untroubled",             options:["Loud and chaotic","Calm, peaceful, and untroubled","Full of anger","Mysterious"],                  correct:1,level:"Beginner"},
];

const FILL = [
  {sentence:"The scientist made a ______ discovery that changed medicine forever.",         options:["groundbreaking","ordinary","tiny","loud"],         correct:0},
  {sentence:"She spoke with great ______, choosing every word very carefully.",             options:["loudness","confusion","eloquence","haste"],        correct:2},
  {sentence:"The students were ______ about the upcoming field trip.",                      options:["bored","reluctant","enthusiastic","nervous"],      correct:2},
  {sentence:"He ______ studied for hours, determined to pass the exam.",                   options:["lazily","randomly","quickly","diligently"],        correct:3},
  {sentence:"The team showed incredible ______ after losing three matches in a row.",      options:["weakness","anger","resilience","confusion"],       correct:2},
  {sentence:"Her ______ smile made everyone in the room feel welcome.",                    options:["stern","cold","blank","warm"],                     correct:3},
  {sentence:"The author's writing was so ______ that readers couldn't put the book down.", options:["boring","captivating","confusing","dull"],         correct:1},
  {sentence:"The ______ student always arrived early and finished every assignment.",      options:["lazy","forgetful","diligent","careless"],          correct:2},
];

const SCRAMBLE = [
  {word:"ACHIEVE",  hint:"To successfully reach a goal"},
  {word:"GRAMMAR",  hint:"The rules that structure a language"},
  {word:"FLUENT",   hint:"Able to speak a language very easily"},
  {word:"EXPLORE",  hint:"To travel into or investigate the unknown"},
  {word:"CURIOUS",  hint:"Eager to know or learn something new"},
  {word:"WISDOM",   hint:"Good judgement gained from experience"},
  {word:"PATIENCE", hint:"Able to wait calmly without getting annoyed"},
  {word:"COURAGE",  hint:"The ability to face fear bravely"},
];

const WOTD = {
  word:"Perspicacious", pos:"adjective",
  definition:"Having a ready insight into things; showing a clear and deep understanding of complex matters.",
  example:'"The perspicacious student noticed the subtle grammatical error that the teacher had missed."',
  synonyms:["shrewd","astute","perceptive","discerning"],
  etymology:"From Latin perspicax — from perspicere, meaning to see through clearly.",
};

// ── HELPERS ───────────────────────────────────────────────
const shuffle  = a => [...a].sort(()=>Math.random()-0.5);
const ts       = () => new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
const esc      = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmtMsg   = t => t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`(.*?)`/g,'<code>$1</code>').replace(/\n/g,'<br>');
const getLevel = s => s < 50 ? 'Beginner' : s < 150 ? 'Intermediate' : 'Advanced';

// ══════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════
function showAuthTab(tab) {
  document.getElementById('auth-login').style.display    = tab==='login'    ? 'block':'none';
  document.getElementById('auth-register').style.display = tab==='register' ? 'block':'none';
  document.getElementById('tab-login').classList.toggle('active',    tab==='login');
  document.getElementById('tab-register').classList.toggle('active', tab==='register');
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  if (!email||!pass) { errEl.textContent='Please fill in all fields.'; return; }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(e) { errEl.textContent = authErr(e.code); }
}

async function doGoogleLogin() {
  try {
    await auth.signInWithPopup(googleProvider);
  } catch(e) { document.getElementById('login-error').textContent = authErr(e.code); }
}

async function doRegister() {
  const name   = document.getElementById('reg-name').value.trim();
  const email  = document.getElementById('reg-email').value.trim();
  const pass   = document.getElementById('reg-password').value;
  const role   = document.getElementById('reg-role').value;
  const native = document.getElementById('reg-native').value;
  const errEl  = document.getElementById('reg-error');
  errEl.textContent = '';
  if (!name||!email||!pass) { errEl.textContent='Please fill in all fields.'; return; }
  if (pass.length<6)        { errEl.textContent='Password must be at least 6 characters.'; return; }
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: name });
    await saveProfile(cred.user.uid, {
      name, email, role, nativeLanguage:native,
      score:0, streak:0, totalCorrect:0, totalAttempts:0,
      joinedAt: new Date().toISOString(),
    });
  } catch(e) { errEl.textContent = authErr(e.code); }
}

function demoLogin(role) {
  DEMO_MODE   = true;
  currentUser = { uid:'demo-'+role, email:role+'@demo.com', displayName: role==='teacher'?'Ms. Marquis (Demo)':'Demo Student' };
  userProfile = { name:currentUser.displayName, role, score:0, streak:0, totalCorrect:0, totalAttempts:0, nativeLanguage:'English', email:currentUser.email };
  onUserReady();
}

function doLogout() {
  if (DEMO_MODE) { DEMO_MODE=false; currentUser=null; userProfile=null; showAuth(); return; }
  auth.signOut();
}

function authErr(code) {
  const m = {
    'auth/user-not-found':'No account found with that email.',
    'auth/wrong-password':'Incorrect password.',
    'auth/email-already-in-use':'An account with this email already exists.',
    'auth/weak-password':'Password is too weak (min. 6 characters).',
    'auth/invalid-email':'Please enter a valid email address.',
    'auth/too-many-requests':'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user':'Sign-in cancelled.',
    'auth/invalid-credential':'Invalid email or password.',
  };
  return m[code] || 'Something went wrong. Please try again.';
}

// Firebase auth state observer
auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    userProfile = await loadProfile(user.uid);
    if (!userProfile) {
      userProfile = { name:user.displayName||user.email, email:user.email, role:'student', score:0, streak:0, totalCorrect:0, totalAttempts:0, nativeLanguage:'Other', joinedAt:new Date().toISOString() };
      await saveProfile(user.uid, userProfile);
    }
    onUserReady();
  } else {
    currentUser=null; userProfile=null; showAuth();
  }
});

async function saveProfile(uid, data) {
  if (DEMO_MODE) return;
  await db.collection('users').doc(uid).set(data, { merge:true });
}

async function loadProfile(uid) {
  if (DEMO_MODE) return null;
  try {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  } catch(e) { return null; }
}

async function updateProgress(delta) {
  const p = userProfile;
  p.score         = (p.score||0)         + (delta.score||0);
  p.streak        = delta.streak         !== undefined ? delta.streak : p.streak;
  p.totalCorrect  = (p.totalCorrect||0)  + (delta.totalCorrect||0);
  p.totalAttempts = (p.totalAttempts||0) + (delta.totalAttempts||0);
  p.lastActive    = new Date().toISOString();
  if (!DEMO_MODE && currentUser) await saveProfile(currentUser.uid, p);
  refreshPanel();
}

function showAuth() {
  document.getElementById('auth-screen').style.display='flex';
  document.getElementById('app-screen').style.display='none';
}

function onUserReady() {
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('app-screen').style.display='flex';
  refreshPanel();
  const isTeacher = userProfile?.role==='teacher';
  document.getElementById('teacher-section').style.display = isTeacher ? 'block':'none';
  document.getElementById('si-dash').style.display         = isTeacher ? 'flex':'none';
  seedMsgs();
  switchChannel('welcome');
  if (isTeacher && !DEMO_MODE) loadStudents();
}

function refreshPanel() {
  const p = userProfile; if (!p) return;
  const init = (p.name||'?').charAt(0).toUpperCase();
  const av = document.getElementById('user-avatar-panel');
  av.textContent = init;
  av.className = 'user-avatar'+(p.role==='teacher'?' teacher':'');
  document.getElementById('panel-username').textContent = p.name||p.email;
  document.getElementById('panel-usertag').textContent  = getLevel(p.score||0)+' • '+(p.score||0)+' pts';
  document.getElementById('header-user-pill').textContent = '👋 '+(p.name||'').split(' ')[0];
}

function seedMsgs() {
  if (!S.tutorMsgs.length)   S.tutorMsgs   = [{role:'bot',    name:'MarquisBot', text:'Hello! 👋 I\'m **MarquisBot**, your AI English tutor powered by Claude. Ask me anything about grammar, vocabulary, writing, or pronunciation. I\'m here to help you master English! 🎓', time:'Today'}];
  if (!S.writingMsgs.length) S.writingMsgs = [{role:'teacher',name:'Ms. Marquis',text:'Welcome to **#writing-practice**! Submit a sentence or paragraph and I\'ll give you detailed AI feedback on grammar, vocabulary, and style. ✍️', time:'Today'}];
  if (!S.grammarMsgs.length) S.grammarMsgs = [{role:'bot',    name:'MarquisBot', text:'Grammar Help is open! Ask me about tenses, articles, prepositions, conditionals — anything. I\'ll explain with clear rules and examples. 📝', time:'Today'}];
  if (!S.generalMsgs.length) S.generalMsgs = [
    {role:'teacher',name:'Ms. Marquis',text:'Welcome to **#general-chat**! Be kind, supportive, and English-focused. 😊',time:'Today'},
    {role:'student', name:'Amara K.',  text:'This academy is amazing! I already learned 5 new words today 🙌',           time:'Today'},
    {role:'student', name:'James T.',  text:'The word scramble game is so fun! Anyone else playing?',                     time:'Today'},
  ];
}

// ══════════════════════════════════════════════════════════
//  CHANNEL SWITCHING
// ══════════════════════════════════════════════════════════
const CH = {
  welcome:      {icon:'🏫',name:'welcome',         desc:'Welcome to MarquisTeacher Academy'},
  announcements:{icon:'📢',name:'announcements',   desc:'Important updates from Ms. Marquis'},
  'ai-tutor':   {icon:'🤖',name:'ask-the-tutor',   desc:'AI English tutor powered by Claude'},
  wotd:         {icon:'📖',name:'word-of-the-day', desc:'Expand your vocabulary every day'},
  writing:      {icon:'✍️',name:'writing-practice',desc:'Submit writing for instant AI feedback'},
  grammar:      {icon:'📝',name:'grammar-help',    desc:'Grammar questions answered instantly'},
  games:        {icon:'🎮',name:'english-games',   desc:'Play games, earn points, level up'},
  leaderboard:  {icon:'🏆',name:'leaderboard',     desc:'Top students this week'},
  general:      {icon:'💬',name:'general-chat',    desc:'Community chat'},
  partners:     {icon:'🤝',name:'study-partners',  desc:'Find a study buddy'},
  dashboard:    {icon:'📊',name:'student-dashboard',desc:'All student progress — teacher view'},
  reports:      {icon:'📋',name:'progress-reports', desc:'Individual student reports'},
};

function switchChannel(ch) {
  S.channel = ch;
  document.querySelectorAll('.channel-item').forEach(el=>el.classList.remove('active'));
  const el=document.getElementById('ch-'+ch);
  if (el) el.classList.add('active');
  const m=CH[ch]||CH.welcome;
  document.getElementById('header-icon').textContent=m.icon;
  document.getElementById('header-name').textContent=m.name;
  document.getElementById('header-desc').textContent=m.desc;
  renderChannel(ch);
}

function renderChannel(ch) {
  const ca=document.getElementById('content-area');
  ca.innerHTML='';
  ({
    welcome:       ()=>renderWelcome(ca),
    announcements: ()=>renderAnnouncements(ca),
    'ai-tutor':    ()=>renderChat(ca,'ai-tutor'),
    wotd:          ()=>renderWOTD(ca),
    writing:       ()=>renderChat(ca,'writing'),
    grammar:       ()=>renderChat(ca,'grammar'),
    general:       ()=>renderChat(ca,'general'),
    games:         ()=>renderGames(ca),
    leaderboard:   ()=>renderLeaderboard(ca),
    partners:      ()=>renderPartners(ca),
    dashboard:     ()=>renderDashboard(ca),
    reports:       ()=>renderReports(ca),
  }[ch]||renderWelcome)(ca);
  ca.scrollTop=ca.scrollHeight;
}

// ══════════════════════════════════════════════════════════
//  VIEWS
// ══════════════════════════════════════════════════════════
function renderWelcome(ca) {
  const name=(userProfile?.name||'Learner').split(' ')[0];
  const isT=userProfile?.role==='teacher';
  ca.innerHTML=`<div class="welcome-view">
    <div class="welcome-icon"><img src="../mascot.png" style="width:56px;height:56px;object-fit:contain"/></div>
    <div class="welcome-title">Welcome back, <span>${esc(name)}</span>! 👋</div>
    <div class="welcome-desc">Your immersive English learning community — powered by AI, built for fluency.</div>
    <div class="channel-cards">
      <div class="ccard" onclick="switchChannel('ai-tutor')"><div class="ccard-icon">🤖</div><div class="ccard-name">#ask-the-tutor</div><div class="ccard-desc">AI tutor powered by Claude — grammar, vocab, writing help</div></div>
      <div class="ccard" onclick="switchChannel('games')"><div class="ccard-icon">🎮</div><div class="ccard-name">#english-games</div><div class="ccard-desc">Vocabulary quiz, fill-in-blank & word scramble</div></div>
      <div class="ccard" onclick="switchChannel('wotd')"><div class="ccard-icon">📖</div><div class="ccard-name">#word-of-the-day</div><div class="ccard-desc">One powerful new word every day</div></div>
      <div class="ccard" onclick="switchChannel('writing')"><div class="ccard-icon">✍️</div><div class="ccard-name">#writing-practice</div><div class="ccard-desc">Submit writing and get instant AI feedback</div></div>
      ${isT?`<div class="ccard" onclick="switchChannel('dashboard')" style="border-color:rgba(155,89,182,0.4)"><div class="ccard-icon">📊</div><div class="ccard-name">#student-dashboard</div><div class="ccard-desc">Track all student progress and activity</div></div>`:''}
      <div class="ccard" onclick="switchChannel('leaderboard')"><div class="ccard-icon">🏆</div><div class="ccard-name">#leaderboard</div><div class="ccard-desc">Top-scoring students this week</div></div>
    </div>
  </div>`;
}

function renderAnnouncements(ca) {
  ca.innerHTML=`<div class="messages-container">
    <div class="msg-group"><div class="msg-avatar teacher">M</div><div class="msg-body">
      <div class="msg-header"><span class="msg-author teacher">Ms. Marquis</span><span class="msg-time">Today at 8:00 AM</span></div>
      <div class="msg-text"><div class="msg-embed"><div class="msg-embed-title">📅 Week 4 — Advanced Vocabulary Challenge</div>
      This week's theme is <strong>Academic Vocabulary</strong>. Play games in #english-games to earn bonus points! Top scorer gets a Gold Scholar badge. 🥇</div></div>
    </div></div>
    <div class="msg-group"><div class="msg-avatar teacher">M</div><div class="msg-body">
      <div class="msg-header"><span class="msg-author teacher">Ms. Marquis</span><span class="msg-time">Yesterday at 3:00 PM</span></div>
      <div class="msg-text"><div class="msg-embed info"><div class="msg-embed-title">🤖 AI Tutor Now Live!</div>
      Head to <strong>#ask-the-tutor</strong> — our Claude-powered AI tutor is live and ready to help with grammar, vocabulary, writing feedback, and more!</div></div>
    </div></div>
  </div>`;
}

function renderWOTD(ca) {
  const w=WOTD;
  ca.innerHTML=`<div style="padding:24px;max-width:640px">
    <div class="wotd-card">
      <div class="wotd-badge">📖 Word of the Day — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
      <div class="wotd-word">${w.word}</div>
      <div class="wotd-pos">${w.pos}</div>
      <div class="wotd-def">${w.definition}</div>
      <div class="wotd-ex">${w.example}</div>
    </div>
    <div style="background:var(--navy3);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:14px">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:10px">Synonyms</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${w.synonyms.map(s=>`<span style="background:rgba(232,168,76,0.12);border:1px solid rgba(232,168,76,0.25);padding:4px 12px;border-radius:20px;font-size:13px;color:var(--gold2)">${s}</span>`).join('')}</div>
    </div>
    <div style="background:var(--navy3);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:16px">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:8px">Etymology</div>
      <div style="font-size:14px;color:var(--text2)">${w.etymology}</div>
    </div>
    <button class="btn-primary" style="width:100%" onclick="switchChannel('ai-tutor');setTimeout(()=>{const i=document.querySelector('.input-box input');if(i)i.value='Give me 3 example sentences using the word Perspicacious and explain its nuance.'},400)">Ask the tutor for examples →</button>
  </div>`;
}

// ── CHAT ─────────────────────────────────────────────────
const CHAT_KEYS = {'ai-tutor':'tutorMsgs',writing:'writingMsgs',grammar:'grammarMsgs',general:'generalMsgs'};
const CHAT_PH   = {'ai-tutor':'Ask MarquisBot anything about English...','writing':'Submit a sentence or paragraph for AI feedback...','grammar':'Ask a grammar question...','general':'Chat with the community...'};
const CHAT_HINT = {'ai-tutor':'🤖 Powered by Claude AI — grammar, vocabulary, writing tips, and more.','writing':'✍️ Submit your writing for feedback on grammar, vocabulary, and style.','grammar':'📝 Ask any grammar question — tenses, articles, conditionals, and more.','general':'💬 Be respectful and supportive of fellow learners.'};
const SYS = {
  'ai-tutor':`You are MarquisBot, a warm, encouraging, and expert English language tutor for MarquisTeacher Academy — an online English learning community. Help students with vocabulary, grammar, pronunciation tips, writing skills, comprehension, and idioms. Keep responses clear, educational, and motivating. Use **bold** for key terms. Always end with a follow-up question or mini-challenge. Keep responses to 3-5 sentences unless more is genuinely needed.`,
  'writing':`You are MarquisBot, an expert English writing coach at MarquisTeacher Academy. Give structured feedback: 1) **Grammar** errors, 2) **Vocabulary** improvements, 3) **Style & Flow**, 4) **What they did well**. Be specific, kind, and encouraging. Use **bold** for important terms.`,
  'grammar':`You are MarquisBot, a grammar expert at MarquisTeacher Academy. Answer clearly: give the rule, a \`code style\` example sentence, and a memory tip. Keep it friendly and under 4 sentences.`,
};

function renderChat(ca, type) {
  const msgs=S[CHAT_KEYS[type]];
  ca.innerHTML=`<div class="messages-container" id="msg-list">${renderMsgs(msgs)}</div>
  <div id="typing-indicator"></div>
  <div class="input-area">
    <div class="input-box">
      <input type="text" id="chat-input" placeholder="${CHAT_PH[type]}" onkeydown="if(event.key==='Enter')sendMsg('${type}')"/>
      <button class="send-btn" onclick="sendMsg('${type}')">Send</button>
    </div>
    <div class="input-hint">${CHAT_HINT[type]}</div>
  </div>`;
  ca.scrollTop=99999;
}

function renderMsgs(msgs) {
  return msgs.map(m=>`<div class="msg-group">
    <div class="msg-avatar ${m.role}">${esc(m.name).charAt(0)}</div>
    <div class="msg-body">
      <div class="msg-header"><span class="msg-author ${m.role}">${esc(m.name)}</span><span class="msg-time">${m.time||ts()}</span></div>
      <div class="msg-text">${fmtMsg(esc(m.text))}</div>
    </div>
  </div>`).join('');
}

async function sendMsg(type) {
  const inp=document.getElementById('chat-input');
  const text=inp.value.trim(); if(!text) return;
  inp.value='';
  const key=CHAT_KEYS[type];
  S[key].push({role:'student',name:userProfile?.name||'You',text,time:ts()});
  document.getElementById('msg-list').innerHTML=renderMsgs(S[key]);
  document.getElementById('content-area').scrollTop=99999;
  if (type==='general') return;

  // Save to Firestore
  if (!DEMO_MODE&&currentUser) {
    db.collection('messages').add({uid:currentUser.uid,channel:type,text,sentAt:new Date().toISOString()}).catch(()=>{});
  }

  const ti=document.getElementById('typing-indicator');
  ti.innerHTML=`<div class="msg-group" style="padding:0 20px"><div class="msg-avatar bot">M</div><div class="msg-body"><div class="msg-typing">MarquisBot is typing<span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span></div></div></div>`;
  document.getElementById('content-area').scrollTop=99999;

  let reply='';
  try {
    const history=S[key].filter(m=>m.role==='student'||m.role==='bot').slice(-8)
      .map(m=>({role:m.role==='student'?'user':'assistant',content:m.text}));

    // Try backend proxy first (production), fall back to direct (dev)
    const endpoint = window.location.hostname==='localhost'
      ? 'https://api.anthropic.com/v1/messages'
      : '/api/chat';

    const headers = {'Content-Type':'application/json'};
    if (window.location.hostname==='localhost') {
      headers['x-api-key']          = CLAUDE_KEY||'';
      headers['anthropic-version']  = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    const res=await fetch(endpoint,{
      method:'POST', headers,
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,system:SYS[type]||SYS['ai-tutor'],messages:history}),
    });
    const data=await res.json();
    reply=data.content?.[0]?.text||fallback(type);
  } catch(e) { reply=fallback(type); }

  ti.innerHTML='';
  S[key].push({role:'bot',name:'MarquisBot',text:reply,time:ts()});
  document.getElementById('msg-list').innerHTML=renderMsgs(S[key]);
  document.getElementById('content-area').scrollTop=99999;
}

function fallback(type) {
  const f={
    'ai-tutor':["Great question! **Vocabulary** is the foundation of fluent English. Try learning 5 new words every day and using each one in a sentence. Would you like a word challenge right now?","**Tenses** are key in English! **Present Simple** = habitual actions (`She reads every day`), **Present Continuous** = happening now (`She is reading`). Which tense would you like to practice?"],
    'writing':["**Great effort!** Your sentence structure is clear. Consider varying sentence length — mix short punchy sentences with longer flowing ones for better rhythm. **What you did well:** Your idea is communicated clearly!"],
    'grammar':["Great grammar question! **Subject-verb agreement:** singular subject = singular verb (`He runs`), plural subject = plural verb (`They run`). **Tip:** Always identify your subject first before choosing your verb form!"],
  };
  const opts=f[type]||f['ai-tutor'];
  return opts[Math.floor(Math.random()*opts.length)];
}

// ══════════════════════════════════════════════════════════
//  GAMES
// ══════════════════════════════════════════════════════════
function renderGames(ca) {
  S.answered=false;
  const p=userProfile||{};
  ca.innerHTML=`<div class="game-view">
    <div class="game-title">English Games</div>
    <div class="game-subtitle">Play, learn, and climb the leaderboard. Earn points with every correct answer!</div>
    <div class="score-strip">
      <div class="score-card"><div class="sc-label">Score</div><div class="sc-val" id="g-score">${p.score||0}</div></div>
      <div class="score-card"><div class="sc-label">Streak</div><div class="sc-val teal" id="g-streak">${p.streak||0}${(p.streak||0)>=3?' 🔥':''}</div></div>
      <div class="score-card"><div class="sc-label">Correct</div><div class="sc-val" id="g-correct">${p.totalCorrect||0}/${p.totalAttempts||0}</div></div>
      <div class="score-card"><div class="sc-label">Level</div><div class="sc-val" id="g-level" style="font-size:16px">${getLevel(p.score||0)}</div></div>
    </div>
    <div class="game-tabs">
      <button class="gtab ${S.gameMode==='vocab'?'active':''}"    onclick="setMode('vocab')">📚 Vocabulary</button>
      <button class="gtab ${S.gameMode==='fill'?'active':''}"     onclick="setMode('fill')">✏️ Fill the Blank</button>
      <button class="gtab ${S.gameMode==='scramble'?'active':''}" onclick="setMode('scramble')">🔀 Scramble</button>
    </div>
    <div id="game-inner"></div>
  </div>`;
  renderInner();
}

function setMode(m){S.gameMode=m;S.answered=false;renderGames(document.getElementById('content-area'));}
function renderInner(){const gi=document.getElementById('game-inner');if(!gi)return;({vocab:renderVocab,fill:renderFill,scramble:renderScramble}[S.gameMode]||renderVocab)(gi);}

async function gameScore(correct) {
  const p=userProfile||{};
  const ns=correct?(p.streak||0)+1:0;
  const pts=correct?10*(ns>=3?2:1):0;
  await updateProgress({score:pts,streak:ns,totalCorrect:correct?1:0,totalAttempts:1});
  const p2=userProfile;
  document.getElementById('g-score').textContent=p2.score;
  document.getElementById('g-streak').textContent=p2.streak+(p2.streak>=3?' 🔥':'');
  document.getElementById('g-correct').textContent=p2.totalCorrect+'/'+p2.totalAttempts;
  document.getElementById('g-level').textContent=getLevel(p2.score);
  return {streak:ns,pts};
}

function renderVocab(gi) {
  const q=VOCAB[S.vocabIdx%VOCAB.length];
  gi.innerHTML=`<div class="qcard"><div class="qcard-tag">What does this word mean?</div>
    <div class="qcard-word">${q.word}</div>
    <div class="qcard-hint">💡 ${q.hint} &nbsp;|&nbsp; Level: ${q.level}</div></div>
  <div class="options-grid">${q.options.map((o,i)=>`<button class="opt" onclick="answerVocab(${i})" id="vopt-${i}">${esc(o)}</button>`).join('')}</div>
  <div class="feedback-pill" id="feedback"></div>
  <div class="action-row">
    <button class="btn-secondary" onclick="switchChannel('ai-tutor');setTimeout(()=>{const i=document.querySelector('.input-box input');if(i)i.value='Explain the word ${q.word} with 3 example sentences and its synonyms.'},400)">Ask tutor</button>
    <button class="btn-primary" id="next-btn" style="display:none" onclick="S.vocabIdx++;S.answered=false;renderVocab(document.getElementById('game-inner'))">Next word →</button>
  </div>`;
}
async function answerVocab(i) {
  if(S.answered)return; S.answered=true;
  const q=VOCAB[S.vocabIdx%VOCAB.length];
  const ok=i===q.correct; const {streak,pts}=await gameScore(ok);
  document.querySelectorAll('.opt').forEach((b,idx)=>{b.disabled=true;if(idx===q.correct)b.classList.add('correct');if(idx===i&&!ok)b.classList.add('wrong');});
  const fb=document.getElementById('feedback');
  fb.className='feedback-pill show '+(ok?'ok':'bad');
  fb.textContent=ok?`✓ Correct! "${q.word}" means: ${q.meaning}${streak>=3?' — Streak bonus x2! 🔥':''}`:`✗ Not quite. "${q.word}" means: ${q.meaning}`;
  document.getElementById('next-btn').style.display='block';
}

function renderFill(gi) {
  const q=FILL[S.fillIdx%FILL.length];
  gi.innerHTML=`<div class="qcard"><div class="qcard-tag">Fill in the blank</div>
    <div class="qcard-word" style="font-size:20px;line-height:1.4;font-family:'Instrument Sans',sans-serif;font-weight:600">${esc(q.sentence)}</div></div>
  <div class="options-grid">${q.options.map((o,i)=>`<button class="opt" onclick="answerFill(${i})" id="fopt-${i}">${esc(o)}</button>`).join('')}</div>
  <div class="feedback-pill" id="feedback"></div>
  <div class="action-row">
    <button class="btn-secondary" onclick="S.fillIdx++;S.answered=false;renderFill(document.getElementById('game-inner'))">Skip</button>
    <button class="btn-primary" id="next-btn" style="display:none" onclick="S.fillIdx++;S.answered=false;renderFill(document.getElementById('game-inner'))">Next →</button>
  </div>`;
}
async function answerFill(i) {
  if(S.answered)return; S.answered=true;
  const q=FILL[S.fillIdx%FILL.length];
  const ok=i===q.correct; await gameScore(ok);
  document.querySelectorAll('.opt').forEach((b,idx)=>{b.disabled=true;if(idx===q.correct)b.classList.add('correct');if(idx===i&&!ok)b.classList.add('wrong');});
  const fb=document.getElementById('feedback');
  fb.className='feedback-pill show '+(ok?'ok':'bad');
  fb.textContent=ok?`✓ Excellent! "${q.options[q.correct]}" is correct!`:`✗ The correct word was: "${q.options[q.correct]}"`;
  document.getElementById('next-btn').style.display='block';
}

function renderScramble(gi) {
  const q=SCRAMBLE[S.scrambleIdx%SCRAMBLE.length];
  const letters=shuffle(q.word.split(''));
  S._scrLetters=letters; S._scrWord=q.word; S.scrambleAnswer=[]; S.scrambleUsed=new Array(letters.length).fill(false);
  gi.innerHTML=`<div class="qcard"><div class="qcard-tag">Unscramble the letters</div>
    <div class="qcard-hint" style="margin-bottom:16px">💡 ${q.hint}</div>
    <div class="tile-row" id="answer-slots">${q.word.split('').map((_,i)=>`<div class="slot" id="slot-${i}" onclick="removeSlot(${i})"></div>`).join('')}</div></div>
  <div class="tile-row" id="letter-tiles">${letters.map((l,i)=>`<div class="tile" id="tile-${i}" onclick="addTile('${l}',${i})">${l}</div>`).join('')}</div>
  <div class="feedback-pill" id="feedback"></div>
  <div class="action-row">
    <button class="btn-secondary" onclick="clearSc()">Clear</button>
    <button class="btn-secondary" onclick="S.scrambleIdx++;S.answered=false;renderScramble(document.getElementById('game-inner'))">Skip</button>
    <button class="btn-primary" id="check-btn" onclick="checkSc()">Check ✓</button>
    <button class="btn-primary" id="next-btn" style="display:none" onclick="S.scrambleIdx++;S.answered=false;renderScramble(document.getElementById('game-inner'))">Next →</button>
  </div>`;
}
function addTile(l,i){if(S.scrambleUsed[i]||S.answered)return;const si=S.scrambleAnswer.length;if(si>=S._scrWord.length)return;S.scrambleAnswer.push({letter:l,tileIdx:i});S.scrambleUsed[i]=true;document.getElementById('tile-'+i).classList.add('used');const s=document.getElementById('slot-'+si);s.textContent=l;s.classList.add('filled');}
function removeSlot(i){if(S.answered||i>=S.scrambleAnswer.length)return;S.scrambleAnswer.splice(i).forEach(({tileIdx})=>{S.scrambleUsed[tileIdx]=false;document.getElementById('tile-'+tileIdx).classList.remove('used');});for(let j=i;j<S._scrWord.length;j++){const s=document.getElementById('slot-'+j);const e=S.scrambleAnswer[j];if(e){s.textContent=e.letter;s.classList.add('filled');}else{s.textContent='';s.className='slot';}}}
function clearSc(){S.scrambleAnswer=[];S.scrambleUsed=new Array(S._scrLetters.length).fill(false);S._scrLetters.forEach((_,i)=>document.getElementById('tile-'+i).classList.remove('used'));for(let i=0;i<S._scrWord.length;i++){const s=document.getElementById('slot-'+i);s.textContent='';s.className='slot';}document.getElementById('feedback').className='feedback-pill';}
async function checkSc(){
  if(S.answered)return;
  const att=S.scrambleAnswer.map(a=>a.letter).join('');
  if(att.length<S._scrWord.length){const fb=document.getElementById('feedback');fb.className='feedback-pill show bad';fb.textContent='Place all letters before checking!';return;}
  S.answered=true;const ok=att===S._scrWord;await gameScore(ok);
  for(let i=0;i<S._scrWord.length;i++)document.getElementById('slot-'+i).classList.add(ok?'correct':'wrong');
  const fb=document.getElementById('feedback');fb.className='feedback-pill show '+(ok?'ok':'bad');
  fb.textContent=ok?`✓ Brilliant! The word is "${S._scrWord}"!`:`✗ Not quite — the answer is "${S._scrWord}"`;
  document.getElementById('check-btn').style.display='none';
  document.getElementById('next-btn').style.display='block';
}

// ══════════════════════════════════════════════════════════
//  LEADERBOARD
// ══════════════════════════════════════════════════════════
async function renderLeaderboard(ca) {
  ca.innerHTML=`<div style="padding:24px"><div class="spinner-wrap" style="height:200px"><div class="spinner"></div></div></div>`;
  let students=[];
  if (!DEMO_MODE) {
    try {
      const snap=await db.collection('users').where('role','==','student').orderBy('score','desc').limit(20).get();
      snap.forEach(d=>students.push({id:d.id,...d.data()}));
    } catch(e){}
  }
  if (!students.length) students=[
    {name:'Amara K.',   score:1240,streak:12},
    {name:'James T.',   score:980, streak:8},
    {name:'Fatima O.',  score:820, streak:5},
    {name:'Carlos M.',  score:710, streak:3},
    {name:'Priya S.',   score:590, streak:7},
    {name:userProfile?.name||'You',score:userProfile?.score||0,streak:userProfile?.streak||0,isMe:true},
  ].sort((a,b)=>b.score-a.score);

  ca.innerHTML=`<div style="padding:24px">
    <div class="dash-title">🏆 Weekly Leaderboard</div>
    <div class="dash-sub">Top students ranked by total points. Play games to earn more!</div>
    <table class="leader-table">
      <thead><tr><th>#</th><th>Student</th><th>Level</th><th>Streak</th><th>Score</th></tr></thead>
      <tbody>${students.map((s,i)=>{
        const rc=i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-other';
        const lv=getLevel(s.score||0);
        const lvc=lv==='Advanced'?'badge-adv':lv==='Intermediate'?'badge-int':'badge-beg';
        return `<tr style="${s.isMe?'background:rgba(232,168,76,0.05)':''}">
          <td><div class="rank-badge ${rc}">${i+1}</div></td>
          <td><strong style="${s.isMe?'color:var(--gold2)':''}">${esc(s.name||'?')}${s.isMe?' (you)':''}</strong></td>
          <td><span class="ldr-badge ${lvc}">${lv}</span></td>
          <td style="color:var(--text3)">${s.streak||0} 🔥</td>
          <td><span class="ldr-score">${s.score||0}</span></td>
        </tr>`;
      }).join('')}</tbody>
    </table>
    <div style="margin-top:20px"><button class="btn-primary" onclick="switchChannel('games')" style="width:100%">Play games to earn more points →</button></div>
  </div>`;
}

// ══════════════════════════════════════════════════════════
//  TEACHER DASHBOARD
// ══════════════════════════════════════════════════════════
async function loadStudents() {
  try {
    const snap=await db.collection('users').where('role','==','student').get();
    S.allStudents=snap.docs.map(d=>({id:d.id,...d.data()}));
  } catch(e){S.allStudents=[];}
}

async function renderDashboard(ca) {
  if (userProfile?.role!=='teacher'){ca.innerHTML='<div style="padding:24px;color:var(--text3)">🔒 Teacher access only.</div>';return;}
  ca.innerHTML=`<div style="padding:24px"><div class="spinner-wrap" style="height:200px"><div class="spinner"></div></div></div>`;
  if (!S.allStudents.length&&!DEMO_MODE) await loadStudents();
  let students=S.allStudents;
  if (!students.length) students=[
    {name:'Amara K.',  email:'amara@demo.com',  score:1240,streak:12,totalCorrect:124,totalAttempts:138,nativeLanguage:'Yoruba',  lastActive:'2026-04-01'},
    {name:'James T.',  email:'james@demo.com',  score:980, streak:8, totalCorrect:98, totalAttempts:112,nativeLanguage:'French',  lastActive:'2026-04-02'},
    {name:'Fatima O.', email:'fatima@demo.com', score:820, streak:5, totalCorrect:82, totalAttempts:100,nativeLanguage:'Arabic',  lastActive:'2026-03-30'},
    {name:'Carlos M.', email:'carlos@demo.com', score:710, streak:3, totalCorrect:71, totalAttempts:95, nativeLanguage:'Spanish', lastActive:'2026-04-01'},
    {name:'Priya S.',  email:'priya@demo.com',  score:590, streak:7, totalCorrect:59, totalAttempts:80, nativeLanguage:'Hindi',   lastActive:'2026-04-02'},
    {name:'Noah L.',   email:'noah@demo.com',   score:340, streak:2, totalCorrect:34, totalAttempts:55, nativeLanguage:'German',  lastActive:'2026-03-25'},
    {name:'Aisha B.',  email:'aisha@demo.com',  score:210, streak:1, totalCorrect:21, totalAttempts:40, nativeLanguage:'Turkish', lastActive:'2026-03-28'},
  ];
  const totalPts=students.reduce((s,u)=>s+(u.score||0),0);
  const avgAcc=students.length?Math.round(students.reduce((s,u)=>s+((u.totalCorrect||0)/Math.max(u.totalAttempts||1,1)*100),0)/students.length):0;
  const active7=students.filter(u=>{if(!u.lastActive)return false;return(Date.now()-new Date(u.lastActive).getTime())<7*24*3600*1000;}).length;
  const bars=[65,80,72,90,85,95,88],days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  ca.innerHTML=`<div style="padding:24px">
    <div class="dash-title">📊 Student Dashboard</div>
    <div class="dash-sub">Live overview of all student activity — MarquisTeacher Academy.</div>
    <div class="dash-stats">
      <div class="dash-stat"><div class="ds-label">Total Students</div><div class="ds-val">${students.length}</div><div class="ds-sub">enrolled</div></div>
      <div class="dash-stat"><div class="ds-label">Active (7d)</div><div class="ds-val green">${active7}</div><div class="ds-sub">of ${students.length}</div></div>
      <div class="dash-stat"><div class="ds-label">Avg Accuracy</div><div class="ds-val teal">${avgAcc}%</div><div class="ds-sub">across all games</div></div>
      <div class="dash-stat"><div class="ds-label">Total Points</div><div class="ds-val purple">${totalPts.toLocaleString()}</div><div class="ds-sub">earned total</div></div>
    </div>
    <div class="chart-wrap">
      <div class="section-title">Weekly Activity</div>
      <div class="mini-chart">${bars.map((h,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div class="bar" style="height:${h}%"></div><div class="bar-label">${days[i]}</div></div>`).join('')}</div>
    </div>
    <div class="section-title">All Students</div>
    <div style="overflow-x:auto"><table class="student-table">
      <thead><tr><th>Student</th><th>Level</th><th>Score</th><th>Accuracy</th><th>Streak</th><th>Native Lang</th><th>Activity</th><th></th></tr></thead>
      <tbody>${students.map(s=>{
        const acc=s.totalAttempts?Math.round((s.totalCorrect||0)/s.totalAttempts*100):0;
        const lv=getLevel(s.score||0);const lvc=lv==='Advanced'?'badge-adv':lv==='Intermediate'?'badge-int':'badge-beg';
        const days=s.lastActive?Math.floor((Date.now()-new Date(s.lastActive).getTime())/86400000):999;
        const ac=days<=1?'high':days<=4?'med':'low';
        const al=days===0?'Today':days===1?'Yesterday':days<7?days+'d ago':'Inactive';
        return `<tr>
          <td><div style="display:flex;align-items:center;gap:8px"><div class="student-avatar">${(s.name||'?').charAt(0)}</div><div><div style="font-weight:600">${esc(s.name||'?')}</div><div style="font-size:11px;color:var(--text3)">${esc(s.email||'')}</div></div></div></td>
          <td><span class="ldr-badge ${lvc}">${lv}</span></td>
          <td><strong style="color:var(--gold2)">${s.score||0}</strong></td>
          <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar-wrap" style="width:70px"><div class="progress-bar-fill" style="width:${acc}%"></div></div><span style="font-size:12px;color:var(--text3)">${acc}%</span></div></td>
          <td style="color:var(--text2)">${s.streak||0} 🔥</td>
          <td style="color:var(--text3);font-size:13px">${esc(s.nativeLanguage||'—')}</td>
          <td><span class="activity-dot ${ac}"></span> <span style="font-size:12px;color:var(--text3)">${al}</span></td>
          <td><button class="btn-secondary" style="padding:6px 12px;font-size:12px" onclick='showReport(${JSON.stringify(JSON.stringify(s))})'>Report</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
  </div>`;
}

function showReport(sJson){S.allStudents=[JSON.parse(sJson),...S.allStudents.filter(x=>x.name!==JSON.parse(sJson).name)];switchChannel('reports');}

function renderReports(ca) {
  if (userProfile?.role!=='teacher'){ca.innerHTML='<div style="padding:24px;color:var(--text3)">🔒 Teacher access only.</div>';return;}
  const students=S.allStudents.length?S.allStudents:[
    {name:'Amara K.',  score:1240,streak:12,totalCorrect:124,totalAttempts:138,nativeLanguage:'Yoruba'},
    {name:'James T.',  score:980, streak:8, totalCorrect:98, totalAttempts:112,nativeLanguage:'French'},
    {name:'Fatima O.', score:820, streak:5, totalCorrect:82, totalAttempts:100,nativeLanguage:'Arabic'},
  ];
  ca.innerHTML=`<div style="padding:24px">
    <div class="dash-title">📋 Progress Reports</div>
    <div class="dash-sub">Individual student performance summaries.</div>
    ${students.slice(0,10).map(s=>{
      const acc=s.totalAttempts?Math.round((s.totalCorrect||0)/s.totalAttempts*100):0;
      const lv=getLevel(s.score||0);
      return `<div class="report-card">
        <div class="report-card-header">
          <div class="student-avatar" style="width:42px;height:42px;font-size:16px">${(s.name||'?').charAt(0)}</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:16px">${esc(s.name||'?')}</div>
            <div style="font-size:12px;color:var(--text3)">${lv} · ${esc(s.nativeLanguage||'')} speaker · Streak: ${s.streak||0} 🔥</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:var(--gold2)">${s.score||0} pts</div>
            <div style="font-size:12px;color:var(--text3)">${acc}% accuracy</div>
          </div>
        </div>
        <div class="report-body">
          <strong>${esc((s.name||'Student').split(' ')[0])}</strong> has completed <strong>${s.totalAttempts||0}</strong> questions with <strong>${acc}%</strong> accuracy, earning <strong>${s.score||0} points</strong>.
          ${acc>=80?`They are performing <strong style="color:#5dbb7a">excellently</strong> — consider advancing to harder vocabulary.`:acc>=60?`They are making <strong style="color:var(--gold2)">solid progress</strong> — encourage daily practice.`:`They may benefit from <strong style="color:#f07065">additional support</strong> — recommend the AI tutor channel.`}
          Current streak: <strong>${s.streak||0} days</strong>.
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ── STUDY PARTNERS ────────────────────────────────────────
function renderPartners(ca) {
  const p=[
    {name:'Amara K.',  level:'Advanced',     flag:'🇳🇬',focus:'Writing & Vocabulary',online:true},
    {name:'Carlos M.', level:'Intermediate', flag:'🇲🇽',focus:'Grammar & Speaking',  online:true},
    {name:'Priya S.',  level:'Intermediate', flag:'🇮🇳',focus:'Pronunciation',        online:false},
    {name:'Noah L.',   level:'Beginner',     flag:'🇫🇷',focus:'Basic Grammar',        online:true},
  ];
  ca.innerHTML=`<div style="padding:24px">
    <div class="dash-title">🤝 Study Partners</div>
    <div class="dash-sub">Connect with learners at your level and practice together.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${p.map(s=>`<div style="background:var(--navy3);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:42px;height:42px;border-radius:50%;background:var(--navy4);display:flex;align-items:center;justify-content:center;font-size:22px;position:relative">
            ${s.flag}<span style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:${s.online?'var(--green)':'var(--text3)'};border:2px solid var(--navy3)"></span>
          </div>
          <div><div style="font-weight:600">${s.name}</div><div style="font-size:11px;color:var(--text3)">${s.online?'🟢 Online':'⚫ Offline'}</div></div>
        </div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:4px">Level</div>
        <div style="font-size:13px;margin-bottom:10px">${s.level}</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:4px">Focus Areas</div>
        <div style="font-size:13px;color:var(--text2)">${s.focus}</div>
      </div>`).join('')}
    </div>
  </div>`;
}
