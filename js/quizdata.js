// ═══════════════════════════════════════════════════════════════
// CUSTOM QUIZ BUILDER — data layer (shared by admin.html and student.html)
// Client-side only, persisted to localStorage. Replaces the old fixed
// QUIZ_BANK topic/count picker: quizzes are now admin-authored objects
// with their own title, description, assigned module, ordered questions,
// and Draft/Published status.
// ═══════════════════════════════════════════════════════════════
const QUIZZES_KEY='modcosim-quizzes';

// Question shape: { id, text, choices:[c0,c1,c2,c3], correctIndex }
// Quiz shape: { id, title, description, moduleId, status:'draft'|'published',
//               questions:[Question], createdAt, updatedAt }

function loadQuizzes(){
  try{return JSON.parse(localStorage.getItem(QUIZZES_KEY))||[];}catch(e){return [];}
}
function saveQuizzes(list){
  try{localStorage.setItem(QUIZZES_KEY,JSON.stringify(list));}catch(e){}
}
function genId(prefix){
  return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
}
function getQuiz(id){
  return loadQuizzes().find(q=>q.id===id)||null;
}
function getPublishedQuizzes(){
  return loadQuizzes().filter(q=>q.status==='published');
}
function createQuiz(data){
  const quizzes=loadQuizzes();
  const now=new Date().toISOString();
  const quiz={
    id:genId('quiz'),
    title:(data&&data.title)||'Untitled Quiz',
    description:(data&&data.description)||'',
    moduleId:(data&&data.moduleId)||'',
    status:'draft',
    questions:[],
    createdAt:now,
    updatedAt:now
  };
  quizzes.push(quiz);
  saveQuizzes(quizzes);
  return quiz;
}
function updateQuiz(id,patch){
  const quizzes=loadQuizzes();
  const idx=quizzes.findIndex(q=>q.id===id);
  if(idx===-1)return null;
  quizzes[idx]=Object.assign({},quizzes[idx],patch,{updatedAt:new Date().toISOString()});
  saveQuizzes(quizzes);
  return quizzes[idx];
}
function deleteQuiz(id){
  saveQuizzes(loadQuizzes().filter(q=>q.id!==id));
}
function setQuizStatus(id,status){
  return updateQuiz(id,{status});
}

// ── Questions ──
function addQuestion(quizId,q){
  const quiz=getQuiz(quizId);
  if(!quiz)return null;
  quiz.questions.push({
    id:genId('q'),
    text:(q&&q.text)||'',
    choices:(q&&q.choices)||['','','',''],
    correctIndex:q&&q.correctIndex!=null?+q.correctIndex:0
  });
  return updateQuiz(quizId,{questions:quiz.questions});
}
function updateQuestion(quizId,questionId,patch){
  const quiz=getQuiz(quizId);
  if(!quiz)return null;
  const idx=quiz.questions.findIndex(q=>q.id===questionId);
  if(idx===-1)return null;
  quiz.questions[idx]=Object.assign({},quiz.questions[idx],patch);
  return updateQuiz(quizId,{questions:quiz.questions});
}
function removeQuestion(quizId,questionId){
  const quiz=getQuiz(quizId);
  if(!quiz)return null;
  quiz.questions=quiz.questions.filter(q=>q.id!==questionId);
  return updateQuiz(quizId,{questions:quiz.questions});
}
function reorderQuestion(quizId,questionId,dir){
  const quiz=getQuiz(quizId);
  if(!quiz)return null;
  const idx=quiz.questions.findIndex(q=>q.id===questionId);
  const target=idx+dir;
  if(idx===-1||target<0||target>=quiz.questions.length)return quiz;
  const arr=quiz.questions;
  [arr[idx],arr[target]]=[arr[target],arr[idx]];
  return updateQuiz(quizId,{questions:arr});
}

// ── One-time seed from the old fixed question bank (formerly QUIZ_BANK in
// quiz.js), grouped by topic, so Quiz Mode has content on first load
// instead of an empty list. Kept here as static data only. ──
const LEGACY_QUIZ_BANK=[
  {t:'Character Coding',q:'How many bits does standard 7-bit ASCII use?',opts:['5','6','7','8'],a:2},
  {t:'Character Coding',q:'What is the ASCII decimal code for the letter "A"?',opts:['61','65','70','97'],a:1},
  {t:'Character Coding',q:'Which parity scheme makes the total number of 1s always even?',opts:['Odd Parity','Even Parity','No Parity','Mark Parity'],a:1},
  {t:'Character Coding',q:'EBCDIC stands for:',opts:['Extended Binary Coded Decimal Interchange Code','Even Bit Coded Decimal','Extended Binary Character Digital Interchange Code','Extended Basic Code'],a:0},
  {t:'Character Coding',q:'UTF-8 can represent characters using how many bytes?',opts:['Only 1','Only 2','1 to 4','4 to 8'],a:2},
  {t:'PCM & Sampling',q:'According to Nyquist theorem, what is the minimum sampling rate for a 4 kHz signal?',opts:['4 kHz','8 kHz','16 kHz','2 kHz'],a:1},
  {t:'PCM & Sampling',q:'How many quantization levels does 8-bit PCM have?',opts:['8','64','128','256'],a:3},
  {t:'PCM & Sampling',q:'The SNR improvement per bit added in PCM is approximately:',opts:['1 dB','3 dB','6 dB','12 dB'],a:2},
  {t:'PCM & Sampling',q:'What is the main difference between Delta PCM and standard PCM?',opts:['Delta uses more bits','Delta encodes the slope (change), not the absolute value','Delta has no quantization','Delta requires no sampling'],a:1},
  {t:'PCM & Sampling',q:'Quantization error in PCM is caused by:',opts:['Transmission noise','Rounding sample values to discrete levels','Insufficient sampling rate','Poor reconstruction filter'],a:1},
  {t:'Line Coding',q:'Which line coding scheme has a built-in clock (self-clocking)?',opts:['NRZ-L','AMI','Manchester','RZ Unipolar'],a:2},
  {t:'Line Coding',q:'What is the DC component problem in NRZ-L encoding?',opts:['Too many transitions','Constant voltage level for long runs of same bits','No clock recovery','High error rate'],a:1},
  {t:'Line Coding',q:'In AMI (Alternate Mark Inversion), bit 0 is represented by:',opts:['Zero voltage','Alternating +V and -V','Always +V','Always -V'],a:0},
  {t:'Line Coding',q:'What does B8ZS substitution solve?',opts:['High error rates','Lack of parity bits','Long strings of zeros (no transitions)','Clock frequency mismatch'],a:2},
  {t:'Digital Modulation',q:'In ASK (OOK), what does the signal look like for bit 0?',opts:['A low-frequency sinusoid','Zero amplitude (silence)','180° phase shift','Maximum amplitude'],a:1},
  {t:'Digital Modulation',q:'FSK switches between two different:',opts:['Amplitudes','Phases','Frequencies','Bit widths'],a:2},
  {t:'Digital Modulation',q:'BPSK represents bit 0 and bit 1 with:',opts:['Different frequencies','Different amplitudes','0° and 180° phase shifts','0° and 90° phase shifts'],a:2},
  {t:'Digital Modulation',q:'QPSK transmits how many bits per symbol?',opts:['1','2','4','8'],a:1},
  {t:'Digital Modulation',q:'Which modulation is most immune to amplitude noise?',opts:['ASK','OOK','FSK','PAM'],a:2},
  {t:'Digital Modulation',q:'16-QAM carries how many bits per symbol?',opts:['2','4','8','16'],a:1},
  {t:'Error Detection',q:'Hamming(7,4) encodes 4 data bits into how many total bits?',opts:['4','7','8','11'],a:1},
  {t:'Error Detection',q:'CRC stands for:',opts:['Cyclic Redundancy Check','Coded Reliability Check','Cyclic Routing Control','Channel Redundancy Code'],a:0},
  {t:'Error Detection',q:'A single parity bit can detect how many bit errors?',opts:['Any number','Two-bit errors','One-bit errors','Three-bit errors'],a:2},
  {t:'Error Detection',q:'In Hamming code, parity bits are placed at positions that are:',opts:['Even numbers','Powers of 2','Prime numbers','Multiples of 3'],a:1},
  {t:'Error Detection',q:'If CRC remainder after division is non-zero, it indicates:',opts:['No error','An error was detected','More bits needed','Generator mismatch'],a:1},
  {t:'Multiplexing',q:'TDM assigns different ________ to different users.',opts:['Frequencies','Time slots','Amplitudes','Phases'],a:1},
  {t:'Multiplexing',q:'FDM assigns different ________ to different users.',opts:['Time slots','Bit widths','Frequencies','Power levels'],a:2},
  {t:'Multiplexing',q:'Guard bands in FDM are used to:',opts:['Amplify signals','Prevent inter-channel interference','Add parity','Increase bit rate'],a:1},
  {t:'Multiplexing',q:'OFDM (used in Wi-Fi) is a variant of:',opts:['TDM','FDM','CDM','PDM'],a:1}
];
function seedQuizzesFromLegacyBank(){
  if(loadQuizzes().length)return; // already seeded or admin has created quizzes
  const byTopic={};
  LEGACY_QUIZ_BANK.forEach(q=>{(byTopic[q.t]=byTopic[q.t]||[]).push(q);});
  const topicModule={
    'Character Coding':'charcode','PCM & Sampling':'pcm','Line Coding':'linecode',
    'Digital Modulation':'digitalmod','Error Detection':'edc','Multiplexing':'mux'
  };
  const quizzes=Object.keys(byTopic).map(topic=>{
    const now=new Date().toISOString();
    return {
      id:genId('quiz'),
      title:topic+' Quiz',
      description:'Starter quiz covering '+topic+'.',
      moduleId:topicModule[topic]||'',
      status:'published',
      questions:byTopic[topic].map(q=>({
        id:genId('q'),text:q.q,choices:q.opts.slice(),correctIndex:q.a
      })),
      createdAt:now,updatedAt:now
    };
  });
  saveQuizzes(quizzes);
}
