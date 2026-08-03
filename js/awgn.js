// ═══════════════════════════════════════
// AWGN & BER
// ═══════════════════════════════════════
function awgnUpdate(){
  const snr=+document.getElementById('awgn-snr').value;
  document.getElementById('awgn-snr-v').textContent=snr+' dB';
  document.getElementById('awgn-snr-disp').textContent=snr+' dB';
  const np=Math.pow(10,-snr/10);
  document.getElementById('awgn-np-disp').textContent=np.toFixed(4);
}

function awgnSimulate(){
  const bits=document.getElementById('awgn-bits').value.replace(/[^01]/g,'').split('').map(Number);
  const snr=+document.getElementById('awgn-snr').value;
  const mod=document.getElementById('awgn-mod').value;
  const N=500;const fc=8;const fs=fc*16;const bpS=Math.floor(N/bits.length);
  let clean=[];
  if(mod==='BPSK'||mod==='QPSK'){
    bits.forEach(b=>{for(let j=0;j<bpS;j++)clean.push((b?1:-1)*Math.cos(2*Math.PI*fc*(clean.length)/fs));});
  } else if(mod==='FSK'){
    bits.forEach(b=>{for(let j=0;j<bpS;j++)clean.push(Math.cos(2*Math.PI*(b?fc:fc/2)*(clean.length)/fs));});
  } else {
    bits.forEach(b=>{for(let j=0;j<bpS;j++)clean.push(b?Math.cos(2*Math.PI*fc*(clean.length)/fs):0);});
  }
  const noiseLevel=Math.pow(10,-snr/20);
  const noisy=addNoise(clean,noiseLevel);
  const detected=noisy.map(v=>v>0?1:0);
  // count errors
  let errors=0;
  bits.forEach((b,i)=>{const startI=i*bpS;const d=detected[startI+Math.floor(bpS/2)];if(d!==b)errors++;});
  const ber=errors/bits.length;
  document.getElementById('awgn-snr-disp').textContent=snr+' dB';
  document.getElementById('awgn-np-disp').textContent=noiseLevel.toFixed(4);
  document.getElementById('awgn-err-disp').textContent=errors;
  document.getElementById('awgn-ber-disp').textContent=ber.toFixed(4);
  const c=document.getElementById('awgnCanvas');c.width=c.offsetWidth||700;c.height=220;
  drawOsc(c,[clean.slice(0,300),noisy.slice(0,300)],['#22c3ff','#ff4f7b'],{labels:['Clean','Noisy'],scales:[c.height*0.12,c.height*0.12],lineWidths:[2,1]});
  const scc=document.getElementById('awgnSpecCleanCanvas');
  if(scc)drawSpectrum(scc,clean,fs,{color:'#22c3ff',label:'Clean Spectrum',maxFreq:fc*4});
  const scn=document.getElementById('awgnSpecNoisyCanvas');
  if(scn)drawSpectrum(scn,noisy,fs,{color:'#ff4f7b',label:'Noisy Spectrum',maxFreq:fc*4});
}

// Q function approximation
function qfunc(x){
  const t=1/(1+0.2316419*x);
  const p=t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return p*Math.exp(-x*x/2)/(Math.sqrt(2*Math.PI));
}

function drawBER(){
  const c=document.getElementById('berCanvas');c.width=c.offsetWidth||700;c.height=300;
  const W=c.width,H=c.height;const ctx=c.getContext('2d');
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060b15';ctx.fillRect(0,0,W,H);
  // grid
  ctx.strokeStyle='rgba(34,195,255,0.08)';ctx.lineWidth=1;
  for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(i*W/10,0);ctx.lineTo(i*W/10,H);ctx.stroke();}
  for(let i=0;i<=8;i++){ctx.beginPath();ctx.moveTo(0,i*H/8);ctx.lineTo(W,i*H/8);ctx.stroke();}
  // axes labels
  ctx.fillStyle='rgba(200,216,240,0.4)';ctx.font='10px JetBrains Mono';ctx.textAlign='center';
  const snrs=[-2,0,2,4,6,8,10,12,14,16,18,20];
  snrs.forEach((s,i)=>{ctx.fillText(s+'dB',i/11*W,H-4);});
  ctx.fillStyle='rgba(200,216,240,0.4)';ctx.textAlign='right';
  ['1','0.1','0.01','0.001','1e-4','1e-5'].forEach((l,i)=>ctx.fillText(l,30,i*(H-20)/5+14));
  ctx.textAlign='left';
  function toY(ber){return ber<=0?H:(1-Math.log10(ber)/(-5))*(H-20)+5;}
  function toX(snr){return ((snr+2)/22)*W;}
  let labelSlot=0;
  function drawCurve(fn,color,label){
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.shadowColor=color;ctx.shadowBlur=6;
    ctx.beginPath();let first=true;let lastY=null;
    for(let snrDB=-2;snrDB<=20;snrDB+=0.5){
      const snrLin=Math.pow(10,snrDB/10);
      const ber=fn(snrLin);if(ber<=0)continue;
      const x=toX(snrDB),y=toY(ber);lastY=y;
      if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);
    }
    ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle=color;ctx.font='11px JetBrains Mono';
    // stack legend labels along the right edge in call order to avoid overlap
    ctx.fillText(label,W-90,16+labelSlot*14);
    labelSlot++;
  }
  // General M-QAM BER approximation (square constellations, Gray-coded):
  // BER ≈ (4/log2(M))·(1−1/√M)·Q(√(3·log2(M)/(M−1)·SNR))
  function mqamBER(M){
    const k=Math.log2(M);
    return snr=>(4/k)*(1-1/Math.sqrt(M))*qfunc(Math.sqrt(3*k/(M-1)*snr));
  }
  if(document.getElementById('ber-bpsk').checked)drawCurve(snr=>qfunc(Math.sqrt(2*snr)),'#00e5a0','BPSK/QPSK');
  if(document.getElementById('ber-ask').checked)drawCurve(snr=>qfunc(Math.sqrt(snr)),'#ffc440','ASK (OOK)');
  if(document.getElementById('ber-fsk').checked)drawCurve(snr=>qfunc(Math.sqrt(snr)),'#22c3ff','FSK');
  if(document.getElementById('ber-16qam').checked)drawCurve(mqamBER(16),'#c97bff','16-QAM');
  if(document.getElementById('ber-64qam').checked)drawCurve(mqamBER(64),'#ff8c42','64-QAM');
  if(document.getElementById('ber-256qam').checked)drawCurve(mqamBER(256),'#ff4f7b','256-QAM');
  // labels
  ctx.fillStyle='rgba(200,216,240,0.5)';ctx.font='10px JetBrains Mono';
  ctx.fillText('SNR (dB) →',W/2-30,H-4);
  ctx.save();ctx.translate(12,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('BER →',0,0);ctx.restore();
}

