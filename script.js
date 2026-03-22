/* ============================================================
   MarquisTeacher Academy — JavaScript
   Quiz engine · Registration · Exam Board · Mascot · Scroll
   ============================================================ */

// ── API URL ───────────────────────────────────────────────────────────────────
var API_URL = 'https://marquisteacher-backend.onrender.com';

// ── CEFR LEVEL POINTS SCALE ───────────────────────────────────────────────────
var LEVEL_POINTS = { A1:10, A2:20, B1:40, B2:60, C1:80, C2:100 };

var LEVEL_COLORS = {
  A1: { bg:'#e8f8fb', color:'#1a8fa2' },
  A2: { bg:'#eaf7ed', color:'#1e8449' },
  B1: { bg:'#fff9e6', color:'#b7791f' },
  B2: { bg:'#fff0e6', color:'#b7560a' },
  C1: { bg:'#fce8e8', color:'#c0392b' },
  C2: { bg:'#f3e8ff', color:'#7d3c98' }
};

// ── QUIZ DATA: 5 Grammar · 5 Vocabulary · 5 Reading · 5 Idioms ───────────────
var allQuestions = [
  // GRAMMAR
  { skill:'Grammar', text:'Choose the correct word: "She ___ to school every day."', instruction:'Grammar - Select the best option to complete the sentence.', options:['go','goes','going','gone'], correct:1, difficulty:'Beginner', diffClass:'diff-beginner', weight:1 },
  { skill:'Grammar', text:'Which sentence is grammatically correct?', instruction:'Grammar - Only one option is correct.', options:['I am having a car since 2020.','I have had a car since 2020.','I had been having a car since 2020.','I have a car since 2020.'], correct:1, difficulty:'Elementary', diffClass:'diff-beginner', weight:2 },
  { skill:'Grammar', text:'Complete the sentence: "If I ___ the lottery, I would travel the world."', instruction:'Grammar - Choose the correct conditional form.', options:['win','won','had won','would win'], correct:1, difficulty:'Intermediate', diffClass:'diff-intermediate', weight:3 },
  { skill:'Grammar', text:'Which sentence uses the subjunctive mood correctly?', instruction:'Grammar - The subjunctive is used for hypothetical or formal requests.', options:['I suggest that he takes more breaks.','I suggest that he take more breaks.','I suggest that he taking more breaks.','I suggest that he should takes more breaks.'], correct:1, difficulty:'Advanced', diffClass:'diff-advanced', weight:5 },
  { skill:'Grammar', text:'"The committee, despite their reservations, have approved the proposal unanimously." What is true?', instruction:'Grammar - Evaluate subject-verb agreement and pronoun reference.', options:['"their" should be "its" only','"have" should be "has" only','The sentence is entirely correct','Both corrections apply'], correct:3, difficulty:'Mastery', diffClass:'diff-advanced', weight:6 },

  // VOCABULARY
  { skill:'Vocabulary', text:'Choose the word that means "very happy".', instruction:'Vocabulary - Pick the best synonym.', options:['sad','elated','tired','quiet'], correct:1, difficulty:'Beginner', diffClass:'diff-beginner', weight:1 },
  { skill:'Vocabulary', text:'The report was criticized for its ___. The data was unclear and conclusions were hard to follow.', instruction:'Vocabulary - Which word best fits the context?', options:['ambiguity','transparency','brevity','accuracy'], correct:0, difficulty:'Upper-Intermediate', diffClass:'diff-intermediate', weight:4 },
  { skill:'Vocabulary', text:'"She spoke with such ___ that the entire room fell silent."', instruction:'Vocabulary - Choose the most precise and elevated word.', options:['volume','eloquence','speed','cheerfulness'], correct:1, difficulty:'Upper-Intermediate', diffClass:'diff-intermediate', weight:4 },
  { skill:'Vocabulary', text:"The politician's speech was deliberately ___, allowing multiple factions to interpret it in their favour.", instruction:'Vocabulary - Choose the word that best describes intentional vagueness.', options:['terse','mendacious','equivocal','pellucid'], correct:2, difficulty:'Advanced', diffClass:'diff-advanced', weight:5 },
  { skill:'Vocabulary', text:'Which word best describes someone who pretends to be virtuous but is not?', instruction:'Vocabulary - Advanced character descriptor.', options:['altruistic','sanctimonious','magnanimous','obsequious'], correct:1, difficulty:'Mastery', diffClass:'diff-advanced', weight:6 },

  // READING
  { skill:'Reading', text:'"The dog ran fast." What did the dog do?', instruction:'Reading - Answer based on the sentence above.', options:['It sat still','It ran quickly','It barked loudly','It ate food'], correct:1, difficulty:'Beginner', diffClass:'diff-beginner', weight:1 },
  { skill:'Reading', text:'"Despite the heavy rain, the match continued." What does "despite" tell us?', instruction:'Reading - Identify the relationship between the two ideas.', options:['The rain caused the match to continue','The match continued because of the rain','The match continued even though it was raining','The rain stopped before the match'], correct:2, difficulty:'Elementary', diffClass:'diff-beginner', weight:2 },
  { skill:'Reading', text:"The author's tone shifts from optimistic to despondent as the narrative progresses. What does this imply?", instruction:'Reading - Identify the correct interpretation.', options:['The author becomes happier as the story goes on','The mood stays consistent throughout','The author becomes sadder as the story develops','The author is confused about the narrative'], correct:2, difficulty:'Intermediate', diffClass:'diff-intermediate', weight:3 },
  { skill:'Reading', text:'"The legislation, long mired in bureaucratic inertia, finally passed after a decade of advocacy." Best paraphrase?', instruction:'Reading - Choose the most accurate restatement.', options:['The law failed after years of effort','After years of slow progress and campaigning, the law was finally approved','Bureaucrats quickly passed the legislation','The advocacy group opposed the new legislation'], correct:1, difficulty:'Advanced', diffClass:'diff-advanced', weight:5 },
  { skill:'Reading', text:'"His prose is marked by deliberate syntactic inversion and a predilection for the latinate." What does this suggest?', instruction:'Reading - Identify the most accurate interpretation.', options:['He writes in simple, everyday English','He uses reversed sentence structures and prefers words of Latin origin','He avoids complex vocabulary deliberately','He writes predominantly in Latin'], correct:1, difficulty:'Mastery', diffClass:'diff-advanced', weight:6 },

  // IDIOMS
  { skill:'Idioms', text:"\"It's raining cats and dogs.\" What does this mean?", instruction:'Idioms - Choose the correct meaning.', options:['Animals are falling from the sky','It is raining very heavily','The weather is unpredictable','It is slightly drizzling'], correct:1, difficulty:'Beginner', diffClass:'diff-beginner', weight:1 },
  { skill:'Idioms', text:'"He let the cat out of the bag before the surprise party." What happened?', instruction:'Idioms - Choose the best interpretation.', options:['He released a cat accidentally','He kept the party secret','He revealed the secret too early','He caused a disruption'], correct:2, difficulty:'Elementary', diffClass:'diff-beginner', weight:2 },
  { skill:'Idioms', text:'"She decided to bite the bullet and tell her boss the truth." What did she do?', instruction:'Idioms - Interpret the idiomatic expression.', options:['She acted aggressively','She endured difficulty and did something hard','She stayed quiet about the issue','She literally bit something'], correct:1, difficulty:'Intermediate', diffClass:'diff-intermediate', weight:3 },
  { skill:'Idioms', text:'Which sentence uses "burn bridges" most naturally and correctly?', instruction:'Idioms - Consider idiomatic accuracy and register.', options:['He burnt bridges by resigning so suddenly.','He burned the bridge between him and his employer.','He burned some bridges when he resigned without notice.','Resigning without notice, he burned many bridges with colleagues.'], correct:3, difficulty:'Advanced', diffClass:'diff-advanced', weight:5 },
  { skill:'Idioms', text:'Which phrase most precisely conveys "saying something that inadvertently reveals a hidden truth"?', instruction:'Idioms - Test of advanced rhetorical vocabulary.', options:['A Freudian slip','A non sequitur','A red herring','An anachronism'], correct:0, difficulty:'Mastery', diffClass:'diff-advanced', weight:6 }
];

var maxPossible = allQuestions.reduce(function(s,q){ return s+q.weight; }, 0);

var levels = [
  { code:'A1', name:'Beginner',          color:'#2ab3c8', bg:'#e8f8fb', min:0,                            desc:"You understand and use basic expressions and simple phrases. A great starting point — with guidance, you'll progress quickly!" },
  { code:'A2', name:'Elementary',         color:'#27ae60', bg:'#eaf7ed', min:Math.round(maxPossible*0.16), desc:"You can communicate in simple, routine situations. You have a solid foundation — now it's time to expand your range." },
  { code:'B1', name:'Intermediate',       color:'#f39c12', bg:'#fff9e6', min:Math.round(maxPossible*0.32), desc:"You can handle most everyday situations with reasonable confidence. You're building real fluency — keep going!" },
  { code:'B2', name:'Upper-Intermediate', color:'#e67e22', bg:'#fff0e6', min:Math.round(maxPossible*0.50), desc:"You communicate effectively on a wide range of topics. You're approaching professional-level English — impressive!" },
  { code:'C1', name:'Advanced',           color:'#e74c3c', bg:'#fce8e8', min:Math.round(maxPossible*0.68), desc:"You express yourself fluently and spontaneously, using language flexibly for social, academic, and professional purposes." },
  { code:'C2', name:'Mastery',            color:'#8e44ad', bg:'#f3e8ff', min:Math.round(maxPossible*0.85), desc:"You can understand virtually everything with ease and express yourself with precision. Exceptional English!" }
];

// ── STATE ─────────────────────────────────────────────────────────────────────
var questions   = [];
var current     = 0;
var score       = 0;
var answered    = false;
var userAnswers = [];
var mascotTimer = null;

// Registration state
var regName      = '';
var regSelfLevel = '';
var latestEntry  = null;

// ── UTILITIES ─────────────────────────────────────────────────────────────────
function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length-1; i > 0; i--) {
    var j = Math.floor(Math.random()*(i+1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function getLevelFromScore(s) {
  var lvl = levels[0];
  for (var i = 0; i < levels.length; i++) {
    if (s >= levels[i].min) lvl = levels[i];
  }
  return lvl;
}

// ── SERVER FUNCTIONS ──────────────────────────────────────────────────────────

// Save result to Firebase via backend
async function saveResultToServer(entry) {
  try {
    var response = await fetch(API_URL + '/api/exam/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:       entry.name,
        resultCode: entry.result,
        resultName: entry.result,
        selfLevel:  entry.selfLevel,
        score:      entry.score,
        maxScore:   maxPossible
      })
    });
    if (response.ok) {
      console.log('Result saved to Firebase!');
    }
  } catch(e) {
    console.log('Could not sync to server — using localStorage only:', e);
  }
}

// Load board from Firebase via backend
async function loadBoardFromServer() {
  try {
    var response = await fetch(API_URL + '/api/exam/board');
    if (!response.ok) throw new Error('Server error');
    var data = await response.json();
    return data.board || [];
  } catch(e) {
    console.log('Could not load from server — falling back to localStorage:', e);
    return loadBoard();
  }
}

// Load board stats from server
async function loadStatsFromServer() {
  try {
    var response = await fetch(API_URL + '/api/exam/board/stats');
    if (!response.ok) throw new Error('Server error');
    return await response.json();
  } catch(e) {
    return null;
  }
}

// ── REGISTRATION MODAL ────────────────────────────────────────────────────────
function openRegistration() {
  document.getElementById('reg-overlay').classList.add('open');
  document.getElementById('reg-name').focus();
  showMascot("Enter your name and pick your current level — then let's see how you do! 🎯", 4000);
}

function closeRegistration() {
  document.getElementById('reg-overlay').classList.remove('open');
  document.getElementById('reg-error').style.display = 'none';
}

function pickLevel(btn) {
  document.querySelectorAll('.level-pick-btn').forEach(function(b) {
    b.classList.remove('selected');
  });
  btn.classList.add('selected');
  regSelfLevel = btn.getAttribute('data-level');
}

function startExam() {
  var name = document.getElementById('reg-name').value.trim();
  var err  = document.getElementById('reg-error');
  if (!name || !regSelfLevel) {
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
  regName = name;
  closeRegistration();
  beginQuiz();
  document.getElementById('quiz').scrollIntoView({ behavior:'smooth' });
}

// ── QUIZ ENGINE ───────────────────────────────────────────────────────────────
function beginQuiz() {
  current = 0; score = 0; answered = false; userAnswers = [];
  questions = shuffleArray(allQuestions);

  document.getElementById('quiz-intro').style.display  = 'none';
  document.getElementById('quiz-result').style.display = 'none';
  document.getElementById('quiz-main').style.display   = 'block';

  document.getElementById('quiz-user-bar').innerHTML =
    '<span>Taking exam as: <strong>' + regName + '</strong></span>' +
    '<span>Self-assessed: <strong>' + regSelfLevel + '</strong></span>';

  renderQuestion();
  showMascot("Good luck, " + regName + "! Take your time — no rush. 😊", 3000);
}

function renderQuestion() {
  var q = questions[current];
  document.getElementById('q-counter').textContent     = 'Question ' + (current+1) + ' of ' + questions.length;
  document.getElementById('q-difficulty').textContent  = q.difficulty;
  document.getElementById('q-difficulty').className    = 'quiz-difficulty ' + q.diffClass;
  document.getElementById('progress-fill').style.width = ((current/questions.length)*100 + 5) + '%';
  document.getElementById('q-text').textContent        = q.text;
  document.getElementById('q-instruction').textContent = q.instruction;

  var opts    = document.getElementById('q-options');
  var letters = ['A','B','C','D'];
  opts.innerHTML = '';
  for (var i = 0; i < q.options.length; i++) {
    var btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.innerHTML = '<span class="quiz-option-letter">' + letters[i] + '</span>' + q.options[i];
    btn.setAttribute('data-idx', i);
    btn.onclick = makeSelectHandler(i, btn);
    opts.appendChild(btn);
  }
  document.getElementById('next-btn').disabled = true;
  answered = false;
}

function makeSelectHandler(idx, btn) {
  return function() { selectOption(idx, btn); };
}

function selectOption(idx, btn) {
  if (answered) return;
  answered = true;
  var q       = questions[current];
  var allOpts = document.querySelectorAll('.quiz-option');
  for (var i = 0; i < allOpts.length; i++) allOpts[i].setAttribute('disabled', true);
  allOpts[q.correct].classList.add('correct');

  if (idx === q.correct) {
    score += q.weight;
    btn.classList.add('correct');
    userAnswers.push({ q:q, correct:true });
    showMascot('Correct! 🎉 Keep it up, ' + regName + '!', 2500);
  } else {
    btn.classList.add('wrong');
    userAnswers.push({ q:q, correct:false });
    showMascot('Not quite — the answer was <strong>' + ['A','B','C','D'][q.correct] + '</strong>. You\'ll get it next time!', 2800);
  }
  document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
  current++;
  if (current >= questions.length) {
    showResult();
  } else {
    renderQuestion();
  }
}

// ── RESULTS ───────────────────────────────────────────────────────────────────
function showResult() {
  document.getElementById('quiz-main').style.display = 'none';
  document.getElementById('quiz-result').style.display = 'block';

  var lvl = getLevelFromScore(score);

  var badge = document.getElementById('result-badge');
  badge.style.cssText = 'background:' + lvl.bg + ';color:' + lvl.color + ';border:3px solid ' + lvl.color;
  badge.innerHTML = lvl.code + '<span>' + lvl.name + '</span>';

  document.getElementById('result-level-name').textContent = regName + ', you\'re at ' + lvl.code + ' — ' + lvl.name;
  document.getElementById('result-desc').textContent       = lvl.desc;

  // Skill breakdown
  var skillMeta = {
    Grammar:    { label:'Grammar',              color:'#2ab3c8' },
    Vocabulary: { label:'Vocabulary',            color:'#27ae60' },
    Reading:    { label:'Reading Comprehension', color:'#f39c12' },
    Idioms:     { label:'Idioms & Expressions',  color:'#8e44ad' }
  };
  var skillMax = {}, skillScore = {}, keys = Object.keys(skillMeta);
  for (var i=0;i<keys.length;i++){skillMax[keys[i]]=0;skillScore[keys[i]]=0;}
  for (var i=0;i<allQuestions.length;i++) skillMax[allQuestions[i].skill]+=allQuestions[i].weight;
  for (var i=0;i<userAnswers.length;i++) {
    if(userAnswers[i].correct) skillScore[userAnswers[i].q.skill]+=userAnswers[i].q.weight;
  }
  var bars = '';
  for (var i=0;i<keys.length;i++){
    var s=keys[i], pct=Math.round((skillScore[s]/skillMax[s])*100);
    bars += '<div style="margin-bottom:0.75rem">'
          + '<div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px">'
          + '<span style="color:var(--ink);font-weight:500">' + skillMeta[s].label + '</span>'
          + '<span style="color:var(--gray);font-family:\'Space Mono\',monospace">' + pct + '%</span></div>'
          + '<div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden">'
          + '<div style="height:100%;width:' + pct + '%;background:' + skillMeta[s].color + ';border-radius:3px;transition:width 1.2s ease 0.3s"></div>'
          + '</div></div>';
  }
  document.getElementById('result-score').innerHTML =
    '<div style="font-family:\'Space Mono\',monospace;font-size:0.75rem;color:var(--gray);margin-bottom:1.5rem">Total score: ' + score + ' / ' + maxPossible + '</div>'
    + '<div style="background:var(--cream);border-radius:8px;padding:1.25rem 1.5rem;text-align:left;margin-bottom:1rem">'
    + '<div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--gray);margin-bottom:1rem;font-family:\'Space Mono\',monospace">Skill Breakdown</div>'
    + bars + '</div>';

  // Self-assessment comparison
  var selfPts   = LEVEL_POINTS[regSelfLevel] || 0;
  var resultPts = LEVEL_POINTS[lvl.code]     || 0;
  var compClass, compMsg;
  if (lvl.code === regSelfLevel) {
    compClass = 'match';
    compMsg   = '✅ Spot on! Your result matches your self-assessment of <strong>' + regSelfLevel + '</strong>.';
  } else if (resultPts > selfPts) {
    compClass = 'higher';
    compMsg   = '🚀 Great news! You scored <strong>' + lvl.code + '</strong> — higher than your self-assessment of ' + regSelfLevel + '.';
  } else {
    compClass = 'lower';
    compMsg   = '📚 You scored <strong>' + lvl.code + '</strong> — your self-assessment of ' + regSelfLevel + ' gives you a clear target to work towards!';
  }
  document.getElementById('result-comparison').innerHTML =
    '<div class="' + compClass + '">' + compMsg + '</div>';

  // Save to both localStorage AND Firebase
  var entry = {
    name:      regName,
    result:    lvl.code,
    selfLevel: regSelfLevel,
    points:    resultPts,
    score:     score,
    ts:        Date.now()
  };
  latestEntry = entry;
  saveToBoardStorage(entry);   // localStorage (instant, offline backup)
  saveResultToServer(entry);   // Firebase via backend (shared globally)
  renderBoard();

  showMascot('Amazing effort, ' + regName + '! You are now on the <strong>Exam Board</strong>! 🏆', 6000);
}

// ── EXAM BOARD STORAGE ────────────────────────────────────────────────────────
var STORAGE_KEY = 'mt_examboard_v1';

function loadBoard() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function saveToBoardStorage(entry) {
  var board = loadBoard();
  board.push(entry);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(board)); } catch(e) {}
}

function clearBoard() {
  if (!confirm('Clear the entire Exam Board? This cannot be undone.')) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
  latestEntry = null;
  renderBoard();
  showMascot('The Exam Board has been cleared. Ready for a fresh start! 🧹', 3000);
}

// ── RENDER BOARD (loads from Firebase, falls back to localStorage) ─────────────
async function renderBoard() {
  var board = await loadBoardFromServer();

  // Sort by points desc then score desc
  board.sort(function(a,b) {
    var bPoints = b.points || (LEVEL_POINTS[b.resultCode] || 0);
    var aPoints = a.points || (LEVEL_POINTS[a.resultCode] || 0);
    if (bPoints !== aPoints) return bPoints - aPoints;
    return (b.score||0) - (a.score||0);
  });

  // Try to get stats from server
  var stats = await loadStatsFromServer();

  // Update stat cards
  document.getElementById('board-total').textContent = stats ? stats.total : board.length;

  if (board.length === 0 && (!stats || stats.total === 0)) {
    document.getElementById('board-avg').textContent       = '—';
    document.getElementById('board-top-level').textContent = '—';
    document.getElementById('board-rows').innerHTML =
      '<div class="board-empty">No results yet — be the first to take the exam! 🎓</div>';
    return;
  }

  if (stats) {
    document.getElementById('board-avg').textContent       = stats.avgPoints + ' pts';
    document.getElementById('board-top-level').textContent = stats.topLevel || '—';
  } else {
    var avg = Math.round(board.reduce(function(s,e){ return s+(e.points||0); },0) / board.length);
    document.getElementById('board-avg').textContent = avg + ' pts';
    var levelCounts = {};
    board.forEach(function(e){ var code = e.result||e.resultCode; levelCounts[code]=(levelCounts[code]||0)+1; });
    var topLevel = Object.keys(levelCounts).reduce(function(a,b){ return levelCounts[a]>levelCounts[b]?a:b; });
    document.getElementById('board-top-level').textContent = topLevel;
  }

  var rows = board.map(function(entry, idx) {
    var rank       = idx + 1;
    var rankCls    = rank===1?'rank-1':rank===2?'rank-2':rank===3?'rank-3':'';
    var rankSymbol = rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':rank;
    var code       = entry.result || entry.resultCode || 'A1';
    var col        = LEVEL_COLORS[code] || { bg:'#f0f0f0', color:'#444' };
    var pts        = entry.points || LEVEL_POINTS[code] || 0;
    var barWidth   = Math.round((pts / 100) * 100);
    var isNew      = latestEntry && entry.name===latestEntry.name && entry.ts===latestEntry.ts;
    var newTag     = isNew ? '<span class="board-new-tag">New</span>' : '';

    return '<div class="board-row' + (isNew?' is-new':'') + '">'
      + '<div class="board-rank ' + rankCls + '">' + rankSymbol + '</div>'
      + '<div class="board-name">' + entry.name + newTag + '</div>'
      + '<div><span class="board-level-badge" style="background:' + col.bg + ';color:' + col.color + '">' + code + '</span></div>'
      + '<div class="board-self">' + (entry.selfLevel||'—') + '</div>'
      + '<div class="board-points">' + pts + '</div>'
      + '<div class="board-bar-wrap"><div class="board-bar-fill" style="width:' + barWidth + '%;background:' + col.color + '"></div></div>'
      + '</div>';
  }).join('');

  document.getElementById('board-rows').innerHTML = rows;
}

// ── NAVIGATION HELPERS ────────────────────────────────────────────────────────
function scrollToQuiz() { openRegistration(); }

function viewBoard() {
  document.getElementById('examboard').scrollIntoView({ behavior:'smooth' });
  setTimeout(function(){
    showMascot('Check out the Exam Board — see where you rank! 🏆', 4000);
  }, 600);
}

function openContact() {
  document.getElementById('contact').scrollIntoView({ behavior:'smooth' });
  setTimeout(function(){
    showMascot('Email us at <strong>MarquisTeacher@gmail.com</strong> and mention your result. We\'ll be in touch! 📬', 5000);
  }, 600);
}

function restartQuiz() {
  regName = ''; regSelfLevel = '';
  document.getElementById('quiz-result').style.display = 'none';
  document.getElementById('quiz-main').style.display   = 'none';
  document.getElementById('quiz-intro').style.display  = 'block';
  document.querySelectorAll('.level-pick-btn').forEach(function(b){ b.classList.remove('selected'); });
  document.getElementById('reg-name').value = '';
  openRegistration();
}

// ── CONTACT MODAL ────────────────────────────────────────────
function openContactModal(subject) {
  var overlay   = document.getElementById('contact-modal-overlay');
  var titleEl   = document.getElementById('contact-modal-title');
  var subjectEl = document.getElementById('contact-subject');
  var errorEl   = document.getElementById('contact-error');
  var successEl = document.getElementById('contact-success');
  var btnEl     = document.getElementById('contact-submit-btn');

  if (subject) {
    subjectEl.value    = subject;
    titleEl.textContent = subject.includes('Consultation') ? 'Free Consultation' : 'Sign Up';
  }

  errorEl.textContent    = '';
  errorEl.style.display  = 'none';
  successEl.style.display = 'none';
  btnEl.textContent      = 'Send Message \u2192';
  btnEl.disabled         = false;

  overlay.classList.add('open');
  document.getElementById('contact-name').focus();
  showMascot('Fill in your details and we\'ll get back to you within 24 hours! 📬', 4000);
}

function closeContactModal() {
  document.getElementById('contact-modal-overlay').classList.remove('open');
  ['contact-name','contact-email','contact-message'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
}

async function submitContactForm() {
  var name      = document.getElementById('contact-name').value.trim();
  var email     = document.getElementById('contact-email').value.trim();
  var subject   = document.getElementById('contact-subject').value.trim();
  var message   = document.getElementById('contact-message').value.trim();
  var errorEl   = document.getElementById('contact-error');
  var successEl = document.getElementById('contact-success');
  var btnEl     = document.getElementById('contact-submit-btn');

  errorEl.textContent    = '';
  errorEl.style.display  = 'none';
  successEl.style.display = 'none';

  if (!name || !email || !subject || !message) {
    errorEl.textContent   = 'Please fill in all fields.';
    errorEl.style.display = 'block';
    return;
  }
  if (message.length < 10) {
    errorEl.textContent   = 'Please write a message of at least 10 characters.';
    errorEl.style.display = 'block';
    return;
  }

  btnEl.textContent = 'Sending...';
  btnEl.disabled    = true;

  try {
    var res  = await fetch(API_URL + '/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, subject, message })
    });
    var data = await res.json();

    if (!res.ok) {
      errorEl.textContent   = data.error || 'Something went wrong. Please try again.';
      errorEl.style.display = 'block';
      btnEl.textContent     = 'Send Message \u2192';
      btnEl.disabled        = false;
      return;
    }

    successEl.style.display = 'block';
    btnEl.textContent       = 'Sent! ✅';
    showMascot('Message sent! Marquis will be in touch within 24 hours! 🎉', 5000);

    setTimeout(function() {
      closeContactModal();
      btnEl.textContent = 'Send Message \u2192';
      btnEl.disabled    = false;
    }, 3000);

  } catch(e) {
    errorEl.textContent   = 'Could not connect — opening email instead.';
    errorEl.style.display = 'block';
    btnEl.textContent     = 'Send Message \u2192';
    btnEl.disabled        = false;
    setTimeout(function() {
      window.location.href = 'mailto:MarquisTeacher@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body='    + encodeURIComponent('Name: ' + name + '\n\n' + message);
    }, 1500);
  }
}

// ── MASCOT ────────────────────────────────────────────────────────────────────
function showMascot(msg, duration) {
  if (!duration) duration = 4000;
  clearTimeout(mascotTimer);
  document.getElementById('bubble-text').innerHTML = msg;
  document.getElementById('mascot-wrap').classList.add('show');
  mascotTimer = setTimeout(hideMascot, duration);
}
function hideMascot()    { document.getElementById('mascot-wrap').classList.remove('show'); }
function dismissMascot() { clearTimeout(mascotTimer); hideMascot(); }

// ── SCROLL ANIMATIONS ─────────────────────────────────────────────────────────
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      if (e.target.closest('#quiz')) {
        setTimeout(function(){ showMascot('Want to know your English level? Hit the button to begin! 🎯', 4000); }, 400);
      }
      if (e.target.closest('#examboard')) {
        setTimeout(function(){ showMascot('See how you rank on the <strong>Exam Board</strong>! 🏆', 3500); }, 400);
      }
      if (e.target.closest('#contact')) {
        setTimeout(function(){ showMascot('Ready to start? Email us for a <strong>free consultation</strong>! 🚀', 4000); }, 400);
      }
    }
  });
}, { threshold: 0.2 });

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.fade-in').forEach(function(el) { observer.observe(el); });

  // Load board from Firebase on startup
  renderBoard();

  setTimeout(function() {
    showMascot('<strong>Welcome to MarquisTeacher Academy!</strong> I\'m Marq — click "Test My English Level" to get started! 👋', 5000);
  }, 1800);

  document.getElementById('reg-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeRegistration();
  });

  document.getElementById('contact-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeContactModal();
  });
});
