// ═══════════════════════════════════════
// COMPARE MODE
// ═══════════════════════════════════════
function cmpDraw(cid,scheme,bits,fc,color,label){
  const c=document.getElementById(cid);c.width=c.offsetWidth||340;c.height=180;
  const N=400;const fs=fc*16;const bpS=Math.floor(N/bits.length);
  const W=c.width,H=c.height;const ctx=c.getContext('2d');
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060b15';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(34,195,255,0.07)';ctx.lineWidth=1;
  for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(i*W/10,0);ctx.lineTo(i*W/10,H);ctx.stroke();}
  let sig;
  if(scheme==='Manchester'||scheme==='NRZ-L (Bipolar)'||scheme==='NRZ-L (Unipolar)'||scheme==='NRZ-I'){
    const raw=lcGetSignal(bits,scheme);
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.shadowColor=color;ctx.shadowBlur=5;
    ctx.beginPath();
    raw.forEach((v,i)=>{const x=i/(raw.length-1)*W,y=H/2-v*(H*0.38);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
    ctx.stroke();ctx.shadowBlur=0;return;
  }
  const msg=[];bits.forEach(b=>{for(let j=0;j<bpS;j++)msg.push(b?1:-1);});
  if(scheme==='BPSK')sig=Array.from({length:N},(_,i)=>msg[Math.min(i,N-1)]*Math.cos(2*Math.PI*fc*i/fs));
  else if(scheme==='ASK')sig=Array.from({length:N},(_,i)=>Math.max(0,msg[Math.min(i,N-1)])*Math.cos(2*Math.PI*fc*i/fs));
  else if(scheme==='FSK')sig=Array.from({length:N},(_,i)=>{const b=msg[Math.min(i,N-1)]>0;return Math.cos(2*Math.PI*(b?fc:fc/2)*i/fs);});
  else if(scheme==='QPSK'){
    sig=Array.from({length:N},(_,i)=>{
      const si=Math.floor(i/bpS*2);const b1=bits[Math.min(Math.floor(si/2),bits.length-1)],b2=bits[Math.min(Math.floor(si/2)+1,bits.length-1)];
      const key=(b1<<1)|b2;const ph=QPSK_MAP[key]||0;
      return Math.cos(2*Math.PI*fc*i/fs+ph);
    });
  } else sig=msg.map(v=>v*Math.cos(2*Math.PI*fc*0/fs));
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.shadowColor=color;ctx.shadowBlur=5;
  ctx.beginPath();(sig||[]).forEach((v,i)=>{const x=i/(N-1)*W,y=H/2-v*(H*0.2);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
  ctx.stroke();ctx.shadowBlur=0;
}

function cmpSimulate(){
  const raw=document.getElementById('cmp-bits').value.replace(/[^01]/g,'');
  const bits=raw.split('').map(Number);
  const sa=document.getElementById('cmp-a').value;
  const sb=document.getElementById('cmp-b').value;
  const fc=+document.getElementById('cmp-fc').value;
  document.getElementById('cmp-label-a').textContent=sa.toUpperCase();
  document.getElementById('cmp-label-b').textContent=sb.toUpperCase();
  requestAnimationFrame(()=>{
    cmpDraw('cmpCanvasA',sa,bits,fc,'#00e5a0',sa);
    cmpDraw('cmpCanvasB',sb,bits,fc,'#c97bff',sb);
  });
}

