// ═══════════════════════════════════════════════════════════════
// STUDENT PROGRESS TRACKER (Admin) — read-only view of each student's
// module/quiz progress, backed by js/progress.js. Client-side only.
// ═══════════════════════════════════════════════════════════════
function spEsc(s){
  const d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;
}
function spFormatDate(iso){
  if(!iso)return 'No activity yet';
  const d=new Date(iso);
  return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
}
function renderStudentProgress(){
  const wrap=document.getElementById('student-progress-list');
  if(!wrap)return;
  const students=loadUsers();
  if(!students.length){
    wrap.innerHTML='<div class="info-box">No students yet. Once students sign up and start using the app, their progress will appear here.</div>';
    return;
  }
  wrap.innerHTML=students.map(u=>{
    const stats=computeStudentStats(u.email);
    const quizLabel=stats.quizAttemptCount
      ?stats.bestQuizPct+'% ('+stats.quizAttemptCount+' attempt'+(stats.quizAttemptCount>1?'s':'')+')'
      :'No attempts yet';
    return '<div class="modrow" style="flex-direction:column;align-items:stretch;gap:10px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">'
        +'<div class="modrow-name">'+spEsc(u.name)+'</div>'
        +'<span class="mod-badge '+(stats.pct===100?'on':'off')+'">'+stats.pct+'% complete</span>'
      +'</div>'
      +'<div class="progress-bar-track"><div class="progress-bar-fill" style="width:'+stats.pct+'%"></div></div>'
      +'<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:11.5px;color:var(--text-dim);">'
        +'<span>Completed: <b style="color:var(--text-hi);">'+stats.completed+'</b></span>'
        +'<span>In Progress: <b style="color:var(--text-hi);">'+stats.inProgress+'</b></span>'
        +'<span>Quiz Score: <b style="color:var(--text-hi);">'+quizLabel+'</b></span>'
        +'<span>Last Activity: <b style="color:var(--text-hi);">'+spFormatDate(stats.lastActivity)+'</b></span>'
      +'</div>'
    +'</div>';
  }).join('');
}

document.querySelectorAll('.nav-item[data-page="activity"]').forEach(el=>{
  el.addEventListener('click',renderStudentProgress);
});
// Keep it live if a Student is using student.html in another tab.
window.addEventListener('storage',e=>{
  if(e.key===PROGRESS_KEY&&document.getElementById('page-activity').classList.contains('active'))renderStudentProgress();
});
renderStudentProgress();
