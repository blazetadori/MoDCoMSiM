// ═══════════════════════════════════════
// MODULATION HELPERS
// ═══════════════════════════════════════
function modCanvas(cid,bits,fc,amp,modFn,colors,labels){
  const c=document.getElementById(cid);
  c.width=c.offsetWidth||700;
  const N=512;const fs=fc*16;
  const msg=[];bits.forEach(b=>{for(let j=0;j<N/bits.length;j++)msg.push(b);});
  const carrier=Array.from({length:N},(_,i)=>amp*Math.cos(2*Math.PI*fc*i/fs));
  const modSig=modFn(msg,carrier,bits,fc,amp,fs,N);
  drawOsc(c,[msg,modSig],colors,{labels,scales:[amp*0.3*c.height/4,amp*0.3*c.height/4]});
}

// ASK
function askSimulate(){
  const bits=document.getElementById('ask-bits').value.replace(/[^01]/g,'').split('').map(Number);
  const fc=+document.getElementById('ask-fc').value;
  const a1=+document.getElementById('ask-a1').value;
  const a0=+document.getElementById('ask-a0').value;
  const noise=+document.getElementById('ask-noise').value;
  const N=600;const fs=fc*16;
  const bpS=Math.floor(N/bits.length);
  const msg=[];bits.forEach(b=>{for(let j=0;j<bpS;j++)msg.push(b);});
  const carrier=Array.from({length:N},(_,i)=>Math.cos(2*Math.PI*fc*i/fs));
  const ask=msg.map((b,i)=>(b?a1:a0)*carrier[i]);
  const noisyAsk=noise>0?addNoise(ask,noise):ask;
  const demod=noisyAsk.map(v=>Math.abs(v)>0.3?1:0);
  const c=document.getElementById('askCanvas');c.width=c.offsetWidth||700;c.height=260;
  drawOsc(c,[msg,noisyAsk,demod],['#22c3ff','#ffc440','#00e5a0'],{labels:['Message','ASK','Demod'],scales:[c.height*0.06,c.height*0.1,c.height*0.06]});
  const sc=document.getElementById('askSpecCanvas');
  if(sc)drawSpectrum(sc,noisyAsk,fs,{color:'#ffc440',label:'ASK Spectrum',maxFreq:fc*4});
}

// ASK step mode
let askStepIdx=0;
const askStepDescriptions=[
  'The message signal is a digital baseband (NRZ) signal. Each bit occupies one symbol period.',
  'The carrier is a continuous sinusoid: s(t) = A·cos(2πfct). Frequency fc must be >> bit rate.',
  'ASK output: multiply each bit\'s amplitude by the carrier. Bit 1 → A1·cos(2πfct), Bit 0 → A0·cos(2πfct).',
  'Demodulation: envelope detection. Rectify → LPF → threshold compare. Output recovers original bits.'
];
function askStep(idx){
  askStepIdx=idx;
  document.querySelectorAll('[id^="ask-s"]').forEach((el,i)=>{el.className='step-btn'+(i===idx?' active':'');});
  document.getElementById('ask-step-desc').textContent=askStepDescriptions[idx];
  const bits=[1,0,1,1,0,1,0,0];
  const fc=8;const N=400;const fs=fc*16;const bpS=Math.floor(N/bits.length);
  const msg=[];bits.forEach(b=>{for(let j=0;j<bpS;j++)msg.push(b);});
  const carrier=Array.from({length:N},(_,i)=>Math.cos(2*Math.PI*fc*i/fs));
  const ask=msg.map((b,i)=>(b?1:0)*carrier[i]);
  const demod=ask.map(v=>Math.abs(v)>0.3?1:0);
  const signals=[[msg,carrier,ask,demod][idx]];
  const colors=[['#22c3ff'],['#ffc440'],['#ff8c42'],['#00e5a0']][idx];
  const c=document.getElementById('askStepCanvas');c.width=c.offsetWidth||700;c.height=200;
  drawOsc(c,signals,colors,{scales:[c.height*0.1]});
}
askStep(0);

// FSK
function fskSimulate(){
  const bits=document.getElementById('fsk-bits').value.replace(/[^01]/g,'').split('').map(Number);
  const f1=+document.getElementById('fsk-f1').value;
  const f0=+document.getElementById('fsk-f0').value;
  const amp=+document.getElementById('fsk-amp').value;
  const noise=+document.getElementById('fsk-noise').value;
  const N=600;const fs=Math.max(f1,f0)*16;const bpS=Math.floor(N/bits.length);
  const msg=[];bits.forEach(b=>{for(let j=0;j<bpS;j++)msg.push(b);});
  const fsk=Array.from({length:N},(_,i)=>{const b=msg[Math.min(i,N-1)];return amp*Math.cos(2*Math.PI*(b?f1:f0)*i/fs);});
  const nFsk=noise>0?addNoise(fsk,noise):fsk;
  // Demodulation: per-symbol correlator against the f1 and f0 reference tones
  // (coherent detection) — whichever tone correlates more strongly wins the bit.
  const demod=new Array(N).fill(0);
  for(let s=0;s<bits.length;s++){
    let corr1=0,corr0=0;
    for(let i=s*bpS;i<Math.min((s+1)*bpS,N);i++){
      corr1+=nFsk[i]*Math.cos(2*Math.PI*f1*i/fs);
      corr0+=nFsk[i]*Math.cos(2*Math.PI*f0*i/fs);
    }
    const bit=Math.abs(corr1)>Math.abs(corr0)?1:0;
    for(let i=s*bpS;i<Math.min((s+1)*bpS,N);i++)demod[i]=bit;
  }
  const c=document.getElementById('fskCanvas');c.width=c.offsetWidth||700;c.height=220;
  drawOsc(c,[msg,nFsk,demod],['#22c3ff','#ffc440','#00e5a0'],{labels:['Message','FSK','Demod'],scales:[c.height*0.05,c.height*0.09,c.height*0.05]});
  const sc=document.getElementById('fskSpecCanvas');
  if(sc)drawSpectrum(sc,nFsk,fs,{color:'#ffc440',label:'FSK Spectrum',maxFreq:Math.max(f1,f0)*3});
}

// BPSK
function bpskSimulate(){
  const bits=document.getElementById('bpsk-bits').value.replace(/[^01]/g,'').split('').map(Number);
  const fc=+document.getElementById('bpsk-fc').value;
  const amp=+document.getElementById('bpsk-amp').value;
  const noise=+document.getElementById('bpsk-noise').value;
  const N=600;const fs=fc*16;const bpS=Math.floor(N/bits.length);
  const msg=[];bits.forEach(b=>{for(let j=0;j<bpS;j++)msg.push(b?1:-1);});
  const bpsk=Array.from({length:N},(_,i)=>amp*msg[Math.min(i,N-1)]*Math.cos(2*Math.PI*fc*i/fs));
  const nBpsk=noise>0?addNoise(bpsk,noise):bpsk;
  // Demodulation: coherent detection — correlate each symbol against the
  // local carrier reference; the sign of the correlation gives the bit.
  const demod=new Array(N).fill(0);
  for(let s=0;s<bits.length;s++){
    let corr=0;
    for(let i=s*bpS;i<Math.min((s+1)*bpS,N);i++){
      corr+=nBpsk[i]*Math.cos(2*Math.PI*fc*i/fs);
    }
    const bit=corr>=0?1:-1;
    for(let i=s*bpS;i<Math.min((s+1)*bpS,N);i++)demod[i]=bit;
  }
  const c=document.getElementById('bpskCanvas');c.width=c.offsetWidth||700;c.height=220;
  drawOsc(c,[msg,nBpsk,demod],['#22c3ff','#ffc440','#00e5a0'],{labels:['Message (±1)','BPSK','Demod (±1)'],scales:[c.height*0.05,c.height*0.09,c.height*0.05]});
  const sc=document.getElementById('bpskSpecCanvas');
  if(sc)drawSpectrum(sc,nBpsk,fs,{color:'#ffc440',label:'BPSK Spectrum',maxFreq:fc*4});
}

// QPSK
const QPSK_MAP={0b00:Math.PI/4,0b01:3*Math.PI/4,0b11:5*Math.PI/4,0b10:7*Math.PI/4};
function qpskSimulate(){
  const rawBits=document.getElementById('qpsk-bits').value.replace(/[^01]/g,'');
  const bits=rawBits.split('').map(Number);
  if(bits.length%2!==0)bits.push(0);
  const fc=+document.getElementById('qpsk-fc').value;
  const amp=+document.getElementById('qpsk-amp').value;
  const noise=+document.getElementById('qpsk-noise').value;
  const N=600;const fs=fc*16;const symN=bits.length/2;const spS=Math.floor(N/symN);
  const qpsk=new Array(N).fill(0);
  let symInfo='';
  for(let s=0;s<symN;s++){
    const b1=bits[s*2],b2=bits[s*2+1];
    const key=(b1<<1)|b2;
    const ph=QPSK_MAP[key]||0;
    symInfo+=`[${b1}${b2}]→${Math.round(ph*180/Math.PI)}° `;
    for(let i=s*spS;i<Math.min((s+1)*spS,N);i++)qpsk[i]=amp*Math.cos(2*Math.PI*fc*i/fs+ph);
  }
  const nQpsk=noise>0?addNoise(qpsk,noise):qpsk;
  // Message reference trace — raw bitstream at baseband, one level per bit
  const bitSamples=Math.max(1,Math.floor(N/bits.length));
  const msg=[];bits.forEach(b=>{for(let j=0;j<bitSamples;j++)msg.push(b);});
  while(msg.length<N)msg.push(msg[msg.length-1]||0);
  // Demodulation: maximum-likelihood phase detection — correlate each symbol
  // against all four reference phases and pick the best match, then decode
  // the bit pair back from the winning phase.
  const phaseKeys=[0b00,0b01,0b11,0b10];
  const demod=new Array(N).fill(0);
  let decodedInfo='';
  for(let s=0;s<symN;s++){
    let bestKey=0,bestCorr=-Infinity;
    phaseKeys.forEach(key=>{
      const ph=QPSK_MAP[key];let corr=0;
      for(let i=s*spS;i<Math.min((s+1)*spS,N);i++)corr+=nQpsk[i]*Math.cos(2*Math.PI*fc*i/fs+ph);
      if(corr>bestCorr){bestCorr=corr;bestKey=key;}
    });
    const b1=(bestKey>>1)&1,b2=bestKey&1;
    decodedInfo+=`[${b1}${b2}] `;
    const half=Math.max(1,Math.floor(spS/2));
    for(let i=s*spS;i<Math.min((s+1)*spS,N);i++){
      const local=i-s*spS;
      demod[i]=local<half?b1:b2;
    }
  }
  const c=document.getElementById('qpskCanvas');c.width=c.offsetWidth||700;c.height=240;
  drawOsc(c,[msg,nQpsk,demod],['#22c3ff','#ffc440','#00e5a0'],{labels:['Message','QPSK Signal','Demod'],scales:[c.height*0.045,c.height*0.09,c.height*0.045]});
  document.getElementById('qpsk-symbols').textContent='Encoded: '+symInfo+' | Decoded: '+decodedInfo;
  drawConstellation();
  const sc=document.getElementById('qpskSpecCanvas');
  if(sc)drawSpectrum(sc,nQpsk,fs,{color:'#ffc440',label:'QPSK Spectrum',maxFreq:fc*4});
}

function drawConstellation(){
  const noise=+document.getElementById('const-noise').value;
  const c=document.getElementById('constCanvas');if(!c)return;
  const W=c.width=300,H=c.height=300;
  const ctx=c.getContext('2d');
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060b15';ctx.fillRect(0,0,W,H);
  // grid
  ctx.strokeStyle='rgba(34,195,255,0.1)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
  ctx.fillStyle='rgba(200,216,240,0.5)';ctx.font='11px JetBrains Mono';ctx.textAlign='center';
  ctx.fillText('Q',W/2,12);ctx.fillText('I',W-10,H/2-6);
  ctx.textAlign='left';
  const cols=['#00e5a0','#22c3ff','#ffc440','#ff4f7b'];
  const pts=[[1,0b00],[1,0b01],[1,0b11],[1,0b10]];
  // circles guide
  ctx.strokeStyle='rgba(34,195,255,0.15)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(W/2,H/2,W*0.35,0,Math.PI*2);ctx.stroke();
  pts.forEach(([_,key],ki)=>{
    const ph=QPSK_MAP[key];const r=W*0.35;
    const cx=W/2+r*Math.cos(ph);const cy=H/2-r*Math.sin(ph);
    // cloud of noisy points
    for(let i=0;i<60;i++){
      const nx=cx+randn()*noise*W*0.3,ny=cy+randn()*noise*W*0.3;
      ctx.fillStyle=cols[ki]+'44';ctx.beginPath();ctx.arc(nx,ny,2,0,Math.PI*2);ctx.fill();
    }
    // ideal point
    ctx.fillStyle=cols[ki];ctx.shadowColor=cols[ki];ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(cx,cy,6,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    const labels=['00','01','11','10'];
    ctx.fillStyle=cols[ki];ctx.font='11px JetBrains Mono';ctx.textAlign='center';
    ctx.fillText(labels[ki],cx,cy-12);
  });
  ctx.textAlign='left';
}
drawConstellation();

// QAM
function qamDraw(){
  const order=+document.getElementById('qam-order').value.replace('-QAM','');
  const noise=+document.getElementById('qam-noise').value;
  const pts=+document.getElementById('qam-pts').value;
  const side=Math.sqrt(order);
  const bps=Math.log2(order);
  document.getElementById('qam-order-disp').textContent=order+'-QAM';
  document.getElementById('qam-bps-disp').textContent=bps;
  document.getElementById('qam-syms-disp').textContent=order;
  const c=document.getElementById('qamCanvas');const W=c.width=340,H=c.height=340;
  const ctx=c.getContext('2d');
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060b15';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(34,195,255,0.1)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
  const step=(W*0.75)/(side-1);
  const ox=W/2-step*(side-1)/2;const oy=H/2-step*(side-1)/2;
  const cmap=['#00e5a0','#22c3ff','#ffc440','#ff4f7b','#c97bff','#ff8c42','#33caff','#ff6699'];
  const ptRadius=side>8?2.5:5;
  let symErrors=0,totalPts=0;
  for(let r=0;r<side;r++)for(let col=0;col<side;col++){
    const ix=ox+col*step,iy=oy+r*step;
    const ci=(r*side+col)%cmap.length;
    // noise cloud — also used to empirically estimate symbol error rate
    const nPerSym=Math.max(1,Math.ceil(pts/order));
    if(noise>0)for(let i=0;i<nPerSym;i++){
      const dx=randn()*noise*step,dy=randn()*noise*step;
      const nx=ix+dx,ny=iy+dy;
      ctx.fillStyle=cmap[ci]+'30';ctx.beginPath();ctx.arc(nx,ny,2,0,Math.PI*2);ctx.fill();
      // decide if the noisy point would be sliced into a neighboring symbol (nearest half-step boundary)
      totalPts++;
      if(Math.abs(dx)>step/2||Math.abs(dy)>step/2)symErrors++;
    }
    ctx.fillStyle=cmap[ci];ctx.shadowColor=cmap[ci];ctx.shadowBlur=side>8?4:8;
    ctx.beginPath();ctx.arc(ix,iy,ptRadius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  }
  const serEl=document.getElementById('qam-ser-disp');
  if(serEl)serEl.textContent=totalPts>0?(symErrors/totalPts).toFixed(4):'0.000';
}
qamDraw();

// QAM time-domain I/Q composite waveform + spectrum
function qamWaveDraw(){
  const orderSel=document.getElementById('qam-order');
  const waveBitsEl=document.getElementById('qam-wave-bits');
  if(!orderSel||!waveBitsEl)return;
  const order=+orderSel.value.replace('-QAM','');
  const bitsPerSym=Math.log2(order);
  const side=Math.sqrt(order);
  const noise=+document.getElementById('qam-noise').value||0;
  const fc=+document.getElementById('qam-wave-fc').value||8;
  let bits=waveBitsEl.value.replace(/[^01]/g,'').split('').map(Number);
  const rem=bits.length%bitsPerSym;
  if(rem!==0)for(let i=0;i<bitsPerSym-rem;i++)bits.push(0);
  const symN=Math.max(1,bits.length/bitsPerSym);
  const N=600;const fs=fc*16;const spS=Math.floor(N/symN)||1;
  const iArr=new Array(N).fill(0),qArr=new Array(N).fill(0),qamSig=new Array(N).fill(0);
  for(let s=0;s<symN;s++){
    const symBits=bits.slice(s*bitsPerSym,(s+1)*bitsPerSym);
    let val=0;symBits.forEach(b=>val=(val<<1)|b);
    const row=Math.floor(val/side),col=val%side;
    // map row/col (0..side-1) to bipolar levels centered at 0, e.g. side=4 -> [-3,-1,1,3]
    const Ival=(2*col-(side-1));
    const Qval=(2*row-(side-1));
    const norm=(side-1)||1;
    for(let i=s*spS;i<Math.min((s+1)*spS,N);i++){
      iArr[i]=Ival/norm;qArr[i]=Qval/norm;
      qamSig[i]=(Ival/norm)*Math.cos(2*Math.PI*fc*i/fs)-(Qval/norm)*Math.sin(2*Math.PI*fc*i/fs);
    }
  }
  const noisySig=noise>0?addNoise(qamSig,noise):qamSig;
  const c=document.getElementById('qamWaveCanvas');
  if(c){c.width=c.offsetWidth||700;c.height=260;
    drawOsc(c,[iArr,qArr,noisySig],['#22c3ff','#c97bff','#ffc440'],{labels:['I','Q','QAM Signal'],scales:[c.height*0.08,c.height*0.08,c.height*0.12]});}
  const sc=document.getElementById('qamSpecCanvas');
  if(sc)drawSpectrum(sc,noisySig,fs,{color:'#ffc440',label:(order+'-QAM Spectrum'),maxFreq:fc*4});
}

