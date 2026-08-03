// ═══════════════════════════════════════
// PCM
// ═══════════════════════════════════════
function pcmUpdate(){
  const fs=+document.getElementById('pcm-fs').value;
  const bd=+document.getElementById('pcm-bitdepth').value;
  document.getElementById('pcm-fs-disp').textContent=fs+' Hz';
  document.getElementById('pcm-bits-disp').textContent=bd+' bits';
  document.getElementById('pcm-levels-disp').textContent=Math.pow(2,bd);
  document.getElementById('pcm-snr-disp').textContent=(6.02*bd+1.76).toFixed(1)+' dB';
}
pcmUpdate();

function genSig(type,freq,amp,N,fs){
  return Array.from({length:N},(_,i)=>{
    const t=i/fs;
    if(type==='Sine Wave')return amp*Math.sin(2*Math.PI*freq*t);
    if(type==='Square Wave')return amp*Math.sign(Math.sin(2*Math.PI*freq*t));
    if(type==='Sawtooth')return amp*(2*(freq*t%1)-1);
    if(type==='Triangle')return amp*(2*Math.abs(2*(freq*t%1)-1)-1);
    return 0;
  });
}

function pcmSimulate(){
  const sigType=document.getElementById('pcm-sig').value;
  const freq=+document.getElementById('pcm-freq').value;
  const amp=+document.getElementById('pcm-amp').value;
  const fs=+document.getElementById('pcm-fs').value;
  const bd=+document.getElementById('pcm-bitdepth').value;
  const noiseDB=+document.getElementById('pcm-noise').value;
  const levels=Math.pow(2,bd);
  const N=512,showN=200;
  const sig=genSig(sigType,freq,amp,N,fs);
  const sampleRate=Math.max(1,Math.floor(fs/freq/8));
  const samples=[],qLevels=[];
  for(let i=0;i<N;i+=sampleRate){
    const v=sig[i];
    const norm=(v+amp)/(2*amp);
    const q=Math.min(levels-1,Math.round(norm*(levels-1)));
    samples.push({i,v,q});
    qLevels.push(q/(levels-1)*2*amp-amp);
  }
  // reconstruct
  const recon=new Array(N).fill(0);
  samples.forEach((s,j)=>{
    const nextI=samples[j+1]?samples[j+1].i:N;
    for(let k=s.i;k<nextI;k++)recon[k]=qLevels[j];
  });
  // noise
  const noiseLevel=noiseDB<40?amp*Math.pow(10,-noiseDB/20)*0.5:0;
  const noisySig=addNoise(sig.slice(0,showN),noiseLevel);
  const c=document.getElementById('pcmCanvas');
  c.width=c.offsetWidth||700;c.height=220;
  const ctx=c.getContext('2d');
  const pth=plotTheme();
  const pl=AX_L,pb=c.height-AX_B,pw=c.width-pl;
  c._redraw=()=>pcmUpdate();
  ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle=pth.bg;ctx.fillRect(0,0,c.width,c.height);
  // grid
  ctx.strokeStyle=pth.grid;ctx.lineWidth=1;
  for(let i=0;i*pw/20<=pw;i++){ctx.beginPath();ctx.moveTo(pl+i*pw/20,0);ctx.lineTo(pl+i*pw/20,pb);ctx.stroke();}
  for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(pl,i*pb/10);ctx.lineTo(c.width,i*pb/10);ctx.stroke();}
  // axes
  ctx.strokeStyle=pth.axisLine;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(pl,0);ctx.lineTo(pl,pb);ctx.stroke();
  ctx.beginPath();ctx.moveTo(pl,pb);ctx.lineTo(c.width,pb);ctx.stroke();
  ctx.fillStyle=pth.axis;ctx.font='9px JetBrains Mono';ctx.textAlign='right';
  [amp,0,-amp].forEach(v=>{const y=pb/2-v/amp*(pb*0.42);ctx.fillText(v.toFixed(2),pl-4,y+3);});
  ctx.textAlign='center';
  for(let i=0;i<=4;i++){const idx=Math.round((showN-1)*i/4);ctx.fillText(String(idx),pl+i/4*pw,c.height-5);}
  ctx.textAlign='left';
  const drawLine=(data,color,lw=1.5)=>{
    ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.shadowColor=color;ctx.shadowBlur=4;
    ctx.beginPath();
    data.forEach((v,i)=>{const x=pl+i/(data.length-1)*pw,y=pb/2-v/amp*(pb*0.42);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
    ctx.stroke();ctx.shadowBlur=0;
  };
  drawLine(noisySig,'rgba(34,195,255,0.5)',1);
  drawLine(sig.slice(0,showN),'#22c3ff',2);
  // samples
  ctx.fillStyle='#00e5a0';
  samples.forEach(s=>{if(s.i<showN){const x=pl+s.i/(showN-1)*pw,y=pb/2-s.v/amp*(pb*0.42);ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();}});
  drawLine(recon.slice(0,showN),'#ffc440',1.5);
  // bitstream
  let bits='';
  samples.forEach(s=>bits+=toBin(s.q,bd)+' ');
  document.getElementById('pcm-bitstream').textContent=bits.trim();
}

// Delta PCM
function deltaSimulate(){
  const type=document.getElementById('dpcm-sig').value;
  const freq=+document.getElementById('dpcm-freq').value;
  const step=+document.getElementById('dpcm-step').value;
  const N=+document.getElementById('dpcm-samples').value;
  const sig=genSig(type,freq,1,N,N*freq);
  let approx=0,bits=[];
  const recon=[0];
  sig.forEach((v,i)=>{
    if(i===0)return;
    const b=v>=approx?1:0;
    bits.push(b);
    approx+=b?step:-step;
    recon.push(approx);
  });
  const c=document.getElementById('deltaCanvas');
  c.width=c.offsetWidth||700;c.height=200;
  drawOsc(c,[sig,recon],['#22c3ff','#00e5a0'],{labels:['Original','Delta Recon']});
  const el=document.getElementById('delta-bits');el.innerHTML='';
  bits.forEach(b=>{const sp=document.createElement('span');sp.className='bit '+(b?'bit-1':'bit-0');sp.textContent=b;el.appendChild(sp);});
}

// Diff PCM
function diffPCMSimulate(){
  const type=document.getElementById('diffpcm-sig').value;
  const freq=+document.getElementById('diffpcm-freq').value;
  const bd=+document.getElementById('diffpcm-bits').value;
  const N=+document.getElementById('diffpcm-samples').value;
  const sig=genSig(type,freq,1,N,N*freq);
  const levels=Math.pow(2,bd);
  let prev=0,recon=[];
  sig.forEach(v=>{
    const diff=v-prev;
    const qd=Math.round(diff*(levels/2))/(levels/2);
    prev+=qd;recon.push(prev);
  });
  const c=document.getElementById('diffpcmCanvas');
  c.width=c.offsetWidth||700;c.height=200;
  drawOsc(c,[sig,recon],['#22c3ff','#00e5a0'],{labels:['Original','DPCM Recon']});
}

// PCM Step Mode
let pcmStepIdx=0;
const pcmStepTexts=[
  '<div class="info-box"><b>Step 1: SAMPLING</b><br>The analog signal is measured at regular intervals (Fs). Each measurement is called a sample. Nyquist theorem: Fs ≥ 2×f_max to avoid aliasing.</div>',
  '<div class="info-box"><b>Step 2: QUANTIZATION</b><br>Each sample value is rounded to the nearest discrete level. With n bits, there are 2^n quantization levels. The difference between the real and rounded value is called quantization error.</div>',
  '<div class="info-box"><b>Step 3: ENCODING</b><br>Each quantized level is converted to a binary code word of n bits. For 8-bit PCM, there are 256 possible levels (0–255).</div>',
  '<div class="info-box"><b>Step 4: DECODING (Receiver)</b><br>At the receiver, the binary code is decoded back to the quantized level (DAC). A low-pass filter smooths the staircase waveform to reconstruct the original analog signal.</div>'
];
function renderPCMStep(){
  document.querySelectorAll('[id^="pcm-step-"]').forEach((el,i)=>{
    el.className='step-btn'+(i===pcmStepIdx?' active':i<pcmStepIdx?' done':'');
  });
  document.getElementById('pcm-step-content').innerHTML=pcmStepTexts[pcmStepIdx];
}
function pcmStepNext(){if(pcmStepIdx<3)pcmStepIdx++;renderPCMStep();}
function pcmStepPrev(){if(pcmStepIdx>0)pcmStepIdx--;renderPCMStep();}
renderPCMStep();

