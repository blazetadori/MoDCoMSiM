// ═══════════════════════════════════════════════════════════════
// CUSTOM QUIZ BUILDER (Admin) — Create/Edit/Delete quizzes, Save as
// Draft/Publish, and an unlimited-question builder (add/delete/edit/
// reorder) for multiple-choice questions. Client-side only, backed by
// js/quizdata.js.
// ═══════════════════════════════════════════════════════════════
let qmCurrentQuizId=null;

function qmEsc(s){
  const d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;
}
function qmAttr(s){
  return qmEsc(s).replace(/"/g,'&quot;');
}
function qmRenderList(){
  const wrap=document.getElementById('qm-quiz-cards');
  if(!wrap)return;
  const quizzes=loadQuizzes();
  if(!quizzes.length){
    wrap.innerHTML='<div class="card"><div class="info-box">No quizzes yet — click CREATE QUIZ to build one.</div></div>';
    return;
  }
  wrap.innerHTML=quizzes.map(q=>{
    const published=q.status==='published';
    const mod=MODULES.find(m=>m.id===q.moduleId);
    return '<div class="card">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">'
        +'<div>'
          +'<div class="card-title" style="margin-bottom:4px;">'+qmEsc(q.title)+'</div>'
          +'<div style="color:var(--text-dim);font-size:12px;">'+qmEsc(q.description||'No description')+'</div>'
          +'<div style="color:var(--text-dim);font-size:11px;margin-top:6px;">'
            +(mod?mod.name:'No module assigned')+' · '+q.questions.length+' question'+(q.questions.length!==1?'s':'')
          +'</div>'
        +'</div>'
        +'<span class="mod-badge '+(published?'on':'off')+'">'+(published?'🟢 Published':'🔴 Draft')+'</span>'
      +'</div>'
      +'<div class="btn-row mt8">'
        +'<button class="btn btn-ghost btn-sm" onclick="qmOpenQuiz(\''+q.id+'\')">EDIT</button>'
        +(published
          ?'<button class="btn btn-ghost btn-sm" onclick="qmSetStatus(\''+q.id+'\',\'draft\')">UNPUBLISH</button>'
          :'<button class="btn btn-green btn-sm" onclick="qmSetStatus(\''+q.id+'\',\'published\')">PUBLISH</button>')
        +'<button class="btn btn-red btn-sm" onclick="qmDeleteQuiz(\''+q.id+'\')">DELETE</button>'
      +'</div>'
    +'</div>';
  }).join('');
}
function qmSetStatus(id,status){
  if(status==='published'){
    const quiz=getQuiz(id);
    if(!quiz||!quiz.questions.length){
      alert('Add at least one question before publishing this quiz.');
      return;
    }
  }
  setQuizStatus(id,status);
  qmRenderList();
}
function qmDeleteQuiz(id){
  if(!confirm('Delete this quiz? This cannot be undone.'))return;
  deleteQuiz(id);
  qmRenderList();
}
function qmCreateQuiz(){
  const quiz=createQuiz({title:'Untitled Quiz'});
  qmOpenQuiz(quiz.id);
}
function qmShowList(){
  qmCurrentQuizId=null;
  document.getElementById('quiz-editor-view').style.display='none';
  document.getElementById('quiz-list-view').style.display='block';
  qmRenderList();
}

// ── Editor ──
function qmPopulateModuleOptions(){
  const sel=document.getElementById('qm-module');
  sel.innerHTML='<option value="">— None —</option>'
    +MODULES.map(m=>'<option value="'+m.id+'">'+qmEsc(m.name)+'</option>').join('');
}
function qmOpenQuiz(id){
  const quiz=getQuiz(id);
  if(!quiz)return;
  qmCurrentQuizId=id;
  qmPopulateModuleOptions();
  document.getElementById('qm-title').value=quiz.title;
  document.getElementById('qm-desc').value=quiz.description||'';
  document.getElementById('qm-module').value=quiz.moduleId||'';
  qmRenderStatusBadge(quiz);
  qmRenderQuestions(quiz);
  document.getElementById('quiz-list-view').style.display='none';
  document.getElementById('quiz-editor-view').style.display='block';
}
function qmRenderStatusBadge(quiz){
  const published=quiz.status==='published';
  document.getElementById('qm-status-badge').className='mod-badge '+(published?'on':'off');
  document.getElementById('qm-status-badge').textContent=published?'🟢 Published':'🔴 Draft';
}
// Editing anything on a Published quiz (its own fields, or any question)
// quietly reverts it to Draft first — students never see a quiz change out
// from under a live attempt. The admin just re-publishes when done editing.
function qmRevertToDraftIfPublished(){
  const quiz=getQuiz(qmCurrentQuizId);
  if(quiz&&quiz.status==='published'){
    qmRenderStatusBadge(updateQuiz(qmCurrentQuizId,{status:'draft'}));
  }
}
function qmSaveMeta(){
  if(!qmCurrentQuizId)return;
  qmRevertToDraftIfPublished();
  updateQuiz(qmCurrentQuizId,{
    title:document.getElementById('qm-title').value.trim()||'Untitled Quiz',
    description:document.getElementById('qm-desc').value,
    moduleId:document.getElementById('qm-module').value
  });
}
function qmPublish(){
  const quiz=getQuiz(qmCurrentQuizId);
  if(!quiz||!quiz.questions.length){alert('Add at least one question before publishing this quiz.');return;}
  qmRenderStatusBadge(setQuizStatus(qmCurrentQuizId,'published'));
}
function qmSaveAsDraft(){
  qmRenderStatusBadge(setQuizStatus(qmCurrentQuizId,'draft'));
}
function qmDeleteCurrentQuiz(){
  if(!confirm('Delete this quiz? This cannot be undone.'))return;
  deleteQuiz(qmCurrentQuizId);
  qmShowList();
}

// ── Question builder ──
function qmRenderQuestions(quiz){
  const wrap=document.getElementById('qm-questions-list');
  if(!quiz.questions.length){
    wrap.innerHTML='<div class="info-box">No questions yet. Click ADD QUESTION to start building this quiz.</div>';
    return;
  }
  const letters=['A','B','C','D'];
  wrap.innerHTML=quiz.questions.map((q,i)=>{
    return '<div class="card" style="background:var(--glass);margin-bottom:12px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">'
        +'<div class="ctrl-label">QUESTION '+(i+1)+'</div>'
        +'<div class="btn-row" style="gap:6px;">'
          +'<button class="btn btn-ghost btn-sm" title="Move up" onclick="qmMoveQuestion(\''+q.id+'\',-1)" '+(i===0?'disabled':'')+'>▲</button>'
          +'<button class="btn btn-ghost btn-sm" title="Move down" onclick="qmMoveQuestion(\''+q.id+'\',1)" '+(i===quiz.questions.length-1?'disabled':'')+'>▼</button>'
          +'<button class="btn btn-red btn-sm" onclick="qmRemoveQuestion(\''+q.id+'\')">DELETE</button>'
        +'</div>'
      +'</div>'
      +'<div class="ctrl-group mb8"><div class="ctrl-label">Question Text</div>'
        +'<input type="text" value="'+qmAttr(q.text)+'" oninput="qmUpdateQuestionField(\''+q.id+'\',\'text\',this.value)"/></div>'
      +'<div class="ctrl-grid">'
        +q.choices.map((c,ci)=>'<div class="ctrl-group"><div class="ctrl-label">Choice '+letters[ci]+(ci===q.correctIndex?' <span style="color:var(--neon-g)">(Correct)</span>':'')+'</div>'
          +'<div style="display:flex;gap:6px;align-items:center;">'
            +'<input type="text" value="'+qmAttr(c)+'" oninput="qmUpdateChoice(\''+q.id+'\','+ci+',this.value)" style="flex:1;"/>'
            +'<label style="display:flex;align-items:center;gap:4px;font-size:11px;white-space:nowrap;cursor:pointer;">'
              +'<input type="radio" name="correct-'+q.id+'" '+(ci===q.correctIndex?'checked':'')+' onchange="qmSetCorrect(\''+q.id+'\','+ci+')"/>Correct'
            +'</label>'
          +'</div></div>').join('')
      +'</div>'
    +'</div>';
  }).join('');
}
function qmRefreshQuestionsOnly(){
  const quiz=getQuiz(qmCurrentQuizId);
  if(quiz)qmRenderQuestions(quiz);
}
function qmAddQuestion(){
  qmRevertToDraftIfPublished();
  addQuestion(qmCurrentQuizId,{text:'',choices:['','','',''],correctIndex:0});
  qmRefreshQuestionsOnly();
}
function qmRemoveQuestion(qid){
  qmRevertToDraftIfPublished();
  removeQuestion(qmCurrentQuizId,qid);
  qmRefreshQuestionsOnly();
}
function qmMoveQuestion(qid,dir){
  qmRevertToDraftIfPublished();
  reorderQuestion(qmCurrentQuizId,qid,dir);
  qmRefreshQuestionsOnly();
}
function qmUpdateQuestionField(qid,field,value){
  qmRevertToDraftIfPublished();
  updateQuestion(qmCurrentQuizId,qid,{[field]:value});
}
function qmUpdateChoice(qid,idx,value){
  qmRevertToDraftIfPublished();
  const quiz=getQuiz(qmCurrentQuizId);
  const q=quiz&&quiz.questions.find(x=>x.id===qid);
  if(!q)return;
  const choices=q.choices.slice();
  choices[idx]=value;
  updateQuestion(qmCurrentQuizId,qid,{choices});
}
function qmSetCorrect(qid,idx){
  qmRevertToDraftIfPublished();
  updateQuestion(qmCurrentQuizId,qid,{correctIndex:idx});
  qmRefreshQuestionsOnly();
}

document.querySelectorAll('.nav-item[data-page="quiz-manage"]').forEach(el=>{
  el.addEventListener('click',qmShowList);
});
seedQuizzesFromLegacyBank();
qmRenderList();
