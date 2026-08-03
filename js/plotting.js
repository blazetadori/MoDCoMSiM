// Gaussian noise
function randn(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function addNoise(sig,level){return sig.map(v=>v+randn()*level);}

// Theme-aware plot palette so canvases follow light/dark mode
function plotTheme(){
  const light=document.documentElement.getAttribute('data-theme')==='light';
  return light
    ? {bg:'#f8f9fc',grid:'rgba(10,110,189,0.10)',center:'rgba(10,110,189,0.26)',axis:'rgba(30,36,51,0.65)',axisLine:'rgba(10,110,189,0.38)',cursor:'#0a6ebd'}
    : {bg:'#060b15',grid:'rgba(34,195,255,0.07)',center:'rgba(34,195,255,0.15)',axis:'rgba(200,216,240,0.55)',axisLine:'rgba(34,195,255,0.28)',cursor:'#ffffff'};
}

// Draw oscilloscope (time-domain amplitude plot) with X/Y axes and an
// interactive draggable cursor: hover/drag along the trace to read the
// exact (time, amplitude) value at that point.
const AX_L=36, AX_B=18; // left margin (amplitude axis), bottom margin (time axis)
function drawOsc(canvas,signals,colors,opts={}){
  // cache the last args on the canvas so we can re-render (theme change / cursor move)
  canvas._oscArgs={signals,colors,opts};
  canvas._redraw=()=>renderOsc(canvas);
  renderOsc(canvas);
  bindOscCursor(canvas);
}
function renderOsc(canvas,cursor){
  const {signals,colors,opts}=canvas._oscArgs||{signals:[],colors:[],opts:{}};
  const W=canvas.width=canvas.offsetWidth||700;
  const H=canvas.height||220;
  const ctx=canvas.getContext('2d');
  const th=plotTheme();
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);
  const pl=AX_L, pb=H-AX_B, pw=W-pl, phh=pb;
  // grid (plot area only)
  ctx.strokeStyle=th.grid;ctx.lineWidth=1;
  const gx=Math.max(1,Math.floor(pw/20)),gy=Math.max(1,Math.floor(phh/10));
  for(let i=0;i*gx<=pw;i++){ctx.beginPath();ctx.moveTo(pl+i*gx,0);ctx.lineTo(pl+i*gx,phh);ctx.stroke();}
  for(let i=0;i*gy<=phh;i++){ctx.beginPath();ctx.moveTo(pl,i*gy);ctx.lineTo(W,i*gy);ctx.stroke();}
  const n=signals.length||1;
  const rows=signals.map((sig,si)=>{
    const slotH=phh/n;
    const cy=slotH*(si+0.5);
    const scale=opts.scales?opts.scales[si]:(slotH*0.38);
    return {cy,scale};
  });
  // per-row center line
  rows.forEach(r=>{ctx.strokeStyle=th.center;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pl,r.cy);ctx.lineTo(W,r.cy);ctx.stroke();});
  // Y AXIS (amplitude) — ticks for the first signal row, representative of the plot's amplitude scale
  ctx.strokeStyle=th.axisLine;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(pl,0);ctx.lineTo(pl,phh);ctx.stroke();
  if(signals[0]&&signals[0].length){
    const vals=signals[0];
    const vMax=Math.max(...vals,0.001),vMin=Math.min(...vals,-0.001);
    const r0=rows[0];
    ctx.fillStyle=th.axis;ctx.font='9px JetBrains Mono';ctx.textAlign='right';
    [ [vMax,r0.cy-vMax*r0.scale], [0,r0.cy], [vMin,r0.cy-vMin*r0.scale] ].forEach(([v,y])=>{
      if(y<-4||y>phh+4)return;
      ctx.fillText(v.toFixed(2),pl-4,y+3);
      ctx.strokeStyle=th.axisLine;ctx.beginPath();ctx.moveTo(pl-3,y);ctx.lineTo(pl,y);ctx.stroke();
    });
    ctx.save();ctx.translate(10,phh/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';
    ctx.fillText('Amplitude',0,0);ctx.restore();
  }
  // X AXIS (time / sample index)
  ctx.strokeStyle=th.axisLine;ctx.beginPath();ctx.moveTo(pl,phh);ctx.lineTo(W,phh);ctx.stroke();
  const maxLen=Math.max(...signals.map(s=>s?s.length:0),2);
  ctx.fillStyle=th.axis;ctx.font='9px JetBrains Mono';ctx.textAlign='center';
  for(let i=0;i<=4;i++){
    const idx=Math.round((maxLen-1)*i/4);
    const x=pl+i/4*pw;
    ctx.fillText(String(idx),x,H-5);
    ctx.strokeStyle=th.axisLine;ctx.beginPath();ctx.moveTo(x,phh);ctx.lineTo(x,phh+3);ctx.stroke();
  }
  ctx.textAlign='left';
  // traces
  signals.forEach((sig,si)=>{
    if(!sig||!sig.length)return;
    const {cy,scale}=rows[si];
    ctx.strokeStyle=colors[si]||'#00e5a0';
    ctx.lineWidth=opts.lineWidths?opts.lineWidths[si]:1.8;
    ctx.shadowColor=colors[si];ctx.shadowBlur=4;
    ctx.beginPath();
    sig.forEach((v,i)=>{
      const x=pl+i/(sig.length-1)*pw;
      const y=cy-v*scale;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();ctx.shadowBlur=0;
    if(opts.labels&&opts.labels[si]){
      ctx.fillStyle=colors[si];ctx.font='10px JetBrains Mono';
      ctx.fillText(opts.labels[si],pl+6,cy-scale-4);
    }
  });
  // interactive amplitude cursor (dot + crosshair) at the hovered/dragged position
  if(cursor&&signals[cursor.row]&&signals[cursor.row].length){
    const sig=signals[cursor.row];const {cy,scale}=rows[cursor.row];
    const i=Math.max(0,Math.min(sig.length-1,Math.round((cursor.x-pl)/pw*(sig.length-1))));
    const v=sig[i];
    const x=pl+i/(sig.length-1)*pw, y=cy-v*scale;
    ctx.strokeStyle=th.cursor;ctx.setLineDash([3,3]);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,phh);ctx.stroke();
    ctx.beginPath();ctx.moveTo(pl,y);ctx.lineTo(W,y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=colors[cursor.row]||th.cursor;
    ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=th.cursor;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.stroke();
    return {i,v,x,y};
  }
}
// bind pointer interactivity (hover + drag) once per canvas
function bindOscCursor(canvas){
  if(canvas.dataset.ampBound)return;
  canvas.dataset.ampBound='1';
  const wrap=canvas.closest('.osc-wrap')||canvas.parentElement;
  let readout=wrap.querySelector('.osc-readout');
  if(!readout){readout=document.createElement('div');readout.className='osc-readout';wrap.appendChild(readout);}
  let dragging=false;
  function pos(e){
    const rect=canvas.getBoundingClientRect();
    const cx=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
    const cy=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;
    const scaleX=canvas.width/rect.width, scaleY=canvas.height/rect.height;
    return {x:cx*scaleX,y:cy*scaleY};
  }
  function update(e){
    const {signals}=canvas._oscArgs||{signals:[]};
    if(!signals.length)return;
    const p=pos(e);
    const H=canvas.height,n=signals.length,phh=H-AX_B;
    let row=Math.floor(p.y/(phh/n));
    row=Math.max(0,Math.min(n-1,row));
    const r=renderOsc(canvas,{row,x:p.x});
    if(r){
      readout.textContent=`t=${r.i}  A=${r.v.toFixed(3)}`;
      readout.classList.add('show');
    }
  }
  function clear(){renderOsc(canvas);readout.classList.remove('show');}
  canvas.style.cursor='crosshair';
  canvas.addEventListener('mousemove',e=>{if(canvas._oscArgs)update(e);});
  canvas.addEventListener('mouseleave',clear);
  canvas.addEventListener('mousedown',e=>{dragging=true;update(e);});
  window.addEventListener('mouseup',()=>dragging=false);
  canvas.addEventListener('touchstart',e=>{update(e);},{passive:true});
  canvas.addEventListener('touchmove',e=>{update(e);e.preventDefault();},{passive:false});
  canvas.addEventListener('touchend',clear);
}

function drawDigital(canvas,bits,colors,opts={}){
  const W=canvas.width=canvas.offsetWidth||700;
  const H=canvas.height||180;
  const ctx=canvas.getContext('2d');
  const th=plotTheme();
  canvas._redraw=()=>drawDigital(canvas,bits,colors,opts);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);
  const pl=AX_L,pb=H-AX_B,pw=W-pl;
  ctx.strokeStyle=th.grid;ctx.lineWidth=1;
  for(let i=0;i<=20;i++){ctx.beginPath();ctx.moveTo(pl+i*pw/20,0);ctx.lineTo(pl+i*pw/20,pb);ctx.stroke();}
  for(let i=0;i<=8;i++){ctx.beginPath();ctx.moveTo(pl,i*pb/8);ctx.lineTo(W,i*pb/8);ctx.stroke();}
  // axes
  ctx.strokeStyle=th.axisLine;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(pl,0);ctx.lineTo(pl,pb);ctx.stroke();
  ctx.beginPath();ctx.moveTo(pl,pb);ctx.lineTo(W,pb);ctx.stroke();
  ctx.fillStyle=th.axis;ctx.font='9px JetBrains Mono';ctx.textAlign='right';
  ctx.fillText('1',pl-4,pb*0.22+3);
  ctx.fillText('0',pl-4,pb*0.78+3);
  ctx.textAlign='left';

  const n=bits.length;
  const hi=pb*0.22,lo=pb*0.78,bw=pw/n;
  ctx.strokeStyle=colors[0]||'#22c3ff';ctx.lineWidth=2;
  ctx.shadowColor=colors[0];ctx.shadowBlur=5;
  ctx.beginPath();
  bits.forEach((b,i)=>{
    const x=pl+i*bw,xn=pl+(i+1)*bw;
    const y=b?hi:lo;
    if(i===0)ctx.moveTo(x,y);
    else{const py=bits[i-1]?hi:lo;if(py!==y){ctx.lineTo(x,py);ctx.lineTo(x,y);}}
    ctx.lineTo(xn,y);
  });
  ctx.stroke();ctx.shadowBlur=0;
  // bit labels (x-axis values)
  ctx.fillStyle=th.axis;ctx.font='10px JetBrains Mono';ctx.textAlign='center';
  bits.forEach((b,i)=>ctx.fillText(b,pl+i*bw+bw/2,H-4));
  ctx.textAlign='left';
}

// ═══════════════════════════════════════
// FFT / SPECTRUM ANALYSIS
// ═══════════════════════════════════════
function fftMag(sig,fs){
  // zero-pad to next power of two
  let N=1;while(N<sig.length)N*=2;
  if(N<16)N=16;
  const re=new Float64Array(N),im=new Float64Array(N);
  const n=sig.length;
  for(let i=0;i<n;i++){
    // Hann window to reduce spectral leakage
    const w=n>1?(0.5-0.5*Math.cos(2*Math.PI*i/(n-1))):1;
    re[i]=sig[i]*w;
  }
  // bit-reversal permutation
  for(let i=1,j=0;i<N;i++){
    let bit=N>>1;
    for(;j&bit;bit>>=1)j^=bit;
    j^=bit;
    if(i<j){const tr=re[i];re[i]=re[j];re[j]=tr;const ti=im[i];im[i]=im[j];im[j]=ti;}
  }
  // radix-2 Cooley-Tukey
  for(let len=2;len<=N;len<<=1){
    const ang=-2*Math.PI/len;
    const wr0=Math.cos(ang),wi0=Math.sin(ang);
    for(let i=0;i<N;i+=len){
      let cwr=1,cwi=0;
      for(let k=0;k<len/2;k++){
        const ur=re[i+k],ui=im[i+k];
        const vr=re[i+k+len/2]*cwr-im[i+k+len/2]*cwi;
        const vi=re[i+k+len/2]*cwi+im[i+k+len/2]*cwr;
        re[i+k]=ur+vr;im[i+k]=ui+vi;
        re[i+k+len/2]=ur-vr;im[i+k+len/2]=ui-vi;
        const nwr=cwr*wr0-cwi*wi0,nwi=cwr*wi0+cwi*wr0;
        cwr=nwr;cwi=nwi;
      }
    }
  }
  const half=N/2;
  const mags=new Array(half),freqs=new Array(half);
  for(let k=0;k<half;k++){
    mags[k]=Math.sqrt(re[k]*re[k]+im[k]*im[k])/N;
    freqs[k]=k*fs/N;
  }
  return {freqs,mags};
}

// Draw a frequency-domain spectrum (magnitude vs frequency) for a time-domain signal.
// Renders a closed Cartesian frame (both axes + top/right border) and supports an
// interactive crosshair cursor — hover/drag along the trace to read the exact
// (frequency, magnitude) value at that point, the same way the oscilloscope does
// for (time, amplitude).
const SPEC_AX_R=14, SPEC_AX_T=16;
function computeSpecData(sig,fs,opts){
  if(!sig||sig.length<4)return null;
  const {freqs,mags}=fftMag(sig,fs);
  const maxFreq=opts.maxFreq||fs/2;
  let useBins=freqs.findIndex(f=>f>maxFreq);
  if(useBins<=1)useBins=freqs.length;
  const maxMag=Math.max(...mags.slice(0,useBins),1e-6);
  return {freqs,mags,maxFreq,useBins,maxMag};
}
function drawSpectrum(canvas,sig,fs,opts={}){
  // cache the last args (+ the FFT result, so dragging the cursor doesn't
  // recompute the transform on every pointer move) for re-render on theme
  // change / cursor move
  canvas._specArgs={sig,fs,opts,specData:computeSpecData(sig,fs,opts)};
  canvas._redraw=()=>renderSpectrum(canvas);
  renderSpectrum(canvas);
  bindSpecCursor(canvas);
}
function renderSpectrum(canvas,cursor){
  const {opts,specData}=canvas._specArgs||{opts:{}};
  const W=canvas.width=canvas.offsetWidth||700;
  const H=canvas.height||200;
  const ctx=canvas.getContext('2d');
  const th=plotTheme();
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);
  const pl=AX_L, pr=SPEC_AX_R, pt=SPEC_AX_T, pb=H-AX_B;
  const pw=W-pl-pr, phh=pb-pt;
  // grid (plot area only)
  ctx.strokeStyle=th.grid;ctx.lineWidth=1;
  const gx=Math.max(1,Math.floor(pw/20)),gy=Math.max(1,Math.floor(phh/8));
  for(let i=0;i*gx<=pw;i++){ctx.beginPath();ctx.moveTo(pl+i*gx,pt);ctx.lineTo(pl+i*gx,pb);ctx.stroke();}
  for(let i=0;i*gy<=phh;i++){ctx.beginPath();ctx.moveTo(pl,pt+i*gy);ctx.lineTo(pl+pw,pt+i*gy);ctx.stroke();}
  // closed Cartesian frame (all four sides, not just the two axes)
  ctx.strokeStyle=th.axisLine;ctx.lineWidth=1;
  ctx.strokeRect(pl+0.5,pt+0.5,pw-1,phh-1);
  if(!specData)return;
  const {freqs,mags,maxFreq,useBins,maxMag}=specData;
  const color=opts.color||'#00e5a0';
  ctx.strokeStyle=color;ctx.lineWidth=1.6;
  ctx.shadowColor=color;ctx.shadowBlur=4;
  ctx.beginPath();ctx.moveTo(pl,pb);
  for(let k=0;k<useBins;k++){
    const x=pl+k/(useBins-1)*pw;
    const y=pb-(mags[k]/maxMag)*phh;
    ctx.lineTo(x,y);
  }
  ctx.lineTo(pl+pw,pb);
  ctx.closePath();
  ctx.fillStyle=color+'33';ctx.fill();
  ctx.stroke();ctx.shadowBlur=0;
  // Y axis — normalized magnitude
  ctx.fillStyle=th.axis;ctx.font='9px JetBrains Mono';ctx.textAlign='right';
  [1,0.75,0.5,0.25,0].forEach(v=>{
    const y=pb-v*phh;
    ctx.fillText(v.toFixed(2),pl-4,y+3);
    ctx.beginPath();ctx.strokeStyle=th.axisLine;ctx.moveTo(pl-3,y);ctx.lineTo(pl,y);ctx.stroke();
  });
  ctx.save();ctx.translate(11,pt+phh/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';
  ctx.fillText('Magnitude',0,0);ctx.restore();
  // X axis — frequency labels
  ctx.fillStyle=th.axis;ctx.font='9px JetBrains Mono';ctx.textAlign='center';
  for(let i=0;i<=5;i++){
    const f=maxFreq*i/5;
    const x=pl+i/5*pw;
    ctx.fillText(f.toFixed(1)+' Hz',x,H-4);
    ctx.strokeStyle=th.axisLine;ctx.beginPath();ctx.moveTo(x,pb);ctx.lineTo(x,pb+3);ctx.stroke();
  }
  ctx.textAlign='left';
  if(opts.label){ctx.fillStyle=color;ctx.font='10px JetBrains Mono';ctx.fillText(opts.label,pl+6,pt+12);}
  // interactive frequency/magnitude cursor (dot + crosshair) at the hovered/dragged position
  if(cursor){
    const relX=Math.max(0,Math.min(pw,cursor.x-pl));
    const k=Math.max(0,Math.min(useBins-1,Math.round(relX/pw*(useBins-1))));
    const f=freqs[k],m=mags[k];
    const x=pl+k/(useBins-1)*pw, y=pb-(m/maxMag)*phh;
    ctx.strokeStyle=th.cursor;ctx.setLineDash([3,3]);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,pt);ctx.lineTo(x,pb);ctx.stroke();
    ctx.beginPath();ctx.moveTo(pl,y);ctx.lineTo(pl+pw,y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=color;
    ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=th.cursor;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.stroke();
    return {f,m,x,y};
  }
}
// bind pointer interactivity (hover + drag) once per spectrum canvas — mirrors bindOscCursor
function bindSpecCursor(canvas){
  if(canvas.dataset.specBound)return;
  canvas.dataset.specBound='1';
  const wrap=canvas.closest('.osc-wrap')||canvas.parentElement;
  let readout=wrap.querySelector('.osc-readout');
  if(!readout){readout=document.createElement('div');readout.className='osc-readout';wrap.appendChild(readout);}
  function pos(e){
    const rect=canvas.getBoundingClientRect();
    const cx=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
    const scaleX=canvas.width/rect.width;
    return {x:cx*scaleX};
  }
  function update(e){
    if(!canvas._specArgs||!canvas._specArgs.specData)return;
    const p=pos(e);
    const r=renderSpectrum(canvas,{x:p.x});
    if(r){
      readout.textContent=`f=${r.f.toFixed(2)} Hz  Mag=${r.m.toFixed(3)}`;
      readout.classList.add('show');
    }
  }
  function clear(){renderSpectrum(canvas);readout.classList.remove('show');}
  canvas.style.cursor='crosshair';
  canvas.addEventListener('mousemove',e=>{if(canvas._specArgs)update(e);});
  canvas.addEventListener('mouseleave',clear);
  canvas.addEventListener('mousedown',e=>update(e));
  canvas.addEventListener('touchstart',e=>{update(e);},{passive:true});
  canvas.addEventListener('touchmove',e=>{update(e);e.preventDefault();},{passive:false});
  canvas.addEventListener('touchend',clear);
}


function exportCanvas(id,filename){
  const c=document.getElementById(id);
  if(!c)return;
  const a=document.createElement('a');a.href=c.toDataURL();a.download=filename;a.click();
}
function exportText(id,filename){
  const el=document.getElementById(id);if(!el)return;
  const blob=new Blob([el.textContent||el.value],{type:'text/plain'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}

