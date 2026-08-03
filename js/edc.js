// ═══════════════════════════════════════
// ERROR DETECTION & CORRECTION
// ═══════════════════════════════════════
function parityEncode(){
  const bits=document.getElementById('par-bits').value.replace(/[^01]/g,'');
  const type=document.getElementById('par-type').value;
  const p=parityBit(bits,type);
  document.getElementById('par-out').textContent=`Data: ${bits} | Parity bit: ${p} | Frame: ${bits+p}`;
}
function parityCheck(){
  const bits=document.getElementById('par-rx').value.replace(/[^01]/g,'');
  const type=document.getElementById('par-rx-type').value;
  const ones=bits.split('').filter(b=>b==='1').length;
  const ok=type==='Even'?ones%2===0:ones%2===1;
  document.getElementById('par-check').style.color=ok?'var(--neon-g)':'var(--neon-r)';
  document.getElementById('par-check').textContent=ok?`✓ No error detected (${ones} ones — ${type} parity OK)`:`✗ Error detected! (${ones} ones — violates ${type} parity)`;
}

// Hamming
let hammingStep=0;
function hammingEncode(){
  const d=document.getElementById('ham-data').value.replace(/[^01]/g,'').slice(0,4).padEnd(4,'0').split('').map(Number);
  // Hamming(7,4): data bits at positions 3,5,6,7; parity at 1,2,4
  const c=new Array(8).fill(0);
  c[3]=d[0];c[5]=d[1];c[6]=d[2];c[7]=d[3];
  c[1]=(c[3]^c[5]^c[7]);
  c[2]=(c[3]^c[6]^c[7]);
  c[4]=(c[5]^c[6]^c[7]);
  const codeword=c.slice(1).join('');
  document.getElementById('ham-rx').value=codeword;
  let html=`<div class="info-box">Data bits: <b>${d.join('')}</b> → Hamming codeword: <b style="color:var(--neon-g)">${codeword}</b><br>
  Parity bits: P1(pos1)=${c[1]}, P2(pos2)=${c[2]}, P4(pos4)=${c[4]}</div>`;
  html+=`<table class="hamming"><tr><th>Position</th>`;
  for(let i=1;i<=7;i++)html+=`<th>${i}</th>`;
  html+=`</tr><tr><th>Bit</th>`;
  for(let i=1;i<=7;i++)html+=`<td class="${[1,2,4].includes(i)?'parity-bit':''}">${c[i]}</td>`;
  html+=`</tr><tr><th>Type</th>`;
  for(let i=1;i<=7;i++)html+=`<td style="font-size:9px">${[1,2,4].includes(i)?'PARITY':'DATA'}</td>`;
  html+=`</tr></table>`;
  document.getElementById('hamming-step-area').innerHTML=html;
  hammingStep=0;
}

function hammingStepNext(){
  const stepDescs=[
    'Place data bits at positions 3, 5, 6, 7.',
    'Calculate P1 (position 1): XOR of bits at positions 3, 5, 7.',
    'Calculate P2 (position 2): XOR of bits at positions 3, 6, 7.',
    'Calculate P4 (position 4): XOR of bits at positions 5, 6, 7.',
    'Final codeword ready. All 7 positions filled.'
  ];
  if(hammingStep<stepDescs.length){
    const d=document.getElementById('ham-data').value.replace(/[^01]/g,'').slice(0,4).padEnd(4,'0').split('').map(Number);
    const c=new Array(8).fill(0);
    c[3]=d[0];c[5]=d[1];c[6]=d[2];c[7]=d[3];
    c[1]=(c[3]^c[5]^c[7]);c[2]=(c[3]^c[6]^c[7]);c[4]=(c[5]^c[6]^c[7]);
    const prev=document.getElementById('hamming-step-area').innerHTML||'';
    document.getElementById('hamming-step-area').innerHTML=prev+`<div class="warn-box">Step ${hammingStep+1}: ${stepDescs[hammingStep]}</div>`;
    hammingStep++;
  }
}

function hammingCorrect(){
  const rx=document.getElementById('ham-rx').value.replace(/[^01]/g,'').slice(0,7);
  if(rx.length!==7){document.getElementById('ham-correct').textContent='Please enter exactly 7 bits.';return;}
  const r=[0,...rx.split('').map(Number)];
  const s1=r[1]^r[3]^r[5]^r[7];
  const s2=r[2]^r[3]^r[6]^r[7];
  const s4=r[4]^r[5]^r[6]^r[7];
  const syndrome=s4*4+s2*2+s1;
  let out='';
  if(syndrome===0){out=`✓ No error detected. Codeword: ${rx}. Data: ${r[3]}${r[5]}${r[6]}${r[7]}`;}
  else{
    const corrected=rx.split('');
    corrected[syndrome-1]=corrected[syndrome-1]==='1'?'0':'1';
    const cc=corrected.join('');
    const cr=[0,...cc.split('').map(Number)];
    out=`✗ Error at bit position ${syndrome}. Corrected: ${cc}. Data: ${cr[3]}${cr[5]}${cr[6]}${cr[7]}`;
  }
  document.getElementById('ham-correct').style.color=syndrome===0?'var(--neon-g)':'var(--neon-y)';
  document.getElementById('ham-correct').textContent=out;
}

// CRC
function xorDiv(dividend,divisor){
  let rem=dividend.slice();
  const dl=divisor.length;
  for(let i=0;i<=rem.length-dl;i++){
    if(rem[i]==='1')for(let j=0;j<dl;j++)rem[i+j]=rem[i+j]===divisor[j]?'0':'1';
  }
  return rem.join('');
}

function crcEncode(){
  const data=document.getElementById('crc-data').value.replace(/[^01]/g,'');
  const poly=document.getElementById('crc-poly').value;
  const deg=poly.length-1;
  const padded=data+('0'.repeat(deg));
  const rem=xorDiv(padded.split(''),poly).slice(-deg);
  const frame=data+rem;
  let html=`<div class="info-box">
  <b>Data:</b> ${data}<br>
  <b>Generator:</b> ${poly} (degree ${deg})<br>
  <b>Padded data:</b> ${padded}<br>
  <b>Remainder (CRC):</b> <span style="color:var(--neon-y)">${rem}</span><br>
  <b>Transmitted frame:</b> <span style="color:var(--neon-g)">${frame}</span>
  </div>`;
  document.getElementById('crc-steps').innerHTML=html;
  document.getElementById('crc-rx').value=frame;
}

function crcVerify(){
  const frame=document.getElementById('crc-rx').value.replace(/[^01]/g,'');
  const poly=document.getElementById('crc-rx-poly').value;
  const rem=xorDiv(frame.split(''),poly);
  const allZero=rem.split('').every(b=>b==='0');
  document.getElementById('crc-verify-out').style.color=allZero?'var(--neon-g)':'var(--neon-r)';
  document.getElementById('crc-verify-out').textContent=allZero
    ?`✓ No errors detected. Remainder: ${rem.slice(-poly.length+1)}`
    :`✗ Error detected! Remainder: ${rem.slice(-poly.length+1)} (non-zero)`;
}

