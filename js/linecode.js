// ═══════════════════════════════════════
// LINE CODING
// ═══════════════════════════════════════
function lcGetSignal(bits,scheme){
  const n=bits.length;const sig=[];let amiSign=1;
  for(let i=0;i<n;i++){
    const b=bits[i];
    if(scheme==='NRZ-L (Unipolar)'){sig.push(b,b);}
    else if(scheme==='NRZ-L (Bipolar)'){sig.push(b?1:-1,b?1:-1);}
    else if(scheme==='NRZ-I'){const prev=i>0?bits[i-1]:0;const v=(b?!prev:!!prev)?-1:1;sig.push(v,v);}
    else if(scheme==='RZ (Unipolar)'){sig.push(b,0);}
    else if(scheme==='RZ (Bipolar)'){sig.push(b?1:-1,0);}
    else if(scheme==='Manchester'){sig.push(b?1:-1,b?-1:1);}
    else if(scheme==='Differential Manchester'){
      const prev=i>0?sig[sig.length-2]:1;
      if(b){sig.push(-prev,prev);}else{sig.push(prev,prev);}
    }
    else if(scheme==='AMI (Bipolar RZ)'){
      if(b){sig.push(amiSign,0);amiSign*=-1;}else{sig.push(0,0);}
    }
    else if(scheme==='B8ZS'||scheme==='HDB3'){
      if(b){sig.push(amiSign,0);amiSign*=-1;}else{sig.push(0,0);}
    }
    else{sig.push(b,b);}
  }
  return sig;
}

function lcSimulate(){
  const raw=document.getElementById('lc-bits').value.replace(/[^01]/g,'');
  const bits=raw.split('').map(Number);
  const scheme=document.getElementById('lc-scheme').value;
  const noise=+document.getElementById('lc-noise').value;
  let sig=lcGetSignal(bits,scheme);
  if(noise>0)sig=addNoise(sig,noise);
  document.getElementById('lc-scheme-disp').textContent=scheme;
  document.getElementById('lc-bits-disp').textContent=raw;
  const c=document.getElementById('lcCanvas');
  c.width=c.offsetWidth||700;c.height=180;
  c._redraw=()=>lcSimulate();
  // Draw step waveform
  const W=c.width,H=c.height;
  const ctx=c.getContext('2d');
  const lth=plotTheme();
  const pl=AX_L,pb=H-AX_B,pw=W-pl;
  ctx.clearRect(0,0,W,H);ctx.fillStyle=lth.bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=lth.grid;ctx.lineWidth=1;
  for(let i=0;i*pw/20<=pw;i++){ctx.beginPath();ctx.moveTo(pl+i*pw/20,0);ctx.lineTo(pl+i*pw/20,pb);ctx.stroke();}
  ctx.strokeStyle=lth.center;ctx.beginPath();ctx.moveTo(pl,pb/2);ctx.lineTo(W,pb/2);ctx.stroke();
  // axes
  ctx.strokeStyle=lth.axisLine;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(pl,0);ctx.lineTo(pl,pb);ctx.stroke();
  ctx.beginPath();ctx.moveTo(pl,pb);ctx.lineTo(W,pb);ctx.stroke();
  ctx.fillStyle=lth.axis;ctx.font='9px JetBrains Mono';ctx.textAlign='right';
  [1,0,-1].forEach(v=>{const y=pb/2-v*(pb*0.38);ctx.fillText(String(v),pl-4,y+3);});
  ctx.textAlign='left';
  ctx.strokeStyle='#c97bff';ctx.lineWidth=2;ctx.shadowColor='#c97bff';ctx.shadowBlur=5;
  ctx.beginPath();
  sig.forEach((v,i)=>{
    const x=pl+i/(sig.length-1)*pw,y=pb/2-v*(pb*0.38);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.stroke();ctx.shadowBlur=0;
  // bit dividers
  ctx.strokeStyle='rgba(255,196,64,0.2)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
  for(let i=1;i<bits.length;i++){const x=pl+i/bits.length*pw;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,pb);ctx.stroke();}
  ctx.setLineDash([]);
  // bit labels (x-axis)
  ctx.fillStyle=lth.axis;ctx.font='10px JetBrains Mono';ctx.textAlign='center';
  bits.forEach((b,i)=>ctx.fillText(b,pl+i/bits.length*pw+pw/bits.length/2,H-5));
  ctx.textAlign='left';
}

function lcRandom(){
  const n=8;let s='';for(let i=0;i<n;i++)s+=Math.round(Math.random());
  document.getElementById('lc-bits').value=s;lcSimulate();
}

function lcCompare(){
  const raw=document.getElementById('lc-cmp-bits').value.replace(/[^01]/g,'');
  const bits=raw.split('').map(Number);
  const sa=document.getElementById('lc-cmp-a').value;
  const sb=document.getElementById('lc-cmp-b').value;
  const sigA=lcGetSignal(bits,sa);
  const sigB=lcGetSignal(bits,sb);
  const colors=['#00e5a0','#c97bff'];
  function makeOsc(sig,scheme,color){
    const div=document.createElement('div');
    div.innerHTML=`<div class="compare-label" style="color:${color}">${scheme}</div><div class="osc-wrap"><canvas height="150"></canvas></div>`;
    const c=div.querySelector('canvas');
    requestAnimationFrame(()=>{
      c.width=c.offsetWidth||340;c.height=150;
      const W=c.width,H=c.height;
      const ctx=c.getContext('2d');ctx.clearRect(0,0,W,H);ctx.fillStyle='#060b15';ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(34,195,255,0.07)';ctx.lineWidth=1;
      for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(i*W/10,0);ctx.lineTo(i*W/10,H);ctx.stroke();}
      ctx.strokeStyle=color;ctx.lineWidth=2;ctx.shadowColor=color;ctx.shadowBlur=4;
      ctx.beginPath();sig.forEach((v,i)=>{const x=i/(sig.length-1)*W,y=H/2-v*(H*0.38);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
      ctx.stroke();ctx.shadowBlur=0;
    });
    return div;
  }
  const out=document.getElementById('lc-cmp-out');out.innerHTML='';
  out.appendChild(makeOsc(sigA,sa,colors[0]));
  out.appendChild(makeOsc(sigB,sb,colors[1]));
}

