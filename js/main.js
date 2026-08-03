// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
window.addEventListener('load',()=>{
  // Initialize TDM
  tdmBuild();
  // Draw default BER
  setTimeout(drawBER,500);
  setTimeout(()=>{qamDraw();drawConstellation();qamWaveDraw();},600);
});

// Clock tick
setInterval(()=>{document.getElementById('hdrTime').textContent=new Date().toTimeString().slice(0,8);},1000);

// ═══════════════════════════════════════
// LIVE SCROLLING ANIMATION
// ═══════════════════════════════════════
(function(){
  let phase=0;
  const SPEED=0.018; // scroll speed

  // Map of page id → function that redraws that page's waveforms with a phase offset
  const pageAnimators={
    'page-ask': function(ph){
      const el=document.getElementById('ask-bits');
      if(!el)return;
      const bits=el.value.replace(/[^01]/g,'').split('').map(Number);
      const fc=+document.getElementById('ask-fc').value||8;
      const a1=+document.getElementById('ask-a1').value||1;
      const a0=+document.getElementById('ask-a0').value||0;
      const noise=+document.getElementById('ask-noise').value||0;
      const N=600;const fs=fc*16;const bpS=Math.floor(N/bits.length);
      const msg=[];bits.forEach(b=>{for(let j=0;j<bpS;j++)msg.push(b);});
      const carrier=Array.from({length:N},(_,i)=>Math.cos(2*Math.PI*fc*i/fs+ph));
      const ask=msg.map((b,i)=>(b?a1:a0)*carrier[i]);
      const noisyAsk=noise>0?addNoise(ask,noise):ask;
      const demod=noisyAsk.map(v=>Math.abs(v)>0.3?1:0);
      const c=document.getElementById('askCanvas');if(!c)return;
      c.width=c.offsetWidth||700;c.height=260;
      drawOsc(c,[msg,noisyAsk,demod],['#22c3ff','#ffc440','#00e5a0'],{labels:['Message','ASK','Demod'],scales:[c.height*0.06,c.height*0.1,c.height*0.06]});
    },
    'page-fsk': function(ph){
      const el=document.getElementById('fsk-bits');if(!el)return;
      const bits=el.value.replace(/[^01]/g,'').split('').map(Number);
      const f1=+document.getElementById('fsk-f1').value||10;
      const f0=+document.getElementById('fsk-f0').value||5;
      const amp=+document.getElementById('fsk-amp').value||1;
      const noise=+document.getElementById('fsk-noise').value||0;
      const N=600;const fs=Math.max(f1,f0)*16;const bpS=Math.floor(N/bits.length);
      const msg=[];bits.forEach(b=>{for(let j=0;j<bpS;j++)msg.push(b);});
      const fsk=Array.from({length:N},(_,i)=>{const b=msg[Math.min(i,N-1)];return amp*Math.cos(2*Math.PI*(b?f1:f0)*i/fs+ph);});
      const nFsk=noise>0?addNoise(fsk,noise):fsk;
      const demod=new Array(N).fill(0);
      for(let s=0;s<bits.length;s++){
        let corr1=0,corr0=0;
        for(let i=s*bpS;i<Math.min((s+1)*bpS,N);i++){
          corr1+=nFsk[i]*Math.cos(2*Math.PI*f1*i/fs+ph);
          corr0+=nFsk[i]*Math.cos(2*Math.PI*f0*i/fs+ph);
        }
        const bit=Math.abs(corr1)>Math.abs(corr0)?1:0;
        for(let i=s*bpS;i<Math.min((s+1)*bpS,N);i++)demod[i]=bit;
      }
      const c=document.getElementById('fskCanvas');if(!c)return;
      c.width=c.offsetWidth||700;c.height=220;
      drawOsc(c,[msg,nFsk,demod],['#22c3ff','#ffc440','#00e5a0'],{labels:['Message','FSK','Demod'],scales:[c.height*0.05,c.height*0.09,c.height*0.05]});
    },
    'page-bpsk': function(ph){
      const el=document.getElementById('bpsk-bits');if(!el)return;
      const bits=el.value.replace(/[^01]/g,'').split('').map(Number);
      const fc=+document.getElementById('bpsk-fc').value||8;
      const amp=+document.getElementById('bpsk-amp').value||1;
      const noise=+document.getElementById('bpsk-noise').value||0;
      const N=600;const fs=fc*16;const bpS=Math.floor(N/bits.length);
      const msg=[];bits.forEach(b=>{for(let j=0;j<bpS;j++)msg.push(b?1:-1);});
      const bpsk=Array.from({length:N},(_,i)=>amp*msg[Math.min(i,N-1)]*Math.cos(2*Math.PI*fc*i/fs+ph));
      const nBpsk=noise>0?addNoise(bpsk,noise):bpsk;
      const demod=new Array(N).fill(0);
      for(let s=0;s<bits.length;s++){
        let corr=0;
        for(let i=s*bpS;i<Math.min((s+1)*bpS,N);i++)corr+=nBpsk[i]*Math.cos(2*Math.PI*fc*i/fs+ph);
        const bit=corr>=0?1:-1;
        for(let i=s*bpS;i<Math.min((s+1)*bpS,N);i++)demod[i]=bit;
      }
      const c=document.getElementById('bpskCanvas');if(!c)return;
      c.width=c.offsetWidth||700;c.height=220;
      drawOsc(c,[msg,nBpsk,demod],['#22c3ff','#ffc440','#00e5a0'],{labels:['Message (±1)','BPSK','Demod (±1)'],scales:[c.height*0.05,c.height*0.09,c.height*0.05]});
    },
    'page-qpsk': function(ph){
      const el=document.getElementById('qpsk-bits');if(!el)return;
      const bits0=el.value.replace(/[^01]/g,'').split('').map(Number);
      const bits=bits0.length%2!==0?[...bits0,0]:bits0;
      const fc=+document.getElementById('qpsk-fc').value||8;
      const amp=+document.getElementById('qpsk-amp').value||1;
      const noise=+document.getElementById('qpsk-noise').value||0;
      const N=600;const fs=fc*16;const symN=bits.length/2;const spS=Math.floor(N/symN);
      const qpsk=new Array(N).fill(0);
      for(let s=0;s<symN;s++){
        const b1=bits[s*2],b2=bits[s*2+1];const key=(b1<<1)|b2;const symPh=QPSK_MAP[key]||0;
        for(let i=s*spS;i<Math.min((s+1)*spS,N);i++)qpsk[i]=amp*Math.cos(2*Math.PI*fc*i/fs+symPh+ph);
      }
      const nQpsk=noise>0?addNoise(qpsk,noise):qpsk;
      const bitSamples=Math.max(1,Math.floor(N/bits.length));
      const msg=[];bits.forEach(b=>{for(let j=0;j<bitSamples;j++)msg.push(b);});
      while(msg.length<N)msg.push(msg[msg.length-1]||0);
      const phaseKeys=[0b00,0b01,0b11,0b10];
      const demod=new Array(N).fill(0);
      for(let s=0;s<symN;s++){
        let bestKey=0,bestCorr=-Infinity;
        phaseKeys.forEach(key=>{
          const symPh=QPSK_MAP[key];let corr=0;
          for(let i=s*spS;i<Math.min((s+1)*spS,N);i++)corr+=nQpsk[i]*Math.cos(2*Math.PI*fc*i/fs+symPh+ph);
          if(corr>bestCorr){bestCorr=corr;bestKey=key;}
        });
        const b1=(bestKey>>1)&1,b2=bestKey&1;const half=Math.max(1,Math.floor(spS/2));
        for(let i=s*spS;i<Math.min((s+1)*spS,N);i++){demod[i]=(i-s*spS)<half?b1:b2;}
      }
      const c=document.getElementById('qpskCanvas');if(!c)return;
      c.width=c.offsetWidth||700;c.height=240;
      drawOsc(c,[msg,nQpsk,demod],['#22c3ff','#ffc440','#00e5a0'],{labels:['Message','QPSK Signal','Demod'],scales:[c.height*0.045,c.height*0.09,c.height*0.045]});
    },
    'page-linecode': function(ph){
      const c=document.getElementById('lcCanvas');if(!c||!c._lastSignals)return;
      const W=c.width=c.offsetWidth||700;const H=c.height||180;
      const ctx=c.getContext('2d');
      // shift = how many pixels to scroll left
      const shift=Math.floor((ph/(Math.PI*2))*W)%W;
      // redraw with offset applied to x coordinates
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#060b15';ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(34,195,255,0.07)';ctx.lineWidth=1;
      const gx=Math.floor(W/20),gy=Math.floor(H/10);
      for(let i=0;i<=20;i++){ctx.beginPath();ctx.moveTo(i*gx,0);ctx.lineTo(i*gx,H);ctx.stroke();}
      for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(0,i*gy);ctx.lineTo(W,i*gy);ctx.stroke();}
      ctx.strokeStyle='rgba(34,195,255,0.15)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
      const {signals,colors,opts}=c._lastSignals;
      const n=signals.length;
      signals.forEach((sig,si)=>{
        if(!sig||!sig.length)return;
        const slotH=H/n;const cy=slotH*(si+0.5);
        const scale=opts.scales?opts.scales[si]:(slotH*0.38);
        ctx.strokeStyle=colors[si]||'#00e5a0';ctx.lineWidth=opts.lineWidths?opts.lineWidths[si]:1.8;
        ctx.shadowColor=colors[si];ctx.shadowBlur=4;
        ctx.beginPath();
        sig.forEach((v,i)=>{
          const rawX=i/(sig.length-1)*W;
          const x=((rawX-shift)+W)%W;
          const y=cy-v*scale;
          // detect wrap-around and lift pen
          if(i>0){
            const prevX=((((i-1)/(sig.length-1))*W)-shift+W)%W;
            if(Math.abs(x-prevX)>W/2){ctx.stroke();ctx.beginPath();ctx.moveTo(x,y);return;}
          }
          i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        });
        ctx.stroke();ctx.shadowBlur=0;
        if(opts.labels&&opts.labels[si]){ctx.fillStyle=colors[si];ctx.font='10px JetBrains Mono';ctx.fillText(opts.labels[si],6,cy-scale-4);}
      });
    },
    'page-awgn': function(ph){
      const c=document.getElementById('awgnCanvas');if(!c||!c._lastSignals)return;
      const W=c.width=c.offsetWidth||700;const H=c.height||220;
      const {signals,colors,opts}=c._lastSignals;
      const shift=Math.floor((ph/(Math.PI*2))*W)%W;
      const ctx=c.getContext('2d');
      ctx.clearRect(0,0,W,H);ctx.fillStyle='#060b15';ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(34,195,255,0.07)';ctx.lineWidth=1;
      const gx=Math.floor(W/20),gy=Math.floor(H/10);
      for(let i=0;i<=20;i++){ctx.beginPath();ctx.moveTo(i*gx,0);ctx.lineTo(i*gx,H);ctx.stroke();}
      for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(0,i*gy);ctx.lineTo(W,i*gy);ctx.stroke();}
      ctx.strokeStyle='rgba(34,195,255,0.15)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
      const n=signals.length;
      signals.forEach((sig,si)=>{
        if(!sig||!sig.length)return;
        const slotH=H/n;const cy=slotH*(si+0.5);
        const scale=opts&&opts.scales?opts.scales[si]:(H/n*0.38);
        ctx.strokeStyle=colors[si]||'#00e5a0';ctx.lineWidth=1.8;
        ctx.shadowColor=colors[si];ctx.shadowBlur=4;ctx.beginPath();
        sig.forEach((v,i)=>{
          const rawX=i/(sig.length-1)*W;
          const x=((rawX-shift)+W)%W;const y=cy-v*scale;
          if(i>0){const prevX=((((i-1)/(sig.length-1))*W)-shift+W)%W;if(Math.abs(x-prevX)>W/2){ctx.stroke();ctx.beginPath();ctx.moveTo(x,y);return;}}
          i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        });
        ctx.stroke();ctx.shadowBlur=0;
        if(opts&&opts.labels&&opts.labels[si]){ctx.fillStyle=colors[si];ctx.font='10px JetBrains Mono';ctx.fillText(opts.labels[si],6,cy-scale-4);}
      });
    },
    'page-mux': function(ph){
      const wdmTab=document.getElementById('mux-wdm');
      if(!wdmTab||!wdmTab.classList.contains('active'))return; // only animate while the WDM sub-tab is showing
      if(typeof wdmDrawFiber==='function')wdmDrawFiber(ph);
    }
  };

  // Patch drawOsc and drawDigital to cache last drawn signals for animated pages
  const _origDrawOsc=drawOsc;
  window.drawOsc=function(canvas,signals,colors,opts){
    _origDrawOsc(canvas,signals,colors,opts);
    if(canvas&&canvas.id&&['lcCanvas','awgnCanvas'].includes(canvas.id)){
      canvas._lastSignals={signals:signals.map(s=>s?[...s]:s),colors:[...colors],opts:Object.assign({},opts,{scales:opts&&opts.scales?[...opts.scales]:undefined,labels:opts&&opts.labels?[...opts.labels]:undefined})};
    }
  };

  function getActivePage(){
    const p=document.querySelector('.page.active');
    return p?p.id:null;
  }

  function animate(){
    phase+=SPEED;
    if(phase>Math.PI*2)phase-=Math.PI*2;
    const pid=getActivePage();
    if(pid&&pageAnimators[pid]){
      try{pageAnimators[pid](phase);}catch(e){}
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
