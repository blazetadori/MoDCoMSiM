// ═══════════════════════════════════════
// CHARACTER CODING
// ═══════════════════════════════════════
const EBCDIC={' ':64,'a':129,'b':130,'c':131,'d':132,'e':133,'f':134,'g':135,'h':136,'i':137,'j':145,'k':146,'l':147,'m':148,'n':149,'o':150,'p':151,'q':152,'r':153,'s':162,'t':163,'u':164,'v':165,'w':166,'x':167,'y':168,'z':169,'A':193,'B':194,'C':195,'D':196,'E':197,'F':198,'G':199,'H':200,'I':201,'J':209,'K':210,'L':211,'M':212,'N':213,'O':214,'P':215,'Q':216,'R':217,'S':226,'T':227,'U':228,'V':229,'W':230,'X':231,'Y':232,'Z':233,'0':240,'1':241,'2':242,'3':243,'4':244,'5':245,'6':246,'7':247,'8':248,'9':249};
const EBCDIC_REV=Object.fromEntries(Object.entries(EBCDIC).map(([k,v])=>[v,k]));

function getCodeVal(ch,type){
  if(type.includes('ASCII'))return ch.charCodeAt(0);
  if(type.includes('EBCDIC'))return EBCDIC[ch]??ch.charCodeAt(0);
  if(type.includes('UTF-8')){const b=new TextEncoder().encode(ch);return Array.from(b);}
  return ch.charCodeAt(0);
}
function toBin(n,bits){return (n>>>0).toString(2).padStart(bits,'0');}
function parityBit(bits,type){const ones=bits.split('').filter(b=>b==='1').length;return type==='Even'?(ones%2===0?'0':'1'):(ones%2===1?'0':'1');}

function ccEncode(){
  const text=document.getElementById('cc-input').value;
  const type=document.getElementById('cc-type').value;
  const par=document.getElementById('cc-parity').value;
  const bits7=type.includes('7-bit');
  const bitLen=type.includes('7-bit')?7:8;
  let bitStr='';let tableHTML='<span style="color:var(--neon-b)">CHAR  CODE  BINARY';
  if(par!=='None')tableHTML+='  +PARITY';
  tableHTML+='</span>\n';
  const bitsEl=document.getElementById('cc-bits');
  bitsEl.innerHTML='';
  for(const ch of text){
    let code,bin;
    if(type.includes('UTF-8')){
      const bytes=Array.from(new TextEncoder().encode(ch));
      bin=bytes.map(b=>toBin(b,8)).join(' ');
      code=bytes.map(b=>b).join(',');
    } else {
      code=getCodeVal(ch,type);
      bin=toBin(code,bitLen);
    }
    let fullBin=bin.replace(/ /g,'');
    let pbits=fullBin;
    if(par!=='None'){const pb=parityBit(fullBin,par);pbits=fullBin+pb;}
    tableHTML+=`  ${ch.padEnd(5)} ${String(code).padEnd(5)} ${bin}`;
    if(par!=='None')tableHTML+=`  (p=${pbits.slice(-1)})`;
    tableHTML+='\n';
    pbits.split('').forEach(b=>{
      const span=document.createElement('span');
      span.className='bit '+(b==='1'?'bit-1':'bit-0');
      span.textContent=b;bitsEl.appendChild(span);
    });
    const sp=document.createElement('span');sp.style.width='8px';sp.style.display='inline-block';bitsEl.appendChild(sp);
    bitStr+=pbits+' ';
  }
  document.getElementById('cc-table').textContent=tableHTML;
  document.getElementById('cc-rx-bits').value=bitStr.trim();
}

function ccDecode(){
  const raw=document.getElementById('cc-rx-bits').value.replace(/\s+/g,'');
  const type=document.getElementById('cc-rx-type').value;
  const bitLen=type.includes('7-bit')?7:type.includes('EBCDIC')?8:8;
  let out='',parOk=true;
  for(let i=0;i<raw.length;i+=bitLen){
    const chunk=raw.slice(i,i+bitLen);
    if(chunk.length<bitLen)break;
    const n=parseInt(chunk,2);
    if(type.includes('EBCDIC'))out+=EBCDIC_REV[n]??'?';
    else out+=String.fromCharCode(n);
  }
  document.getElementById('cc-output').textContent=out||'(empty)';
  document.getElementById('cc-parity-result').textContent='Decoding complete — '+raw.length+' bits → "'+out+'"';
}
function ccClear(){document.getElementById('cc-input').value='';document.getElementById('cc-bits').innerHTML='';document.getElementById('cc-output').textContent='—';}

function ccStepStart(){
  const ch=document.getElementById('cc-step-char').value||'A';
  const type=document.getElementById('cc-step-type').value;
  const code=ch.charCodeAt(0);
  const bits=type.includes('7-bit')?7:8;
  const bin=toBin(code,bits);
  let html=`<div class="info-box"><b>Character:</b> '${ch}'&nbsp;&nbsp;<b>Decimal code:</b> ${code}</div>`;
  html+=`<div class="ctrl-label mb8">Binary representation (${bits} bits):</div>`;
  html+=`<div class="bitstream">`;
  bin.split('').forEach((b,i)=>{
    html+=`<span class="bit ${b==='1'?'bit-1':'bit-0'}" title="Bit ${bits-1-i} (2^${bits-1-i}=${Math.pow(2,bits-1-i)})">${b}</span>`;
  });
  html+=`</div>`;
  html+=`<div class="info-box mt8">Bit positions from MSB: ${bin.split('').map((b,i)=>`<span style="color:${b==='1'?'var(--neon-g)':'var(--text-dim)'}">2^${bits-1-i}=${b==='1'?Math.pow(2,bits-1-i):0}</span>`).join(' + ')} = ${code}</div>`;
  document.getElementById('cc-step-area').innerHTML=html;
}

function ccCompare(){
  const text=document.getElementById('cc-cmp-input').value||'Hi';
  const types=['ASCII (7-bit)','ASCII (8-bit)','EBCDIC','Unicode UTF-8'];
  let html='';
  types.forEach(type=>{
    let bits='';
    for(const ch of text){
      if(type.includes('UTF-8')){bits+=Array.from(new TextEncoder().encode(ch)).map(b=>toBin(b,8)).join(' ')+' ';}
      else{const c=type.includes('EBCDIC')?(EBCDIC[ch]??ch.charCodeAt(0)):ch.charCodeAt(0);bits+=toBin(c,type.includes('7-bit')?7:8)+' ';}
    }
    html+=`<div class="card" style="margin:0"><div class="compare-label">${type}</div><div class="output-box" style="font-size:10px;word-break:break-all">${bits.trim()}</div></div>`;
  });
  document.getElementById('cc-cmp-out').innerHTML=html;
}

