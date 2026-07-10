'use strict';
/* ============================================================
   CV GENERATOR — main.js (version propre UTF-8)
   ============================================================ */

/* ----------------------------------------------------------
   DONNÉES PAR DÉFAUT
   ---------------------------------------------------------- */
const DEFAULT_DATA = {
  name: 'Jean-Pierre Dubois',
  title: 'Développeur Web & Designer UI/UX',
  email: 'jean.dubois@exemple.com',
  phone: '+229 01 XX XX XX',
  address: 'Cotonou, Bénin',
  linkedin: '',
  portfolio: '',
  photo: '',
  profile: "Développeur web passionné avec 3 ans d'expérience dans la conception d'interfaces modernes et performantes. Spécialisé en React, Node.js et design UI/UX. Je combine créativité et rigueur technique pour livrer des produits digitaux de qualité.",
  experiences: [
    { date:'2024', company:'Agence Digitale XYZ', role:'Développeur Web Front-end', desc:'Développement d\'interfaces React, intégration d\'API REST, optimisation des performances. Collaboration avec une équipe de 5 développeurs.' },
    { date:'2023', company:'StartupTech Africa', role:'Designer UI/UX', desc:'Conception de maquettes Figma, prototypage, tests utilisateurs. Refonte complète de l\'interface mobile (+40% d\'engagement).' },
    { date:'2022-2023', company:'Freelance', role:'Développeur Web Full-stack', desc:'Création de sites web et applications pour des PME locales. Stack : HTML, CSS, JavaScript, PHP, WordPress.' }
  ],
  education: [
    { school:'Université d\'Abomey-Calavi', degree:'Licence en Informatique', date:'2019 - 2022' }
  ],
  certifications: [
    { year:'2023', org:'Google', title:'Google UX Design Certificate' },
    { year:'2022', org:'freeCodeCamp', title:'Responsive Web Design Certification' },
    { year:'2021', org:'OpenClassrooms', title:'Développeur Web JavaScript / React' }
  ],
  skills: [
    { name:'Développement Web', pct:90 },
    { name:'Design UI/UX', pct:82 },
    { name:'React / JavaScript', pct:85 },
    { name:'Gestion de projet', pct:75 },
    { name:'Communication', pct:88 },
    { name:'Résolution de problèmes', pct:90 }
  ],
  tools: ['VS Code', 'Figma', 'React', 'Node.js', 'Git / GitHub'],
  languages: [
    { name:'Français', level:'Natif', pct:100 },
    { name:'Anglais', level:'Avancé', pct:80 }
  ],
  interests: ['Technologie', 'Design', 'Entrepreneuriat', 'Open Source'],
  references: [
    { name:'Marie Koné', role:'Directrice Agence Digitale XYZ', contact:'Tel: +229 01 XX XX XX' }
  ],
  template: 1,
  accentColor: '#2563EB'
};

/* ----------------------------------------------------------
   STATE
   ---------------------------------------------------------- */
let cvData = {};
let cvSettings = { font:'Poppins', fontSize:12, lineHeight:1.6 };
let isDark = false;
let autosaveTimer = null;
let currentStep = 1;
let translatedData = null;
let lastLinkedInPost = '';
let lastLinkedInVariant = 0;
let presentSlides = [];
let presentIndex = 0;

const ACCENT_COLORS = [
  { hex:'#2563EB', name:'Bleu' },
  { hex:'#7c3aed', name:'Violet' },
  { hex:'#059669', name:'Vert' },
  { hex:'#dc2626', name:'Rouge' },
  { hex:'#d97706', name:'Orange' },
  { hex:'#0891b2', name:'Cyan' }
];

const TEMPLATES = [
  { id:1,  name:'Moderne',      pro:false, icon:'columns' },
  { id:2,  name:'Minimaliste',  pro:false, icon:'align-center' },
  { id:3,  name:'Créatif',      pro:false, icon:'paint-brush' },
  { id:4,  name:'Corporate',    pro:false, icon:'building' },
  { id:5,  name:'Executive',    pro:true,  icon:'briefcase' },
  { id:6,  name:'Timeline',     pro:true,  icon:'stream' },
  { id:7,  name:'Élégant',      pro:true,  icon:'feather' },
  { id:8,  name:'Colorblock',   pro:true,  icon:'th-large' },
  { id:9,  name:'Compact',      pro:true,  icon:'compress' },
  { id:10, name:'Gradient Pro', pro:true,  icon:'fire' }
];

/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
  // Restore theme
  const savedTheme = localStorage.getItem('cvTheme');
  if (savedTheme === 'dark') {
    isDark = true;
    document.documentElement.setAttribute('data-theme', 'dark');
    const tog = document.getElementById('themeToggle');
    const ico = document.getElementById('themeIcon');
    if (tog) tog.checked = true;
    if (ico) ico.className = 'fas fa-sun';
  }

  // Restore settings
  const savedSettings = localStorage.getItem('cvSettings');
  if (savedSettings) {
    try { cvSettings = Object.assign({}, cvSettings, JSON.parse(savedSettings)); } catch(e) {}
  }

  loadData();
  renderAllForms();
  renderTemplatePickers();
  renderColorPickers();
  updateStats();
  updateCompletion();
  setInterval(autosaveSilent, 3000);

  // Delay preview so forms are populated first
  setTimeout(updatePreview, 150);
});

/* ----------------------------------------------------------
   DATA
   ---------------------------------------------------------- */
function loadData() {
  const saved = localStorage.getItem('cvGeneratorData');
  if (!saved) { cvData = Object.assign({}, DEFAULT_DATA); return; }
  try {
    const parsed = JSON.parse(saved);
    // Sanity check — reject corrupted data
    if (!parsed || typeof parsed.name !== 'string' ||
        (parsed.name && parsed.name.indexOf('%PDF') >= 0)) {
      localStorage.removeItem('cvGeneratorData');
      cvData = Object.assign({}, DEFAULT_DATA);
      showToast('Données corrompues réinitialisées', 'warning');
    } else {
      cvData = Object.assign({}, DEFAULT_DATA, parsed);
    }
  } catch(e) { cvData = Object.assign({}, DEFAULT_DATA); }
}

function saveData() {
  localStorage.setItem('cvGeneratorData', JSON.stringify(cvData));
  const el = document.getElementById('saveStatus');
  if (el) {
    const now = new Date();
    el.innerHTML = '<i class="fas fa-circle-check"></i><span>Sauvegardé à ' +
      String(now.getHours()).padStart(2,'0') + ':' +
      String(now.getMinutes()).padStart(2,'0') + '</span>';
  }
}

function autosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(function() {
    collectFormData();
    saveData();
    updatePreview();
    updateStats();
    updateCompletion();
  }, 400);
}

function autosaveSilent() {
  collectFormData();
  saveData();
}

/* ----------------------------------------------------------
   COLLECT FORM DATA (safe — never overwrites with null)
   ---------------------------------------------------------- */
function collectFormData() {
  ['name','title','email','phone','address','linkedin','portfolio','profile'].forEach(function(field) {
    const el = document.getElementById('f-' + field);
    if (el !== null) cvData[field] = el.value;
  });
}

/* ----------------------------------------------------------
   NAVIGATION
   ---------------------------------------------------------- */
function showPage(pageId, btn) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });

  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  if (btn) {
    btn.classList.add('active');
  } else {
    const nav = document.querySelector('[data-page="' + pageId + '"]');
    if (nav) nav.classList.add('active');
  }

  const titles = {
    'dashboard':    '<i class="fas fa-home"></i><span>Tableau de bord</span>',
    'builder':      '<i class="fas fa-edit"></i><span>Créer mon CV</span>',
    'preview':      '<i class="fas fa-eye"></i><span>Aperçu du CV</span>',
    'cover-letter': '<i class="fas fa-envelope-open-text"></i><span>Lettre de motivation</span>',
    'score':        '<i class="fas fa-chart-bar"></i><span>Score CV</span>',
    'match':        '<i class="fas fa-search"></i><span>Match Offre</span>',
    'linkedin':     '<i class="fab fa-linkedin"></i><span>Posts LinkedIn</span>',
    'export':       '<i class="fas fa-download"></i><span>Exporter</span>',
    'translate':    '<i class="fas fa-language"></i><span>Traduction Anglais</span>',
    'present':      '<i class="fas fa-tv"></i><span>Mode Présentation</span>',
    'portfolio':    '<i class="fas fa-globe"></i><span>Portfolio Web</span>',
    'qrcode':       '<i class="fas fa-qrcode"></i><span>QR Code</span>',
    'history':      '<i class="fas fa-history"></i><span>Historique</span>',
    'settings':     '<i class="fas fa-sliders-h"></i><span>Apparence</span>',
    'import-cv':    '<i class="fas fa-file-import"></i><span>Importer un CV</span>',
    'profiles':     '<i class="fas fa-layer-group"></i><span>Mes profils CV</span>',
    'tips':         '<i class="fas fa-lightbulb"></i><span>Conseils CV</span>',
    'interview':    '<i class="fas fa-comments"></i><span>Simulation d\'entretien</span>'
  };

  const tb = document.getElementById('topbarTitle');
  if (tb && titles[pageId]) tb.innerHTML = titles[pageId];

  // Page-specific actions
  if (pageId === 'preview') {
    renderTemplatePickers('templateGridPreview');
    renderColorPickers('colorPickerPreview');
    setTimeout(updatePreview, 50);
  }
  if (pageId === 'builder') setTimeout(updatePreview, 50);
  if (pageId === 'score') setTimeout(analyzeCV, 100);
  if (pageId === 'history') renderVersionsList();
  if (pageId === 'qrcode') setTimeout(generateQR, 300);
  if (pageId === 'portfolio') setTimeout(updatePortfolioPreview, 200);
  if (pageId === 'translate') setTimeout(translateCV, 100);
  if (pageId === 'present') setTimeout(buildPresentationSlides, 200);
  if (pageId === 'word') setTimeout(refreshWordPreview, 200);
  if (pageId === 'profiles') renderProfilesList();
  if (pageId === 'interview') { setTimeout(initInterviewPage, 100); setTimeout(renderSampleQuestions, 150); }

  if (window.innerWidth <= 900) toggleSidebar(false);
}

/* ----------------------------------------------------------
   WIZARD
   ---------------------------------------------------------- */
function goToStep(n) {
  currentStep = n;
  document.querySelectorAll('.step-content').forEach(function(s) { s.classList.remove('active'); });
  const sc = document.getElementById('step-' + n);
  if (sc) sc.classList.add('active');

  document.querySelectorAll('.wizard-step').forEach(function(ws) {
    const sn = parseInt(ws.dataset.step);
    ws.classList.remove('active','completed');
    if (sn === n) ws.classList.add('active');
    else if (sn < n) ws.classList.add('completed');
  });

  const pct = Math.round((n / 5) * 100);
  const lbl = document.getElementById('currentStepLabel');
  const bar = document.getElementById('builderProgressBar');
  const pctEl = document.getElementById('builderProgressPct');
  if (lbl) lbl.textContent = n;
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';

  if (n === 5) setTimeout(updatePreview, 50);
}

/* ----------------------------------------------------------
   THEME
   ---------------------------------------------------------- */
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const ico = document.getElementById('themeIcon');
  if (ico) ico.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  localStorage.setItem('cvTheme', isDark ? 'dark' : 'light');
}

/* ----------------------------------------------------------
   SIDEBAR
   ---------------------------------------------------------- */
function toggleSidebar(force) {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const isOpen = sidebar.classList.contains('open');
  const shouldOpen = (force === undefined) ? !isOpen : force;
  sidebar.classList.toggle('open', shouldOpen);
  if (overlay) overlay.classList.toggle('active', shouldOpen);
}

/* ----------------------------------------------------------
   HELPERS
   ---------------------------------------------------------- */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setElStyle(id, prop, val) {
  const el = document.getElementById(id);
  if (el) el.style[prop] = val;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function showToast(msg, type) {
  type = type || 'info';
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success:'circle-check', error:'circle-xmark', info:'circle-info', warning:'triangle-exclamation' };
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<i class="fas fa-' + (icons[type]||'circle-info') + '"></i><span>' + msg + '</span>';
  container.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('hiding');
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 3000);
}

function photoTag(data, cls) {
  if (data.photo) return '<div class="' + cls + '"><img src="' + data.photo + '" alt="Photo" /></div>';
  return '<div class="' + cls + '"><i class="fas fa-user"></i></div>';
}

function contactItems(data, cls) {
  let h = '';
  if (data.phone)     h += '<div class="'+cls+'"><i class="fas fa-phone"></i><span>'+esc(data.phone)+'</span></div>';
  if (data.email)     h += '<div class="'+cls+'"><i class="fas fa-envelope"></i><span>'+esc(data.email)+'</span></div>';
  if (data.address)   h += '<div class="'+cls+'"><i class="fas fa-map-marker-alt"></i><span>'+esc(data.address)+'</span></div>';
  if (data.linkedin)  h += '<div class="'+cls+'"><i class="fab fa-linkedin"></i><span>'+esc(data.linkedin)+'</span></div>';
  if (data.portfolio) h += '<div class="'+cls+'"><i class="fas fa-globe"></i><span>'+esc(data.portfolio)+'</span></div>';
  return h;
}

function contactRow(data, cls) {
  let items = [];
  if (data.phone)     items.push('<span class="'+cls+'"><i class="fas fa-phone"></i>'+esc(data.phone)+'</span>');
  if (data.email)     items.push('<span class="'+cls+'"><i class="fas fa-envelope"></i>'+esc(data.email)+'</span>');
  if (data.address)   items.push('<span class="'+cls+'"><i class="fas fa-map-marker-alt"></i>'+esc(data.address)+'</span>');
  if (data.linkedin)  items.push('<span class="'+cls+'"><i class="fab fa-linkedin"></i>'+esc(data.linkedin)+'</span>');
  if (data.portfolio) items.push('<span class="'+cls+'"><i class="fas fa-globe"></i>'+esc(data.portfolio)+'</span>');
  return '<div class="cv-contact-row">' + items.join('') + '</div>';
}

/* ----------------------------------------------------------
   FORMS — render all fields from cvData
   ---------------------------------------------------------- */
function renderAllForms() {
  setVal('f-name',      cvData.name);
  setVal('f-title',     cvData.title);
  setVal('f-email',     cvData.email);
  setVal('f-phone',     cvData.phone);
  setVal('f-address',   cvData.address);
  setVal('f-linkedin',  cvData.linkedin  || '');
  setVal('f-portfolio', cvData.portfolio || '');
  setVal('f-profile',   cvData.profile);
  updateCharCount(document.getElementById('f-profile'), 'profileCounter', 600);
  renderExperienceList();
  renderEducationList();
  renderCertificationList();
  renderSkillsList();
  renderToolsList();
  renderLanguagesList();
  renderInterestsList();
  renderReferencesList();
  if (cvData.photo) {
    const p = document.getElementById('photoPreview');
    if (p) p.innerHTML = '<img src="' + cvData.photo + '" alt="Photo" />';
  }
}

function updateCharCount(el, counterId, max) {
  if (!el) return;
  const len = el.value.length;
  const counter = document.getElementById(counterId);
  if (!counter) return;
  counter.textContent = len + ' / ' + max;
  counter.className = 'char-counter' + (len >= max ? ' danger' : len > max*0.85 ? ' warn' : '');
}

/* ----------------------------------------------------------
   STATS & COMPLETION
   ---------------------------------------------------------- */
function updateStats() {
  setEl('stat-name',   cvData.name || '—');
  setEl('stat-exp',    String((cvData.experiences||[]).length));
  setEl('stat-skills', String((cvData.skills||[]).length + (cvData.tools||[]).length));
  setEl('stat-edu',    String((cvData.education||[]).length + (cvData.certifications||[]).length));
}

function updateCompletion() {
  const checks = [
    { label:'Nom complet',       done: !!cvData.name },
    { label:'Titre professionnel',done: !!cvData.title },
    { label:'Email',             done: !!cvData.email },
    { label:'Téléphone',         done: !!cvData.phone },
    { label:'Adresse',           done: !!cvData.address },
    { label:'Profil/Résumé',     done: !!(cvData.profile && cvData.profile.length > 30) },
    { label:'Photo de profil',   done: !!cvData.photo },
    { label:'Expériences (1+)',  done: (cvData.experiences||[]).length > 0 },
    { label:'Formation',         done: (cvData.education||[]).length > 0 },
    { label:'Compétences (3+)',  done: (cvData.skills||[]).length >= 3 },
    { label:'Outils',            done: (cvData.tools||[]).length > 0 },
    { label:'Références',        done: (cvData.references||[]).length > 0 }
  ];
  const done = checks.filter(function(c) { return c.done; }).length;
  const pct  = Math.round((done / checks.length) * 100);

  setElStyle('sidebarCompletionBar', 'width', pct + '%');
  setEl('sidebarCompletion', pct + '%');
  setElStyle('dashCompletionBar', 'width', pct + '%');
  setEl('dashCompletionPct', pct + '%');

  const badge = document.getElementById('dashCompletionBadge');
  if (badge) {
    badge.textContent = pct + '%';
    badge.className = 'btn btn-sm ' + (pct >= 80 ? 'btn-success' : pct >= 50 ? 'btn-primary' : 'btn-ghost');
  }

  const cl = document.getElementById('completionChecklist');
  if (cl) {
    cl.innerHTML = checks.map(function(c) {
      return '<div style="display:flex;align-items:center;gap:7px;padding:4px 0">' +
        '<i class="fas fa-' + (c.done ? 'circle-check' : 'circle-xmark') + '" style="color:' + (c.done ? 'var(--success)' : 'var(--text-muted)') + ';font-size:13px"></i>' +
        '<span style="font-size:12px;color:' + (c.done ? 'var(--text)' : 'var(--text-muted)') + '">' + c.label + '</span></div>';
    }).join('');
  }
}

/* ----------------------------------------------------------
   PREVIEW — MAIN RENDER
   ---------------------------------------------------------- */
function updatePreview() {
  // Safely sync form fields — only if they exist in DOM
  const fields = ['name','title','email','phone','address','linkedin','portfolio','profile'];
  fields.forEach(function(field) {
    const el = document.getElementById('f-' + field);
    if (el !== null) cvData[field] = el.value;
  });

  const html = buildCvHTML(cvData);
  ['builderCvPreview','mainCvPreview'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function buildCvHTML(data) {
  const accent = data.accentColor || '#2563EB';
  const fs = "font-family:'" + (cvSettings.font||'Poppins') + "',sans-serif;" +
             "font-size:" + (cvSettings.fontSize||12) + "px;" +
             "line-height:" + (cvSettings.lineHeight||1.6);
  switch (data.template || 1) {
    case 1:  return buildTemplate1(data, accent, fs);
    case 2:  return buildTemplate2(data, accent, fs);
    case 3:  return buildTemplate3(data, accent, fs);
    case 4:  return buildTemplate4(data, accent, fs);
    case 5:  return buildTemplate5(data, accent, fs);
    case 6:  return buildTemplate6(data, accent, fs);
    case 7:  return buildTemplate7(data, accent, fs);
    case 8:  return buildTemplate8(data, accent, fs);
    case 9:  return buildTemplate9(data, accent, fs);
    case 10: return buildTemplate10(data, accent, fs);
    default: return buildTemplate1(data, accent, fs);
  }
}

/* ----------------------------------------------------------
   TEMPLATE 1 — Moderne (sidebar colorée)
   ---------------------------------------------------------- */
function buildTemplate1(d, accent, fs) {
  const skills = (d.skills||[]).map(function(sk) {
    return '<div class="cv-skill-item"><div class="cv-skill-name"><span>'+esc(sk.name)+'</span><span>'+sk.pct+'%</span></div>' +
           '<div class="cv-skill-bar"><div class="cv-skill-fill" style="width:'+sk.pct+'%"></div></div></div>';
  }).join('');
  const tools = (d.tools||[]).map(function(t) { return '<span class="cv-tool-tag">'+esc(t)+'</span>'; }).join('');
  const langs = (d.languages||[]).map(function(l) {
    const dots = [1,2,3,4,5].map(function(n) {
      return '<div class="cv-lang-dot ' + (n <= Math.round((l.pct||60)/20) ? 'filled' : '') + '"></div>';
    }).join('');
    return '<div class="cv-lang-item"><span>'+esc(l.name)+'</span><div class="cv-lang-dots">'+dots+'</div></div>';
  }).join('');
  const interests = (d.interests||[]).map(function(it) {
    return '<span class="cv-interest-tag">'+esc(it)+'</span>';
  }).join('');
  const exps = (d.experiences||[]).map(function(e) {
    return '<div class="cv-experience-item">' +
      '<div class="cv-exp-date">'+esc(e.date)+'</div>' +
      '<div class="cv-exp-body">' +
        '<p class="cv-exp-title">'+esc(e.role)+'</p>' +
        '<p class="cv-exp-company">'+esc(e.company)+'</p>' +
        '<p class="cv-exp-desc">'+esc(e.desc)+'</p>' +
      '</div></div>';
  }).join('');
  const edu = (d.education||[]).map(function(e) {
    return '<div class="cv-edu-item">' +
      '<p class="cv-edu-school">'+esc(e.school)+'</p>' +
      '<p class="cv-edu-degree">'+esc(e.degree)+'</p>' +
      '<p class="cv-edu-date">'+esc(e.date)+'</p></div>';
  }).join('');
  const certs = (d.certifications||[]).map(function(c) {
    return '<div class="cv-edu-item">' +
      '<p class="cv-edu-school">'+esc(c.year)+(c.org?' — '+esc(c.org):'')+'</p>' +
      '<p class="cv-edu-degree">'+esc(c.title)+'</p></div>';
  }).join('');
  const refs = (d.references||[]).map(function(r) {
    return '<div class="cv-ref-item">' +
      '<p class="cv-ref-name">'+esc(r.name)+'</p>' +
      '<p class="cv-ref-detail">'+esc(r.role)+'</p>' +
      '<p class="cv-ref-detail">'+esc(r.contact)+'</p></div>';
  }).join('');

  return '<div class="cv-template-1" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-sidebar">' +
      '<div class="cv-photo-wrapper">'+photoTag(d,'cv-photo')+'</div>' +
      '<div class="cv-sidebar-section"><h3>Contact</h3>'+contactItems(d,'cv-contact-item')+'</div>' +
      (skills ? '<div class="cv-sidebar-section"><h3>Compétences</h3>'+skills+'</div>' : '') +
      (tools  ? '<div class="cv-sidebar-section"><h3>Outils</h3>'+tools+'</div>' : '') +
      (langs  ? '<div class="cv-sidebar-section"><h3>Langues</h3>'+langs+'</div>' : '') +
      (interests ? '<div class="cv-sidebar-section"><h3>Intérêts</h3>'+interests+'</div>' : '') +
    '</div>' +
    '<div class="cv-main">' +
      '<div class="cv-header">' +
        '<h1 class="cv-name">'+(esc(d.name)||'Votre Nom')+'</h1>' +
        '<p class="cv-title">'+(esc(d.title)||'Titre professionnel')+'</p>' +
      '</div>' +
      (d.profile ? '<div><h2 class="cv-section-title">Profil</h2><p class="cv-profile-text">'+esc(d.profile)+'</p></div>' : '') +
      (exps  ? '<div><h2 class="cv-section-title">Expériences</h2>'+exps+'</div>' : '') +
      (edu||certs ? '<div><h2 class="cv-section-title">Formation</h2>'+edu+certs+'</div>' : '') +
      (refs  ? '<div><h2 class="cv-section-title">Références</h2>'+refs+'</div>' : '') +
    '</div></div>';
}

/* ----------------------------------------------------------
   TEMPLATE 2 — Minimaliste
   ---------------------------------------------------------- */
function buildTemplate2(d, accent, fs) {
  const skills = (d.skills||[]).map(function(sk) {
    return '<div class="cv-skill-item"><div class="cv-skill-name"><span>'+esc(sk.name)+'</span><span>'+sk.pct+'%</span></div><div class="cv-skill-bar"><div class="cv-skill-fill" style="width:'+sk.pct+'%"></div></div></div>';
  }).join('');
  const tools = (d.tools||[]).map(function(t) { return '<span class="cv-tool-tag">'+esc(t)+'</span>'; }).join('');
  const langs = (d.languages||[]).map(function(l) {
    return '<div class="cv-lang-item"><span>'+esc(l.name)+'</span><span class="cv-lang-level">'+esc(l.level)+'</span></div>';
  }).join('');
  const np = (d.name||'Votre Nom').split(' ');
  const exps = (d.experiences||[]).map(function(e) {
    return '<div class="cv-experience-item"><div class="cv-exp-date">'+esc(e.date)+'</div><div class="cv-exp-body"><p class="cv-exp-title">'+esc(e.role)+'</p><p class="cv-exp-company">'+esc(e.company)+'</p><p class="cv-exp-desc">'+esc(e.desc)+'</p></div></div>';
  }).join('');
  const edu = (d.education||[]).map(function(e) {
    return '<div class="cv-edu-item"><p class="cv-edu-school">'+esc(e.school)+'</p><p class="cv-edu-degree">'+esc(e.degree)+'</p><p class="cv-edu-date">'+esc(e.date)+'</p></div>';
  }).join('');
  const certs = (d.certifications||[]).map(function(c) {
    return '<div class="cv-edu-item"><p class="cv-edu-school">'+esc(c.year)+(c.org?' — '+esc(c.org):'')+'</p><p class="cv-edu-degree">'+esc(c.title)+'</p></div>';
  }).join('');
  const refs = (d.references||[]).map(function(r) {
    return '<div class="cv-ref-item"><p class="cv-ref-name">'+esc(r.name)+'</p><p class="cv-ref-detail">'+esc(r.role)+' — '+esc(r.contact)+'</p></div>';
  }).join('');

  return '<div class="cv-template-2" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-header">' + photoTag(d,'cv-photo') +
      '<div class="cv-header-info">' +
        '<h1 class="cv-name"><span>'+esc(np[0])+'</span> '+esc(np.slice(1).join(' '))+'</h1>' +
        '<p class="cv-title">'+(esc(d.title)||'Titre professionnel')+'</p>' +
        contactRow(d,'cv-contact-item') +
      '</div></div>' +
    '<div class="cv-body"><div class="cv-left">' +
      (d.profile ? '<div class="cv-section"><h3 class="cv-section-title">Profil</h3><p class="cv-profile-text">'+esc(d.profile)+'</p></div>' : '') +
      (exps ? '<div class="cv-section"><h3 class="cv-section-title">Expériences professionnelles</h3>'+exps+'</div>' : '') +
      (edu||certs ? '<div class="cv-section"><h3 class="cv-section-title">Formation</h3>'+edu+certs+'</div>' : '') +
      (refs ? '<div class="cv-section"><h3 class="cv-section-title">Références</h3>'+refs+'</div>' : '') +
    '</div><div class="cv-right">' +
      (skills ? '<div class="cv-section"><h3 class="cv-section-title">Compétences</h3>'+skills+'</div>' : '') +
      (tools  ? '<div class="cv-section"><h3 class="cv-section-title">Outils</h3>'+tools+'</div>' : '') +
      (langs  ? '<div class="cv-section"><h3 class="cv-section-title">Langues</h3>'+langs+'</div>' : '') +
    '</div></div></div>';
}

/* ----------------------------------------------------------
   TEMPLATE 3 — Créatif
   ---------------------------------------------------------- */
function buildTemplate3(d, accent, fs) {
  const skills = (d.skills||[]).map(function(sk) {
    return '<div class="cv-skill-item"><div class="cv-skill-name"><span>'+esc(sk.name)+'</span><span>'+sk.pct+'%</span></div><div class="cv-skill-bar"><div class="cv-skill-fill" style="width:'+sk.pct+'%"></div></div></div>';
  }).join('');
  const tools = (d.tools||[]).map(function(t) { return '<span class="cv-tool-tag">'+esc(t)+'</span>'; }).join('');
  const langs = (d.languages||[]).map(function(l) {
    return '<div class="cv-lang-item"><div class="cv-lang-name">'+esc(l.name)+' <small>'+esc(l.level)+'</small></div><div class="cv-lang-bar"><div class="cv-lang-fill" style="width:'+(l.pct||60)+'%"></div></div></div>';
  }).join('');
  const interests = (d.interests||[]).map(function(it) {
    return '<span class="cv-interest-tag">'+esc(it)+'</span>';
  }).join('');
  const exps = (d.experiences||[]).map(function(e) {
    return '<div class="cv-experience-item"><div class="cv-exp-header"><p class="cv-exp-title">'+esc(e.role)+'</p><span class="cv-exp-date">'+esc(e.date)+'</span></div><p class="cv-exp-company">'+esc(e.company)+'</p><p class="cv-exp-desc">'+esc(e.desc)+'</p></div>';
  }).join('');
  const edu = (d.education||[]).map(function(e) {
    return '<div class="cv-edu-item"><p class="cv-edu-school">'+esc(e.school)+'</p><p class="cv-edu-degree">'+esc(e.degree)+'</p><p class="cv-edu-date">'+esc(e.date)+'</p></div>';
  }).join('');
  const certs = (d.certifications||[]).map(function(c) {
    return '<div class="cv-edu-item"><p class="cv-edu-school">'+esc(c.year)+(c.org?' — '+esc(c.org):'')+'</p><p class="cv-edu-degree">'+esc(c.title)+'</p></div>';
  }).join('');
  const refs = (d.references||[]).map(function(r) {
    return '<div class="cv-ref-item"><p class="cv-ref-name">'+esc(r.name)+'</p><p class="cv-ref-detail">'+esc(r.role)+'</p><p class="cv-ref-detail">'+esc(r.contact)+'</p></div>';
  }).join('');
  const si = function(ico) { return '<i class="fas fa-'+ico+'"></i>'; };

  return '<div class="cv-template-3" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-header">'+photoTag(d,'cv-photo') +
      '<div class="cv-header-info">' +
        '<h1 class="cv-name">'+(esc(d.name)||'Votre Nom')+'</h1>' +
        '<p class="cv-title">'+(esc(d.title)||'Titre')+'</p>' +
        contactRow(d,'cv-contact-item') +
      '</div></div>' +
    '<div class="cv-body"><div class="cv-left">' +
      (d.profile ? '<div class="cv-section"><h3 class="cv-section-title">'+si('user')+' Profil</h3><p class="cv-profile-text">'+esc(d.profile)+'</p></div>' : '') +
      (exps ? '<div class="cv-section"><h3 class="cv-section-title">'+si('briefcase')+' Expériences</h3>'+exps+'</div>' : '') +
      (edu||certs ? '<div class="cv-section"><h3 class="cv-section-title">'+si('graduation-cap')+' Formation</h3>'+edu+certs+'</div>' : '') +
      (refs ? '<div class="cv-section"><h3 class="cv-section-title">'+si('address-card')+' Références</h3>'+refs+'</div>' : '') +
    '</div><div class="cv-right">' +
      (skills ? '<div class="cv-section"><h3 class="cv-section-title">'+si('star')+' Compétences</h3>'+skills+'</div>' : '') +
      (tools  ? '<div class="cv-section"><h3 class="cv-section-title">'+si('tools')+' Outils</h3>'+tools+'</div>' : '') +
      (langs  ? '<div class="cv-section"><h3 class="cv-section-title">'+si('language')+' Langues</h3>'+langs+'</div>' : '') +
      (interests ? '<div class="cv-section"><h3 class="cv-section-title">'+si('heart')+' Intérêts</h3>'+interests+'</div>' : '') +
    '</div></div></div>';
}

/* ----------------------------------------------------------
   TEMPLATE 4 — Corporate
   ---------------------------------------------------------- */
function buildTemplate4(d, accent, fs) {
  const sl = (d.skills||[]).map(function(sk) { return '<li>'+esc(sk.name)+'</li>'; }).join('');
  const tl = (d.tools||[]).map(function(t)  { return '<li>'+esc(t)+'</li>'; }).join('');
  const langs = (d.languages||[]).map(function(l) {
    return '<div class="cv-lang-item"><span>'+esc(l.name)+'</span><span class="cv-lang-level">'+esc(l.level)+'</span></div>';
  }).join('');
  const interests = (d.interests||[]).map(function(it) { return '<span class="cv-interest-tag">'+esc(it)+'</span>'; }).join('');
  const exps = (d.experiences||[]).map(function(e) {
    return '<div class="cv-experience-item"><div class="cv-exp-header"><p class="cv-exp-title">'+esc(e.role)+'</p><span class="cv-exp-date">'+esc(e.date)+'</span></div><p class="cv-exp-company">'+esc(e.company)+'</p><p class="cv-exp-desc">'+esc(e.desc)+'</p></div>';
  }).join('');
  const edu = (d.education||[]).map(function(e) {
    return '<div class="cv-edu-item"><p class="cv-edu-school">'+esc(e.school)+'</p><p class="cv-edu-degree">'+esc(e.degree)+'</p><p class="cv-edu-date">'+esc(e.date)+'</p></div>';
  }).join('');
  const certs = (d.certifications||[]).map(function(c) {
    return '<div class="cv-edu-item"><p class="cv-edu-school">'+esc(c.year)+(c.org?' — '+esc(c.org):'')+'</p><p class="cv-edu-degree">'+esc(c.title)+'</p></div>';
  }).join('');
  const refs = (d.references||[]).map(function(r) {
    return '<div class="cv-ref-item"><p class="cv-ref-name">'+esc(r.name)+'</p><p class="cv-ref-detail">'+esc(r.role)+' — '+esc(r.contact)+'</p></div>';
  }).join('');

  return '<div class="cv-template-4" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-header">' +
      (d.photo ? '<div class="cv-photo-wrapper">'+photoTag(d,'cv-photo')+'</div>' : '') +
      '<h1 class="cv-name">'+(esc(d.name)||'VOTRE NOM')+'</h1>' +
      '<p class="cv-title">'+(esc(d.title)||'Titre professionnel')+'</p>' +
      contactRow(d,'cv-contact-item') +
    '</div>' +
    (d.profile ? '<div class="cv-section"><h3 class="cv-section-title">Profil professionnel</h3><p class="cv-profile-text">'+esc(d.profile)+'</p></div>' : '') +
    (exps ? '<div class="cv-section"><h3 class="cv-section-title">Expériences professionnelles</h3>'+exps+'</div>' : '') +
    (edu||certs ? '<div class="cv-section"><h3 class="cv-section-title">Formation & Certifications</h3><div class="cv-two-col">'+edu+certs+'</div></div>' : '') +
    '<div class="cv-section"><h3 class="cv-section-title">Compétences & Outils</h3><div class="cv-two-col">' +
      (sl ? '<div><ul class="cv-skills-list">'+sl+'</ul></div>' : '') +
      (tl ? '<div><ul class="cv-tools-list">'+tl+'</ul></div>' : '') +
    '</div></div>' +
    (langs ? '<div class="cv-section"><h3 class="cv-section-title">Langues</h3>'+langs+'</div>' : '') +
    (refs  ? '<div class="cv-section"><h3 class="cv-section-title">Références</h3><div class="cv-two-col">'+refs+'</div></div>' : '') +
    (interests ? '<div class="cv-section"><h3 class="cv-section-title">Centres d\'intérêt</h3>'+interests+'</div>' : '') +
  '</div>';
}

/* ----------------------------------------------------------
   TEMPLATE PICKERS & COLOR PICKERS
   ---------------------------------------------------------- */
function renderTemplatePickers(containerId) {
  const ids = containerId ? [containerId] : ['templateGrid','templateGridPreview'];
  ids.forEach(function(id) {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';
    TEMPLATES.forEach(function(t) {
      const isPro = t.pro && !isProActive();
      const isActive = cvData.template === t.id;
      const card = document.createElement('div');
      card.className = 'template-card' + (isActive ? ' active' : '') + (isPro ? ' template-pro-locked' : '');
      card.style.position = 'relative';
      card.style.cursor = isPro ? 'pointer' : 'pointer';

      card.onclick = function() {
        if (isPro) {
          requirePro('Template ' + t.name);
          return;
        }
        selectTemplate(t.id);
      };

      card.innerHTML =
        '<div class="template-thumb template-thumb-t' + Math.min(t.id,4) + '">' +
          '<div class="template-thumb-bars">' +
            '<div class="template-thumb-bar accent" style="width:60%"></div>' +
            '<div class="template-thumb-bar" style="width:90%"></div>' +
            '<div class="template-thumb-bar" style="width:70%"></div>' +
            '<div class="template-thumb-bar" style="width:50%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="template-label">' +
          '<i class="fas fa-' + t.icon + '"></i> ' + t.name +
          (isPro ? ' <span style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:8px;font-weight:800;padding:1px 6px;border-radius:10px;margin-left:3px;text-transform:uppercase">PRO</span>' : '') +
        '</div>';

      if (isPro) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;border-radius:inherit;z-index:2';
        overlay.innerHTML = '<div style="text-align:center;color:#fff"><i class="fas fa-lock" style="font-size:22px;margin-bottom:6px;display:block;color:#f59e0b"></i><span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Pro</span></div>';
        card.appendChild(overlay);
      }

      container.appendChild(card);
    });
  });
}

function selectTemplate(id) {
  cvData.template = id;
  document.querySelectorAll('.template-card').forEach(function(c, idx) {
    c.classList.toggle('active', TEMPLATES[idx % TEMPLATES.length] && TEMPLATES[idx % TEMPLATES.length].id === id);
  });
  updatePreview();
  saveData();
  showToast('Template ' + (TEMPLATES.find(function(t){return t.id===id;})||{name:''}).name + ' sélectionné', 'success');
}

function renderColorPickers(containerId) {
  const ids = containerId ? [containerId] : ['colorPickerRow','colorPickerPreview'];
  ids.forEach(function(id) {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';
    ACCENT_COLORS.forEach(function(color) {
      const sw = document.createElement('div');
      sw.className = 'color-swatch' + (cvData.accentColor === color.hex ? ' active' : '');
      sw.style.background = color.hex;
      sw.title = color.name;
      sw.onclick = function() { selectColor(color.hex); };
      container.appendChild(sw);
    });
    const custom = document.createElement('input');
    custom.type = 'color';
    custom.className = 'color-custom-input';
    custom.value = cvData.accentColor || '#2563EB';
    custom.oninput = function(e) { selectColor(e.target.value); };
    container.appendChild(custom);
  });
}

function selectColor(hex) {
  cvData.accentColor = hex;
  document.querySelectorAll('.color-swatch').forEach(function(sw) {
    sw.classList.toggle('active', sw.title === (ACCENT_COLORS.find(function(c){return c.hex===hex;})||{}).name);
  });
  updatePreview();
  saveData();
}

function setPreviewScale(scale, btn) {
  const w = document.getElementById('builderPreviewScale');
  if (w) w.style.transform = 'scale(' + scale + ')';
  document.querySelectorAll('#step-5 .preview-scale-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
}

function setPreviewScale2(scale, btn) {
  const w = document.getElementById('previewScale');
  if (w) w.style.transform = 'scale(' + scale + ')';
  document.querySelectorAll('#page-preview .preview-scale-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
}

/* ----------------------------------------------------------
   FORM ITEMS — Experience, Education, Certifications
   ---------------------------------------------------------- */
function renderExperienceList() {
  const c = document.getElementById('experienceList');
  if (!c) return;
  c.innerHTML = '';
  (cvData.experiences||[]).forEach(function(exp, i) { c.appendChild(createExpItem(exp, i)); });
}

function createExpItem(exp, i) {
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML =
    '<div class="dynamic-item-header" onclick="toggleItem(this)">' +
      '<i class="fas fa-grip-vertical drag-handle"></i>' +
      '<div class="dynamic-item-title">'+(exp.role||'Nouveau poste')+'<span class="dynamic-item-subtitle"> — '+(exp.company||'')+'</span></div>' +
      '<div class="dynamic-item-actions">' +
        '<button class="btn btn-sm btn-ghost btn-icon" onclick="event.stopPropagation();duplicateExp('+i+')" title="Dupliquer"><i class="fas fa-copy" style="color:var(--primary)"></i></button>' +
        '<button class="btn btn-sm btn-ghost btn-icon" onclick="event.stopPropagation();removeExp('+i+')" title="Supprimer"><i class="fas fa-trash" style="color:var(--danger)"></i></button>' +
        '<i class="fas fa-chevron-down" style="color:var(--text-muted)"></i>' +
      '</div></div>' +
    '<div class="dynamic-item-body">' +
      '<div class="form-row">' +
        '<div class="form-group mb-0"><label>Poste / Titre</label><input type="text" class="form-control" value="'+esc(exp.role)+'" onchange="updateExp('+i+',\'role\',this.value)" /></div>' +
        '<div class="form-group mb-0"><label>Entreprise</label><input type="text" class="form-control" value="'+esc(exp.company)+'" onchange="updateExp('+i+',\'company\',this.value)" /></div>' +
      '</div>' +
      '<div class="form-group mt-16"><label>Période</label><input type="text" class="form-control" value="'+esc(exp.date)+'" placeholder="Ex: 2024, 2022-2023" onchange="updateExp('+i+',\'date\',this.value)" /></div>' +
      '<div class="form-group"><label>Description</label><textarea class="form-control" rows="3" onchange="updateExp('+i+',\'desc\',this.value)">'+esc(exp.desc)+'</textarea></div>' +
    '</div>';
  return div;
}

function updateExp(i, field, val) {
  if (!cvData.experiences[i]) return;
  cvData.experiences[i][field] = val;
  const items = document.querySelectorAll('#experienceList .dynamic-item');
  if (items[i]) {
    const t = items[i].querySelector('.dynamic-item-title');
    if (t) t.innerHTML = (cvData.experiences[i].role||'Nouveau poste') + '<span class="dynamic-item-subtitle"> — ' + (cvData.experiences[i].company||'') + '</span>';
  }
  autosave();
}

function addExperience() { cvData.experiences.push({date:'',company:'',role:'',desc:''}); renderExperienceList(); autosave(); }
function removeExp(i) { cvData.experiences.splice(i,1); renderExperienceList(); autosave(); }
function duplicateExp(i) { cvData.experiences.splice(i+1,0,Object.assign({},cvData.experiences[i])); renderExperienceList(); autosave(); showToast('Expérience dupliquée','info'); }

function renderEducationList() {
  const c = document.getElementById('educationList');
  if (!c) return; c.innerHTML = '';
  (cvData.education||[]).forEach(function(edu, i) { c.appendChild(createEduItem(edu, i)); });
}

function createEduItem(edu, i) {
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML =
    '<div class="dynamic-item-header" onclick="toggleItem(this)"><i class="fas fa-grip-vertical drag-handle"></i>' +
    '<div class="dynamic-item-title">'+(edu.school||'Établissement')+'<span class="dynamic-item-subtitle"> — '+(edu.degree||'')+'</span></div>' +
    '<div class="dynamic-item-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="event.stopPropagation();removeEdu('+i+')"><i class="fas fa-trash" style="color:var(--danger)"></i></button><i class="fas fa-chevron-down" style="color:var(--text-muted)"></i></div></div>' +
    '<div class="dynamic-item-body"><div class="form-row">' +
    '<div class="form-group mb-0"><label>Établissement</label><input type="text" class="form-control" value="'+esc(edu.school)+'" onchange="updateEdu('+i+',\'school\',this.value)" /></div>' +
    '<div class="form-group mb-0"><label>Diplôme</label><input type="text" class="form-control" value="'+esc(edu.degree)+'" onchange="updateEdu('+i+',\'degree\',this.value)" /></div>' +
    '</div><div class="form-group mt-16"><label>Période</label><input type="text" class="form-control" value="'+esc(edu.date)+'" onchange="updateEdu('+i+',\'date\',this.value)" /></div></div>';
  return div;
}

function updateEdu(i, f, v) { if(cvData.education[i]) { cvData.education[i][f]=v; autosave(); } }
function addEducation() { cvData.education.push({school:'',degree:'',date:''}); renderEducationList(); autosave(); }
function removeEdu(i) { cvData.education.splice(i,1); renderEducationList(); autosave(); }

function renderCertificationList() {
  const c = document.getElementById('certificationList');
  if (!c) return; c.innerHTML = '';
  (cvData.certifications||[]).forEach(function(cert, i) {
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML =
      '<div class="dynamic-item-header" onclick="toggleItem(this)"><i class="fas fa-grip-vertical drag-handle"></i>' +
      '<div class="dynamic-item-title">'+(cert.title||'Attestation')+'<span class="dynamic-item-subtitle"> — '+(cert.year||'')+'</span></div>' +
      '<div class="dynamic-item-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="event.stopPropagation();removeCert('+i+')"><i class="fas fa-trash" style="color:var(--danger)"></i></button><i class="fas fa-chevron-down" style="color:var(--text-muted)"></i></div></div>' +
      '<div class="dynamic-item-body"><div class="form-row">' +
      '<div class="form-group mb-0"><label>Année</label><input type="text" class="form-control" value="'+esc(cert.year)+'" onchange="updateCert('+i+',\'year\',this.value)" /></div>' +
      '<div class="form-group mb-0"><label>Organisme</label><input type="text" class="form-control" value="'+esc(cert.org)+'" onchange="updateCert('+i+',\'org\',this.value)" /></div>' +
      '</div><div class="form-group mt-16"><label>Intitulé</label><input type="text" class="form-control" value="'+esc(cert.title)+'" onchange="updateCert('+i+',\'title\',this.value)" /></div></div>';
    c.appendChild(div);
  });
}

function updateCert(i, f, v) { if(cvData.certifications[i]) { cvData.certifications[i][f]=v; autosave(); } }
function addCertification() { if(!cvData.certifications)cvData.certifications=[]; cvData.certifications.push({year:'',org:'',title:''}); renderCertificationList(); autosave(); }
function removeCert(i) { cvData.certifications.splice(i,1); renderCertificationList(); autosave(); }

/* ----------------------------------------------------------
   SKILLS, TOOLS, LANGUAGES, INTERESTS, REFERENCES
   ---------------------------------------------------------- */
function renderSkillsList() {
  const c = document.getElementById('skillsList'); if(!c) return; c.innerHTML = '';
  (cvData.skills||[]).forEach(function(sk, i) {
    c.innerHTML += '<div class="skill-item-row">' +
      '<input type="text" class="form-control skill-name-input" value="'+esc(sk.name)+'" placeholder="Compétence" onchange="updateSkill('+i+',\'name\',this.value)" />' +
      '<input type="range" class="skill-slider" min="10" max="100" step="5" value="'+sk.pct+'" oninput="updateSkill('+i+',\'pct\',parseInt(this.value));this.nextElementSibling.textContent=this.value+\'%\'" />' +
      '<span class="skill-percent">'+sk.pct+'%</span>' +
      '<button class="skill-delete-btn" onclick="removeSkill('+i+')"><i class="fas fa-times"></i></button></div>';
  });
}

function updateSkill(i,f,v) { if(cvData.skills[i]) { cvData.skills[i][f]=v; autosave(); } }
function addSkill() { cvData.skills.push({name:'',pct:80}); renderSkillsList(); autosave(); }
function removeSkill(i) { cvData.skills.splice(i,1); renderSkillsList(); autosave(); }

function renderToolsList() {
  const c = document.getElementById('toolsList'); if(!c) return; c.innerHTML = '';
  (cvData.tools||[]).forEach(function(tool, i) {
    c.innerHTML += '<div class="skill-item-row"><input type="text" class="form-control" value="'+esc(tool)+'" placeholder="Logiciel / Outil" onchange="updateTool('+i+',this.value)" /><button class="skill-delete-btn" onclick="removeTool('+i+')"><i class="fas fa-times"></i></button></div>';
  });
}

function updateTool(i,v) { cvData.tools[i]=v; autosave(); }
function addTool() { cvData.tools.push(''); renderToolsList(); autosave(); }
function removeTool(i) { cvData.tools.splice(i,1); renderToolsList(); autosave(); }

function renderLanguagesList() {
  const c = document.getElementById('languagesList'); if(!c) return; c.innerHTML = '';
  (cvData.languages||[]).forEach(function(lang, i) {
    c.innerHTML += '<div class="lang-item-row">' +
      '<input type="text" class="form-control" style="flex:1" value="'+esc(lang.name)+'" placeholder="Langue" onchange="updateLang('+i+',\'name\',this.value)" />' +
      '<select class="form-control" style="width:130px" onchange="updateLang('+i+',\'level\',this.value)">' +
      ['Débutant','Intermédiaire','Avancé','Courant','Natif'].map(function(l) {
        return '<option'+(lang.level===l?' selected':'')+'>'+l+'</option>';
      }).join('') + '</select>' +
      '<input type="range" class="skill-slider" min="20" max="100" step="5" value="'+(lang.pct||80)+'" oninput="updateLang('+i+',\'pct\',parseInt(this.value))" style="width:80px" />' +
      '<button class="skill-delete-btn" onclick="removeLang('+i+')"><i class="fas fa-times"></i></button></div>';
  });
}

function updateLang(i,f,v) { if(cvData.languages[i]) { cvData.languages[i][f]=v; autosave(); } }
function addLanguage() { if(!cvData.languages)cvData.languages=[]; cvData.languages.push({name:'',level:'Intermédiaire',pct:60}); renderLanguagesList(); autosave(); }
function removeLang(i) { cvData.languages.splice(i,1); renderLanguagesList(); autosave(); }

function renderInterestsList() {
  const c = document.getElementById('interestsList'); if(!c) return; c.innerHTML = '';
  (cvData.interests||[]).forEach(function(it, i) {
    c.innerHTML += '<div class="skill-item-row"><input type="text" class="form-control" value="'+esc(it)+'" placeholder="Centre d\'intérêt" onchange="updateInterest('+i+',this.value)" /><button class="skill-delete-btn" onclick="removeInterest('+i+')"><i class="fas fa-times"></i></button></div>';
  });
}

function updateInterest(i,v) { cvData.interests[i]=v; autosave(); }
function addInterest() { if(!cvData.interests)cvData.interests=[]; cvData.interests.push(''); renderInterestsList(); autosave(); }
function removeInterest(i) { cvData.interests.splice(i,1); renderInterestsList(); autosave(); }

function renderReferencesList() {
  const c = document.getElementById('referencesList'); if(!c) return; c.innerHTML = '';
  (cvData.references||[]).forEach(function(ref, i) {
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML =
      '<div class="dynamic-item-header" onclick="toggleItem(this)"><i class="fas fa-grip-vertical drag-handle"></i>' +
      '<div class="dynamic-item-title">'+(ref.name||'Référence')+'</div>' +
      '<div class="dynamic-item-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="event.stopPropagation();removeRef('+i+')"><i class="fas fa-trash" style="color:var(--danger)"></i></button><i class="fas fa-chevron-down" style="color:var(--text-muted)"></i></div></div>' +
      '<div class="dynamic-item-body"><div class="form-row">' +
      '<div class="form-group mb-0"><label>Nom</label><input type="text" class="form-control" value="'+esc(ref.name)+'" onchange="updateRef('+i+',\'name\',this.value)" /></div>' +
      '<div class="form-group mb-0"><label>Poste</label><input type="text" class="form-control" value="'+esc(ref.role)+'" onchange="updateRef('+i+',\'role\',this.value)" /></div>' +
      '</div><div class="form-group mt-16"><label>Contact</label><input type="text" class="form-control" value="'+esc(ref.contact)+'" onchange="updateRef('+i+',\'contact\',this.value)" /></div></div>';
    c.appendChild(div);
  });
}

function updateRef(i,f,v) { if(cvData.references[i]) { cvData.references[i][f]=v; autosave(); } }
function addReference() { if(!cvData.references)cvData.references=[]; cvData.references.push({name:'',role:'',contact:''}); renderReferencesList(); autosave(); }
function removeRef(i) { cvData.references.splice(i,1); renderReferencesList(); autosave(); }

function toggleItem(header) {
  const item = header.closest('.dynamic-item');
  item.classList.toggle('collapsed');
  const ico = header.querySelector('.fa-chevron-down, .fa-chevron-up');
  if (ico) { ico.classList.toggle('fa-chevron-down'); ico.classList.toggle('fa-chevron-up'); }
}

/* ----------------------------------------------------------
   PHOTO UPLOAD
   ---------------------------------------------------------- */
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Format invalide — utilisez JPG ou PNG', 'error'); return; }
  if (file.size > 2*1024*1024) { showToast('Fichier trop volumineux (max 2MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    const result = e.target.result;
    if (!result || result.indexOf('data:image') !== 0) { showToast('Fichier invalide', 'error'); return; }
    cvData.photo = result;
    const p = document.getElementById('photoPreview');
    if (p) p.innerHTML = '<img src="' + result + '" alt="Photo" />';
    autosave(); updatePreview();
    showToast('Photo chargée !', 'success');
  };
  reader.readAsDataURL(file);
}

/* ----------------------------------------------------------
   EXPORT PDF
   ---------------------------------------------------------- */
function exportPDF() {
  const html = buildCvHTML(cvData);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { showToast('Autorisez les popups pour exporter en PDF', 'error'); return; }
  const getHref = function(sel) { const el = document.querySelector(sel); return el ? el.href : ''; };
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CV — ' + esc(cvData.name||'Mon CV') + '</title>' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700;900&family=Montserrat:wght@400;500;600;700;800&family=Raleway:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template1.css"]') + '">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template2.css"]') + '">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template3.css"]') + '">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template4.css"]') + '">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template5.css"]') + '">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template6.css"]') + '">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template7.css"]') + '">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template8.css"]') + '">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template9.css"]') + '">' +
    '<link rel="stylesheet" href="' + getHref('link[href*="template10.css"]') + '">' +
    '<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#fff}@page{size:A4;margin:0}@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style>' +
    '</head><body>' + html + '</body></html>');
  win.document.close();
  win.onload = function() { setTimeout(function() { win.print(); }, 600); };
  showToast('Fenêtre d\'impression ouverte', 'info');
}

/* ----------------------------------------------------------
   EXPORT JSON / IMPORT JSON
   ---------------------------------------------------------- */
function exportJSON() {
  const blob = new Blob([JSON.stringify(cvData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cv-' + (cvData.name||'profil').replace(/\s+/g,'-').toLowerCase() + '.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('Profil exporté en JSON !', 'success');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.json')) {
    showToast('Utilisez un fichier .json — pour importer un CV utilisez "Importer un CV"', 'error');
    event.target.value = ''; return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      cvData = Object.assign({}, DEFAULT_DATA, data);
      saveData(); renderAllForms(); renderTemplatePickers(); renderColorPickers();
      updatePreview(); updateStats(); updateCompletion();
      showToast('Profil importé avec succès !', 'success');
    } catch(err) { showToast('Fichier JSON invalide', 'error'); }
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

/* ----------------------------------------------------------
   COPY TO CLIPBOARD
   ---------------------------------------------------------- */
/* ----------------------------------------------------------
   SHARE
   ---------------------------------------------------------- */
function shareApp() {
  const url  = 'https://thibautaffohoyochi-collab.github.io/cv-generator/';
  const text = '🎯 CV Generator Pro — Créez votre CV professionnel gratuitement en minutes. 10 templates, export PDF, simulation d\'entretien et bien plus !';
  if (navigator.share) {
    navigator.share({ title: 'CV Generator Pro', text: text, url: url })
      .then(function() { showToast('Merci d\'avoir partagé !', 'success'); })
      .catch(function() {});
  } else {
    navigator.clipboard.writeText(url).then(function() {
      showToast('Lien copié ! Partagez-le autour de vous 🙌', 'success');
    });
  }
}

/* ----------------------------------------------------------
   COPY TO CLIPBOARD
   ---------------------------------------------------------- */
function copyToClipboard() {
  let text = (cvData.name||'') + '\n' + (cvData.title||'') + '\n' +
    [cvData.email, cvData.phone, cvData.address].filter(Boolean).join(' | ') + '\n\n';
  if (cvData.profile) text += 'PROFIL\n' + cvData.profile + '\n\n';
  if ((cvData.experiences||[]).length) {
    text += 'EXPÉRIENCES\n';
    cvData.experiences.forEach(function(e) { text += e.date + ' | ' + e.role + ' — ' + e.company + '\n' + e.desc + '\n\n'; });
  }
  if ((cvData.skills||[]).length) text += 'COMPÉTENCES\n' + cvData.skills.map(function(s){return '• '+s.name+' ('+s.pct+'%)';}).join('\n') + '\n\n';
  navigator.clipboard.writeText(text)
    .then(function() { showToast('CV copié !', 'success'); })
    .catch(function() { showToast('Copie non supportée sur ce navigateur', 'error'); });
}

/* ----------------------------------------------------------
   RESET
   ---------------------------------------------------------- */
function confirmReset() {
  const m = document.getElementById('resetModal'); if (m) m.classList.remove('hidden');
}

function resetAll() {
  const m = document.getElementById('resetModal'); if (m) m.classList.add('hidden');
  cvData = Object.assign({}, DEFAULT_DATA);
  localStorage.removeItem('cvGeneratorData');
  renderAllForms(); renderTemplatePickers(); renderColorPickers();
  updatePreview(); updateStats(); updateCompletion();
  showToast('CV réinitialisé', 'info');
}

/* ----------------------------------------------------------
   COVER LETTER
   ---------------------------------------------------------- */
function generateCoverLetter() {
  const poste      = (document.getElementById('cl-poste')?.value||'').trim() || '[Poste visé]';
  const entreprise = (document.getElementById('cl-entreprise')?.value||'').trim() || '[Entreprise]';
  const recruteur  = (document.getElementById('cl-recruteur')?.value||'').trim() || 'Madame, Monsieur';
  const ville      = (document.getElementById('cl-ville')?.value||'').trim() || 'Cotonou';
  const ton        = document.getElementById('cl-ton')?.value || 'formel';
  const variation  = document.getElementById('cl-variation')?.value || '1';
  const date       = new Date().toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'});
  const name       = cvData.name || 'Votre Nom';
  const title      = cvData.title || 'Professionnel';
  const topExp     = (cvData.experiences||[])[0];
  const expStr     = topExp ? topExp.role + ' chez ' + topExp.company : 'diverses expériences';
  const skills     = (cvData.skills||[]).slice(0,4).map(function(s){return s.name;}).join(', ') || 'compétences variées';
  const tools      = (cvData.tools||[]).slice(0,3).join(', ') || 'outils professionnels';
  const sal        = recruteur && recruteur !== 'Madame, Monsieur'
    ? (recruteur.match(/^M/i) ? 'Monsieur' : 'Madame') + ' ' + recruteur
    : 'Madame, Monsieur';

  let letter = name + '\n' + cvData.email + (cvData.phone ? ' | ' + cvData.phone : '') + '\n\n' +
    ville + ', le ' + date + '\n\nÀ l\'attention de ' + sal + '\n' + entreprise + '\n\nObjet : Candidature au poste de ' + poste + '\n\n' + sal + ',\n\n';

  if (variation === '1') {
    const intro = ton === 'dynamique'
      ? 'Passionné(e) par ' + title.split('&')[0].trim() + ', je vous soumets ma candidature au poste de ' + poste + ' au sein de ' + entreprise + '.'
      : ton === 'creatif'
      ? 'La créativité est mon moteur. C\'est dans cet esprit que je vous adresse ma candidature pour le poste de ' + poste + ' au sein de ' + entreprise + '.'
      : 'Suite à votre annonce concernant le poste de ' + poste + ', je me permets de vous adresser ma candidature. Fort(e) d\'une solide expérience en tant que ' + title + ', je suis convaincu(e) de pouvoir apporter une réelle valeur ajoutée chez ' + entreprise + '.';
    letter += intro + '\n\nAu cours de mon parcours en tant que ' + expStr + ', j\'ai développé des compétences approfondies en ' + skills + '. Ma maîtrise de ' + tools + ' m\'a permis de mener à bien des projets ambitieux.\n\nJe reste disponible pour un entretien. Veuillez agréer, ' + sal + ', l\'expression de mes sincères salutations.\n\n' + name;
  } else if (variation === '2') {
    letter += 'Permettez-moi de vous présenter ma candidature pour le poste de ' + poste + '.\n\nMES POINTS FORTS :\n▶ Compétences : ' + skills + '\n▶ Outils : ' + tools + '\n▶ Expérience : ' + expStr + '\n\nJe serais heureux(se) de vous rencontrer.\n\nSalutations respectueuses,\n\n' + name;
  } else {
    letter += 'Mon expérience en tant que ' + expStr + ' m\'a appris que chaque projet créatif cache une histoire à raconter. Grâce à ' + tools + ' et à mes compétences en ' + skills + ', j\'ai contribué à de nombreux projets réussis.\n\nEn rejoignant ' + entreprise + ', je souhaite continuer cette aventure créative. Je serais honoré(e) de vous rencontrer.\n\nAvec enthousiasme,\n\n' + name;
  }

  const ta = document.getElementById('coverLetterText');
  if (ta) ta.value = letter;
  showToast('Lettre de motivation générée !', 'success');
}

function copyCoverLetter() {
  const ta = document.getElementById('coverLetterText');
  if (!ta || !ta.value) { showToast('Générez d\'abord la lettre', 'error'); return; }
  navigator.clipboard.writeText(ta.value).then(function() { showToast('Lettre copiée !', 'success'); });
}

function exportCoverLetterPDF() {
  const ta = document.getElementById('coverLetterText');
  if (!ta || !ta.value) { showToast('Générez d\'abord la lettre', 'error'); return; }
  const win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><style>body{font-family:"Times New Roman",serif;padding:40px 60px;line-height:1.8;font-size:13pt;white-space:pre-wrap}@page{size:A4;margin:0}</style></head><body>' + ta.value.replace(/\n/g,'<br>') + '</body></html>');
  win.document.close();
  setTimeout(function() { win.print(); }, 300);
}

/* ----------------------------------------------------------
   SCORE CV
   ---------------------------------------------------------- */
function analyzeCV() {
  const d = cvData;
  const criteria = [
    { label:'Nom & Titre',   icon:'user',           weight:10, score:(d.name?5:0)+(d.title?5:0),          tip:'Assurez un nom complet et un titre professionnel précis.' },
    { label:'Coordonnées',   icon:'address-card',   weight:10, score:(d.email?3:0)+(d.phone?3:0)+(d.address?2:0)+(d.linkedin?1:0)+(d.portfolio?1:0), tip:'Ajoutez LinkedIn et portfolio pour compléter.' },
    { label:'Profil',        icon:'align-left',     weight:15, score:!d.profile?0:d.profile.length>=300?15:d.profile.length>=150?10:5, tip:'150 à 400 caractères, précis et impactant.' },
    { label:'Photo',         icon:'camera',         weight:5,  score:d.photo?5:0, tip:'Une photo professionnelle augmente vos chances.' },
    { label:'Expériences',   icon:'briefcase',      weight:25, score:Math.min(25,(d.experiences||[]).length*5+(d.experiences||[]).filter(function(e){return e.desc&&e.desc.length>50;}).length*3), tip:'Décrivez chaque mission avec des résultats concrets.' },
    { label:'Formation',     icon:'graduation-cap', weight:10, score:Math.min(10,(d.education||[]).length*4+(d.certifications||[]).length*2), tip:'Ajoutez certifications et formations.' },
    { label:'Compétences',   icon:'star',           weight:15, score:(d.skills||[]).length>=6?10:(d.skills||[]).length>=3?6:(d.skills||[]).length>0?3:0, tip:'6 à 10 compétences clés.' },
    { label:'Outils',        icon:'tools',          weight:5,  score:(d.tools||[]).length>=3?5:(d.tools||[]).length>0?3:0, tip:'Listez tous vos outils.' },
    { label:'Langues',       icon:'language',       weight:5,  score:(d.languages||[]).length>=2?5:(d.languages||[]).length===1?3:0, tip:'Ajoutez toutes vos langues.' }
  ];
  const total = Math.min(100, criteria.reduce(function(a,c) { return a+c.score; }, 0));

  // Animate ring
  const circle = document.getElementById('scoreRingCircle');
  if (circle) {
    circle.style.stroke = total>=80?'#10b981':total>=60?'#f59e0b':'#ef4444';
    setTimeout(function() { circle.style.strokeDashoffset = String(314 - (314 * total / 100)); }, 100);
  }

  // Animate counter
  const scoreEl = document.getElementById('scoreValue');
  if (scoreEl) {
    let cur = 0;
    const timer = setInterval(function() {
      cur = Math.min(total, cur + total/40);
      scoreEl.textContent = String(Math.round(cur));
      if (cur >= total) clearInterval(timer);
    }, 30);
  }

  const grade = total>=85?'🏆 Excellent CV !':total>=70?'👍 Bon CV':total>=50?'⚠️ CV à améliorer':'🔴 CV incomplet';
  setEl('scoreTitle', grade);
  setEl('scoreSubtitle', 'Score global : ' + total + '/100');

  const container = document.getElementById('scoreCriteria');
  if (container) {
    container.innerHTML = criteria.map(function(c) {
      const pct = Math.round((c.score/c.weight)*100);
      const color = pct>=80?'var(--success)':pct>=50?'var(--warning)':'var(--danger)';
      return '<div class="card"><div class="card-body" style="padding:16px">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
          '<div style="width:36px;height:36px;border-radius:8px;background:'+color+'20;display:flex;align-items:center;justify-content:center;color:'+color+'"><i class="fas fa-'+c.icon+'"></i></div>' +
          '<div style="flex:1"><div style="font-weight:600;font-size:13px">'+c.label+'</div><div style="font-size:11px;color:var(--text-secondary)">'+c.score+'/'+c.weight+' pts</div></div>' +
          '<span style="font-size:18px;font-weight:800;color:'+color+'">'+pct+'%</span>' +
        '</div>' +
        '<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:3px"></div></div>' +
        (pct<100?'<p style="font-size:11px;color:var(--text-secondary);margin-top:8px;margin-bottom:0"><i class="fas fa-info-circle" style="color:var(--primary)"></i> '+c.tip+'</p>':'') +
      '</div></div>';
    }).join('');
  }

  const recs = criteria.filter(function(c) { return c.score<c.weight; }).map(function(c) {
    return '<div class="tip-item" style="margin-bottom:10px"><i class="fas fa-arrow-right" style="color:var(--primary);flex-shrink:0"></i><span class="tip-text"><strong>'+c.label+':</strong> '+c.tip+'</span></div>';
  });
  const recCard = document.getElementById('scoreRecommendations');
  const recList = document.getElementById('scoreRecList');
  if (recCard) recCard.style.display = recs.length ? 'block' : 'none';
  if (recList) recList.innerHTML = recs.join('');
}

/* ----------------------------------------------------------
   MATCH OFFRE
   ---------------------------------------------------------- */
function matchOffer() {
  const offerText = (document.getElementById('match-offer')?.value||'').toLowerCase();
  if (!offerText.trim()) { showToast('Collez d\'abord le texte de l\'offre', 'error'); return; }
  const d = cvData;
  const cvWords = [
    ...(d.title||'').split(/\s|&|,/),
    ...(d.skills||[]).map(function(s){return s.name;}),
    ...(d.tools||[]),
    ...(d.experiences||[]).flatMap(function(e){return [e.role,e.company,e.desc].join(' ').split(/\s|,/);})
  ].map(function(w) { return w ? w.toLowerCase().replace(/[^a-zàâéèêëîïôùûüç]/g,'').trim() : ''; }).filter(function(w){return w&&w.length>3;});

  const stopWords = new Set(['avec','dans','pour','votre','vous','nous','sont','être','avoir','cette','mais','les','des','une','par','sur']);
  const offerWords = [...new Set(
    offerText.split(/\s+|[,;.\-()\/\\]/)
      .map(function(w){return w.replace(/[^a-zàâéèêëîïôùûüç]/gi,'').toLowerCase().trim();})
      .filter(function(w){return w.length>3&&!stopWords.has(w);})
  )];

  const found   = offerWords.filter(function(w) { return cvWords.some(function(cv){return cv.includes(w)||w.includes(cv);}); });
  const missing = offerWords.filter(function(w) { return !cvWords.some(function(cv){return cv.includes(w)||w.includes(cv);}); }).slice(0,20);
  const score   = offerWords.length > 0 ? Math.round((found.length/offerWords.length)*100) : 0;

  ['matchResultCard','matchKeywordsCard','matchMissingCard'].forEach(function(id) {
    const el = document.getElementById(id); if (el) el.style.display = 'block';
  });

  const circle = document.getElementById('matchScoreCircle');
  if (circle) circle.style.background = score>=70?'var(--success)':score>=45?'var(--warning)':'var(--danger)';
  setEl('matchScorePct', score + '%');
  setEl('matchScoreLabel', score>=70?'✅ Excellent match !':score>=45?'⚠️ Match moyen — adaptez votre CV':'❌ Faible compatibilité');

  const foundEl = document.getElementById('matchFoundKeywords');
  if (foundEl) foundEl.innerHTML = found.slice(0,25).map(function(w) {
    return '<span style="background:var(--success);color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600">'+w+'</span>';
  }).join('');

  const missingEl = document.getElementById('matchMissingKeywords');
  if (missingEl) missingEl.innerHTML = missing.map(function(w) {
    return '<span style="background:var(--danger);color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600">'+w+'</span>';
  }).join('');

  showToast('Analyse terminée — Score : ' + score + '%', score>=70?'success':'info');
}

/* ----------------------------------------------------------
   HISTORIQUE DES VERSIONS
   ---------------------------------------------------------- */
function saveVersion() {
  let versions = JSON.parse(localStorage.getItem('cvVersions')||'[]');
  versions.unshift({ id:Date.now(), date:new Date().toLocaleString('fr-FR'), name:cvData.name||'Profil', title:cvData.title||'', data:JSON.parse(JSON.stringify(cvData)) });
  if (versions.length > 5) versions = versions.slice(0,5);
  localStorage.setItem('cvVersions', JSON.stringify(versions));
  renderVersionsList();
  showToast('Version sauvegardée !', 'success');
}

function renderVersionsList() {
  const container = document.getElementById('versionsList');
  if (!container) return;
  const versions = JSON.parse(localStorage.getItem('cvVersions')||'[]');
  if (!versions.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-history" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.4"></i><p>Aucune version sauvegardée.<br>Cliquez sur "Sauvegarder version actuelle" pour commencer.</p></div>';
    return;
  }
  container.innerHTML = versions.map(function(v,i) {
    return '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:10px;background:var(--bg-card)">' +
      '<div style="width:42px;height:42px;border-radius:10px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;color:var(--primary);font-weight:800;font-size:16px">'+(i+1)+'</div>' +
      '<div style="flex:1"><div style="font-weight:600;font-size:13px">'+v.name+' — <span style="color:var(--text-secondary);font-weight:400">'+v.title+'</span></div>' +
      '<div style="font-size:11px;color:var(--text-muted)"><i class="fas fa-clock"></i> '+v.date+'</div></div>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="btn btn-sm btn-secondary" onclick="restoreVersion('+i+')"><i class="fas fa-undo"></i> Restaurer</button>' +
        '<button class="btn btn-sm btn-ghost" onclick="deleteVersion('+i+')" style="color:var(--danger)"><i class="fas fa-trash"></i></button>' +
      '</div></div>';
  }).join('');
}

function restoreVersion(i) {
  const versions = JSON.parse(localStorage.getItem('cvVersions')||'[]');
  if (!versions[i]) return;
  cvData = Object.assign({}, DEFAULT_DATA, versions[i].data);
  saveData(); renderAllForms(); renderTemplatePickers(); renderColorPickers();
  updatePreview(); updateStats(); updateCompletion();
  showToast('Version restaurée avec succès !', 'success');
}

function deleteVersion(i) {
  let versions = JSON.parse(localStorage.getItem('cvVersions')||'[]');
  versions.splice(i,1);
  localStorage.setItem('cvVersions', JSON.stringify(versions));
  renderVersionsList();
  showToast('Version supprimée', 'info');
}

/* ----------------------------------------------------------
   QR CODE
   ---------------------------------------------------------- */
function generateQR() {
  const type  = document.getElementById('qr-type')?.value || 'vcard';
  const size  = parseInt(document.getElementById('qr-size')?.value || '250');
  const color = document.getElementById('qr-color')?.value || '#1e293b';
  let content = '';
  switch(type) {
    case 'vcard':     content = 'BEGIN:VCARD\nVERSION:3.0\nFN:'+cvData.name+'\nTITLE:'+cvData.title+'\nEMAIL:'+cvData.email+'\nTEL:'+cvData.phone+'\nADR:;;'+cvData.address+';;;;\nEND:VCARD'; break;
    case 'email':     content = 'mailto:' + cvData.email; break;
    case 'phone':     content = 'tel:' + cvData.phone; break;
    case 'linkedin':  content = cvData.linkedin || 'https://linkedin.com'; break;
    case 'portfolio': content = cvData.portfolio || 'https://monportfolio.com'; break;
  }
  const infoEl = document.getElementById('qrInfo');
  if (infoEl) infoEl.textContent = content.length>80 ? content.substring(0,80)+'...' : content;

  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  canvas.width = size; canvas.height = size;

  const tempDiv = document.createElement('div');
  tempDiv.style.display = 'none';
  document.body.appendChild(tempDiv);

  try {
    if (typeof QRCode !== 'undefined') {
      new QRCode(tempDiv, { text:content||'https://example.com', width:size, height:size, colorDark:color, colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.M });
      setTimeout(function() {
        const img = tempDiv.querySelector('img') || tempDiv.querySelector('canvas');
        if (img) { const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,size,size); }
        tempDiv.remove();
      }, 200);
    } else {
      drawFallbackQR(canvas, size, color);
      tempDiv.remove();
    }
  } catch(e) { drawFallbackQR(canvas, size, color); tempDiv.remove(); }
}

function drawFallbackQR(canvas, size, color) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,size,size);
  ctx.fillStyle = color;
  const cell = Math.floor(size/21);
  const pattern = [[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]];
  pattern.forEach(function(row,r) { row.forEach(function(v,c) { if(v) ctx.fillRect(c*cell,r*cell,cell-1,cell-1); }); });
  const off = 14*cell;
  pattern.forEach(function(row,r) { row.forEach(function(v,c) { if(v) ctx.fillRect(off+c*cell,r*cell,cell-1,cell-1); }); });
  ctx.font = 'bold '+Math.floor(size/16)+'px Poppins,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(cvData.name||'Contact', size/2, size-8);
}

function downloadQR() {
  const canvas = document.getElementById('qrCanvas'); if (!canvas) return;
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'qrcode-' + (cvData.name||'contact').replace(/\s+/g,'-').toLowerCase() + '.png';
  a.click();
  showToast('QR Code téléchargé !', 'success');
}

/* ----------------------------------------------------------
   PORTFOLIO WEB
   ---------------------------------------------------------- */
function updatePortfolioPreview() {
  const iframe = document.getElementById('portfolioIframe');
  if (!iframe) return;
  iframe.srcdoc = buildPortfolioHTML();
}

function previewPortfolio() {
  const win = window.open('','_blank');
  win.document.write(buildPortfolioHTML());
  win.document.close();
}

function exportPortfolio() {
  const blob = new Blob([buildPortfolioHTML()], { type:'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'portfolio-' + (cvData.name||'profil').replace(/\s+/g,'-').toLowerCase() + '.html';
  a.click(); URL.revokeObjectURL(url);
  showToast('Portfolio HTML exporté !', 'success');
}

function buildPortfolioHTML() {
  const d = cvData;
  const color   = document.getElementById('pf-color')?.value   || '#2563EB';
  const style   = document.getElementById('pf-style')?.value   || 'modern';
  const slogan  = document.getElementById('pf-slogan')?.value  || d.title || '';
  const projRaw = document.getElementById('pf-projects')?.value || '';
  const projects = projRaw.split('\n').filter(function(p){return p.trim();});
  const isDk = style==='modern', isGr = style==='gradient';
  const bg   = isDk?'#0f172a':isGr?'linear-gradient(135deg,#1a1a2e,#16213e)':'#f8fafc';
  const cBg  = isDk?'#1e293b':isGr?'rgba(255,255,255,0.08)':'#ffffff';
  const tc   = (isDk||isGr)?'#f1f5f9':'#1e293b';
  const sub  = (isDk||isGr)?'#94a3b8':'#64748b';
  const bdr  = (isDk||isGr)?'rgba(255,255,255,0.1)':'#e2e8f0';
  const skills = (d.skills||[]).slice(0,8).map(function(s){return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;color:'+sub+';margin-bottom:4px"><span>'+s.name+'</span><span>'+s.pct+'%</span></div><div style="height:5px;background:'+bdr+';border-radius:3px"><div style="height:100%;width:'+s.pct+'%;background:'+color+';border-radius:3px"></div></div></div>';}).join('');
  const tools = (d.tools||[]).map(function(t){return '<span style="background:'+color+'22;color:'+color+';padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin:2px;display:inline-block">'+t+'</span>';}).join('');
  const exps = (d.experiences||[]).map(function(e){return '<div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid '+bdr+'"><div style="font-size:11px;font-weight:700;color:'+color+';min-width:70px">'+e.date+'</div><div><strong style="color:'+tc+'">'+e.role+'</strong><br><span style="color:'+sub+';font-size:12px">'+e.company+'</span><p style="color:'+sub+';font-size:12px;margin-top:4px;line-height:1.6">'+e.desc+'</p></div></div>';}).join('');
  const pCards = projects.map(function(p,i){return '<div style="background:'+cBg+';border:1px solid '+bdr+';border-radius:12px;padding:18px;border-top:3px solid '+color+'"><div style="font-size:1.6rem;font-weight:800;color:'+color+';opacity:.5;margin-bottom:6px">0'+(i+1)+'</div><p style="font-size:13px;color:'+sub+';line-height:1.6">'+p+'</p></div>';}).join('');

  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio — '+d.name+'</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet">' +
    '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Poppins,sans-serif;background:'+bg+';color:'+tc+'}</style>' +
    '</head><body>' +
    '<div style="background:'+color+';padding:70px 40px;text-align:center;color:#fff">' +
      (d.photo?'<img src="'+d.photo+'" style="width:110px;height:110px;border-radius:50%;border:4px solid rgba(255,255,255,.4);object-fit:cover;margin-bottom:18px;display:block;margin-left:auto;margin-right:auto">':'') +
      '<h1 style="font-size:2.4rem;font-weight:800;margin-bottom:8px">'+d.name+'</h1>' +
      '<p style="opacity:.85;letter-spacing:1px;margin-bottom:16px">'+d.title+'</p>' +
      '<p style="opacity:.75;font-size:.9rem;max-width:500px;margin:0 auto 20px">'+slogan+'</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">' +
        (d.email?'<span style="background:rgba(255,255,255,.2);padding:5px 14px;border-radius:20px;font-size:13px">'+d.email+'</span>':'') +
        (d.phone?'<span style="background:rgba(255,255,255,.2);padding:5px 14px;border-radius:20px;font-size:13px">'+d.phone+'</span>':'') +
        (d.address?'<span style="background:rgba(255,255,255,.2);padding:5px 14px;border-radius:20px;font-size:13px">'+d.address+'</span>':'') +
      '</div>' +
    '</div>' +
    (d.profile?'<div style="padding:50px 40px;max-width:900px;margin:0 auto"><h2 style="color:'+color+';font-size:1.1rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">À propos</h2><p style="font-size:14px;line-height:1.8">'+d.profile+'</p></div>':'') +
    (pCards?'<div style="padding:0 40px 50px;max-width:900px;margin:0 auto"><h2 style="color:'+color+';font-size:1.1rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:20px">Réalisations</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">'+pCards+'</div></div>':'') +
    (exps?'<div style="padding:0 40px 50px;max-width:900px;margin:0 auto"><h2 style="color:'+color+';font-size:1.1rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">Expériences</h2><div style="background:'+cBg+';border-radius:14px;padding:20px;border:1px solid '+bdr+'">'+exps+'</div></div>':'') +
    '<div style="padding:0 40px 50px;max-width:900px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:20px">' +
      (skills?'<div><h2 style="color:'+color+';font-size:1.1rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">Compétences</h2><div style="background:'+cBg+';border-radius:14px;padding:20px;border:1px solid '+bdr+'">'+skills+'</div></div>':'') +
      (tools?'<div><h2 style="color:'+color+';font-size:1.1rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">Outils</h2><div style="background:'+cBg+';border-radius:14px;padding:20px;border:1px solid '+bdr+'">'+tools+'</div></div>':'') +
    '</div>' +
    '<div style="text-align:center;padding:30px;border-top:1px solid '+bdr+';color:'+sub+';font-size:12px">© '+new Date().getFullYear()+' '+d.name+' · Portfolio généré avec CV Generator Pro</div>' +
    '</body></html>';
}

/* ----------------------------------------------------------
   SETTINGS / APPARENCE
   ---------------------------------------------------------- */
function applySettings() {
  cvSettings.font       = document.getElementById('s-font')?.value       || 'Poppins';
  cvSettings.fontSize   = parseFloat(document.getElementById('s-fontsize')?.value   || 12);
  cvSettings.lineHeight = parseFloat(document.getElementById('s-lineheight')?.value || 1.6);
  localStorage.setItem('cvSettings', JSON.stringify(cvSettings));
  const pt = document.getElementById('settingsPreviewText');
  if (pt) {
    pt.style.fontFamily  = "'" + cvSettings.font + "', sans-serif";
    pt.style.fontSize    = cvSettings.fontSize + 'px';
    pt.style.lineHeight  = String(cvSettings.lineHeight);
  }
  updatePreview();
  showToast('Apparence appliquée !', 'success');
}

function resetSettings() {
  cvSettings = { font:'Poppins', fontSize:12, lineHeight:1.6 };
  localStorage.removeItem('cvSettings');
  const fontEl = document.getElementById('s-font'); if (fontEl) fontEl.value = 'Poppins';
  [{ id:'s-fontsize', val:12, sfx:'px' }, { id:'s-lineheight', val:1.6, sfx:'' }].forEach(function(item) {
    const el = document.getElementById(item.id);
    if (!el) return;
    el.value = item.val;
    const lb = el.nextElementSibling; if (lb) lb.textContent = item.val + item.sfx;
  });
  applySettings();
  showToast('Apparence réinitialisée', 'info');
}

/* ----------------------------------------------------------
   TRADUCTION EN
   ---------------------------------------------------------- */
const FR_EN = {
  'Graphiste Designer':'Graphic Designer','Community Manager':'Community Manager',
  'Formateur':'Trainer','Identité visuelle':'Visual Identity','Mise en page':'Layout',
  'Création de contenu':'Content Creation','Réseaux sociaux':'Social Media',
  'Intelligence Artificielle':'Artificial Intelligence','Conception':'Design',
  'Gestion':'Management','Branding':'Branding','Licence':'Bachelor\'s Degree',
  'Courant':'Fluent','Natif':'Native','Avancé':'Advanced',
  'Intermédiaire':'Intermediate','Débutant':'Beginner',
  'Septembre':'September','Juin':'June','Janvier':'January','Février':'February',
  'Mars':'March','Avril':'April','Mai':'May','Juillet':'July',
  'Août':'August','Octobre':'October','Novembre':'November','Décembre':'December'
};

function translateText(text) {
  if (!text) return '';
  let r = text;
  Object.entries(FR_EN).sort(function(a,b){return b[0].length-a[0].length;}).forEach(function(entry) {
    r = r.replace(new RegExp(entry[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), entry[1]);
  });
  return r;
}

function translateCV() {
  const d = cvData;
  translatedData = Object.assign({}, d, {
    title:       translateText(d.title),
    profile:     translateText(d.profile),
    experiences: (d.experiences||[]).map(function(e){return Object.assign({},e,{role:translateText(e.role),desc:translateText(e.desc)});}),
    education:   (d.education||[]).map(function(e){return Object.assign({},e,{degree:translateText(e.degree)});}),
    certifications:(d.certifications||[]).map(function(c){return Object.assign({},c,{title:translateText(c.title)});}),
    skills:      (d.skills||[]).map(function(s){return Object.assign({},s,{name:translateText(s.name)});}),
    languages:   (d.languages||[]).map(function(l){return Object.assign({},l,{level:translateText(l.level)});})
  });

  const frEl = document.getElementById('translate-fr-preview');
  const enEl = document.getElementById('translate-en-preview');
  if (frEl) frEl.innerHTML = buildTextSummary(d, 'fr');
  if (enEl) enEl.innerHTML = buildTextSummary(translatedData, 'en');
  showToast('Traduction terminée !', 'success');
}

function buildTextSummary(d, lang) {
  const sec = function(title, content) {
    return content ? '<div style="margin-bottom:14px"><strong style="color:var(--primary);text-transform:uppercase;font-size:10px;letter-spacing:1px">'+title+'</strong><div style="margin-top:4px">'+content+'</div></div>' : '';
  };
  return '<div style="font-size:12px">' +
    '<div style="margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--border)">' +
      '<strong style="font-size:15px">'+d.name+'</strong><br>' +
      '<span style="color:var(--primary)">'+d.title+'</span><br>' +
      '<span style="font-size:11px;color:var(--text-muted)">'+(d.email||'')+' · '+(d.phone||'')+'</span>' +
    '</div>' +
    sec(lang==='fr'?'Profil':'Profile', d.profile?'<span style="font-size:11.5px">'+d.profile+'</span>':'') +
    sec(lang==='fr'?'Expériences':'Experience', (d.experiences||[]).map(function(e){return '<div style="margin-bottom:8px"><strong>'+e.role+'</strong> — '+e.company+' <span style="color:var(--text-muted)">('+e.date+')</span><br><span style="font-size:11px">'+e.desc+'</span></div>';}).join('')) +
    sec(lang==='fr'?'Compétences':'Skills', (d.skills||[]).map(function(s){return '<span style="display:inline-block;background:var(--primary-light);color:var(--primary);padding:2px 8px;border-radius:10px;font-size:11px;margin:2px">'+s.name+' '+s.pct+'%</span>';}).join('')) +
  '</div>';
}

function copyTranslated() {
  if (!translatedData) { showToast('Traduisez d\'abord le CV', 'error'); return; }
  let text = translatedData.name + '\n' + translatedData.title + '\n\n';
  if (translatedData.profile) text += 'PROFILE\n' + translatedData.profile + '\n\n';
  (translatedData.experiences||[]).forEach(function(e){ text += e.date+' | '+e.role+' — '+e.company+'\n'+e.desc+'\n\n'; });
  navigator.clipboard.writeText(text).then(function(){ showToast('CV anglais copié !', 'success'); });
}

function exportTranslatedPDF() {
  if (!translatedData) { showToast('Traduisez d\'abord le CV', 'error'); return; }
  const saved = cvData;
  cvData = translatedData;
  exportPDF();
  cvData = saved;
}

/* ----------------------------------------------------------
   MODE PRÉSENTATION
   ---------------------------------------------------------- */
function buildPresentationSlides() {
  const d = cvData; presentSlides = []; presentIndex = 0;
  const accent = d.accentColor || '#2563EB';

  // Slide 1 — Couverture
  presentSlides.push({ title:'Couverture', html:
    '<div style="padding:60px 40px;text-align:center;min-height:297mm;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,'+accent+','+accent+'cc)">' +
    (d.photo?'<img src="'+d.photo+'" style="width:120px;height:120px;border-radius:50%;border:4px solid rgba(255,255,255,.5);object-fit:cover;margin-bottom:20px">':'<div style="width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:48px;margin-bottom:20px">👤</div>') +
    '<h1 style="font-family:Poppins,sans-serif;font-size:32px;font-weight:800;color:#fff;margin:0 0 8px">'+(d.name||'')+'</h1>' +
    '<p style="font-family:Poppins,sans-serif;font-size:14px;color:rgba(255,255,255,.85);letter-spacing:2px;text-transform:uppercase;margin:0 0 24px">'+(d.title||'')+'</p>' +
    '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">' +
    [d.email,d.phone,d.address].filter(Boolean).map(function(x){return '<span style="background:rgba(255,255,255,.2);color:#fff;padding:5px 14px;border-radius:20px;font-size:12px">'+x+'</span>';}).join('') +
    '</div></div>'
  });

  // Slide 2 — Profil
  if (d.profile) {
    presentSlides.push({ title:'Profil', html: buildSlide(accent, 'Profil Professionnel',
      '<p style="font-size:16px;line-height:1.9;color:#374151;font-family:Poppins,sans-serif;text-align:center;max-width:560px;margin:40px auto 0">"' + d.profile + '"</p>'
    )});
  }

  // Slides Expériences (2 par slide)
  const exps = d.experiences || [];
  for (let i = 0; i < exps.length; i += 2) {
    const chunk = exps.slice(i, i+2);
    presentSlides.push({ title:'Expériences', html: buildSlide(accent, 'Expériences Professionnelles',
      chunk.map(function(e) {
        return '<div style="background:#f8faff;border-radius:10px;padding:16px 20px;margin-bottom:14px;border-left:4px solid '+accent+'">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
            '<strong style="font-size:13px;font-family:Poppins,sans-serif">'+e.role+'</strong>' +
            '<span style="background:'+accent+';color:#fff;padding:2px 8px;border-radius:12px;font-size:11px">'+e.date+'</span>' +
          '</div>' +
          '<p style="color:'+accent+';font-size:12px;font-weight:600;margin:0 0 4px">'+e.company+'</p>' +
          '<p style="color:#6b7280;font-size:11px;line-height:1.6;margin:0">'+e.desc+'</p></div>';
      }).join('')
    )});
  }

  // Slide Compétences
  if ((d.skills||[]).length) {
    presentSlides.push({ title:'Compétences', html: buildSlide(accent, 'Compétences & Outils',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 28px">' +
      (d.skills||[]).map(function(s) {
        return '<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="font-weight:600">'+s.name+'</span><span style="color:'+accent+';font-weight:700">'+s.pct+'%</span></div><div style="height:6px;background:#e5e7eb;border-radius:3px"><div style="height:100%;width:'+s.pct+'%;background:'+accent+';border-radius:3px"></div></div></div>';
      }).join('') + '</div>' +
      ((d.tools||[]).length ? '<div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:6px">' + (d.tools||[]).map(function(t){return '<span style="background:'+accent+'22;color:'+accent+';padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600">'+t+'</span>';}).join('') + '</div>' : '')
    )});
  }

  // Slide Contact
  presentSlides.push({ title:'Contact', html:
    '<div style="padding:60px 40px;text-align:center;min-height:297mm;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff">' +
    '<div style="width:70px;height:70px;background:'+accent+';border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px">🤝</div>' +
    '<h2 style="font-family:Poppins,sans-serif;font-size:26px;font-weight:800;color:#1a1a2e;margin:0 0 10px">Travaillons ensemble</h2>' +
    '<p style="font-family:Poppins,sans-serif;font-size:13px;color:#6b7280;margin:0 0 24px">'+(d.title||'')+'</p>' +
    '<div style="display:flex;flex-direction:column;gap:10px;align-items:center">' +
    [d.email&&('✉️ '+d.email), d.phone&&('📞 '+d.phone), d.linkedin&&('🔗 '+d.linkedin)].filter(Boolean).map(function(x){return '<div style="font-size:13px">'+x+'</div>';}).join('') +
    '</div></div>'
  });

  renderPresentSlide();
  renderPresentThumbs();
}

function buildSlide(accent, title, content) {
  return '<div style="padding:32px 44px;min-height:297mm;font-family:Poppins,sans-serif;background:#fff">' +
    '<div style="border-bottom:3px solid '+accent+';padding-bottom:12px;margin-bottom:24px">' +
      '<h2 style="font-size:20px;font-weight:800;color:#1a1a2e;margin:0">'+title+'</h2>' +
      '<div style="width:36px;height:3px;background:'+accent+';margin-top:7px;border-radius:2px"></div>' +
    '</div>' + content + '</div>';
}

function renderPresentSlide() {
  const slide = document.getElementById('presentSlide'); if (!slide||!presentSlides.length) return;
  slide.innerHTML = presentSlides[presentIndex].html;
  const counter = document.getElementById('present-counter');
  if (counter) counter.textContent = (presentIndex+1) + ' / ' + presentSlides.length;
  const prev = document.getElementById('present-prev-btn'); if (prev) prev.disabled = presentIndex===0;
  const next = document.getElementById('present-next-btn'); if (next) next.disabled = presentIndex===presentSlides.length-1;
  const fsSlide = document.getElementById('fsSlideWrap'); if (fsSlide) fsSlide.innerHTML = presentSlides[presentIndex].html;
  const fsCounter = document.getElementById('fs-counter'); if (fsCounter) fsCounter.textContent = (presentIndex+1)+'/'+presentSlides.length;
}

function renderPresentThumbs() {
  const c = document.getElementById('presentThumbs'); if (!c) return;
  const accent = cvData.accentColor || '#2563EB';
  c.innerHTML = presentSlides.map(function(s,i) {
    const active = i===presentIndex;
    return '<div onclick="presentIndex='+i+';renderPresentSlide();renderPresentThumbs()" style="cursor:pointer;border:2px solid '+(active?accent:'var(--border)')+';border-radius:8px;overflow:hidden;width:80px;flex-shrink:0">' +
      '<div style="height:60px;background:'+(active?'var(--primary-light)':'var(--bg-input)')+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:'+(active?accent:'var(--text-muted)')+';text-align:center;padding:4px">'+(i+1)+'<br><span style="font-size:9px;font-weight:400">'+s.title+'</span></div>' +
    '</div>';
  }).join('');
}

function presentPrev() { if (presentIndex>0) { presentIndex--; renderPresentSlide(); renderPresentThumbs(); } }
function presentNext() { if (presentIndex<presentSlides.length-1) { presentIndex++; renderPresentSlide(); renderPresentThumbs(); } }

function launchFullscreen() {
  if (!presentSlides.length) { showToast('Aucune slide à afficher', 'error'); return; }
  const fs = document.getElementById('fullscreenPresent'); if (!fs) return;
  fs.style.display = 'flex'; renderPresentSlide();
  document.addEventListener('keydown', handlePresentKey);
}

function closeFullscreen() {
  const fs = document.getElementById('fullscreenPresent'); if (fs) fs.style.display = 'none';
  document.removeEventListener('keydown', handlePresentKey);
}

function handlePresentKey(e) {
  if (e.key==='ArrowRight'||e.key==='ArrowDown') presentNext();
  if (e.key==='ArrowLeft' ||e.key==='ArrowUp')   presentPrev();
  if (e.key==='Escape') closeFullscreen();
}

/* ----------------------------------------------------------
   EXPORT WORD / RTF / TXT
   ---------------------------------------------------------- */
function buildPlainText(d, lang) {
  const isEN = lang === 'en', sep = '─'.repeat(48);
  let out = (d.name||'') + '\n' + (d.title||'') + '\n' + [d.email,d.phone,d.address].filter(Boolean).join(' | ') + '\n\n';
  if (d.profile) out += (isEN?'PROFILE':'PROFIL') + '\n' + sep + '\n' + d.profile + '\n\n';
  if ((d.experiences||[]).length) {
    out += (isEN?'EXPERIENCE':'EXPÉRIENCES') + '\n' + sep + '\n';
    d.experiences.forEach(function(e){ out += e.date+' | '+e.role+' — '+e.company+'\n'+e.desc+'\n\n'; });
  }
  if ((d.skills||[]).length) out += (isEN?'SKILLS':'COMPÉTENCES') + '\n' + sep + '\n' + d.skills.map(function(s){return '• '+s.name+' ('+s.pct+'%)';}).join('\n') + '\n\n';
  if ((d.tools||[]).length)  out += (isEN?'TOOLS':'OUTILS') + '\n' + sep + '\n' + d.tools.map(function(t){return '• '+t;}).join('\n') + '\n\n';
  return out;
}

function refreshWordPreview() {
  const lang   = document.getElementById('word-lang')?.value   || 'fr';
  const format = document.getElementById('word-format')?.value || 'docx';
  const d = (lang==='en' && translatedData) ? translatedData : cvData;
  const preview = document.getElementById('wordPreview'); if (!preview) return;
  preview.textContent = buildPlainText(d, lang);
}

function exportWord() {
  const lang   = document.getElementById('word-lang')?.value   || 'fr';
  const format = document.getElementById('word-format')?.value || 'docx';
  const d = (lang==='en' && translatedData) ? translatedData : cvData;
  const fn = 'cv-' + (d.name||'profil').replace(/\s+/g,'-').toLowerCase() + '-' + lang;

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  if (format === 'txt') {
    downloadBlob(new Blob(['\ufeff' + buildPlainText(d,lang)], {type:'text/plain;charset=utf-8'}), fn+'.txt');
    showToast('Export TXT téléchargé !', 'success'); return;
  }

  if (format === 'rtf') {
    let rtf = '{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Calibri;}}\n\\f0\\fs22\n';
    rtf += buildPlainText(d,lang).split('\n').map(function(l){
      return l.replace(/\\/g,'\\\\').replace(/[{}]/g,'\\$&').replace(/[^\x00-\x7F]/g,function(c){return '\\u'+c.charCodeAt(0)+'?';}) + '\\par\n';
    }).join('');
    rtf += '}';
    downloadBlob(new Blob([rtf],{type:'application/rtf'}), fn+'.rtf');
    showToast('Export RTF téléchargé !', 'success'); return;
  }

  // Word HTML
  const accent = d.accentColor || '#2563EB';
  const exps = (d.experiences||[]).map(function(e){
    return '<tr><td style="width:80px;vertical-align:top;color:'+accent+';font-weight:bold;font-size:10pt;padding-right:8px">'+e.date+'</td>' +
      '<td><strong>'+e.role+'</strong><br><span style="color:'+accent+'">'+e.company+'</span><br><span style="font-size:10pt;color:#555">'+e.desc+'</span></td></tr>';
  }).join('');
  const edu = (d.education||[]).map(function(e){
    return '<p style="margin:0 0 8px"><strong>'+e.school+'</strong><br><span style="color:'+accent+'">'+e.degree+'</span><br><span style="font-size:10pt;color:#777">'+e.date+'</span></p>';
  }).join('');
  const skills = (d.skills||[]).map(function(s){return '<tr><td>'+s.name+'</td><td style="color:'+accent+';font-weight:bold">'+s.pct+'%</td></tr>';}).join('');
  const tools  = (d.tools||[]).map(function(t){return '<span style="display:inline-block;background:#f0f4ff;color:'+accent+';padding:2px 8px;border-radius:12px;font-size:10pt;margin:2px">'+t+'</span>';}).join('');
  const refs   = (d.references||[]).map(function(r){return '<p style="margin:0 0 6px"><strong>'+r.name+'</strong> — '+r.role+'<br><span style="color:#555">'+r.contact+'</span></p>';}).join('');
  const secH2  = function(t){ return '<h2 style="font-size:11pt;color:'+accent+';border-bottom:2px solid '+accent+';padding-bottom:3px;margin:18px 0 8px;text-transform:uppercase;letter-spacing:1px">'+t+'</h2>'; };
  const html   = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#222;margin:2cm 2.5cm;line-height:1.5}table{width:100%;border-collapse:collapse}@page{size:A4;margin:2cm}</style></head><body>' +
    '<div style="border-bottom:3px solid '+accent+';padding-bottom:14px;margin-bottom:18px"><h1 style="font-size:20pt;margin:0;color:#111">'+d.name+'</h1><p style="font-size:12pt;color:'+accent+';margin:3px 0;font-style:italic">'+d.title+'</p><p style="font-size:10pt;color:#555;margin:0">'+(d.email||'')+' · '+(d.phone||'')+' · '+(d.address||'')+'</p></div>' +
    (d.profile?secH2(lang==='en'?'Profile':'Profil')+'<p style="font-style:italic">'+d.profile+'</p>':'') +
    (exps?secH2(lang==='en'?'Experience':'Expériences')+'<table>'+exps+'</table>':'') +
    (edu?secH2(lang==='en'?'Education':'Formation')+edu:'') +
    (skills?secH2(lang==='en'?'Skills':'Compétences')+'<table style="width:60%">'+skills+'</table>':'') +
    (tools?secH2(lang==='en'?'Tools':'Outils')+'<div>'+tools+'</div>':'') +
    (refs?secH2(lang==='en'?'References':'Références')+refs:'') +
    '</body></html>';
  downloadBlob(new Blob(['\ufeff'+html],{type:'application/vnd.ms-word;charset=utf-8'}), fn+'.doc');
  showToast('Export Word téléchargé !', 'success');
}

/* ----------------------------------------------------------
   IMPORT ANCIEN CV
   ---------------------------------------------------------- */
let importedParsed = null;

function handleImportDrag(e) { e.preventDefault(); document.getElementById('importDropZone')?.classList.add('drag-over'); }
function handleImportDragLeave() { document.getElementById('importDropZone')?.classList.remove('drag-over'); }
function handleImportDrop(e) {
  e.preventDefault();
  document.getElementById('importDropZone')?.classList.remove('drag-over');
  const file = e.dataTransfer?.files?.[0];
  if (file) readImportFile(file);
}
function handleImportFileSelect(e) { const file = e.target.files?.[0]; if (file) readImportFile(file); }

function readImportFile(file) {
  const fname = file.name.toLowerCase();
  if (fname.endsWith('.json')) { showToast('Fichier JSON non accepté ici — utilisez la page Export pour importer un JSON', 'error'); return; }
  if (!fname.match(/\.(txt|pdf|doc|docx)$/)) { showToast('Format non supporté. Utilisez .txt, .pdf, .doc ou .docx', 'error'); return; }
  showToast('Lecture du fichier : ' + file.name, 'info');
  const reader = new FileReader();
  reader.onload = function(e) {
    let raw = e.target.result || '';
    let text = '';
    if (fname.endsWith('.txt')) {
      text = raw;
    } else if (fname.endsWith('.pdf')) {
      // Extract text from PDF BT...ET blocks
      const btBlocks = raw.match(/BT[\s\S]*?ET/g) || [];
      let extracted = '';
      btBlocks.forEach(function(block) {
        const matches = block.match(/\(([^)]{1,200})\)\s*Tj/g) || [];
        matches.forEach(function(m) {
          const txt = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim();
          if (txt.length > 1 && /[a-zA-ZÀ-ÿ]/.test(txt)) extracted += txt + ' ';
        });
      });
      if (extracted.length < 50) {
        const strings = raw.match(/[A-Za-zÀ-ÿ0-9@._+\-]{3,80}/g) || [];
        extracted = strings.filter(function(s){return /[a-zA-ZÀ-ÿ]/.test(s)&&!['obj','endobj','stream','endstream','xref','trailer'].includes(s.toLowerCase());}).join(' ');
      }
      text = extracted.trim();
      if (text.length < 30) text = 'Le PDF ne contient pas de texte extractible.\nCollez manuellement le texte de votre CV dans la zone ci-dessous.';
    } else {
      const strings = raw.match(/[A-Za-zÀ-ÿ0-9\s@._+\-:,;()«»'"]{4,}/g) || [];
      text = strings.filter(function(s){return s.trim().length>3&&/[a-zA-ZÀ-ÿ]{2,}/.test(s);}).join('\n').replace(/\n{3,}/g,'\n\n').trim();
      if (text.length < 30) text = 'Fichier Word non lisible directement.\nConvertissez-le en .txt ou copiez-collez son contenu.';
    }
    const ta = document.getElementById('importCvText');
    if (ta) ta.value = text || 'Aucun texte extractible — collez le contenu manuellement.';
  };
  if (fname.endsWith('.txt')) reader.readAsText(file, 'UTF-8');
  else reader.readAsBinaryString(file);
}

function parseImportedCV() {
  const raw = document.getElementById('importCvText')?.value?.trim() || '';
  if (raw.length < 20) { showToast('Collez d\'abord le texte de votre CV', 'error'); return; }

  const lines = raw.split('\n').map(function(l){return l.trim();}).filter(function(l){return l.length>0;});
  const result = { name:'',title:'',email:'',phone:'',address:'',linkedin:'',portfolio:'',profile:'',experiences:[],education:[],certifications:[],skills:[],tools:[],languages:[],interests:[],references:[] };

  const emailMatch = raw.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  if (emailMatch) result.email = emailMatch[0];
  const phoneMatch = raw.match(/\+?[\d\s\-().]{8,20}/);
  if (phoneMatch) result.phone = phoneMatch[0].trim();
  const liMatch = raw.match(/linkedin\.com\/in\/[\w-]+/i);
  if (liMatch) result.linkedin = 'https://' + liMatch[0];

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    if (!l.includes('@') && !l.match(/\d{4}/) && l.split(' ').length <= 5 && l.length>3 && l.length<50) { result.name = l; break; }
  }

  const nameIdx = lines.findIndex(function(l){return l===result.name;});
  if (nameIdx>=0 && nameIdx+1<lines.length) {
    const next = lines[nameIdx+1];
    if (!next.includes('@') && next.length>3 && next.length<80 && !next.match(/^\d/)) result.title = next;
  }

  const addrMatch = raw.match(/(?:Cotonou|Bénin|Benin|Paris|Dakar|Abidjan|France|Canada|Cameroun)[^,\n]*/i);
  if (addrMatch) result.address = addrMatch[0].trim();

  const SECS = { profile:['profil','résumé','summary','about','presentation'], exp:['expérience','experience','emploi','poste','professional'], edu:['formation','education','diplôme','études'], cert:['certification','attestation'], skills:['compétence','competence','skill'], tools:['outil','logiciel','software','adobe','canva'], langs:['langue','language'], interests:['intérêt','interest','loisir','hobby'], refs:['référence','reference'] };
  let curSec = 'none', secBuf = [], sections = {};
  lines.forEach(function(line) {
    const ll = line.toLowerCase();
    let detected = null;
    Object.entries(SECS).forEach(function(entry) {
      if (!detected && entry[1].some(function(k){return ll.includes(k)&&line.length<60;})) detected = entry[0];
    });
    if (detected) { if (curSec!=='none') sections[curSec]=secBuf.slice(); curSec=detected; secBuf=[]; }
    else secBuf.push(line);
  });
  if (curSec!=='none') sections[curSec]=secBuf.slice();

  if (sections.profile) result.profile = sections.profile.filter(function(l){return l.length>20;}).slice(0,5).join(' ').substring(0,600);

  const KNOWN_TOOLS = ['photoshop','illustrator','indesign','canva','figma','word','excel','powerpoint','html','css','javascript','python'];
  (sections.skills||[]).concat(sections.tools||[]).forEach(function(line) {
    line.split(/[,;•|\n]/).map(function(i){return i.trim();}).filter(function(i){return i.length>2&&i.length<50;}).forEach(function(item) {
      const isT = KNOWN_TOOLS.some(function(t){return item.toLowerCase().includes(t);});
      const pct = item.match(/(\d{2,3})\s*%/);
      if (isT) { const clean = item.replace(/\d+%/,'').trim(); if (!result.tools.includes(clean)) result.tools.push(clean); }
      else result.skills.push({name:item.replace(/\d+%/,'').trim(), pct:pct?parseInt(pct[1]):80});
    });
  });

  result.skills = result.skills.filter(function(s,i,a){return s.name&&a.findIndex(function(x){return x.name===s.name;})===i;}).slice(0,12);
  result.tools  = [...new Set(result.tools.filter(function(t){return t;}))].slice(0,8);

  importedParsed = result;
  showImportResults(result);
}

function showImportResults(r) {
  const grid = document.getElementById('importResultsGrid'); if (!grid) return;
  const field = function(label, value) {
    return '<div class="import-field-row">' +
      '<div class="import-field-label"><i class="fas fa-'+(value?'check-circle':'circle-xmark')+'" style="color:'+(value?'var(--success)':'var(--text-muted)')+'"></i> '+label+'</div>' +
      '<div class="import-field-value '+(value?'':'empty')+'">'+(value||'Non détecté')+'</div></div>';
  };
  const listField = function(label, items, display) {
    return '<div class="import-field-row"><div class="import-field-label"><i class="fas fa-'+(items.length?'check-circle':'circle-xmark')+'" style="color:'+(items.length?'var(--success)':'var(--text-muted)')+'"></i> '+label+' <span style="background:var(--primary);color:#fff;padding:1px 7px;border-radius:10px;font-size:10px;margin-left:4px">'+items.length+'</span></div>' +
      '<div class="import-field-value">'+(items.length?display(items):'<span class="empty">Non détecté</span>')+'</div></div>';
  };
  grid.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">' +
    field('Nom', r.name) + field('Titre', r.title) + field('Email', r.email) + field('Téléphone', r.phone) + field('Adresse', r.address) +
    listField('Compétences', r.skills, function(items){return items.map(function(s){return '<span class="import-tag">'+s.name+'</span>';}).join('');}) +
    listField('Outils', r.tools, function(items){return items.map(function(t){return '<span class="import-tag">'+t+'</span>';}).join('');}) +
    field('Profil extrait', r.profile ? r.profile.substring(0,120)+'...' : '') +
  '</div>';
  document.getElementById('importStep2').style.display = 'block';
  document.getElementById('importStep3').style.display = 'block';
  document.getElementById('importStep2').scrollIntoView({behavior:'smooth',block:'start'});
  showToast('Extraction terminée — ' + r.skills.length + ' compétence(s) trouvée(s)', 'success');
}

function applyImportedCV() {
  if (!importedParsed) { showToast('Aucune donnée à appliquer', 'error'); return; }
  const r = importedParsed;
  if (document.getElementById('imp-infos')?.checked) {
    if (r.name) cvData.name = r.name; if (r.title) cvData.title = r.title;
    if (r.email) cvData.email = r.email; if (r.phone) cvData.phone = r.phone;
    if (r.address) cvData.address = r.address;
  }
  if (document.getElementById('imp-profile')?.checked && r.profile) cvData.profile = r.profile;
  if (document.getElementById('imp-skills')?.checked && r.skills.length) {
    const existing = cvData.skills.map(function(s){return s.name.toLowerCase();});
    cvData.skills = cvData.skills.concat(r.skills.filter(function(s){return !existing.includes(s.name.toLowerCase());})).slice(0,12);
  }
  if (document.getElementById('imp-tools')?.checked && r.tools.length) {
    const existing = cvData.tools.map(function(t){return t.toLowerCase();});
    cvData.tools = cvData.tools.concat(r.tools.filter(function(t){return !existing.includes(t.toLowerCase());})).slice(0,8);
  }
  saveData(); renderAllForms(); renderTemplatePickers(); renderColorPickers();
  updatePreview(); updateStats(); updateCompletion();
  showToast('CV importé et appliqué ! 🎉', 'success');
  setTimeout(function() { showPage('builder', document.querySelector('[data-page="builder"]')); }, 1200);
}

function resetImport() {
  importedParsed = null;
  const ta = document.getElementById('importCvText'); if (ta) ta.value = '';
  const grid = document.getElementById('importResultsGrid'); if (grid) grid.innerHTML = '';
  const s2 = document.getElementById('importStep2'); if (s2) s2.style.display = 'none';
  const s3 = document.getElementById('importStep3'); if (s3) s3.style.display = 'none';
  const fi = document.getElementById('importCvFile'); if (fi) fi.value = '';
}

/* ----------------------------------------------------------
   LINKEDIN POSTS
   ---------------------------------------------------------- */
function generateLinkedInPost() {
  const type     = document.getElementById('li-type')?.value     || 'intro';
  const hashtags = document.getElementById('li-hashtags')?.value || '';
  const name     = cvData.name  || 'Thibaut A. Hoyochi';
  const title    = cvData.title || 'Graphiste Designer & Community Manager';
  const topExp   = (cvData.experiences||[])[0];
  const expStr   = topExp ? topExp.role + ' chez ' + topExp.company : 'diverses missions';
  const skills   = (cvData.skills||[]).slice(0,4).map(function(s){return s.name;}).join(', ');
  const tools    = (cvData.tools||[]).slice(0,3).join(', ');
  lastLinkedInVariant = (lastLinkedInVariant % 3) + 1;
  const v = lastLinkedInVariant - 1;

  const posts = {
    intro: [
      '👋 Bonjour LinkedIn !\n\nJe suis ' + name + ', ' + title + ' basé(e) à ' + (cvData.address||'Cotonou, Bénin') + '.\n\nCe que je fais :\n✅ Conception d\'identités visuelles\n✅ Gestion des réseaux sociaux\n✅ Création de contenus avec l\'IA\n✅ Formation en graphisme\n\nOutils : ' + tools + '\n\nProjet créatif ? Parlons-en ! 🎨\n\n' + hashtags,
      '🎨 Je suis ' + name + ' — ' + title + '.\n\nJe transforme des idées en visuels qui parlent et qui vendent.\n\nAujourd\'hui : ' + expStr + '.\n\nObjectif : aider les marques à rayonner grâce au design.\n\n💌 Contactez-moi !\n\n' + hashtags,
      '💼 En bref :\n→ ' + name + '\n→ ' + title + '\n→ ' + (cvData.address||'Cotonou') + '\n→ Outils : ' + tools + '\n\nClients en Afrique, France, Canada et Cameroun.\n\nContactez-moi pour vos projets 🚀\n\n' + hashtags
    ],
    competence: ['🎯 Ce que m\'a appris le design en 3 ans :\n\n1️⃣ La technique s\'apprend. L\'oeil, ça se développe.\n2️⃣ Un bon brief vaut mieux que 10 révisions.\n3️⃣ La cohérence visuelle = la signature d\'une marque.\n4️⃣ L\'IA amplifie le créatif, ne le remplace pas.\n\n' + hashtags],
    experience: ['📌 Retour d\'expérience : ' + expStr + '\n\n✅ Conception de visuels impactants\n✅ Gestion d\'une ligne éditoriale\n✅ Formation d\'équipes aux outils créatifs\n\nChaque mission forge le professionnel. 💪\n\n' + hashtags],
    recherche: ['🔍 Ouvert(e) à de nouvelles opportunités\n\n📌 Poste : ' + title + '\n📍 Zone : Internationale (remote possible)\n\n✅ 3 ans en design & community management\n✅ Maîtrise de ' + tools + '\n\n📧 ' + (cvData.email||'') + '\n\n' + hashtags],
    conseil: ['💡 Conseil du jour sur la création de contenu :\n\nBeaucoup de créatifs commencent par l\'outil. Mauvais réflexe.\n\n✅ La bonne approche :\n1. Comprendre l\'objectif\n2. Définir le message clé\n3. Choisir le format\n4. PUIS choisir l\'outil\n\nD\'accord ? 👇\n\n' + hashtags],
    milestone: ['🏆 Nouvelle étape franchie !\n\nMerci à tous ceux qui m\'ont soutenu(e) 🙏\n\nCeci n\'est qu\'un début. La suite s\'annonce encore plus belle 🚀\n\n' + hashtags]
  };

  const typeArr = posts[type] || posts.intro;
  const post = typeArr[v % typeArr.length];
  lastLinkedInPost = post;

  const el = document.getElementById('liPostText');
  if (el) el.innerHTML = post.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>').replace(/(#\w+)/g,'<strong style="color:var(--primary)">$1</strong>');

  const counter = document.getElementById('li-char-count');
  if (counter) counter.textContent = post.length + ' / 3000 caractères';

  const pName  = document.getElementById('li-preview-name');  if (pName)  pName.textContent  = cvData.name  || 'Thibaut A. Hoyochi';
  const pTitle = document.getElementById('li-preview-title'); if (pTitle) pTitle.textContent = cvData.title || 'Graphiste Designer';

  showToast('Post LinkedIn généré !', 'success');
}

function regenerateLinkedInPost() { lastLinkedInVariant = (lastLinkedInVariant % 3) + 1; generateLinkedInPost(); }

function copyLinkedInPost() {
  if (!lastLinkedInPost) { showToast('Générez d\'abord un post', 'error'); return; }
  navigator.clipboard.writeText(lastLinkedInPost).then(function() { showToast('Post copié !', 'success'); });
}

function addHashtag(tag) {
  const el = document.getElementById('li-hashtags'); if (!el) return;
  if (!el.value.includes(tag)) { el.value = (el.value ? el.value + ' ' : '') + tag; showToast(tag + ' ajouté !', 'info'); }
}

/* ==========================================================
   PHOTO CROP — Canvas-based circular cropper
   ========================================================== */

let cropState = {
  imgSrc: '',       // original base64
  zoom: 1,
  offsetX: 0,       // image position in container
  offsetY: 0,
  naturalW: 0,
  naturalH: 0,
  containerW: 0,
  containerH: 0,
  cropSize: 0,      // diameter of the circle
  dragging: false,
  startX: 0,
  startY: 0,
  startOffX: 0,
  startOffY: 0
};

/* Override the photo upload to open the crop modal */
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Format invalide — utilisez JPG ou PNG', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Fichier trop volumineux (max 5MB)', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const result = e.target.result;
    if (!result || result.indexOf('data:image') !== 0) {
      showToast('Fichier invalide', 'error');
      return;
    }
    openCropModal(result);
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function openCropModal(imgSrc) {
  cropState.imgSrc = imgSrc;

  const modal = document.getElementById('cropModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  // Load image first to get natural dimensions
  const tempImg = new Image();
  tempImg.onload = function() {
    cropState.naturalW = tempImg.naturalWidth;
    cropState.naturalH = tempImg.naturalHeight;

    // Now set src on the actual img element
    const img = document.getElementById('cropImg');
    if (img) img.src = imgSrc;

    // Get container dimensions after modal is visible
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        initCropLayout();
        attachCropEvents();
        renderCrop();
      });
    });
  };
  tempImg.src = imgSrc;
}

function initCropLayout() {
  const container = document.getElementById('cropContainer');
  if (!container) return;

  cropState.containerW = container.offsetWidth || 500;
  cropState.containerH = container.offsetHeight || 360;
  cropState.cropSize   = Math.min(cropState.containerW, cropState.containerH) * 0.78;

  // Scale to fill the crop circle
  const scaleX = cropState.cropSize / cropState.naturalW;
  const scaleY = cropState.cropSize / cropState.naturalH;
  const baseScale = Math.max(scaleX, scaleY);
  cropState.zoom = baseScale;

  // Center image
  const scaledW = cropState.naturalW * cropState.zoom;
  const scaledH = cropState.naturalH * cropState.zoom;
  cropState.offsetX = (cropState.containerW - scaledW) / 2;
  cropState.offsetY = (cropState.containerH - scaledH) / 2;

  // Set zoom slider range
  const slider = document.getElementById('cropZoom');
  if (slider) {
    slider.min   = String(baseScale * 0.5);
    slider.max   = String(baseScale * 5);
    slider.step  = String(baseScale * 0.02);
    slider.value = String(cropState.zoom);
  }
  const lbl = document.getElementById('cropZoomLabel');
  if (lbl) lbl.textContent = '100%';
}


function renderCrop() {
  const img       = document.getElementById('cropImg');
  const canvas    = document.getElementById('cropOverlay');
  const container = document.getElementById('cropContainer');
  if (!img || !canvas || !container) return;

  const W = cropState.containerW;
  const H = cropState.containerH;
  const scaledW = cropState.naturalW * cropState.zoom;
  const scaledH = cropState.naturalH * cropState.zoom;

  // Position the image
  img.style.width  = scaledW + 'px';
  img.style.height = scaledH + 'px';
  img.style.left   = cropState.offsetX + 'px';
  img.style.top    = cropState.offsetY + 'px';

  // Draw overlay with circle cutout
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const cx  = W / 2;
  const cy  = H / 2;
  const r   = cropState.cropSize / 2;

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);

  // Cut out the circle
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Draw circle border
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Grid lines inside circle (rule of thirds)
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(cx - r + (2*r/3)*i, cy - r); ctx.lineTo(cx - r + (2*r/3)*i, cy + r); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r, cy - r + (2*r/3)*i); ctx.lineTo(cx + r, cy - r + (2*r/3)*i); ctx.stroke();
  }
  ctx.restore();
}

function updateCropZoom(val) {
  const newZoom = parseFloat(val);
  if (isNaN(newZoom) || newZoom <= 0) return;
  const W = cropState.containerW;
  const H = cropState.containerH;

  // Zoom centered on crop circle center
  const cx = W / 2, cy = H / 2;
  const relX = cropState.zoom > 0 ? (cx - cropState.offsetX) / cropState.zoom : 0;
  const relY = cropState.zoom > 0 ? (cy - cropState.offsetY) / cropState.zoom : 0;
  cropState.zoom = newZoom;
  cropState.offsetX = cx - relX * newZoom;
  cropState.offsetY = cy - relY * newZoom;

  clampOffset();
  renderCrop();

  // Show zoom as percentage relative to fit-to-circle size
  const slider = document.getElementById('cropZoom');
  const lbl    = document.getElementById('cropZoomLabel');
  if (lbl && slider) {
    const minZoom = parseFloat(slider.min);
    const pct = minZoom > 0 ? Math.round((newZoom / minZoom) * 100) : 100;
    lbl.textContent = pct + '%';
  }
}

function clampOffset() {
  const W = cropState.containerW, H = cropState.containerH;
  const scaledW = cropState.naturalW * cropState.zoom;
  const scaledH = cropState.naturalH * cropState.zoom;
  // Don't let the image leave the viewport completely
  const pad = cropState.cropSize / 2;
  cropState.offsetX = Math.min(cropState.offsetX, W/2 + pad - 20);
  cropState.offsetX = Math.max(cropState.offsetX, W/2 - pad - scaledW + 20);
  cropState.offsetY = Math.min(cropState.offsetY, H/2 + pad - 20);
  cropState.offsetY = Math.max(cropState.offsetY, H/2 - pad - scaledH + 20);
}

function attachCropEvents() {
  const c = document.getElementById('cropContainer');
  if (!c) return;
  if (c._cropEventsAttached) return; // prevent duplicates
  c._cropEventsAttached = true;

  // Mouse
  c.addEventListener('mousedown', function(e) {
    cropState.dragging = true;
    cropState.startX    = e.clientX;
    cropState.startY    = e.clientY;
    cropState.startOffX = cropState.offsetX;
    cropState.startOffY = cropState.offsetY;
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!cropState.dragging) return;
    cropState.offsetX = cropState.startOffX + (e.clientX - cropState.startX);
    cropState.offsetY = cropState.startOffY + (e.clientY - cropState.startY);
    clampOffset();
    renderCrop();
  });

  document.addEventListener('mouseup', function() { cropState.dragging = false; });

  // Touch events
  c.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      cropState.dragging = true;
      cropState.startX   = e.touches[0].clientX;
      cropState.startY   = e.touches[0].clientY;
      cropState.startOffX = cropState.offsetX;
      cropState.startOffY = cropState.offsetY;
    }
    e.preventDefault();
  }, { passive: false });

  c.addEventListener('touchmove', function(e) {
    if (!cropState.dragging || e.touches.length !== 1) return;
    cropState.offsetX = cropState.startOffX + (e.touches[0].clientX - cropState.startX);
    cropState.offsetY = cropState.startOffY + (e.touches[0].clientY - cropState.startY);
    clampOffset();
    renderCrop();
    e.preventDefault();
  }, { passive: false });

  c.addEventListener('touchend', function() { cropState.dragging = false; });

  // Wheel zoom
  c.addEventListener('wheel', function(e) {
    e.preventDefault();
    const slider = document.getElementById('cropZoom');
    if (!slider) return;
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const current = parseFloat(slider.value) || cropState.zoom;
    const minV = parseFloat(slider.min);
    const maxV = parseFloat(slider.max);
    const newVal = Math.min(maxV, Math.max(minV, current + delta * current));
    slider.value = String(newVal);
    updateCropZoom(newVal);
  }, { passive: false });
}

function resetCrop() {
  initCropLayout();
  const slider = document.getElementById('cropZoom');
  if (slider) slider.value = String(cropState.zoom);
  const lbl = document.getElementById('cropZoomLabel');
  if (lbl) lbl.textContent = '100%';
  renderCrop();
}

function applyCrop() {
  const W  = cropState.containerW;
  const H  = cropState.containerH;
  const cx = W / 2;
  const cy = H / 2;
  const r  = cropState.cropSize / 2;
  const OUTPUT_SIZE = 400; // output pixel size

  // Canvas to extract the cropped circle
  const output = document.createElement('canvas');
  output.width  = OUTPUT_SIZE;
  output.height = OUTPUT_SIZE;
  const ctx = output.getContext('2d');

  // Clip to circle
  ctx.beginPath();
  ctx.arc(OUTPUT_SIZE/2, OUTPUT_SIZE/2, OUTPUT_SIZE/2, 0, Math.PI * 2);
  ctx.clip();

  // Draw the image portion that falls inside the crop circle
  const srcX = (cx - r - cropState.offsetX) / cropState.zoom;
  const srcY = (cy - r - cropState.offsetY) / cropState.zoom;
  const srcW = (r * 2) / cropState.zoom;
  const srcH = (r * 2) / cropState.zoom;

  const img = document.getElementById('cropImg');
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const result = output.toDataURL('image/jpeg', 0.92);
  cvData.photo = result;

  // Update all photo previews in the app
  document.querySelectorAll('.photo-preview, #photoPreview').forEach(function(p) {
    p.innerHTML = '<img src="' + result + '" alt="Photo" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />';
  });

  autosave();
  updatePreview();
  closeCropModal();
  showToast('Photo recadrée et appliquée !', 'success');
}

function closeCropModal() {
  const modal = document.getElementById('cropModal');
  if (modal) modal.classList.add('hidden');
  cropState.dragging = false;
  // Reset the events flag so they re-attach on next open
  const c = document.getElementById('cropContainer');
  if (c) c._cropEventsAttached = false;
}

/* ==========================================================
   FREEMIUM — Pro System
   ========================================================== */
function requirePro(featureName) {
  const modal = document.getElementById('proModal');
  const desc  = document.getElementById('proModalDesc');
  if (!modal) return;
  if (desc) {
    desc.textContent = '"' + featureName + '" est disponible dans la version Pro. ' +
      'Contactez Thibaut pour obtenir un accès complet sans restriction.';
  }
  modal.classList.remove('hidden');
}

/* ==========================================================
   PRO ACCESS — Code System
   SHA-256 hashes of valid Pro codes
   DO NOT share these codes — give one per paying client
   ========================================================== */
const PRO_CODES = [
  'd2edc28383087290ba80d647aa5c28bafe27ff271773d045fc00d63593c11288', // CVPRO-C5NC-NZ3E
  'ca02df57dafb30ab0991f4aa5271cb0fef02026535030027a33796003d93331a', // CVPRO-CDT9-HEW6
  'bd34d33ee4f7f25f2aae2ea378208930125ee868afa5b4001c9ab1e360819aed', // CVPRO-AS30-TD98
  '0f949c9dafd17c7f68affce33d9cae159aafc83afd831d57d1d52079ab9926c9', // CVPRO-462W-DVKS
  'da36a69a6d16772e2af64310cc2a7d27d3477b003df5cf02f3d0f4be6607bbe1', // CVPRO-9ZT8-IPUC
  '995b1fd53c3d23716ef9a9a72ff83da98242052642833a17699f1b311e875620', // CVPRO-BTOS-WPYA
  '83c30d7488696d5d4f244686810dc44c6f79c85dbf2c8c040a7719377ab32e2e', // CVPRO-BHXB-C92P
  '63dc93240b49bcab9e37120a23031c929f12594c88bbafff39dd6e86d59d8557', // CVPRO-9L3J-3W7M
  'f42e938b12336ff628eee9cd0e259e246e6ab9c1918bd06d9f3972becac83901', // CVPRO-NESV-RHLW
  '74f99af366a9dc9b09e89c130f4e578d8b5a6523b0e093b5f8988ba4f798ebb4', // CVPRO-SWCJ-FRT1
  'c1b700905e5b68edc9c1cdb808f534aa20ade6eeb43350bb3fae75f9a42d7d69', // CVPRO-VVW8-JBGL
  '084b8a0bd24922dd64e68b306d9bc984c953081f98db51cd6d0b35a490501a02', // CVPRO-IVFQ-I3ME
  '9611b54d2de8a87357cbed9065c55d2f02f3957322127d0a16f13b6ad99b32d3', // CVPRO-ZTK5-1C4U
  '219a052390c7d92e2c08fda7ec40638d8cc9e7aed4f981f6b2fd06b328c781d2', // CVPRO-CYIL-1SWP
  '784e839c62198fe3c309a572d7104aba153812e7d3e0e5ce259c43a2f7950223', // CVPRO-44KP-N84F
  'acfec772d28a6dfeaa1a586b16f2dee0b481f2bc3fbb6b06a2c5877aad1f14c0', // CVPRO-M2F4-C6V1
  '4ba201949b3ffc320212a2271eee7c29ce6e3b9dce4ad5200ca58d13560b19b3', // CVPRO-OYAD-KF7K
  'a99bd6e36d785e0cd67ac50d71fba4b7ae85c5aa0661b1a6e4916dc032d0aea7', // CVPRO-XTPJ-YTI1
  '99546e16400b819dc2cc9d0af05265bc301dd2288574f19489d9988d37882cf8', // CVPRO-VTQW-M1GD
  '749470202b08e2f0306ca6e54639e0ab1c3bd4b1e22ad2472cf3614e40845e8e' // CVPRO-RQPD-655X
];

/* Check if Pro is already activated */
function isProActive() {
  return localStorage.getItem('cvProActivated') === 'true';
}

/* Simple SHA-256 — works in ALL contexts (file://, http://, https://) */
/* Based on RFC 4634 — pure JS, no external deps */
function sha256(str) {
  function rr(n, d) { return (n >>> d) | (n << (32 - d)); }
  var K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var bytes = [];
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c < 0x80)       { bytes.push(c); }
    else if (c < 0x800) { bytes.push(0xc0|(c>>6), 0x80|(c&63)); }
    else                { bytes.push(0xe0|(c>>12), 0x80|((c>>6)&63), 0x80|(c&63)); }
  }
  var L = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  bytes.push(0,0,0,0,(L>>>24)&255,(L>>>16)&255,(L>>>8)&255,L&255);
  for (var chunk = 0; chunk < bytes.length; chunk += 64) {
    var w = [];
    for (var j = 0; j < 16; j++)
      w[j] = (bytes[chunk+j*4]<<24)|(bytes[chunk+j*4+1]<<16)|(bytes[chunk+j*4+2]<<8)|bytes[chunk+j*4+3];
    for (var j = 16; j < 64; j++) {
      var s0 = rr(w[j-15],7)^rr(w[j-15],18)^(w[j-15]>>>3);
      var s1 = rr(w[j-2],17)^rr(w[j-2],19)^(w[j-2]>>>10);
      w[j] = (w[j-16]+s0+w[j-7]+s1)|0;
    }
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for (var j = 0; j < 64; j++) {
      var S1 = rr(e,6)^rr(e,11)^rr(e,25);
      var ch = (e&f)^(~e&g);
      var t1 = (h+S1+ch+K[j]+w[j])|0;
      var S0 = rr(a,2)^rr(a,13)^rr(a,22);
      var maj = (a&b)^(a&c)^(b&c);
      var t2 = (S0+maj)|0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
    H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
  }
  var hex = '';
  for (var i = 0; i < 8; i++) {
    hex += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
  }
  return hex;
}

/* Activate Pro with a code — works in file://, http://, https:// */
function activateProCode() {
  var input = document.getElementById('proCodeInput');
  var btn   = document.getElementById('proCodeBtn');
  var msg   = document.getElementById('proCodeMsg');
  if (!input || !msg) return;

  var code = input.value.trim().toUpperCase();
  if (!code) {
    msg.textContent = 'Entrez votre code d\'accès.';
    msg.style.color = 'var(--warning)';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vérification...';
  msg.textContent = '';

  /* Small delay for UX feedback */
  setTimeout(function() {
    try {
      var hash = sha256(code);
      if (PRO_CODES.includes(hash)) {
        localStorage.setItem('cvProActivated', 'true');
        localStorage.setItem('cvProCode', code);
        msg.textContent = '✅ Code valide ! Accès Pro activé.';
        msg.style.color = 'var(--success)';
        btn.innerHTML = '<i class="fas fa-check"></i> Activé !';
        setTimeout(function() {
          document.getElementById('proModal').classList.add('hidden');
          unlockProUI();
          showToast('🎉 Version Pro activée ! Toutes les fonctionnalités sont débloquées.', 'success');
        }, 1200);
      } else {
        msg.textContent = '❌ Code invalide. Vérifiez et réessayez.';
        msg.style.color = 'var(--danger)';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-key"></i> Activer';
      }
    } catch(e) {
      msg.textContent = 'Erreur de vérification. Réessayez.';
      msg.style.color = 'var(--danger)';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-key"></i> Activer';
    }
  }, 400);
}

/* Unlock Pro UI elements */
function unlockProUI() {
  // Remove pro-locked class from all locked buttons
  document.querySelectorAll('.nav-item.pro-locked').forEach(function(btn) {
    btn.classList.remove('pro-locked');
    // Restore original onclick based on feature name text
    const text = btn.textContent.trim();
    if (text.includes('sentation')) {
      btn.setAttribute('onclick', "showPage('present',this)");
      btn.setAttribute('data-page', 'present');
    } else if (text.includes('Portfolio')) {
      btn.setAttribute('onclick', "showPage('portfolio',this)");
      btn.setAttribute('data-page', 'portfolio');
    } else if (text.includes('QR')) {
      btn.setAttribute('onclick', "showPage('qrcode',this)");
      btn.setAttribute('data-page', 'qrcode');
    }
  });

  // Hide Pro badges on unlocked items
  document.querySelectorAll('.nav-item .pro-badge').forEach(function(b) { b.style.display = 'none'; });

  // Hide Pro banner
  const banner = document.querySelector('.pro-banner');
  if (banner) {
    banner.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.08))';
    banner.style.borderColor = 'rgba(16,185,129,0.25)';
    banner.innerHTML = '<div style="font-size:13px;color:var(--text)"><strong style="color:var(--success)">✅ Version Pro activée</strong> — Toutes les fonctionnalités sont débloquées !</div>';
  }
}

/* Override requirePro to check activation first */
function requirePro(featureName) {
  if (isProActive()) {
    // Already pro — just navigate to the right page
    const pageMap = {
      'Mode Présentation': 'present',
      'Portfolio Web': 'portfolio',
      'QR Code': 'qrcode'
    };
    const pageId = pageMap[featureName];
    if (pageId) showPage(pageId, null);
    return;
  }

  const modal = document.getElementById('proModal');
  const desc  = document.getElementById('proModalDesc');
  if (!modal) return;
  if (desc) {
    desc.textContent = '"' + featureName + '" est disponible dans la version Pro. Entrez votre code ci-dessous ou contactez Thibaut pour l\'obtenir.';
  }
  modal.classList.remove('hidden');

  // Focus the code input
  setTimeout(function() {
    const inp = document.getElementById('proCodeInput');
    if (inp) inp.focus();
  }, 100);
}

/* Init Pro on load */
document.addEventListener('DOMContentLoaded', function() {
  if (isProActive()) {
    setTimeout(unlockProUI, 200);
  }
});

/* ==========================================================
   TEMPLATES 5-10 — Build functions
   ========================================================== */

/* Helper: build common blocks */
function buildExpItems(exps, cls) {
  return (exps||[]).map(function(e) {
    return '<div class="cv-experience-item">' +
      (cls === 'cv-template-6' ?
        '<div class="cv-timeline-dot"></div>' +
        '<div class="cv-exp-body"><p class="cv-exp-title">'+esc(e.role)+'</p>' +
        '<p class="cv-exp-company">'+esc(e.company)+'</p>' +
        '<p class="cv-exp-date">'+esc(e.date)+'</p>' +
        '<p class="cv-exp-desc">'+esc(e.desc)+'</p></div>'
      : cls === 'cv-template-5' ?
        '<div class="cv-exp-date">'+esc(e.date)+'</div>' +
        '<div class="cv-exp-body"><p class="cv-exp-title">'+esc(e.role)+'</p>' +
        '<p class="cv-exp-company">'+esc(e.company)+'</p>' +
        '<p class="cv-exp-desc">'+esc(e.desc)+'</p></div>'
      :
        '<div class="cv-exp-header"><p class="cv-exp-title">'+esc(e.role)+'</p>' +
        '<span class="cv-exp-date">'+esc(e.date)+'</span></div>' +
        '<p class="cv-exp-company">'+esc(e.company)+'</p>' +
        '<p class="cv-exp-desc">'+esc(e.desc)+'</p>'
      ) +
    '</div>';
  }).join('');
}

function buildSkills(skills, cls) {
  return (skills||[]).map(function(sk) {
    return '<div class="cv-skill-item"><div class="cv-skill-name"><span>'+esc(sk.name)+'</span><span>'+sk.pct+'%</span></div>' +
           '<div class="cv-skill-bar"><div class="cv-skill-fill" style="width:'+sk.pct+'%"></div></div></div>';
  }).join('');
}

function buildTools(tools, cls) {
  return (tools||[]).map(function(t) { return '<span class="cv-tool-tag">'+esc(t)+'</span>'; }).join('');
}

function buildLangs(langs, cls) {
  return (langs||[]).map(function(l) {
    return '<div class="cv-lang-item"><span>'+esc(l.name)+'</span><span class="cv-lang-level">'+esc(l.level)+'</span></div>';
  }).join('');
}

function buildInterests(interests, cls) {
  return (interests||[]).map(function(it) { return '<span class="cv-interest-tag">'+esc(it)+'</span>'; }).join('');
}

function buildEduItems(edu, certs, cls) {
  const e = (edu||[]).map(function(e) {
    return '<div class="cv-edu-item">' +
      (cls==='cv-template-8' ?
        '<div class="cv-edu-dot"></div><div class="cv-edu-info"><p class="cv-edu-school">'+esc(e.school)+'</p><p class="cv-edu-degree">'+esc(e.degree)+'</p><p class="cv-edu-date">'+esc(e.date)+'</p></div>'
      :
        '<p class="cv-edu-school">'+esc(e.school)+'</p><p class="cv-edu-degree">'+esc(e.degree)+'</p><p class="cv-edu-date">'+esc(e.date)+'</p>'
      ) + '</div>';
  }).join('');
  const c = (certs||[]).map(function(c) {
    return '<div class="cv-edu-item">' +
      (cls==='cv-template-8' ?
        '<div class="cv-edu-dot"></div><div class="cv-edu-info"><p class="cv-edu-school">'+esc(c.year)+(c.org?' — '+esc(c.org):'')+'</p><p class="cv-edu-degree">'+esc(c.title)+'</p></div>'
      :
        '<p class="cv-edu-school">'+esc(c.year)+(c.org?' — '+esc(c.org):'')+'</p><p class="cv-edu-degree">'+esc(c.title)+'</p>'
      ) + '</div>';
  }).join('');
  return e + c;
}

function buildRefs(refs, cls) {
  return (refs||[]).map(function(r) {
    return '<div class="cv-ref-item"><p class="cv-ref-name">'+esc(r.name)+'</p><p class="cv-ref-detail">'+esc(r.role)+'</p><p class="cv-ref-detail">'+esc(r.contact)+'</p></div>';
  }).join('');
}

/* TEMPLATE 5 — EXECUTIVE */
function buildTemplate5(d, accent, fs) {
  var cls = 'cv-template-5';
  var skills = buildSkills(d.skills, cls);
  var tools  = buildTools(d.tools, cls);
  var langs  = buildLangs(d.languages, cls);
  var ints   = buildInterests(d.interests, cls);
  var exps   = buildExpItems(d.experiences, cls);
  var edu    = buildEduItems(d.education, d.certifications, cls);
  var refs   = buildRefs(d.references, cls);

  return '<div class="cv-template-5" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-sidebar">' +
      '<div class="cv-photo-wrapper">'+photoTag(d,'cv-photo')+'</div>' +
      '<div class="cv-sidebar-section"><h3>Contact</h3>'+contactItems(d,'cv-contact-item')+'</div>' +
      (skills?'<div class="cv-sidebar-section"><h3>Compétences</h3>'+skills+'</div>':'') +
      (tools?'<div class="cv-sidebar-section"><h3>Outils</h3>'+tools+'</div>':'') +
      (langs?'<div class="cv-sidebar-section"><h3>Langues</h3>'+langs+'</div>':'') +
      (ints?'<div class="cv-sidebar-section"><h3>Intérêts</h3>'+ints+'</div>':'') +
    '</div>' +
    '<div class="cv-main">' +
      '<div class="cv-header"><h1 class="cv-name">'+(esc(d.name)||'Votre Nom')+'</h1><p class="cv-title">'+(esc(d.title)||'Titre')+'</p></div>' +
      (d.profile?'<div><h2 class="cv-section-title">Profil</h2><p class="cv-profile-text">'+esc(d.profile)+'</p></div>':'') +
      (exps?'<div><h2 class="cv-section-title">Expériences</h2>'+exps+'</div>':'') +
      (edu?'<div><h2 class="cv-section-title">Formation</h2>'+edu+'</div>':'') +
      (refs?'<div><h2 class="cv-section-title">Références</h2>'+refs+'</div>':'') +
    '</div></div>';
}

/* TEMPLATE 6 — TIMELINE */
function buildTemplate6(d, accent, fs) {
  var cls = 'cv-template-6';
  var skills = buildSkills(d.skills, cls);
  var tools  = buildTools(d.tools, cls);
  var langs  = buildLangs(d.languages, cls);
  var ints   = buildInterests(d.interests, cls);
  var exps   = buildExpItems(d.experiences, cls);
  var edu    = buildEduItems(d.education, d.certifications, cls);
  var refs   = buildRefs(d.references, cls);

  return '<div class="cv-template-6" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-header">'+photoTag(d,'cv-photo') +
      '<div class="cv-header-info">' +
        '<h1 class="cv-name">'+(esc(d.name)||'Votre Nom')+'</h1>' +
        '<p class="cv-title">'+(esc(d.title)||'Titre')+'</p>' +
        contactRow(d,'cv-contact-item') +
      '</div>' +
    '</div>' +
    '<div class="cv-body">' +
      '<div class="cv-left">' +
        (d.profile?'<div class="cv-section"><h3 class="cv-section-title">Profil</h3><p class="cv-profile-text">'+esc(d.profile)+'</p></div>':'') +
        (exps?'<div class="cv-section"><h3 class="cv-section-title">Expériences</h3>'+exps+'</div>':'') +
        (edu?'<div class="cv-section"><h3 class="cv-section-title">Formation</h3>'+edu+'</div>':'') +
        (refs?'<div class="cv-section"><h3 class="cv-section-title">Références</h3>'+refs+'</div>':'') +
      '</div>' +
      '<div class="cv-right">' +
        (skills?'<div class="cv-section"><h3 class="cv-section-title">Compétences</h3>'+skills+'</div>':'') +
        (tools?'<div class="cv-section"><h3 class="cv-section-title">Outils</h3>'+tools+'</div>':'') +
        (langs?'<div class="cv-section"><h3 class="cv-section-title">Langues</h3>'+langs+'</div>':'') +
        (ints?'<div class="cv-section"><h3 class="cv-section-title">Intérêts</h3>'+ints+'</div>':'') +
      '</div>' +
    '</div></div>';
}

/* TEMPLATE 7 — ELEGANT */
function buildTemplate7(d, accent, fs) {
  var cls = 'cv-template-7';
  var skills = buildSkills(d.skills, cls);
  var tools  = buildTools(d.tools, cls);
  var langs  = buildLangs(d.languages, cls);
  var ints   = buildInterests(d.interests, cls);
  var exps   = buildExpItems(d.experiences, cls);
  var edu    = buildEduItems(d.education, d.certifications, cls);
  var refs   = buildRefs(d.references, cls);

  var mkRight = function(title, content) {
    return content ? '<div class="cv-right-section"><h4 class="cv-right-title">'+title+'</h4>'+content+'</div>' : '';
  };

  return '<div class="cv-template-7" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-header">' +
      photoTag(d,'cv-photo') +
      '<h1 class="cv-name">'+(esc(d.name)||'Votre Nom')+'</h1>' +
      '<p class="cv-title">'+(esc(d.title)||'Titre')+'</p>' +
      contactRow(d,'cv-contact-item') +
    '</div>' +
    '<div class="cv-body">' +
      '<div class="cv-left">' +
        (d.profile?'<div class="cv-section"><h3 class="cv-section-title">Profil</h3><p class="cv-profile-text">'+esc(d.profile)+'</p></div>':'') +
        (exps?'<div class="cv-section"><h3 class="cv-section-title">Expériences</h3>'+exps+'</div>':'') +
        (edu?'<div class="cv-section"><h3 class="cv-section-title">Formation</h3>'+edu+'</div>':'') +
      '</div>' +
      '<div class="cv-right">' +
        mkRight('Compétences', skills) +
        mkRight('Outils', tools) +
        mkRight('Langues', langs) +
        mkRight('Intérêts', ints) +
        mkRight('Références', refs) +
      '</div>' +
    '</div></div>';
}

/* TEMPLATE 8 — COLORBLOCK */
function buildTemplate8(d, accent, fs) {
  var cls = 'cv-template-8';
  var skills = buildSkills(d.skills, cls);
  var tools  = buildTools(d.tools, cls);
  var langs  = buildLangs(d.languages, cls);
  var ints   = buildInterests(d.interests, cls);
  var exps   = buildExpItems(d.experiences, cls);
  var edu    = buildEduItems(d.education, d.certifications, cls);
  var refs   = buildRefs(d.references, cls);

  return '<div class="cv-template-8" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-header">' +
      '<div class="cv-header-left">'+photoTag(d,'cv-photo')+'</div>' +
      '<div class="cv-header-right">' +
        '<h1 class="cv-name">'+(esc(d.name)||'Votre Nom')+'</h1>' +
        '<p class="cv-title">'+(esc(d.title)||'Titre')+'</p>' +
        contactRow(d,'cv-contact-item') +
      '</div>' +
    '</div>' +
    '<div class="cv-body">' +
      '<div class="cv-left">' +
        (d.profile?'<div class="cv-section"><h3 class="cv-section-title">Profil</h3><p class="cv-profile-text">'+esc(d.profile)+'</p></div>':'') +
        (skills?'<div class="cv-section"><h3 class="cv-section-title">Compétences</h3>'+skills+'</div>':'') +
        (tools?'<div class="cv-section"><h3 class="cv-section-title">Outils</h3>'+tools+'</div>':'') +
        (langs?'<div class="cv-section"><h3 class="cv-section-title">Langues</h3>'+langs+'</div>':'') +
        (ints?'<div class="cv-section"><h3 class="cv-section-title">Intérêts</h3>'+ints+'</div>':'') +
      '</div>' +
      '<div class="cv-right-col">' +
        (exps?'<div class="cv-section"><h3 class="cv-section-title">Expériences</h3>'+exps+'</div>':'') +
        (edu?'<div class="cv-section"><h3 class="cv-section-title">Formation</h3>'+edu+'</div>':'') +
        (refs?'<div class="cv-section"><h3 class="cv-section-title">Références</h3>'+refs+'</div>':'') +
      '</div>' +
    '</div></div>';
}

/* TEMPLATE 9 — COMPACT */
function buildTemplate9(d, accent, fs) {
  var cls = 'cv-template-9';
  var skills = buildSkills(d.skills, cls);
  var tools  = buildTools(d.tools, cls);
  var langs  = buildLangs(d.languages, cls);
  var ints   = buildInterests(d.interests, cls);
  var exps   = buildExpItems(d.experiences, cls);
  var edu    = buildEduItems(d.education, d.certifications, cls);
  var refs   = buildRefs(d.references, cls);

  return '<div class="cv-template-9" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-header">' + photoTag(d,'cv-photo') +
      '<div class="cv-header-info">' +
        '<h1 class="cv-name">'+(esc(d.name)||'Votre Nom')+'</h1>' +
        '<p class="cv-title">'+(esc(d.title)||'Titre')+'</p>' +
        contactRow(d,'cv-contact-item') +
      '</div>' +
    '</div>' +
    '<div class="cv-body">' +
      '<div class="cv-col">' +
        (d.profile?'<div class="cv-section"><h3 class="cv-section-title">Profil</h3><p class="cv-profile-text">'+esc(d.profile)+'</p></div>':'') +
        (exps?'<div class="cv-section"><h3 class="cv-section-title">Expériences</h3>'+exps+'</div>':'') +
      '</div>' +
      '<div class="cv-col">' +
        (edu?'<div class="cv-section"><h3 class="cv-section-title">Formation</h3>'+edu+'</div>':'') +
        (skills?'<div class="cv-section"><h3 class="cv-section-title">Compétences</h3>'+skills+'</div>':'') +
      '</div>' +
      '<div class="cv-col">' +
        (tools?'<div class="cv-section"><h3 class="cv-section-title">Outils</h3>'+tools+'</div>':'') +
        (langs?'<div class="cv-section"><h3 class="cv-section-title">Langues</h3>'+langs+'</div>':'') +
        (ints?'<div class="cv-section"><h3 class="cv-section-title">Intérêts</h3>'+ints+'</div>':'') +
        (refs?'<div class="cv-section"><h3 class="cv-section-title">Références</h3>'+refs+'</div>':'') +
      '</div>' +
    '</div></div>';
}

/* TEMPLATE 10 — GRADIENT PRO */
function buildTemplate10(d, accent, fs) {
  var cls = 'cv-template-10';
  var skills = buildSkills(d.skills, cls);
  var tools  = buildTools(d.tools, cls);
  var langs  = buildLangs(d.languages, cls);
  var ints   = buildInterests(d.interests, cls);
  var exps   = buildExpItems(d.experiences, cls);
  var edu    = buildEduItems(d.education, d.certifications, cls);
  var refs   = buildRefs(d.references, cls);

  return '<div class="cv-template-10" style="--cv-accent:'+accent+';'+fs+'">' +
    '<div class="cv-header">'+photoTag(d,'cv-photo') +
      '<div class="cv-header-info">' +
        '<h1 class="cv-name">'+(esc(d.name)||'Votre Nom')+'</h1>' +
        '<p class="cv-title">'+(esc(d.title)||'Titre')+'</p>' +
        contactRow(d,'cv-contact-item') +
      '</div>' +
    '</div>' +
    '<div class="cv-body">' +
      '<div class="cv-left">' +
        (d.profile?'<div class="cv-section"><h3 class="cv-section-title">Profil</h3><p class="cv-profile-text">'+esc(d.profile)+'</p></div>':'') +
        (exps?'<div class="cv-section"><h3 class="cv-section-title">Expériences</h3>'+exps+'</div>':'') +
        (edu?'<div class="cv-section"><h3 class="cv-section-title">Formation</h3>'+edu+'</div>':'') +
        (refs?'<div class="cv-section"><h3 class="cv-section-title">Références</h3>'+refs+'</div>':'') +
      '</div>' +
      '<div class="cv-right">' +
        (skills?'<div class="cv-section"><h3 class="cv-section-title">Compétences</h3>'+skills+'</div>':'') +
        (tools?'<div class="cv-section"><h3 class="cv-section-title">Outils</h3>'+tools+'</div>':'') +
        (langs?'<div class="cv-section"><h3 class="cv-section-title">Langues</h3>'+langs+'</div>':'') +
        (ints?'<div class="cv-section"><h3 class="cv-section-title">Intérêts</h3>'+ints+'</div>':'') +
      '</div>' +
    '</div></div>';
}

/* ==========================================================
   DRAG & DROP — Réordonner les expériences
   ========================================================== */
let dragSrcIndex = null;
let dragSrcList  = null;

function initDragDrop(listId, dataArray, renderFn) {
  const container = document.getElementById(listId);
  if (!container) return;

  container.querySelectorAll('.dynamic-item').forEach(function(item, i) {
    const handle = item.querySelector('.drag-handle');
    if (!handle) return;

    handle.setAttribute('draggable', true);
    item.setAttribute('draggable', true);

    item.addEventListener('dragstart', function(e) {
      dragSrcIndex = i;
      dragSrcList  = { id: listId, arr: dataArray, render: renderFn };
      e.dataTransfer.effectAllowed = 'move';
      item.style.opacity = '0.5';
    });

    item.addEventListener('dragend', function() {
      item.style.opacity = '1';
      container.querySelectorAll('.dynamic-item').forEach(function(el) {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
        el.style.borderTop = '';
        el.style.borderBottom = '';
      });
    });

    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      item.style.borderTop = i < dragSrcIndex ? '2px solid var(--primary)' : '';
      item.style.borderBottom = i > dragSrcIndex ? '2px solid var(--primary)' : '';
    });

    item.addEventListener('dragleave', function() {
      item.style.borderTop = '';
      item.style.borderBottom = '';
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      if (dragSrcIndex === null || dragSrcIndex === i) return;
      item.style.borderTop = '';
      item.style.borderBottom = '';

      const arr = dragSrcList.arr;
      const moved = arr.splice(dragSrcIndex, 1)[0];
      arr.splice(i, 0, moved);
      dragSrcList.render();
      autosave();
      dragSrcIndex = null;
      showToast('Ordre mis à jour', 'info');
    });
  });
}

/* Hook drag-drop into render functions */
var _origRenderExpList = renderExperienceList;
renderExperienceList = function() {
  _origRenderExpList();
  setTimeout(function() {
    initDragDrop('experienceList', cvData.experiences, renderExperienceList);
  }, 50);
};

var _origRenderEduList = renderEducationList;
renderEducationList = function() {
  _origRenderEduList();
  setTimeout(function() {
    initDragDrop('educationList', cvData.education, renderEducationList);
  }, 50);
};

/* ==========================================================
   MULTI-PROFILS — Gérer plusieurs CV
   ========================================================== */
function getProfiles() {
  try { return JSON.parse(localStorage.getItem('cvProfiles') || '[]'); } catch(e) { return []; }
}

function saveProfiles(profiles) {
  localStorage.setItem('cvProfiles', JSON.stringify(profiles));
}

function saveCurrentProfile(name) {
  if (!name || !name.trim()) { showToast('Entrez un nom pour ce profil', 'error'); return; }
  const profiles = getProfiles();
  const profile = {
    id: Date.now(),
    name: name.trim(),
    title: cvData.title || '',
    date: new Date().toLocaleDateString('fr-FR'),
    data: JSON.parse(JSON.stringify(cvData))
  };
  // Check if name already exists
  const existIdx = profiles.findIndex(function(p) { return p.name === profile.name; });
  if (existIdx >= 0) {
    profiles[existIdx] = profile; // update
    showToast('Profil "' + profile.name + '" mis à jour', 'success');
  } else {
    profiles.unshift(profile);
    if (profiles.length > 10) profiles.pop(); // max 10 profiles
    showToast('Profil "' + profile.name + '" sauvegardé', 'success');
  }
  saveProfiles(profiles);
  renderProfilesList();
}

function loadProfile(id) {
  const profiles = getProfiles();
  const profile = profiles.find(function(p) { return p.id === id; });
  if (!profile) return;
  cvData = Object.assign({}, DEFAULT_DATA, profile.data);
  saveData();
  renderAllForms();
  renderTemplatePickers();
  renderColorPickers();
  updatePreview();
  updateStats();
  updateCompletion();
  showToast('Profil "' + profile.name + '" chargé !', 'success');
  showPage('builder', document.querySelector('[data-page="builder"]'));
}

function deleteProfile(id) {
  let profiles = getProfiles();
  const profile = profiles.find(function(p) { return p.id === id; });
  profiles = profiles.filter(function(p) { return p.id !== id; });
  saveProfiles(profiles);
  renderProfilesList();
  showToast((profile ? '"' + profile.name + '"' : 'Profil') + ' supprimé', 'info');
}

function renderProfilesList() {
  const container = document.getElementById('profilesList');
  if (!container) return;
  const profiles = getProfiles();
  if (!profiles.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">' +
      '<i class="fas fa-layer-group" style="font-size:40px;display:block;margin-bottom:12px;opacity:.4"></i>' +
      '<p>Aucun profil sauvegardé.<br>Créez votre premier profil ci-dessous.</p></div>';
    return;
  }
  container.innerHTML = profiles.map(function(p) {
    return '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:10px;background:var(--bg-card);transition:all .2s" ' +
      'onmouseover="this.style.boxShadow=\'var(--shadow-md)\'" onmouseout="this.style.boxShadow=\'none\'">' +
      '<div style="width:44px;height:44px;border-radius:10px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">👤</div>' +
      '<div style="flex:1">' +
        '<div style="font-weight:700;font-size:13px;color:var(--text)">' + p.name + '</div>' +
        '<div style="font-size:11px;color:var(--text-secondary)">' + p.title + '</div>' +
        '<div style="font-size:10px;color:var(--text-muted)"><i class="fas fa-clock"></i> ' + p.date + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="btn btn-sm btn-primary" onclick="loadProfile(' + p.id + ')"><i class="fas fa-folder-open"></i> Charger</button>' +
        '<button class="btn btn-sm btn-ghost" onclick="deleteProfile(' + p.id + ')" style="color:var(--danger)"><i class="fas fa-trash"></i></button>' +
      '</div></div>';
  }).join('');
}

function promptSaveProfile() {
  const name = window.prompt('Nom du profil :', cvData.name || 'Mon CV');
  if (name !== null) saveCurrentProfile(name);
}

/* ==========================================================
   SIMULATION D'ENTRETIEN
   ========================================================== */

/* -- État de la simulation -- */
var ivSession = {
  questions: [], answers: [], scores: [], feedbacks: [],
  current: 0, active: false, type: 'general', lang: 'fr',
  poste: '', entreprise: ''
};

/* -- Banque de questions -- */
var IV_QUESTIONS = {
  fr: {
    general: [
      { q: "Parlez-moi de vous.", cat: "Présentation", hint: "Résumez votre parcours en 2 minutes max : formation, expériences clés, compétences.", ideal: "Je suis [Nom], [titre]. J'ai [N] ans d'expérience dans [domaine]. J'ai notamment travaillé sur [projet clé] ce qui m'a permis de [résultat concret]. Aujourd'hui je cherche à [objectif]." },
      { q: "Pourquoi voulez-vous travailler dans notre entreprise ?", cat: "Motivation", hint: "Montrez que vous connaissez l'entreprise et que vous avez une vraie raison.", ideal: "J'ai suivi votre actualité et je suis particulièrement intéressé par [projet/valeur]. Mes compétences en [domaine] correspondraient bien à vos besoins sur [poste]." },
      { q: "Quelles sont vos principales qualités ?", cat: "Soft skills", hint: "Citez 3 qualités concrètes, illustrées par des exemples réels.", ideal: "Ma première qualité est [qualité 1] : par exemple lors de [situation]. Je suis aussi [qualité 2] ce qui m'a permis de [résultat]. Enfin [qualité 3] me caractérise car [preuve]." },
      { q: "Quel est votre principal défaut ?", cat: "Introspection", hint: "Choisissez un défaut réel mais que vous êtes en train de corriger. Évitez les clichés.", ideal: "J'ai tendance à être trop perfectionniste, ce qui peut allonger certaines tâches. J'ai appris à mieux fixer des limites de temps et à prioriser l'essentiel." },
      { q: "Où vous voyez-vous dans 5 ans ?", cat: "Ambition", hint: "Montrez une vision claire mais réaliste, en lien avec le poste et l'entreprise.", ideal: "Dans 5 ans, je me vois [objectif concret] avec des responsabilités accrues en [domaine], idéalement au sein d'une structure comme la vôtre où je peux continuer à progresser." },
      { q: "Décrivez votre plus grande réussite professionnelle.", cat: "Expérience", hint: "Utilisez la méthode STAR : Situation, Tâche, Action, Résultat.", ideal: "Dans mon poste chez [entreprise], j'ai [action concrète] ce qui a permis de [résultat mesurable]. C'est ma plus grande fierté car [impact]." },
      { q: "Comment gérez-vous le stress et la pression ?", cat: "Soft skills", hint: "Donnez des exemples concrets de situations stressantes et comment vous les avez gérées.", ideal: "Je gère le stress en priorisant mes tâches et en découpant les problèmes complexes en étapes. Par exemple lors de [situation], j'ai [action] ce qui a permis de [résultat]." },
      { q: "Pourquoi avez-vous quitté votre précédent emploi ?", cat: "Parcours", hint: "Restez positif, ne critiquez jamais votre ancien employeur.", ideal: "J'ai quitté ce poste car je souhaitais évoluer vers [nouveau domaine/responsabilité]. C'était une excellente expérience mais je sentais que j'avais fait le tour de mes missions." },
      { q: "Quelles sont vos prétentions salariales ?", cat: "Négociation", hint: "Faites des recherches sur le marché, donnez une fourchette réaliste.", ideal: "Compte tenu de mon expérience de [N] ans et du marché local, je vise une rémunération entre [X] et [Y] FCFA. Je reste ouvert à la discussion selon les avantages proposés." },
      { q: "Avez-vous des questions pour nous ?", cat: "Initiative", hint: "Toujours préparer 2-3 questions sur les missions, l'équipe ou la culture d'entreprise.", ideal: "Oui, j'aimerais savoir comment est structurée l'équipe avec laquelle je travaillerais, et quels sont les défis principaux du poste pour les 6 premiers mois." }
    ],
    motivation: [
      { q: "Qu'est-ce qui vous motive dans ce métier ?", cat: "Motivation", hint: "Parlez de passion, d'impact, de création de valeur — soyez sincère.", ideal: "Ce qui me motive avant tout, c'est [raison profonde] et le fait de voir [impact concret] au quotidien." },
      { q: "Pourquoi ce poste et pas un autre ?", cat: "Motivation", hint: "Montrez que c'est un choix réfléchi, pas un hasard.", ideal: "Ce poste correspond exactement à [compétences] que j'ai développées et au type de mission que je recherche activement : [précision]." },
      { q: "Qu'est-ce qui vous donne envie de vous lever chaque matin pour travailler ?", cat: "Motivation", hint: "Réponse personnelle et authentique sur ce qui vous anime professionnellement.", ideal: "Ce qui me donne envie c'est [mission ou challenge quotidien]. Je suis passionné par [domaine] et chaque journée apporte [bénéfice]." },
      { q: "Comment définiriez-vous le succès dans ce poste ?", cat: "Vision", hint: "Parlez de résultats mesurables, d'impact sur l'équipe et sur les clients.", ideal: "Le succès pour moi ce serait d'atteindre [objectif mesurable], de contribuer à [objectif équipe] et d'être reconnu pour [qualité spécifique]." },
      { q: "Quelle est la valeur ajoutée que vous apporteriez à notre équipe ?", cat: "Valeur", hint: "Listez 2-3 compétences différenciantes avec des preuves concrètes.", ideal: "J'apporterais [compétence 1] prouvée par [exemple], [compétence 2] illustrée par [résultat], et une capacité à [compétence 3] que peu de candidats ont." }
    ],
    technique: [
      { q: "Décrivez un projet technique complexe que vous avez réalisé.", cat: "Technique", hint: "Détaillez les outils, les défis techniques et la solution trouvée.", ideal: "J'ai travaillé sur [projet] qui consistait à [objectif]. J'ai utilisé [outils/technologies], résolu le défi de [problème] en [solution], avec un résultat de [mesure]." },
      { q: "Comment vous tenez-vous à jour dans votre domaine ?", cat: "Veille", hint: "Mentionnez des sources concrètes : newsletters, formations, communautés.", ideal: "Je suis régulièrement [sources spécifiques], je participe à [communautés/événements] et j'ai récemment suivi une formation sur [sujet]." },
      { q: "Quelle est votre maîtrise de [outil principal du poste] ?", cat: "Compétence", hint: "Soyez honnête sur votre niveau, et montrez votre capacité d'apprentissage.", ideal: "Je maîtrise [outil] à [niveau] et je l'utilise pour [usage]. J'ai notamment réalisé [exemple concret] qui montre ma maîtrise pratique." },
      { q: "Comment organisez-vous votre travail au quotidien ?", cat: "Organisation", hint: "Parlez de méthodes (to-do list, sprints, Kanban) et d'outils utilisés.", ideal: "Je commence par prioriser mes tâches selon urgence/importance, j'utilise [outil/méthode] et je fais des points réguliers pour ajuster mon plan." },
      { q: "Comment gérez-vous les délais serrés sur un projet ?", cat: "Gestion", hint: "Montrez votre capacité à prioriser, communiquer et livrer sous pression.", ideal: "Face à un délai serré, je décompose le projet en tâches essentielles, communique immédiatement avec le client si nécessaire, et me concentre sur le livrable minimum viable avant d'enrichir." }
    ],
    situation: [
      { q: "Décrivez une situation où vous avez dû gérer un conflit avec un collègue.", cat: "Conflit", hint: "Méthode STAR — montrez l'écoute, la communication et la résolution positive.", ideal: "Dans ce contexte, j'ai d'abord écouté le point de vue de mon collègue sans interrompre, puis expliqué le mien calmement. Nous avons trouvé un compromis qui a amélioré notre collaboration." },
      { q: "Parlez d'une fois où vous avez échoué et ce que vous en avez appris.", cat: "Résilience", hint: "Montrez l'échec honnêtement, puis insistez sur l'apprentissage et la correction.", ideal: "Sur le projet [X], j'ai sous-estimé le temps nécessaire pour [tâche]. J'ai manqué la deadline. Depuis, j'ajoute toujours une marge de 20% à mes estimations et je communique en avance si un risque apparaît." },
      { q: "Comment avez-vous géré un client ou un manager difficile ?", cat: "Relations", hint: "Empathie, clarté des attentes, documentation écrite.", ideal: "J'ai demandé un entretien pour clarifier ses attentes avec des exemples concrets. J'ai reformulé ce que j'avais compris et proposé un plan d'action. La relation s'est nettement améliorée ensuite." },
      { q: "Racontez une situation où vous avez dû prendre une décision difficile.", cat: "Leadership", hint: "Montrez votre analyse, votre courage décisionnel et l'impact de votre choix.", ideal: "J'avais le choix entre [option A] et [option B]. J'ai analysé les risques et bénéfices de chaque option, consulté les parties prenantes, puis décidé de [choix] ce qui a permis [résultat positif]." },
      { q: "Décrivez un moment où vous avez dû apprendre quelque chose très vite.", cat: "Apprentissage", hint: "Montrez votre méthode d'apprentissage rapide et votre adaptabilité.", ideal: "On m'a demandé de maîtriser [compétence] en [délai]. J'ai suivi [méthode d'apprentissage], pratiqué sur [exercice concret] et pu livrer [résultat] dans les temps impartis." }
    ],
    stress: [
      { q: "Vendez-moi ce stylo.", cat: "Stress test", hint: "Identifiez un besoin, valorisez les caractéristiques comme bénéfices, concluez sur la valeur.", ideal: "Avant de vous proposer quoi que ce soit, permettez-moi de comprendre vos besoins : qu'est-ce qui est important pour vous dans un stylo ? [Écoute] Dans ce cas, ce stylo est parfait car..." },
      { q: "Êtes-vous vraiment la meilleure personne pour ce poste ?", cat: "Confiance", hint: "Répondez avec assurance sans arrogance, appuyez-vous sur des faits.", ideal: "Je crois sincèrement être un excellent candidat pour ce poste car [3 raisons concrètes]. Je reconnais qu'il peut y avoir d'autres bons profils, mais je suis convaincu que [valeur différenciante] fait la différence." },
      { q: "Que pensez-vous de votre ancien manager ?", cat: "Stress test", hint: "Restez professionnel et positif même si la relation était difficile.", ideal: "Mon ancien manager avait de grandes qualités en [domaine]. Comme dans toute relation professionnelle, nous avions parfois des approches différentes, mais j'en ai toujours tiré des apprentissages utiles." },
      { q: "Qu'est-ce que vous n'avez pas aimé dans votre dernier poste ?", cat: "Honnêteté", hint: "Soyez honnête mais constructif, évitez toute négativité excessive.", ideal: "Il y avait peu d'opportunités d'évolution vers [domaine qui m'intéresse]. C'est d'ailleurs ce qui m'a poussé à chercher un poste comme celui-ci qui offre davantage de [bénéfice]." },
      { q: "Pourquoi devrais-je vous choisir vous plutôt qu'un autre candidat ?", cat: "Différenciation", hint: "3 arguments béton, concis, différenciants. Soyez direct et confiant.", ideal: "Trois raisons : premièrement [argument 1 + preuve], deuxièmement [argument 2 + résultat], troisièmement [argument 3 unique]. Ensemble, ces éléments font de moi un candidat qui peut [valeur immédiate pour l'entreprise]." }
    ],
    rh: [
      { q: "Quelle est votre disponibilité ?", cat: "Logistique", hint: "Soyez précis sur votre préavis et votre date de début possible.", ideal: "Je suis disponible à partir du [date]. J'ai un préavis de [durée] dans mon poste actuel que je respecterai bien sûr." },
      { q: "Êtes-vous prêt à travailler en dehors des heures normales si nécessaire ?", cat: "Flexibilité", hint: "Montrez votre engagement sans vous engager à l'illimité.", ideal: "Je suis capable de m'investir davantage lors de périodes importantes ou de projets urgents. J'apprécie cependant qu'un équilibre sain soit maintenu sur le long terme pour une performance durable." },
      { q: "Que recherchez-vous dans votre prochain employeur ?", cat: "Attentes", hint: "Parlez de valeurs, d'environnement de travail et d'opportunités d'évolution.", ideal: "Je cherche un environnement où [valeur 1], des opportunités de monter en compétences sur [domaine], et un management basé sur [style de management souhaité]." },
      { q: "Comment décrivent-on votre travail vos anciens collègues ?", cat: "Réputation", hint: "Citez des qualités précises, idéalement des choses que vous ont dites réellement.", ideal: "Mes collègues me décrivent généralement comme [qualité 1] et [qualité 2]. L'un d'eux m'a dit [citation réelle ou plausible] ce qui m'a vraiment marqué." },
      { q: "Avez-vous d'autres entretiens en cours ?", cat: "Position", hint: "Soyez honnête, ça démontre votre attractivité sans être arrogant.", ideal: "Oui, j'ai quelques processus en cours mais votre entreprise est ma priorité car [raison sincère]. Je serais en mesure de vous donner une réponse sous [délai]." }
    ]
  },
  en: {
    general: [
      { q: "Tell me about yourself.", cat: "Introduction", hint: "Summarize your background in 2 minutes: education, key experience, skills.", ideal: "I'm [Name], a [title] with [N] years of experience in [field]. I've worked on [key project] which allowed me to [concrete result]. I'm now looking to [goal]." },
      { q: "Why do you want to work at our company?", cat: "Motivation", hint: "Show you know the company and have a genuine reason for applying.", ideal: "I've followed your work and I'm particularly interested in [project/value]. My skills in [field] would align well with your needs for this role." },
      { q: "What are your greatest strengths?", cat: "Soft skills", hint: "List 3 concrete strengths with real examples.", ideal: "My first strength is [strength 1], for example in [situation]. I'm also [strength 2] which helped me [result]. Finally [strength 3] characterizes me because [proof]." },
      { q: "What is your greatest weakness?", cat: "Self-awareness", hint: "Choose a real weakness you're actively working to improve.", ideal: "I tend to be overly detail-oriented, which can slow me down on some tasks. I've learned to set time limits and focus on what's most important." },
      { q: "Where do you see yourself in 5 years?", cat: "Ambition", hint: "Show a clear but realistic vision linked to the role and company.", ideal: "In 5 years, I see myself in [concrete goal] with more responsibility in [field], ideally in a company like yours where I can continue to grow." }
    ]
  }
};

/* -- Initialisation de la page entretien -- */
function initInterviewPage() {
  var name = cvData.name || '—';
  var title = cvData.title || '—';
  setEl('ivPreviewName', name);
  setEl('ivPreviewTitle', title);

  var posteEl = document.getElementById('iv-poste');
  if (posteEl && !posteEl.value) posteEl.value = cvData.title || '';

  renderSampleQuestions();
}

function renderSampleQuestions() {
  var lang = (document.getElementById('iv-lang') || {}).value || 'fr';
  var type = (document.getElementById('iv-type') || {}).value || 'general';
  var bank = (IV_QUESTIONS[lang] || IV_QUESTIONS.fr)[type] || IV_QUESTIONS.fr.general;
  var samples = bank.slice(0, 3);
  var el = document.getElementById('ivSampleQuestions');
  if (!el) return;
  el.innerHTML = samples.map(function(q) {
    return '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:var(--bg-input);border-radius:8px">' +
      '<i class="fas fa-question-circle" style="color:var(--primary);margin-top:2px;flex-shrink:0;font-size:13px"></i>' +
      '<span style="font-size:12px;color:var(--text)">' + q.q + '</span></div>';
  }).join('');
}

/* -- Démarrer la simulation -- */
function startInterview() {
  var lang = document.getElementById('iv-lang').value || 'fr';
  var type = document.getElementById('iv-type').value || 'general';
  var count = parseInt(document.getElementById('iv-count').value) || 10;
  var poste = document.getElementById('iv-poste').value.trim() || cvData.title || 'ce poste';
  var entreprise = document.getElementById('iv-entreprise').value.trim() || 'votre entreprise';

  var bank = (IV_QUESTIONS[lang] || IV_QUESTIONS.fr)[type] || IV_QUESTIONS.fr.general;

  // Mélanger et sélectionner les questions
  var shuffled = bank.slice().sort(function() { return Math.random() - 0.5; });
  var selected = shuffled.slice(0, Math.min(count, shuffled.length));

  // Ajouter des questions personnalisées selon le CV
  selected = personalizeQuestions(selected, poste, cvData, lang);

  ivSession = {
    questions: selected,
    answers: [],
    scores: [],
    feedbacks: [],
    current: 0,
    active: true,
    type: type,
    lang: lang,
    poste: poste,
    entreprise: entreprise
  };

  document.getElementById('interviewSetup').style.display = 'none';
  document.getElementById('interviewResults').style.display = 'none';
  document.getElementById('interviewSession').style.display = 'block';

  setEl('ivTotalNum', selected.length);
  var typeLabels = { general:'Entretien général', motivation:'Motivation', technique:'Compétences techniques', situation:'Questions situationnelles', stress:'Entretien de stress', rh:'Entretien RH' };
  setEl('ivTypeBadge', typeLabels[type] || 'Entretien');

  showQuestion(0);
}

/* -- Personnaliser les questions selon le CV -- */
function personalizeQuestions(questions, poste, data, lang) {
  return questions.map(function(q) {
    var text = q.q
      .replace(/\[poste\]/gi, poste)
      .replace(/\[outil principal du poste\]/gi, (data.tools || ['votre outil principal'])[0] || poste)
      .replace(/\[Nom\]/gi, data.name || 'votre nom')
      .replace(/\[titre\]/gi, poste);
    return Object.assign({}, q, { q: text });
  });
}

/* -- Afficher une question -- */
function showQuestion(index) {
  var q = ivSession.questions[index];
  if (!q) return;

  document.getElementById('ivAnswer').value = '';
  document.getElementById('ivAnswerCounter').textContent = '0 mots';
  document.getElementById('ivFeedback').style.display = 'none';
  document.getElementById('ivHint').style.display = 'none';

  setEl('ivCurrentNum', index + 1);
  setEl('ivQuestionCategory', q.cat);
  setEl('ivQuestionText', q.q);
  setEl('ivHintText', q.hint);

  var pct = Math.round(((index + 1) / ivSession.questions.length) * 100);
  document.getElementById('ivProgressBar').style.width = pct + '%';

  var avgScore = ivSession.scores.length > 0
    ? Math.round(ivSession.scores.reduce(function(a,b){return a+b;},0) / ivSession.scores.length)
    : '—';
  setEl('ivScore', avgScore === '—' ? '—' : avgScore + '/100');

  document.getElementById('ivAnswer').focus();
}

/* -- Compteur de mots -- */
function countWords(el, counterId) {
  var words = el.value.trim().split(/\s+/).filter(function(w) { return w.length > 0; });
  var el2 = document.getElementById(counterId);
  if (el2) el2.textContent = words.length + ' mot' + (words.length > 1 ? 's' : '');
}

/* -- Toggle hint -- */
function toggleHint() {
  var hint = document.getElementById('ivHint');
  if (hint) hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
}

/* -- Soumettre une réponse -- */
function submitAnswer() {
  var answer = (document.getElementById('ivAnswer').value || '').trim();
  if (!answer) { showToast('Tapez votre réponse avant de valider', 'warning'); return; }

  var q = ivSession.questions[ivSession.current];
  var feedback = evaluateAnswer(answer, q, ivSession.lang);

  ivSession.answers.push(answer);
  ivSession.scores.push(feedback.score);
  ivSession.feedbacks.push(feedback);

  // Afficher le feedback
  document.getElementById('ivFeedback').style.display = 'block';
  document.getElementById('ivAnswerScore').innerHTML =
    '<span style="color:' + scoreColor(feedback.score) + '">' + feedback.score + '/100</span>';
  document.getElementById('ivFeedbackPos').innerHTML = feedback.positif.map(function(p) {
    return '<div style="display:flex;gap:6px;margin-bottom:6px"><i class="fas fa-check-circle" style="color:var(--success);margin-top:2px;flex-shrink:0"></i><span>' + p + '</span></div>';
  }).join('');
  document.getElementById('ivFeedbackNeg').innerHTML = feedback.negatif.map(function(n) {
    return '<div style="display:flex;gap:6px;margin-bottom:6px"><i class="fas fa-arrow-up" style="color:var(--warning);margin-top:2px;flex-shrink:0"></i><span>' + n + '</span></div>';
  }).join('');
  setEl('ivIdealAnswer', q.ideal);

  var isLast = ivSession.current >= ivSession.questions.length - 1;
  var nextBtn = document.getElementById('ivNextBtn');
  if (nextBtn) {
    nextBtn.innerHTML = isLast
      ? '<i class="fas fa-trophy"></i> Voir les résultats'
      : '<i class="fas fa-arrow-right"></i> Question suivante';
  }

  document.getElementById('ivFeedback').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* -- Évaluer une réponse -- */
function evaluateAnswer(answer, question, lang) {
  var words = answer.trim().split(/\s+/).filter(function(w) { return w.length > 0; });
  var wordCount = words.length;
  var score = 50;
  var positif = [];
  var negatif = [];

  // Longueur de la réponse
  if (wordCount >= 80) { score += 15; positif.push('Réponse bien développée et complète.'); }
  else if (wordCount >= 40) { score += 8; positif.push('Longueur de réponse correcte.'); }
  else if (wordCount >= 20) { score += 0; negatif.push('Réponse un peu courte — développez davantage (idéal : 60-100 mots).'); }
  else { score -= 15; negatif.push('Réponse trop courte. Le recruteur attend plus de détail.'); }

  // Mots-clés positifs
  var posKeywords = lang === 'en'
    ? ['experience', 'result', 'achieved', 'managed', 'developed', 'improved', 'team', 'project', 'client']
    : ['expérience', 'résultat', 'réalisé', 'géré', 'développé', 'amélioré', 'équipe', 'projet', 'client', 'objectif', 'formation'];
  var foundPos = posKeywords.filter(function(kw) { return answer.toLowerCase().indexOf(kw) >= 0; });
  if (foundPos.length >= 4) { score += 12; positif.push('Bonne utilisation de mots-clés professionnels.'); }
  else if (foundPos.length >= 2) { score += 5; }
  else { negatif.push('Utilisez plus de mots-clés professionnels : résultats, expériences, chiffres.'); }

  // Chiffres et métriques
  var hasNumbers = /\d+/.test(answer);
  if (hasNumbers) { score += 10; positif.push('Excellente utilisation de chiffres et données concrètes.'); }
  else { negatif.push('Ajoutez des chiffres ou métriques pour crédibiliser votre réponse (ex: +30%, 5 projets, 3 ans).'); }

  // Exemples personnels (indicateurs de la méthode STAR)
  var starKeywords = lang === 'en'
    ? ['when', 'because', 'so', 'therefore', 'example', 'situation']
    : ['quand', 'parce que', 'donc', 'ainsi', 'exemple', 'situation', 'lors', 'grâce', 'notamment'];
  var hasStar = starKeywords.some(function(kw) { return answer.toLowerCase().indexOf(kw) >= 0; });
  if (hasStar) { score += 8; positif.push('Bonne structure avec des exemples concrets.'); }
  else { negatif.push('Illustrez avec un exemple concret (méthode STAR : Situation, Tâche, Action, Résultat).'); }

  // Mots à éviter
  var badWords = lang === 'en'
    ? ['i don\'t know', 'i can\'t', 'never', 'always', 'perfect', 'best ever']
    : ['je sais pas', 'je ne sais pas', 'je peux pas', 'jamais', 'toujours', 'parfait', 'le meilleur'];
  var hasBad = badWords.some(function(bw) { return answer.toLowerCase().indexOf(bw) >= 0; });
  if (hasBad) { score -= 10; negatif.push('Évitez les formulations négatives ou les absolus comme "jamais" ou "toujours".'); }

  // Cohérence avec le profil
  var profileKeywords = [
    (cvData.title || '').toLowerCase(),
    (cvData.name || '').split(' ')[0].toLowerCase()
  ].concat((cvData.tools || []).map(function(t) { return t.toLowerCase(); }));
  var cvMatch = profileKeywords.some(function(kw) { return kw.length > 2 && answer.toLowerCase().indexOf(kw) >= 0; });
  if (cvMatch) { score += 5; positif.push('Réponse bien alignée avec votre profil CV.'); }

  // Borner le score
  score = Math.max(10, Math.min(100, score));

  // Messages par défaut si rien trouvé
  if (positif.length === 0) positif.push('Vous avez répondu à la question posée.');
  if (negatif.length === 0) negatif.push('Continuez à vous entraîner pour plus de fluidité.');

  return { score: score, positif: positif, negatif: negatif };
}

function scoreColor(score) {
  if (score >= 75) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

/* -- Question suivante -- */
function nextQuestion() {
  var isLast = ivSession.current >= ivSession.questions.length - 1;
  if (isLast) { showInterviewResults(); return; }
  ivSession.current++;
  showQuestion(ivSession.current);
  document.getElementById('ivQuestionCard').scrollIntoView({ behavior: 'smooth' });
}

/* -- Passer une question -- */
function skipQuestion() {
  ivSession.answers.push('');
  ivSession.scores.push(0);
  ivSession.feedbacks.push({ score: 0, positif: [], negatif: ['Question passée.'] });
  var isLast = ivSession.current >= ivSession.questions.length - 1;
  if (isLast) { showInterviewResults(); return; }
  ivSession.current++;
  showQuestion(ivSession.current);
  showToast('Question passée', 'warning');
}

/* -- Arrêter la simulation -- */
function stopInterview() {
  if (!confirm('Arrêter la simulation ? Les résultats actuels seront affichés.')) return;
  // Compléter les questions manquantes
  while (ivSession.answers.length < ivSession.questions.length) {
    ivSession.answers.push('');
    ivSession.scores.push(0);
    ivSession.feedbacks.push({ score: 0, positif: [], negatif: ['Question non traitée.'] });
  }
  showInterviewResults();
}

/* -- Afficher les résultats finaux -- */
function showInterviewResults() {
  ivSession.active = false;
  document.getElementById('interviewSession').style.display = 'none';
  document.getElementById('interviewResults').style.display = 'block';
  document.getElementById('interviewResults').scrollIntoView({ behavior: 'smooth' });

  var scores = ivSession.scores;
  var answered = scores.filter(function(s) { return s > 0; });
  var avgScore = answered.length > 0
    ? Math.round(answered.reduce(function(a,b){return a+b;},0) / answered.length)
    : 0;
  var goodCount = scores.filter(function(s) { return s >= 70; }).length;
  var midCount  = scores.filter(function(s) { return s >= 40 && s < 70; }).length;
  var skipCount = scores.filter(function(s) { return s === 0; }).length;

  setEl('ivFinalScore', avgScore);
  setEl('ivResTotal', scores.length);
  setEl('ivResGood', goodCount);
  setEl('ivResMid', midCount);
  setEl('ivResSkip', skipCount);

  // Emoji selon score
  var emoji = avgScore >= 80 ? '🏆' : avgScore >= 60 ? '🎉' : avgScore >= 40 ? '💪' : '📚';
  setEl('ivResultEmoji', emoji);

  // Détail par question
  var detailEl = document.getElementById('ivDetailedResults');
  if (detailEl) {
    detailEl.innerHTML = ivSession.questions.map(function(q, i) {
      var s = scores[i] || 0;
      var a = ivSession.answers[i] || '';
      return '<div style="border-bottom:1px solid var(--border);padding:16px 0' + (i === 0 ? ';padding-top:0' : '') + (i === ivSession.questions.length-1 ? ';border-bottom:none' : '') + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px">' +
          '<div style="flex:1">' +
            '<p style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Q' + (i+1) + ' — ' + q.cat + '</p>' +
            '<p style="font-size:13px;font-weight:600;color:var(--text)">' + q.q + '</p>' +
          '</div>' +
          '<div style="text-align:center;flex-shrink:0">' +
            '<div style="font-size:20px;font-weight:800;color:' + scoreColor(s) + '">' + (s > 0 ? s : '—') + '</div>' +
            '<div style="font-size:10px;color:var(--text-muted)">/100</div>' +
          '</div>' +
        '</div>' +
        (a ? '<p style="font-size:12px;color:var(--text-secondary);background:var(--bg-input);padding:10px 12px;border-radius:8px;margin:0;font-style:italic">"' + a.substring(0, 150) + (a.length > 150 ? '...' : '') + '"</p>' : '<p style="font-size:12px;color:var(--danger);font-style:italic">Question passée</p>') +
      '</div>';
    }).join('');
  }

  // Recommandations
  var recEl = document.getElementById('ivRecommendations');
  if (recEl) {
    var recs = [];
    if (avgScore < 50) recs.push({ icon: 'book', color: 'var(--primary)', text: 'Entraînez-vous davantage avec la méthode STAR pour structurer vos réponses.' });
    if (skipCount > 0) recs.push({ icon: 'forward', color: 'var(--warning)', text: 'Vous avez passé ' + skipCount + ' question(s). Préparez des réponses pour tous les types de questions.' });
    if (goodCount >= scores.length * 0.7) recs.push({ icon: 'star', color: '#f59e0b', text: 'Excellent niveau ! Vous êtes prêt(e) pour un entretien réel.' });
    recs.push({ icon: 'comments', color: 'var(--success)', text: 'Pratiquez à voix haute : la fluidité orale est aussi importante que le contenu.' });
    recs.push({ icon: 'search', color: 'var(--violet)', text: 'Recherchez l\'entreprise en détail avant chaque entretien (actualités, valeurs, projets).' });
    if (cvData.profile && cvData.profile.length < 100) recs.push({ icon: 'edit', color: 'var(--primary)', text: 'Enrichissez votre profil CV — il servira de base à vos réponses d\'entretien.' });

    recEl.innerHTML = recs.map(function(r) {
      return '<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--border)">' +
        '<i class="fas fa-' + r.icon + '" style="color:' + r.color + ';margin-top:2px;font-size:15px;flex-shrink:0"></i>' +
        '<span style="font-size:13px;color:var(--text);line-height:1.6">' + r.text + '</span></div>';
    }).join('');
  }
}

/* -- Redémarrer -- */
function restartInterview() {
  ivSession = { questions:[], answers:[], scores:[], feedbacks:[], current:0, active:false };
  document.getElementById('interviewResults').style.display = 'none';
  document.getElementById('interviewSession').style.display = 'none';
  document.getElementById('interviewSetup').style.display = 'grid';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* -- Exporter le rapport -- */
function exportInterviewReport() {
  var scores = ivSession.scores;
  var avgScore = scores.length > 0
    ? Math.round(scores.reduce(function(a,b){return a+b;},0) / scores.filter(function(s){return s>0;}).length || 0)
    : 0;
  var date = new Date().toLocaleDateString('fr', { year:'numeric', month:'long', day:'numeric' });
  var name = cvData.name || 'Candidat';

  var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport d\'entretien — ' + name + '</title>' +
    '<style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;color:#1e293b;padding:0 24px}' +
    'h1{font-size:28px;font-weight:800;margin-bottom:4px}' +
    '.score-big{font-size:56px;font-weight:900;color:#2563EB;text-align:center;margin:24px 0}' +
    '.q-item{border-left:3px solid #2563EB;padding:12px 16px;margin-bottom:16px;background:#f8fafc;border-radius:0 8px 8px 0}' +
    '.q-cat{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}' +
    '.q-text{font-size:14px;font-weight:600;margin:4px 0 8px}' +
    '.q-answer{font-size:12px;color:#475569;font-style:italic;margin-bottom:6px}' +
    '.q-score{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700}' +
    '.good{background:#d1fae5;color:#065f46}.mid{background:#fef3c7;color:#92400e}.bad{background:#fee2e2;color:#991b1b}' +
    '</style></head><body>' +
    '<h1>Rapport de simulation d\'entretien</h1>' +
    '<p style="color:#64748b;margin-bottom:24px">' + name + ' — ' + date + ' — ' + ivSession.poste + '</p>' +
    '<div class="score-big">' + avgScore + '<span style="font-size:24px;color:#94a3b8">/100</span></div>';

  html += '<h2 style="font-size:18px;margin-bottom:16px">Détail des réponses</h2>';
  ivSession.questions.forEach(function(q, i) {
    var s = scores[i] || 0;
    var cls = s >= 70 ? 'good' : s >= 40 ? 'mid' : 'bad';
    html += '<div class="q-item">' +
      '<div class="q-cat">Q' + (i+1) + ' — ' + q.cat + '</div>' +
      '<div class="q-text">' + q.q + '</div>' +
      (ivSession.answers[i] ? '<div class="q-answer">"' + ivSession.answers[i] + '"</div>' : '<div class="q-answer" style="color:#ef4444">Question passée</div>') +
      '<span class="q-score ' + cls + '">' + (s > 0 ? s + '/100' : 'Passée') + '</span>' +
      '</div>';
  });

  html += '<p style="text-align:center;margin-top:40px;font-size:12px;color:#94a3b8">Généré par CV Generator Pro — thibautaffohoyochi-collab.github.io/cv-generator</p></body></html>';

  var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'rapport_entretien_' + (name.replace(/\s+/g,'_')) + '_' + new Date().toISOString().slice(0,10) + '.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Rapport exporté !', 'success');
}

/* ==========================================================
   MOBILE BOTTOM NAV
   ========================================================== */
function syncMobNav(btn) {
  document.querySelectorAll('.mob-nav-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
}

function toggleMobMenu() {
  var menu = document.getElementById('mobMoreMenu');
  var icon = document.getElementById('mobMenuIcon');
  if (!menu) return;
  var isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (icon) icon.className = isOpen ? 'fas fa-grid-2' : 'fas fa-times';
}

function closeMobMenu() {
  var menu = document.getElementById('mobMoreMenu');
  var icon = document.getElementById('mobMenuIcon');
  if (menu) menu.style.display = 'none';
  if (icon) icon.className = 'fas fa-grid-2';
}

// Close more menu when clicking outside
document.addEventListener('click', function(e) {
  var menu = document.getElementById('mobMoreMenu');
  if (!menu || menu.style.display === 'none') return;
  var btn = e.target.closest('.mob-nav-btn');
  if (!btn && !e.target.closest('#mobMoreMenu')) closeMobMenu();
});

// Sync mobile bottom nav when showPage is called
var _origShowPage = showPage;
showPage = function(pageId, btn) {
  _origShowPage(pageId, btn);
  // Sync bottom nav
  var mainPages = ['dashboard','builder','preview','export'];
  document.querySelectorAll('.mob-nav-btn[data-page]').forEach(function(b) {
    b.classList.toggle('active', b.dataset.page === pageId);
  });
  // "Plus" button stays unselected for non-main pages
  var moreBtn = document.querySelector('.mob-nav-btn:not([data-page])');
  if (moreBtn) moreBtn.classList.toggle('active', !mainPages.includes(pageId));
};

/* ==========================================================
   BUTTON RIPPLE EFFECT
   ========================================================== */
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.btn');
  if (!btn) return;
  var r = document.createElement('span');
  r.className = 'ripple';
  var rect = btn.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  r.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+(e.clientX-rect.left-size/2)+'px;top:'+(e.clientY-rect.top-size/2)+'px';
  btn.appendChild(r);
  setTimeout(function() { if (r.parentNode) r.parentNode.removeChild(r); }, 550);
});

/* ==========================================================
   ONBOARDING
   ========================================================== */
var ONBOARDING_STEPS = [
  {
    icon: '👋',
    iconBg: 'linear-gradient(135deg,#2563EB,#7c3aed)',
    title: 'Bienvenue dans CV Generator Pro !',
    desc: 'Créez votre CV professionnel en quelques minutes. Voici un tour rapide des fonctionnalités clés.',
    features: [
      { icon: 'fa-edit', color: '#60a5fa', text: '10 templates CV' },
      { icon: 'fa-file-pdf', color: '#f87171', text: 'Export PDF A4' },
      { icon: 'fa-chart-bar', color: '#fbbf24', text: 'Score CV /100' },
      { icon: 'fa-envelope-open-text', color: '#34d399', text: 'Lettre motivation' }
    ]
  },
  {
    icon: '✍️',
    iconBg: 'linear-gradient(135deg,#10b981,#059669)',
    title: 'Remplissez votre profil',
    desc: 'Commencez par "Créer mon CV" dans la barre latérale. Le formulaire guidé en 5 étapes vous accompagne.',
    features: [
      { icon: 'fa-user', color: '#60a5fa', text: 'Infos personnelles' },
      { icon: 'fa-briefcase', color: '#fbbf24', text: 'Expériences' },
      { icon: 'fa-graduation-cap', color: '#34d399', text: 'Formation' },
      { icon: 'fa-star', color: '#f87171', text: 'Compétences' }
    ]
  },
  {
    icon: '🎯',
    iconBg: 'linear-gradient(135deg,#f59e0b,#d97706)',
    title: 'Analysez et optimisez',
    desc: 'Utilisez le Score CV, le Match offre d\'emploi et la Simulation d\'entretien pour maximiser vos chances.',
    features: [
      { icon: 'fa-search', color: '#a78bfa', text: 'Match offre d\'emploi' },
      { icon: 'fa-comments', color: '#60a5fa', text: 'Simulation entretien' },
      { icon: 'fa-language', color: '#34d399', text: 'Traduction anglais' },
      { icon: 'fa-crown', color: '#f59e0b', text: 'Templates Pro' }
    ]
  }
];

var onboardingStep = 0;

function showOnboarding() {
  if (localStorage.getItem('cvOnboardingDone')) return;
  var overlay = document.getElementById('onboardingOverlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  renderOnboardingStep(0);
}

function renderOnboardingStep(step) {
  onboardingStep = step;
  var s = ONBOARDING_STEPS[step];
  if (!s) return;

  // Dots
  var dots = document.getElementById('onboardingDots');
  if (dots) {
    dots.innerHTML = ONBOARDING_STEPS.map(function(_, i) {
      return '<div class="onboarding-dot' + (i === step ? ' active' : '') + '"></div>';
    }).join('');
  }

  // Icon
  var icon = document.getElementById('onboardingIcon');
  if (icon) {
    icon.style.background = s.iconBg;
    icon.innerHTML = '<span style="font-size:32px">' + s.icon + '</span>';
  }

  setEl('onboardingTitle', s.title);

  var desc = document.getElementById('onboardingDesc');
  if (desc) desc.textContent = s.desc;

  // Features
  var feat = document.getElementById('onboardingFeatures');
  if (feat) {
    feat.innerHTML = s.features.map(function(f) {
      return '<div class="onboarding-feature">' +
        '<i class="fas ' + f.icon + '" style="color:' + f.color + '"></i>' +
        '<span>' + f.text + '</span></div>';
    }).join('');
  }

  // Buttons
  var nextBtn = document.getElementById('onboardingNext');
  var skipBtn = document.getElementById('onboardingSkip');
  var isLast = step === ONBOARDING_STEPS.length - 1;

  if (nextBtn) {
    nextBtn.innerHTML = isLast
      ? '<i class="fas fa-rocket"></i> Commencer !'
      : 'Suivant <i class="fas fa-arrow-right"></i>';
  }
  if (skipBtn) skipBtn.style.display = isLast ? 'none' : 'inline-flex';
}

function nextOnboarding() {
  if (onboardingStep < ONBOARDING_STEPS.length - 1) {
    renderOnboardingStep(onboardingStep + 1);
  } else {
    closeOnboarding();
  }
}

function skipOnboarding() { closeOnboarding(); }

function closeOnboarding() {
  var overlay = document.getElementById('onboardingOverlay');
  if (overlay) {
    overlay.style.animation = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(function() { overlay.classList.add('hidden'); }, 300);
  }
  localStorage.setItem('cvOnboardingDone', '1');
}

// Lancer l'onboarding au chargement si premier usage
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (!localStorage.getItem('cvOnboardingDone') && !localStorage.getItem('cvGeneratorData')) {
      showOnboarding();
    }
  }, 800);
});
