// ═══════════════════════════════════════
// MULTIPLEXING
// ═══════════════════════════════════════
function tdmBuild(){
  const nCh=+document.getElementById('tdm-ch').value;
  const nb=+document.getElementById('tdm-bits').value;
  let html='';
  const cols=['var(--neon-g)','var(--neon-b)','var(--neon-y)','var(--neon-p)'];
  for(let i=0;i<nCh;i++){
    let defBits='';for(let j=0;j<nb;j++)defBits+=Math.round(Math.random());
    html+=`<div class="ctrl-group mb8"><div class="ctrl-label" style="color:${cols[i]}">Channel ${i+1} Bits</div>
    <input type="text" id="tdm-ch${i}" value="${defBits}" maxlength="${nb}"/></div>`;
  }
  document.getElementById('tdm-inputs').innerHTML=html;
}
tdmBuild();
document.getElementById('tdm-ch').addEventListener('change',tdmBuild);

function tdmSimulate(){
  const nCh=+document.getElementById('tdm-ch').value;
  const cols=['#00e5a0','#22c3ff','#ffc440','#c97bff'];
  const channels=[];
  for(let i=0;i<nCh;i++){
    const el=document.getElementById('tdm-ch'+i);
    channels.push((el?el.value:'').replace(/[^01]/g,'').split('').map(Number));
  }
  const maxLen=Math.max(...channels.map(c=>c.length));
  channels.forEach(c=>{while(c.length<maxLen)c.push(0);});
  // interleave
  const frame=[];const frameStr=[];
  for(let i=0;i<maxLen;i++)for(let j=0;j<nCh;j++){frame.push({bit:channels[j][i],ch:j});frameStr.push(`[Ch${j+1}:${channels[j][i]}]`);}
  // draw
  const c=document.getElementById('tdmCanvas');c.width=c.offsetWidth||700;c.height=200;
  const tth=plotTheme();
  const tpl=AX_L;
  const W=c.width,H=c.height;const ctx=c.getContext('2d');
  ctx.clearRect(0,0,W,H);ctx.fillStyle=tth.bg;ctx.fillRect(0,0,W,H);
  const pw=W-tpl;const bw=pw/frame.length;const hi=H*0.2,lo=H*0.8;
  // Y axis (bit level)
  ctx.strokeStyle=tth.axisLine;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(tpl,0);ctx.lineTo(tpl,H);ctx.stroke();
  ctx.fillStyle=tth.axis;ctx.font='9px JetBrains Mono';ctx.textAlign='right';
  ctx.fillText('1',tpl-4,hi+3);ctx.fillText('0',tpl-4,lo+3);
  ctx.textAlign='left';
  frame.forEach(({bit,ch},i)=>{
    const x=tpl+i*bw;const color=cols[ch];
    ctx.fillStyle=color+'33';
    ctx.fillRect(x,0,bw-1,H);
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.shadowColor=color;ctx.shadowBlur=4;
    ctx.beginPath();ctx.moveTo(x,bit?hi:lo);ctx.lineTo(x+bw,bit?hi:lo);ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle=color;ctx.font='9px JetBrains Mono';ctx.textAlign='center';
    ctx.fillText(`C${ch+1}`,x+bw/2,H-6);
  });
  ctx.textAlign='left';
  document.getElementById('tdm-frame').textContent='TDM Frame (Time slot →): '+frameStr.join(' ');
}

function fdmSimulate(){
  const nCh=+document.getElementById('fdm-ch').value;
  const guard=+document.getElementById('fdm-guard').value;
  const cols=['#00e5a0','#22c3ff','#ffc440','#c97bff'];
  const bw=10;
  const c=document.getElementById('fdmCanvas');c.width=c.offsetWidth||700;c.height=220;
  const W=c.width,H=c.height;const ctx=c.getContext('2d');
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#060b15';ctx.fillRect(0,0,W,H);
  const totalBW=(bw+guard)*nCh;const scale=W/totalBW;
  // draw freq axis (X) + power axis (Y)
  ctx.strokeStyle='rgba(34,195,255,0.2)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,H-30);ctx.lineTo(W,H-30);ctx.stroke();
  ctx.fillStyle='rgba(34,195,255,0.5)';ctx.font='10px JetBrains Mono';ctx.textAlign='center';
  for(let f=0;f<=totalBW;f+=5){
    ctx.fillText(f+'Hz',f*scale,H-15);
    ctx.beginPath();ctx.moveTo(f*scale,H-30);ctx.lineTo(f*scale,H-25);ctx.stroke();
  }
  ctx.save();ctx.translate(10,(H-30)/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';
  ctx.fillStyle='rgba(34,195,255,0.5)';ctx.font='9px JetBrains Mono';ctx.fillText('Power',0,0);ctx.restore();
  ctx.textAlign='center';ctx.fillText('Frequency →',W/2,H-3);
  // draw channels
  for(let i=0;i<nCh;i++){
    const fx=((bw+guard)*i)*scale;
    const fw=bw*scale;const peak=H-40;const base=H-30;
    ctx.fillStyle=cols[i]+'33';ctx.fillRect(fx,peak-60,fw,60);
    ctx.strokeStyle=cols[i];ctx.lineWidth=2;ctx.shadowColor=cols[i];ctx.shadowBlur=8;
    // sinc-like shape
    ctx.beginPath();ctx.moveTo(fx,base);
    for(let x=0;x<=fw;x++){
      const rel=(x/fw-0.5)*4;const y=base-60*Math.exp(-rel*rel);
      x===0?ctx.moveTo(fx+x,y):ctx.lineTo(fx+x,y);
    }
    ctx.lineTo(fx+fw,base);ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle=cols[i];ctx.font='11px JetBrains Mono';ctx.textAlign='center';
    ctx.fillText(`Ch${i+1}`,(fx+fw/2),peak-65);
  }
  ctx.textAlign='left';
}

// ═══════════════════════════════════════
// WDM (Wavelength Division Multiplexing)
// Visualizes several independent light wavelengths traveling together
// through one optical fiber, then splitting apart at a demultiplexer.
// ═══════════════════════════════════════
const WDM_COLORS=['#ff4f7b','#ffc440','#00e5a0','#22c3ff','#c97bff'];
const WDM_BASE_NM=1530; // starting wavelength (nm), typical of the C-band used in real DWDM/CWDM links

function wdmChannelParams(){
  const nCh=+document.getElementById('wdm-ch').value;
  const spacing=+document.getElementById('wdm-spacing').value||20;
  return {nCh,spacing};
}
function wdmRenderLegend(){
  const {nCh,spacing}=wdmChannelParams();
  const legend=document.getElementById('wdm-legend');
  if(!legend)return;
  legend.innerHTML='';
  for(let i=0;i<nCh;i++){
    const nm=WDM_BASE_NM+i*spacing;
    const item=document.createElement('div');
    item.className='legend-item';
    item.innerHTML=`<div class="legend-dot" style="background:${WDM_COLORS[i]}"></div>λ${i+1} = ${nm}nm`;
    legend.appendChild(item);
  }
}
function wdmSimulate(){
  wdmRenderLegend();
  wdmDrawFiber(0);
  wdmDrawSpectrum();
}
// phase: animation offset (radians) so the beams appear to travel down the fiber
function wdmDrawFiber(phase){
  const {nCh,spacing}=wdmChannelParams();
  const c=document.getElementById('wdmCanvas');
  if(!c)return;
  c.width=c.offsetWidth||700;c.height=240;
  const W=c.width,H=c.height;const ctx=c.getContext('2d');
  const th=plotTheme();
  ctx.clearRect(0,0,W,H);ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);

  const muxX=W*0.12,demuxX=W*0.82; // multiplexer / demultiplexer positions
  const fiberY=H/2,fiberHalf=H*0.18;

  // fiber cladding (the single shared strand)
  ctx.fillStyle='rgba(34,195,255,0.06)';
  ctx.fillRect(muxX,fiberY-fiberHalf,demuxX-muxX,fiberHalf*2);
  ctx.strokeStyle='rgba(34,195,255,0.25)';ctx.lineWidth=1;
  ctx.strokeRect(muxX,fiberY-fiberHalf,demuxX-muxX,fiberHalf*2);

  // input laser sources (before mux) and output receivers (after demux)
  ctx.font='10px JetBrains Mono';ctx.textAlign='center';
  for(let i=0;i<nCh;i++){
    const spread=(i-(nCh-1)/2)*(fiberHalf*1.6/Math.max(1,nCh-1||1));
    const y0=fiberY+ (nCh>1?spread:0);
    ctx.strokeStyle=WDM_COLORS[i];ctx.lineWidth=2;ctx.shadowColor=WDM_COLORS[i];ctx.shadowBlur=6;
    ctx.beginPath();ctx.moveTo(0,y0);ctx.lineTo(muxX,fiberY);ctx.stroke();
    ctx.beginPath();ctx.moveTo(demuxX,fiberY);ctx.lineTo(W,y0);ctx.stroke();
    ctx.shadowBlur=0;
    ctx.fillStyle=WDM_COLORS[i];
    ctx.fillText(`λ${i+1}`,muxX*0.4,y0-8);
    ctx.fillText(`λ${i+1}`,demuxX+(W-demuxX)*0.6,y0-8);
  }

  // mux / demux markers
  ctx.fillStyle=th.axis;ctx.font='10px JetBrains Mono';ctx.textAlign='center';
  ctx.fillText('MUX',muxX,fiberY-fiberHalf-8);
  ctx.fillText('DEMUX',demuxX,fiberY-fiberHalf-8);
  ctx.strokeStyle=th.axisLine;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(muxX,fiberY-fiberHalf-2);ctx.lineTo(muxX,fiberY+fiberHalf+2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(demuxX,fiberY-fiberHalf-2);ctx.lineTo(demuxX,fiberY+fiberHalf+2);ctx.stroke();

  // combined wavelengths traveling together inside the fiber — each drawn as
  // its own sine wave (different period = different wavelength/color), all
  // sharing the same physical strand without interfering.
  const innerW=demuxX-muxX;
  for(let i=0;i<nCh;i++){
    const periodPx=26+i*7; // shorter period ~ shorter wavelength, just for visual variety
    ctx.strokeStyle=WDM_COLORS[i];ctx.lineWidth=1.8;ctx.shadowColor=WDM_COLORS[i];ctx.shadowBlur=5;
    ctx.beginPath();
    for(let x=0;x<=innerW;x+=2){
      const y=fiberY+Math.sin((x/periodPx)*2*Math.PI+phase+i*0.6)*(fiberHalf*0.55);
      x===0?ctx.moveTo(muxX+x,y):ctx.lineTo(muxX+x,y);
    }
    ctx.stroke();ctx.shadowBlur=0;
  }
  ctx.textAlign='left';
}
function wdmDrawSpectrum(){
  const {nCh,spacing}=wdmChannelParams();
  const c=document.getElementById('wdmSpecCanvas');
  if(!c)return;
  c.width=c.offsetWidth||700;c.height=200;
  const W=c.width,H=c.height;const ctx=c.getContext('2d');
  const th=plotTheme();
  ctx.clearRect(0,0,W,H);ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);

  const totalSpan=spacing*(nCh+1);const scale=W/totalSpan;
  const base=H-30;
  ctx.strokeStyle=th.axisLine;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,base);ctx.lineTo(W,base);ctx.stroke();
  ctx.fillStyle=th.axis;ctx.font='10px JetBrains Mono';ctx.textAlign='center';
  for(let i=0;i<=nCh+1;i++){
    const nm=WDM_BASE_NM-spacing+i*spacing;
    const x=i*spacing*scale;
    ctx.fillText(nm+'nm',x,base+14);
  }
  ctx.fillText('Wavelength (λ) →',W/2,H-4);

  for(let i=0;i<nCh;i++){
    const cx=(spacing*(i+1))*scale;const peakH=base-40;
    ctx.fillStyle=WDM_COLORS[i]+'33';
    ctx.strokeStyle=WDM_COLORS[i];ctx.lineWidth=2;ctx.shadowColor=WDM_COLORS[i];ctx.shadowBlur=8;
    ctx.beginPath();ctx.moveTo(cx-10*scale,base);
    for(let x=-10;x<=10;x++){
      const rel=x/4;const y=base-40*Math.exp(-rel*rel);
      ctx.lineTo(cx+x*scale,y);
    }
    ctx.lineTo(cx+10*scale,base);ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle=WDM_COLORS[i];ctx.font='11px JetBrains Mono';
    ctx.fillText(`λ${i+1}`,cx,peakH-10);
  }
  ctx.textAlign='left';
}
wdmRenderLegend();
document.getElementById('wdm-ch').addEventListener('change',wdmRenderLegend);
// Draw once as soon as the WDM tab is first opened (canvases need to be
// visible to measure offsetWidth), same as TDM/FDM's own SIMULATE-driven flow.
document.querySelectorAll('.tab[data-tab="mux-wdm"]').forEach(t=>t.addEventListener('click',()=>wdmSimulate()));

