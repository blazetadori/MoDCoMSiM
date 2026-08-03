// ═══════════════════════════════════════════════════════════════
// STUDENT PROGRESS TRACKING (shared by student.html and admin.html)
// Client-side only, persisted to localStorage, keyed per student email
// so multiple demo accounts in the same browser don't collide.
// Depends on MODULES from modules.js (module list) being loaded first.
// ═══════════════════════════════════════════════════════════════
const PROGRESS_KEY='modcosim-progress';

function loadAllProgress(){
  try{return JSON.parse(localStorage.getItem(PROGRESS_KEY))||{};}catch(e){return {};}
}
function saveAllProgress(all){
  try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(all));}catch(e){}
}
// Progress record shape per student email:
// { modules: { [moduleId]: 'in-progress'|'completed' },
//   quizAttempts: [ {topic, score, total, pct, date} ], lastActivity: isoDate }
function getStudentProgress(email){
  const all=loadAllProgress();
  const key=(email||'').toLowerCase();
  return all[key]||{modules:{},quizAttempts:[],lastActivity:null};
}
function saveStudentProgress(email,record){
  const all=loadAllProgress();
  all[(email||'').toLowerCase()]=record;
  saveAllProgress(all);
}
function touchLastActivity(email){
  const rec=getStudentProgress(email);
  rec.lastActivity=new Date().toISOString();
  saveStudentProgress(email,rec);
}
// Marks a module page as visited ("in-progress") unless already completed.
function markModuleVisited(email,page){
  if(!email)return;
  const mod=pageToModule(page);
  if(!mod)return;
  const rec=getStudentProgress(email);
  if(rec.modules[mod.id]!=='completed'){
    rec.modules[mod.id]='in-progress';
  }
  rec.lastActivity=new Date().toISOString();
  saveStudentProgress(email,rec);
}
function markModuleComplete(email,moduleId){
  if(!email)return;
  const rec=getStudentProgress(email);
  rec.modules[moduleId]='completed';
  rec.lastActivity=new Date().toISOString();
  saveStudentProgress(email,rec);
}
function getModuleStatusFor(email,moduleId){
  const rec=getStudentProgress(email);
  return rec.modules[moduleId]||'not-started';
}
function recordQuizAttempt(email,topic,score,total){
  if(!email)return;
  const rec=getStudentProgress(email);
  const pct=total>0?Math.round(score/total*100):0;
  rec.quizAttempts=rec.quizAttempts||[];
  rec.quizAttempts.push({topic,score,total,pct,date:new Date().toISOString()});
  rec.lastActivity=new Date().toISOString();
  saveStudentProgress(email,rec);
}

// ── Aggregate helpers used by the Admin dashboard ──
function computeStudentStats(email){
  const rec=getStudentProgress(email);
  const total=MODULES.length;
  let completed=0,inProgress=0;
  MODULES.forEach(m=>{
    const st=rec.modules[m.id];
    if(st==='completed')completed++;
    else if(st==='in-progress')inProgress++;
  });
  const pct=total>0?Math.round(completed/total*100):0;
  const attempts=rec.quizAttempts||[];
  const bestPct=attempts.length?Math.max(...attempts.map(a=>a.pct)):null;
  return {
    total,completed,inProgress,pct,
    quizAttemptCount:attempts.length,
    bestQuizPct:bestPct,
    lastActivity:rec.lastActivity
  };
}
