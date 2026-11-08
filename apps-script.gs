// Amalan Harian — penghubung Google Sheets. Tempel di Ekstensi → Apps Script, lalu
// Deploy sebagai Web app (Execute as: Me, Who has access: Anyone). Data di tab "Log".
const S='Log',TZ='Asia/Jakarta';
function sh_(){const ss=SpreadsheetApp.getActive();let s=ss.getSheetByName(S);if(!s){s=ss.insertSheet(S);s.appendRow(['Tanggal','ID Amalan','Amalan','Selesai','Catatan','Diubah']);s.setFrozenRows(1);s.getRange('A:A').setNumberFormat('yyyy-mm-dd');s.getRange('F:F').setNumberFormat('yyyy-mm-dd hh:mm');}return s;}
function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function k_(v){return v instanceof Date?Utilities.formatDate(v,TZ,'yyyy-MM-dd'):String(v).slice(0,10);}
function all_(s){const n=s.getLastRow();return n<2?[]:s.getRange(2,1,n-1,6).getValues();}
function t_(v){return v instanceof Date?v.getTime():Number(v)||0;}
function doGet(){return out_({ok:true,rows:all_(sh_()).filter(r=>r[0]&&r[1]).map(r=>[k_(r[0]),String(r[1]),r[3]===true?1:0,String(r[4]||''),t_(r[5])])});}
function doPost(e){const l=LockService.getScriptLock();l.waitLock(20000);try{
const ops=JSON.parse(e.postData.contents).ops||[],s=sh_(),idx={},add=[],last={};
ops.forEach(o=>{const k=o.date+'|'+o.id;if(!last[k]||o.ts>=last[k].ts)last[k]=o;});
all_(s).forEach((r,i)=>{if(r[0]&&r[1])idx[k_(r[0])+'|'+r[1]]={row:i+2,ts:t_(r[5])};});
Object.keys(last).forEach(k=>{const o=last[k],v=[Utilities.parseDate(o.date,TZ,'yyyy-MM-dd'),o.id,o.name||o.id,!!o.done,o.note||'',new Date(o.ts||Date.now())],f=idx[k];
if(f){if((o.ts||0)>=f.ts)s.getRange(f.row,1,1,6).setValues([v]);}else add.push(v);});
if(add.length)s.getRange(s.getLastRow()+1,1,add.length,6).setValues(add);
return out_({ok:true});}catch(err){return out_({ok:false,error:String(err)});}finally{l.releaseLock();}}
