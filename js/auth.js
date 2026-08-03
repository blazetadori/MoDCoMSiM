// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION (client-side demo auth, stored in this browser's
// localStorage as a small user "database". Good enough for a
// classroom demo / prototype — NOT a real backend. Passwords are
// stored in plain text in localStorage; do not reuse real passwords.
// ═══════════════════════════════════════════════════════════════
const USERS_KEY='modcosim-users';
const SESSION_KEY='modcosim-session';

// The one and only Admin account. Predefined, not stored in the student
// user list, and not creatable/editable from the Sign Up page.
const ADMIN_ACCOUNT={name:'Admin',email:'admin1',password:'admin123',role:'admin'};

function loadUsers(){
  try{return JSON.parse(localStorage.getItem(USERS_KEY))||[];}catch(e){return [];}
}
function saveUsers(list){
  try{localStorage.setItem(USERS_KEY,JSON.stringify(list));}catch(e){}
}
function seedDemoAccounts(){
  let users=loadUsers();
  const has=email=>users.some(u=>u.email.toLowerCase()===email);
  let changed=false;
  if(!has('student@modcomsim.edu')){
    users.push({name:'Juan Dela Cruz',email:'student@modcomsim.edu',password:'Student123!',role:'student'});
    changed=true;
  }
  if(changed)saveUsers(users);
}

function initials(name){
  const parts=(name||'?').trim().split(/\s+/);
  return ((parts[0]?.[0]||'')+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase()||'?';
}

function setAuthMsg(id,text,type){
  const el=document.getElementById(id);
  if(!el)return;
  el.textContent=text;
  el.className='auth-msg show '+(type||'err');
}
function clearAuthMsg(id){
  const el=document.getElementById(id);
  if(!el)return;
  el.className='auth-msg';
}

function authSwitchTab(which){
  document.getElementById('tabLoginBtn').classList.toggle('active',which==='login');
  document.getElementById('tabSignupBtn').classList.toggle('active',which==='signup');
  document.getElementById('loginForm').classList.toggle('active',which==='login');
  document.getElementById('signupForm').classList.toggle('active',which==='signup');
  clearAuthMsg('loginMsg');clearAuthMsg('signupMsg');
}

function togglePw(id,el){
  const input=document.getElementById(id);
  if(!input)return;
  const showing=input.type==='text';
  input.type=showing?'password':'text';
  el.textContent=showing?'SHOW':'HIDE';
}

function handleLogin(evt){
  evt.preventDefault();
  const rawInput=(document.getElementById('loginEmail').value||'').trim();
  const email=rawInput.toLowerCase();
  const pass=document.getElementById('loginPassword').value||'';
  if(!email||!pass){setAuthMsg('loginMsg','Enter your email and password.');return false;}

  if(rawInput===ADMIN_ACCOUNT.email&&pass===ADMIN_ACCOUNT.password){
    startSession(ADMIN_ACCOUNT);
    return false;
  }

  const users=loadUsers();
  const user=users.find(u=>u.email.toLowerCase()===email);
  if(!user||user.password!==pass){setAuthMsg('loginMsg','Incorrect email or password.');return false;}
  startSession(user);
  return false;
}

function handleSignup(evt){
  evt.preventDefault();
  const name=(document.getElementById('signupName').value||'').trim();
  const email=(document.getElementById('signupEmail').value||'').trim().toLowerCase();
  const pass=document.getElementById('signupPassword').value||'';
  if(!name||!email||!pass){setAuthMsg('signupMsg','Please fill in every field.');return false;}
  if(!/^\S+@\S+\.\S+$/.test(email)){setAuthMsg('signupMsg','Enter a valid email address.');return false;}
  if(pass.length<6){setAuthMsg('signupMsg','Password must be at least 6 characters.');return false;}
  if(email===ADMIN_ACCOUNT.email.toLowerCase()){setAuthMsg('signupMsg','That username is reserved — sign in instead.');return false;}
  const users=loadUsers();
  if(users.some(u=>u.email.toLowerCase()===email)){setAuthMsg('signupMsg','An account with that email already exists — sign in instead.');return false;}
  const newUser={name,email,password:pass,role:'student'};
  users.push(newUser);
  saveUsers(users);
  setAuthMsg('signupMsg','Account created! Signing you in…','ok');
  setTimeout(()=>startSession(newUser),450);
  return false;
}

function startSession(user){
  try{localStorage.setItem(SESSION_KEY,JSON.stringify({email:user.email,ts:Date.now()}));}catch(e){}
  showApp(user);
}

function handleLogout(){
  try{localStorage.removeItem(SESSION_KEY);}catch(e){}
  window.location.href='login.html';
}

// Redirects to the page for the user's role. Used after login/signup and
// when a page's own guard finds a valid session (see student.html / admin.html).
function showApp(user){
  window.location.href=user.role==='admin'?'admin.html':'student.html';
}

// Looks up the currently signed-in user from localStorage, if any, without
// navigating anywhere. Returns the user object or null.
function getSessionUser(){
  seedDemoAccounts();
  let session=null;
  try{session=JSON.parse(localStorage.getItem(SESSION_KEY));}catch(e){}
  if(!session)return null;
  if(session.email.toLowerCase()===ADMIN_ACCOUNT.email.toLowerCase()){
    return ADMIN_ACCOUNT;
  }
  const users=loadUsers();
  const user=users.find(u=>u.email.toLowerCase()===session.email.toLowerCase());
  return user||null;
}

// On login.html: if already signed in, skip the form and go straight to the app.
function resumeSession(){
  const user=getSessionUser();
  if(!user)return false;
  showApp(user);
  return true;
}

// On student.html / admin.html: if NOT signed in, bounce to login.html. If
// signed in as a Student trying to open admin.html, bounce to student.html
// (Students never reach Admin pages). Admins may open either page — the
// mode pill (see toggleAdminMode()) lets them preview student.html and
// jump back. Populates the header user info + mode when it succeeds.
function requireSession(requiredRole){
  const user=getSessionUser();
  if(!user){window.location.href='login.html';return null;}
  if(requiredRole==='admin'&&user.role!=='admin'){
    window.location.href='student.html';
    return null;
  }
  document.getElementById('hdrUserAvatar').textContent=initials(user.name);
  document.getElementById('hdrUserName').textContent=user.name;
  document.getElementById('hdrUserRole').textContent=user.role.toUpperCase();
  setMode(user.role==='admin'?'admin':'student');
  const pill=document.getElementById('modePill');
  if(pill)pill.style.display=user.role==='admin'?'flex':'none';
  return user;
}
