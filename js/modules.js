// ═══════════════════════════════════════════════════════════════
// MODULE ENABLE/DISABLE (shared by admin.html and student.html)
// Client-side only, persisted to localStorage. Admin toggles a module
// off here → its nav items + home card disappear from student.html.
// ═══════════════════════════════════════════════════════════════
const MODULES_KEY='modcosim-modules';

// Each module groups one or more student.html data-page values under a
// single admin-facing switch (e.g. all PCM sub-pages toggle together).
const MODULES=[
  {id:'charcode',   name:'Character Coding',         pages:['charcode']},
  {id:'pcm',        name:'Pulse Code Modulation',    pages:['pcm-basic','pcm-delta','pcm-diff']},
  {id:'linecode',   name:'Line Coding',              pages:['linecode']},
  {id:'digitalmod', name:'Digital Modulation',       pages:['ask','fsk','bpsk','qpsk','qam']},
  {id:'edc',        name:'Error Detection & Correction', pages:['edc']},
  {id:'mux',        name:'Multiplexing',             pages:['mux']},
  {id:'awgn',       name:'AWGN & BER Analysis',      pages:['awgn']},
  {id:'compare',    name:'Compare Mode',             pages:['compare']},
  {id:'quiz',       name:'Quiz Mode',                pages:['quiz']}
];

function loadModuleStatus(){
  try{return JSON.parse(localStorage.getItem(MODULES_KEY))||{};}catch(e){return {};}
}
function saveModuleStatus(status){
  try{localStorage.setItem(MODULES_KEY,JSON.stringify(status));}catch(e){}
}
// Modules are enabled by default until explicitly disabled.
function isModuleEnabled(id){
  const status=loadModuleStatus();
  return status[id]!==false;
}
function setModuleEnabled(id,enabled){
  const status=loadModuleStatus();
  status[id]=enabled;
  saveModuleStatus(status);
}
function pageToModule(page){
  return MODULES.find(m=>m.pages.includes(page));
}
