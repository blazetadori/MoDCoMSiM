
// ═══════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════
function nav(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg=document.getElementById('page-'+page);
  if(pg)pg.classList.add('active');
  document.querySelectorAll('.nav-item[data-page="'+page+'"]').forEach(n=>n.classList.add('active'));
  document.getElementById('hdrStatus').textContent=page.toUpperCase();
}
document.querySelectorAll('.nav-item[data-page]').forEach(n=>n.addEventListener('click',()=>{nav(n.dataset.page);closeMobileNav();}));
document.querySelectorAll('.module-card[onclick]');

// Mobile nav drawer
function openMobileNav(){
  document.getElementById('mainNav').classList.add('open');
  document.getElementById('navScrim').classList.add('show');
  const t=document.getElementById('navToggle');if(t)t.setAttribute('aria-expanded','true');
}
function closeMobileNav(){
  document.getElementById('mainNav').classList.remove('open');
  document.getElementById('navScrim').classList.remove('show');
  const t=document.getElementById('navToggle');if(t)t.setAttribute('aria-expanded','false');
}
(function(){
  const toggle=document.getElementById('navToggle');
  const scrim=document.getElementById('navScrim');
  if(toggle)toggle.addEventListener('click',()=>{
    document.getElementById('mainNav').classList.contains('open')?closeMobileNav():openMobileNav();
  });
  if(scrim)scrim.addEventListener('click',closeMobileNav);
})();

// Tab system
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',function(){
  const tabId=this.dataset.tab;
  const parent=this.closest('.page')||document.body;
  parent.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  parent.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));
  this.classList.add('active');
  const tc=document.getElementById(tabId);
  if(tc)tc.classList.add('active');
}));

// Clock
setInterval(()=>{document.getElementById('hdrTime').textContent=new Date().toTimeString().slice(0,8);},1000);

// ═══════════════════════════════════════
// THEME (LIGHT / DARK)
// ═══════════════════════════════════════
const SUN_ICON='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
const MOON_ICON='<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>';
function applyTheme(mode){
  document.documentElement.setAttribute('data-theme',mode);
  const icon=document.getElementById('themeIcon');
  const label=document.getElementById('themeLabel');
  if(icon)icon.innerHTML=(mode==='light')?SUN_ICON:MOON_ICON;
  if(label)label.textContent=mode==='light'?'LIGHT':'DARK';
  try{localStorage.setItem('modcosim-theme',mode);}catch(e){}
  // redraw any live canvases so grid/text colors match the new theme
  document.querySelectorAll('canvas').forEach(c=>{if(c._redraw)try{c._redraw();}catch(e){}});
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme')||'dark';
  applyTheme(cur==='light'?'dark':'light');
}

// ═══════════════════════════════════════
// TEXT SIZE (ACCESSIBILITY SCALE)
// ═══════════════════════════════════════
let uiScale=1;
function applyTextSize(scale){
  uiScale=Math.min(1.4,Math.max(0.85,scale));
  document.documentElement.style.setProperty('--ui-scale',uiScale);
  try{localStorage.setItem('modcosim-scale',uiScale);}catch(e){}
}
function changeTextSize(dir){applyTextSize(uiScale+dir*0.1);}

// ═══════════════════════════════════════
// ADMIN / STUDENT MODE
// Client-side only: this gates the UI (hides/locks admin-only controls)
// for convenience in a classroom setting. Because this is a static page
// with no server/backend, it is NOT real security — anyone with the page
// source can bypass it. Use a real auth system if that matters.
// ═══════════════════════════════════════
function setMode(mode){
  document.documentElement.setAttribute('data-mode',mode);
  const pill=document.getElementById('modePill');
  const label=document.getElementById('modeLabel');
  if(pill){pill.classList.remove('admin','student');pill.classList.add(mode);}
  if(label)label.textContent=mode.toUpperCase();
  try{sessionStorage.setItem('modcosim-mode',mode);}catch(e){}
}
// Only account holders with the Admin role ever see this pill (see
// requireSession() in auth.js). It lets a logged-in Admin jump over to
// student.html to preview what a Student sees, and back — it is not a
// security boundary (requireSession() re-checks the role on each page).
function toggleAdminMode(){
  const cur=document.documentElement.getAttribute('data-mode')||'student';
  window.location.href=cur==='admin'?'student.html':'admin.html';
}

// ═══════════════════════════════════════
// ICON SYSTEM (inline SVG, replaces emoji glyphs)
// ═══════════════════════════════════════
const ICONS={
  charcode:'<path d="M4 17V7l4 6 4-6v10"/><path d="M15 7h5M15 12h5M15 17h3"/>',
  pcm:'<path d="M2 12h3l2-7 3 14 3-10 2 3h7"/>',
  linecode:'<path d="M2 6h4v6h4V6h4v12h4V6h4"/>',
  antenna:'<path d="M12 22V12"/><path d="M12 12l7-7"/><circle cx="19" cy="5" r="2.4"/><path d="M4 15a8 8 0 0 1 8-8"/><path d="M2 19a10 10 0 0 1 10-10"/>',
  edc:'<path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"/><path d="M9 12l2 2 4-4"/>',
  mux:'<path d="M3 6h5l4 12h9"/><path d="M3 18h5l2-6"/><path d="M17 3l3 3-3 3"/><path d="M17 15l3 3-3 3"/>',
  awgn:'<path d="M3 3v18h18"/><path d="M6 15l3-5 3 3 4-8 3 5"/>',
  compare:'<path d="M12 3v18"/><path d="M5 8l-3 5a3 3 0 0 0 6 0z"/><path d="M19 8l-3 5a3 3 0 0 0 6 0z"/><path d="M5 8h14M12 3l-3 2M12 3l3 2"/>',
  quiz:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 2"/><circle cx="12" cy="17" r="0.4" fill="currentColor"/>'
};
function applyIcons(){
  document.querySelectorAll('[data-icon]').forEach(el=>{
    const key=el.getAttribute('data-icon');
    const path=ICONS[key];
    if(!path)return;
    el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
  });
}

// ═══════════════════════════════════════
// INIT preferences saved from a previous visit
// ═══════════════════════════════════════
(function initPrefs(){
  let savedTheme='dark',savedScale=1;
  try{savedTheme=localStorage.getItem('modcosim-theme')||savedTheme;}catch(e){}
  try{savedScale=parseFloat(localStorage.getItem('modcosim-scale'))||savedScale;}catch(e){}
  applyTheme(savedTheme);
  applyTextSize(savedScale);
  applyIcons();
  // Session handling is page-specific: login.html calls resumeSession()
  // (skip the form if already signed in); student.html/admin.html call
  // requireSession() (bounce to login.html if not signed in).
})();

