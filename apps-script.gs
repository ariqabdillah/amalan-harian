// Amalan Harian v2 — penghubung Google Sheets. Tanggal disimpan sebagai teks supaya tidak bergeser zona waktu.
const S='Log';
function sh_(){const ss=SpreadsheetApp.getActive();let s=ss.getSheetByName(S);if(!s){s=ss.insertSheet(S);s.appendRow(['Tanggal','ID Amalan','Amalan','Selesai','Catatan','Diubah']);s.setFrozenRows(1);}s.getRange('A:A').setNumberFormat('@');return s;}
function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function k_(v){return v instanceof Date?Utilities.formatDate(v,SpreadsheetApp.getActive().getSpreadsheetTimeZone(),'yyyy-MM-dd'):String(v).trim().slice(0,10);}
function all_(s){const n=s.getLastRow();return n<2?[]:s.getRange(2,1,n-1,6).getValues();}
function t_(v){return v instanceof Date?v.getTime():Number(v)||0;}
function doGet(){const m={};all_(sh_()).forEach(r=>{if(!r[0]||!r[1])return;const d=k_(r[0]),k=d+'|'+r[1],t=t_(r[5]);if(!m[k]||t>=m[k][4])m[k]=[d,String(r[1]),r[3]===true||r[3]==='TRUE'?1:0,String(r[4]||''),t];});return out_({ok:true,v:2,rows:Object.values(m)});}
function doPost(e){const l=LockService.getScriptLock();l.waitLock(20000);try{
const ops=JSON.parse(e.postData.contents).ops||[],s=sh_(),idx={},add=[],last={};
ops.forEach(o=>{const k=o.date+'|'+o.id;if(!last[k]||o.ts>=last[k].ts)last[k]=o;});
all_(s).forEach((r,i)=>{if(r[0]&&r[1])idx[k_(r[0])+'|'+r[1]]={row:i+2,ts:t_(r[5])};});
Object.keys(last).forEach(k=>{const o=last[k],v=[o.date,o.id,o.name||o.id,!!o.done,o.note||'',new Date(o.ts||Date.now())],f=idx[k];
if(f){if((o.ts||0)>=f.ts)s.getRange(f.row,1,1,6).setValues([v]);}else add.push(v);});
if(add.length)s.getRange(s.getLastRow()+1,1,add.length,6).setValues(add);
return out_({ok:true,v:2});}catch(err){return out_({ok:false,error:String(err)});}finally{l.releaseLock();}}
