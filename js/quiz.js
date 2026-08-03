// ═══════════════════════════════════════
// QUIZ (Student) — takes admin-authored, Published quizzes only
// ═══════════════════════════════════════
let quizActiveQuiz=null,quizAnswered=[],quizIdx=0;

function qEsc(s){
  const d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;
}
function quizListPublished(){
  const area=document.getElementById('quiz-area');
  const published=getPublishedQuizzes();
  if(!published.length){
    area.innerHTML='<div class="card"><div class="info-box">No quizzes are available yet. Check back later.</div></div>';
    return;
  }
  area.innerHTML='<div class="card"><div class="card-title">AVAILABLE QUIZZES</div>'
    +published.map(q=>'<div class="modrow">'
      +'<div><div class="modrow-name">'+qEsc(q.title)+'</div>'
      +'<div style="color:var(--text-dim);font-size:11.5px;margin-top:4px;">'+qEsc(q.description||'')+'</div>'
      +'<div style="color:var(--text-dim);font-size:11px;margin-top:4px;">'+q.questions.length+' question'+(q.questions.length!==1?'s':'')+'</div></div>'
      +'<button class="btn btn-primary btn-sm" onclick="quizStart(\''+q.id+'\')" '+(q.questions.length?'':'disabled')+'>START</button>'
    +'</div>').join('')
    +'</div>';
}
function quizStart(quizId){
  const quiz=getQuiz(quizId);
  if(!quiz||quiz.status!=='published'||!quiz.questions.length)return;
  quizActiveQuiz=quiz;
  quizAnswered=new Array(quiz.questions.length).fill(null);
  quizIdx=0;
  document.getElementById('quiz-score-area').innerHTML='';
  renderQuiz();
}
function quizReset(){
  quizActiveQuiz=null;quizAnswered=[];quizIdx=0;
  document.getElementById('quiz-score-area').innerHTML='';
  quizListPublished();
}
function renderQuiz(){
  const area=document.getElementById('quiz-area');
  if(!quizActiveQuiz){quizListPublished();return;}
  const quiz=quizActiveQuiz;
  const q=quiz.questions[quizIdx];const answered=quizAnswered[quizIdx];
  let html='<div class="card"><div class="card-title">'+qEsc(quiz.title)+' — QUESTION '+(quizIdx+1)+' / '+quiz.questions.length+'</div>'
    +'<div class="quiz-q"><p>'+qEsc(q.text)+'</p><div class="quiz-opts">';
  q.choices.forEach((o,i)=>{
    let cls='quiz-opt';
    if(answered!==null){if(i===q.correctIndex)cls+=' correct';else if(i===answered&&i!==q.correctIndex)cls+=' wrong';}
    html+='<div class="'+cls+'" onclick="quizAnswer('+i+')">'+String.fromCharCode(65+i)+'. '+qEsc(o)+'</div>';
  });
  html+='</div>';
  if(answered!==null){
    const ok=answered===q.correctIndex;
    html+='<div class="quiz-feedback" style="background:'+(ok?'rgba(0,229,160,0.1)':'rgba(255,79,123,0.1)')+';color:'+(ok?'var(--neon-g)':'var(--neon-r)')+'">'+(ok?'✓ Correct!':'✗ Incorrect. Correct answer: '+qEsc(q.choices[q.correctIndex]))+'</div>';
  }
  html+='</div><div class="btn-row">';
  if(quizIdx>0)html+='<button class="btn btn-ghost btn-sm" onclick="quizNav(-1)">◀ PREV</button>';
  if(quizIdx<quiz.questions.length-1)html+='<button class="btn btn-primary btn-sm" onclick="quizNav(1)">NEXT ▶</button>';
  if(quizIdx===quiz.questions.length-1)html+='<button class="btn btn-green" onclick="quizFinish()">FINISH ✓</button>';
  html+='<button class="btn btn-ghost btn-sm" onclick="quizReset()">CANCEL</button>';
  html+='</div></div>';
  area.innerHTML=html;
  document.getElementById('quiz-score-area').innerHTML='';
}
function quizAnswer(i){if(quizAnswered[quizIdx]===null){quizAnswered[quizIdx]=i;renderQuiz();}}
function quizNav(d){quizIdx=Math.max(0,Math.min(quizActiveQuiz.questions.length-1,quizIdx+d));renderQuiz();}
function quizFinish(){
  const quiz=quizActiveQuiz;
  if(!quiz)return;
  const correct=quizAnswered.filter((a,i)=>a===quiz.questions[i].correctIndex).length;
  const total=quiz.questions.length;
  const pct=Math.round(correct/total*100);
  const grade=pct>=90?'EXCELLENT!':pct>=75?'GOOD JOB!':pct>=60?'PASSING':'NEEDS REVIEW';
  if(typeof CURRENT_STUDENT!=='undefined'&&CURRENT_STUDENT&&typeof recordQuizAttempt==='function'){
    recordQuizAttempt(CURRENT_STUDENT.email,quiz.title,correct,total);
  }
  document.getElementById('quiz-area').innerHTML='';
  document.getElementById('quiz-score-area').innerHTML=
    '<div class="card" style="text-align:center">'
    +'<div class="quiz-score">'+correct+'/'+total+'</div>'
    +'<div style="font-size:28px;margin:4px 0;color:'+(pct>=75?'var(--neon-g)':'var(--neon-r)')+'">'+pct+'%</div>'
    +'<div class="chip '+(pct>=75?'chip-g':'chip-r')+'" style="font-size:14px;padding:6px 16px">'+grade+'</div>'
    +'<div class="btn-row" style="justify-content:center;margin-top:12px">'
      +'<button class="btn btn-primary" onclick="quizStart(\''+quiz.id+'\')">TRY AGAIN</button>'
      +'<button class="btn btn-ghost" onclick="quizReset()">BACK TO QUIZZES</button>'
    +'</div></div>';
  quizActiveQuiz=null;
}

seedQuizzesFromLegacyBank();
