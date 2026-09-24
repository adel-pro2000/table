// Use a separate localhost origin and synthetic data only.
const frame = document.getElementById('app');
const result = document.getElementById('result');
function canonical(value) {
  if(Array.isArray(value)) return value.map(canonical);
  if(value&&typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  return value;
}
const fixture = () => ({kind:'oil-filters-project',version:7,workbook:{activeSheetId:'sheet-3',nextSheetId:4,
  sheets:['МАСЛЯНЫЕ ФИЛЬТРЫ','СВЕЧИ','Воздушные фильтры'].map((name,i)=>({id:`sheet-${i+1}`,name,
    snapshot:{rows:1500,data:{[i]:['Бренд',`A00${i}`,String(i+5),`000${i}`,'A\nB','Авто','3/4']},
      merges:[],rowMeta:{[i]:{itemId:`item-${i}`}},nextMasterId:1}}))},
  stock:{revision:1,movements:[{id:'old',type:'receipt',quantityAfter:5}]},
  inventory:{sessions:[{id:'finished',status:'applied',lines:[]}],activeSessionId:null},
  changeHistory:[{sheetId:'sheet-2',sheetName:'СВЕЧИ',changedAt:'2026-09-10T12:00:00Z',changes:[{row:1,column:'C',before:'4',after:'5'}]}]});

function fileHandle(win, initial) {
  const disk={text:initial,writes:0,opens:0,requests:0,permission:'granted',writePermission:null,grantOnRequest:false,hold:null,fail:false};
  return {name:'transfer.json',disk,
    queryPermission:async options=>options?.mode==='readwrite'&&disk.writePermission!==null?disk.writePermission:disk.permission,
    requestPermission:async options=>{disk.requests++;if(options?.mode==='readwrite'&&disk.grantOnRequest)disk.writePermission='granted';return options?.mode==='readwrite'&&disk.writePermission!==null?disk.writePermission:disk.permission;},
    isSameEntry:async other=>disk===other.disk,
    getFile:async()=>new win.File([disk.text],'transfer.json',{type:'application/json'}),
    createWritable:async()=>{disk.opens++;let pending;return{
      write:async text=>{pending=text;if(disk.hold)await disk.hold;},
      close:async()=>{if(disk.fail)throw Error('test disk failure');disk.text=pending;disk.writes++;},
      abort:async()=>{pending=null;}
    };}
  };
}

async function runChecks(){
  let w=frame.contentWindow,d=w.document,passed=0;
  const check=(ok,message)=>{if(!ok)throw Error(message);passed++;result.textContent=`Running: ${passed} checks complete`;};
  const signature=()=>JSON.stringify(w.serializeCurrentProject().workbook);
  try{
    result.textContent='Waiting for app startup';
    await w.appReady;
    // Control periodic ticks for deterministic failure/race tests. One real
    // accelerated real interval is exercised at the end, including continuous edits.
    const realSetInterval=w.setInterval,realClearInterval=w.clearInterval;
    const timers=new Map();let nextTimer=100000;
    w.setInterval=(callback,ms)=>{const id=nextTimer++;timers.set(id,{callback,ms});return id;};
    w.clearInterval=id=>{if(!timers.delete(id))realClearInterval.call(w,id);};
    w.persistProjectFileHandle=async()=>true;
    w.confirm=()=>true;
    const cache=JSON.stringify({data:[['OLD CACHE']]});
    w.localStorage.setItem('oil-filters-table-v1',cache);
    const old=fixture(),raw=JSON.stringify(old),file=fileHandle(w,raw);
    check(await w.openProjectFromFileHandle(file),`Could not open old 3-sheet JSON: ${d.getElementById('status').textContent}`);
    check(d.querySelectorAll('.sheet-tab').length===3,'Wrong tab count');
    check([...d.querySelectorAll('.sheet-tab')].map(x=>x.textContent).join('|')===old.workbook.sheets.map(x=>x.name).join('|'),'Sheet names changed');
    check(d.getElementById('tableTitle').textContent===old.workbook.sheets[2].name,'Active sheet title lost');
    check(file.disk.text===raw&&file.disk.writes===0,'Opening rewrote source');
    check(!w.hasUnsavedProjectChanges(),'Opening marked the file dirty');
    const baseline=signature();
    // Edit on a different sheet and preserve every other field and journal.
    w.switchToSheet('sheet-2');
    w.getCell(1,2).dataset.raw='21';w.renderAllCells();w.saveTableData();w.pushHistorySnapshot();
    check(w.hasUnsavedProjectChanges(),'Edit not marked unsaved');
    check(file.disk.writes===0,'Editing autosaved the source');
    check(w.localStorage.getItem('oil-filters-table-v1')===cache,'Edit overwrote browser cache');
    check(await w.saveProject(),'Explicit save failed');
    const saved=JSON.parse(file.disk.text);
    check(saved.sheetCount===3&&saved.workbook.sheets[1].snapshot.data[1][2]==='21','Save lost a sheet or edited quantity');
    check(JSON.stringify(canonical(saved.workbook.sheets[0]))===JSON.stringify(canonical(old.workbook.sheets[0])),'Save changed another sheet');
    check(JSON.stringify(saved.stock)===JSON.stringify(old.stock),'Save lost stock journal');
    check(saved.inventory.sessions[0].id==='finished'&&saved.changeHistory.length>0,'Save lost inventory or history');
    check(!w.hasUnsavedProjectChanges(),'Successful save still dirty');
    const savedSignature=signature();
    // Broken import must not replace the current workbook or its bound file.
    const broken=fixture();broken.workbook.sheets[1]=null;
    check(!await w.importProjectFile(new w.File([JSON.stringify(broken)],'broken.json')),'Broken import accepted');
    check(signature()===savedSignature,'Broken import replaced current table');
    check(file.disk.writes===1,'Broken import wrote the old source');
    // File replacement from another computer must be detected even if the name is unchanged.
    const newer=fixture();newer.workbook.sheets[2].name='НОВОЕ ИМЯ';file.disk.text=JSON.stringify(newer);
    check(!await w.saveProject(),'External change was overwritten');
    check(JSON.parse(file.disk.text).workbook.sheets[2].name==='НОВОЕ ИМЯ','External change lost');
    check(await w.openProjectFromFileHandle(file),'Could not reopen externally updated file');
    check(d.getElementById('tableTitle').textContent==='НОВОЕ ИМЯ','Reopen did not read new bytes');
    // Wait for a slow write; edits made in the meantime must remain unsaved.
    let release;file.disk.hold=new Promise(resolve=>{release=resolve;});
    w.getCell(2,2).dataset.raw='31';w.saveTableData();
    const pending=w.saveProject();
    await new Promise(resolve=>setTimeout(resolve,30));
    check(!await w.openProjectFromFileHandle(file),'Opened another file during a write');
    w.getCell(2,2).dataset.raw='32';w.saveTableData();release();
    check(await pending,'Slow save failed');
    check(JSON.parse(file.disk.text).workbook.sheets[2].snapshot.data[2][2]==='31','Write snapshot was not stable');
    check(w.hasUnsavedProjectChanges(),'Concurrent edits incorrectly marked saved');
    file.disk.hold=null;check(await w.saveProject(),'Second save failed');
    file.disk.fail=true;w.getCell(2,2).dataset.raw='33';w.saveTableData();
    const intact=file.disk.text;check(!await w.saveProject(),'Disk failure reported success');
    check(file.disk.text===intact&&w.hasUnsavedProjectChanges(),'Disk failure lost source or dirty state');
    file.disk.fail=false;
    w.confirm=()=>false;
    check(!await w.importProjectFile(new w.File([raw],'discard.json')),'Ignored cancel for unsaved changes');
    check(w.getCell(2,2).dataset.raw==='33','Cancelled open lost edits');
    w.confirm=()=>true;
    // Startup reads the actual stored handle. The old cache must not win.
    await w.newProject();
    w.readPersistedProjectFileHandle=async()=>file;
    await w.initApp();
    check(w.getCell(2,2).dataset.raw==='32','Startup did not read latest saved disk bytes');
    check(w.localStorage.getItem('oil-filters-table-v1')===cache,'Startup modified the old browser backup');
    await w.newProject();file.disk.permission='prompt';await w.initApp();
    check(Object.keys(w.serializeCurrentProject().workbook.sheets[0].snapshot.data).length===0,'Denied permission restored stale browser data');
    check(d.getElementById('status').textContent.includes('Открыть проект'),'Missing permission did not explain how to open');
    file.disk.permission='granted';
    // File input detaches the old writable handle and transfers the same three sheets.
    check(await w.importProjectFile(new w.File([raw],'from-other-computer.json')),'File input import failed');
    check(signature()===baseline,'Transfer through File input changed the workbook');
    w.supportsProjectFileAccess=()=>false;
    let downloads=[];w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,url:this.href});};
    const blobs=[];w.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:test';};w.URL.revokeObjectURL=()=>{};
    w.getCell(2,2).dataset.raw='44';w.saveTableData();check(await w.saveProject(),'Fallback save failed');
    check(file.disk.text===intact,'Fallback import/save wrote the previously bound file');
    const copied=JSON.parse(await blobs.at(-1).text());
    check(copied.workbook.sheets.length===3&&copied.workbook.sheets[2].snapshot.data[2][2]==='44','Downloaded copy lost sheets or edits');
    check(downloads.at(-1).name==='from-other-computer.json','Downloaded copy has wrong filename');
    w.downloadBrowserBackup();check(await blobs.at(-1).text()===cache,'Backup export changed old cache');
    await checkAutosave(w,d,check,timers,realSetInterval,realClearInterval);
    result.textContent=`PASS: ${passed} browser checks (JSON transfer, three sheets, periodic autosave, startup, writes, conflicts, failures, fallback, backup).`;
  }catch(error){result.textContent=`FAIL after ${passed}: ${error.stack}`;}
}

async function checkAutosave(w,d,check,timers,realSetInterval,realClearInterval){
  w.supportsProjectFileAccess=()=>true;
  const raw=JSON.stringify(fixture()),file=fileHandle(w,raw);
  check(await w.openProjectFromFileHandle(file),'Autosave: could not open transferred JSON');
  check(timers.size===1&&[...timers.values()][0].ms===300000,'Autosave interval must be 5 minutes');
  check(!d.getElementById('newProject'),'New-base button was not removed');
  check(!await w.autosaveProject()&&file.disk.writes===0,'Clean file was rewritten');
  w.prompt=()=> 'ПЕРЕНЕСЁННЫЙ ЛИСТ';w.renameActiveWorkbookSheet();
  w.getCell(2,2).dataset.raw='51';w.saveTableData();
  check(timers.size===1,'Editing duplicated the timer');
  check(await w.autosaveProject(),'Autosave did not write edits');
  let saved=JSON.parse(file.disk.text);
  check(saved.workbook.sheets.length===3&&saved.workbook.sheets[2].name==='ПЕРЕНЕСЁННЫЙ ЛИСТ'&&saved.workbook.sheets[2].snapshot.data[2][2]==='51','Autosave lost transferred sheets, name or values');
  check(d.getElementById('syncStatus').textContent.includes('Сохранено в')&&!w.hasUnsavedProjectChanges(),'Autosave success/time not shown');
  // Saving other committed cells must leave the current editor and caret intact.
  w.getCell(2,2).dataset.raw='52';w.saveTableData();
  w.focusCellForEdit(w.getCell(2,1));
  const editor=d.querySelector('.cell-editor');editor.value='A-NEW';editor.setSelectionRange(2,2);
  check(await w.autosaveProject(),'Autosave during editing failed');
  check(editor.isConnected&&d.activeElement===editor&&editor.selectionStart===2,'Autosave interrupted cell editing');
  check(JSON.parse(file.disk.text).workbook.sheets[2].snapshot.data[2][1]==='A002','Autosave committed an unfinished draft');
  w.saveCellEdit();check(await w.autosaveProject(),'Committed editor value was not autosaved');
  check(JSON.parse(file.disk.text).workbook.sheets[2].snapshot.data[2][1]==='A-NEW','Committed article lost');
  // Slow I/O: no overlapping saves, and newer revisions wait for the next tick.
  let release;file.disk.hold=new Promise(resolve=>{release=resolve;});
  w.getCell(2,2).dataset.raw='61';w.saveTableData();
  const pending=w.autosaveProject();await new Promise(resolve=>setTimeout(resolve,30));
  const opened=file.disk.opens;
  check(!await w.autosaveProject()&&file.disk.opens===opened,'Autosave opened overlapping writers');
  w.getCell(2,2).dataset.raw='62';w.saveTableData();release();
  check(await pending&&w.hasUnsavedProjectChanges(),'Edits during autosave were marked saved');
  check(JSON.parse(file.disk.text).workbook.sheets[2].snapshot.data[2][2]==='61','Autosave snapshot changed during I/O');
  file.disk.hold=null;check(await w.autosaveProject(),'Next tick failed to save newer edits');
  // Externally replaced file must pause until re-opened or explicitly saved as a copy.
  const external=fixture();external.workbook.sheets[2].name='ВНЕШНЯЯ ВЕРСИЯ';file.disk.text=JSON.stringify(external);
  w.getCell(2,2).dataset.raw='63';w.saveTableData();
  const untouched=file.disk.text;
  check(!await w.autosaveProject()&&file.disk.text===untouched,'Autosave overwrote an external version');
  const conflictOpens=file.disk.opens;w.saveTableData();
  check(!await w.autosaveProject()&&file.disk.opens===conflictOpens,'Paused autosave kept retrying');
  check(d.getElementById('syncStatus').textContent.includes('приостановлено'),'Conflict pause is not visible');
  check(await w.openProjectFromFileHandle(file),'Could not reopen external version');
  w.getCell(2,2).dataset.raw='64';w.saveTableData();
  check(await w.autosaveProject(),'Autosave did not resume for reopened external version');
  // Read-only permission: timer must never request access itself.
  const readonly=fileHandle(w,raw);readonly.disk.writePermission='prompt';
  await w.openProjectFromFileHandle(readonly);
  const requested=readonly.disk.requests;w.getCell(2,2).dataset.raw='71';w.saveTableData();
  check(!await w.autosaveProject()&&readonly.disk.requests===requested&&readonly.disk.writes===0,'Timer requested permission or wrote without access');
  check(!d.getElementById('enableProjectAutosave').hidden,'No way to enable write permission');
  readonly.disk.grantOnRequest=true;
  check(await w.enableProjectAutosave(),'Enabling write permission failed');
  check(readonly.disk.requests===requested+1&&readonly.disk.writes===1,'Explicit permission action did not save');
  readonly.disk.writePermission='denied';w.getCell(2,2).dataset.raw='72';w.saveTableData();
  check(!await w.autosaveProject()&&readonly.disk.requests===requested+1,'Revoked permission triggered a timer prompt');
  // A write error preserves dirty data; an explicit retry resumes the interval.
  readonly.disk.writePermission='granted';check(await w.enableProjectAutosave(),'Could not recover from revoked permission');
  readonly.disk.fail=true;w.getCell(2,2).dataset.raw='73';w.saveTableData();const intact=readonly.disk.text;
  check(!await w.autosaveProject()&&readonly.disk.text===intact&&w.hasUnsavedProjectChanges(),'Failed autosave lost source or edits');
  readonly.disk.fail=false;check(await w.enableProjectAutosave(),'Could not retry failed autosave');
  w.getCell(2,2).dataset.raw='74';w.saveTableData();check(await w.autosaveProject(),'Autosave stayed paused after successful retry');
  // Pause while Save As chooses a path; a cancelled picker retains the binding.
  let cancelPicker;w.showSaveFilePicker=()=>new Promise((resolve,reject)=>{cancelPicker=reject;});
  w.getCell(2,2).dataset.raw='75';w.saveTableData();const choosing=w.saveProjectAs();
  check(!await w.autosaveProject(),'Autosave ran while choosing a save target');
  cancelPicker(new w.DOMException('cancel','AbortError'));check(!await choosing,'Cancelled picker reported success');
  check(await w.autosaveProject(),'Cancelled picker left autosave blocked');
  // Import and new-base actions stop the old timer and never write an old file.
  const oldWrites=readonly.disk.writes;
  await w.importProjectFile(new w.File([raw],'unbound.json'));w.getCell(2,2).dataset.raw='81';w.saveTableData();
  check(!await w.autosaveProject()&&timers.size===0&&readonly.disk.writes===oldWrites,'File-input import left old autosave attached');
  await w.newProject();check(timers.size===0&&!await w.autosaveProject(),'New base kept an old autosave target');
  const copy=fileHandle(w,'');check(await w.saveProjectToFileHandle(copy),'First save of new base failed');
  check(timers.size===1,'First save did not start autosave');
  // Verify the production interval argument, but accelerate the clock in this
  // harness. Continuous edits must not postpone a periodic timer indefinitely.
  w.setInterval=(callback,ms)=>{check(ms===300000,'Production timer is not 5 minutes');return realSetInterval.call(w,callback,1000);};
  w.clearInterval=realClearInterval;
  const timed=fileHandle(w,raw);check(await w.openProjectFromFileHandle(timed),'Could not load timed fixture');
  w.startProjectAutosave();
  const started=Date.now();let value=90;
  const editing=realSetInterval.call(w,()=>{w.getCell(2,2).dataset.raw=String(++value);w.saveTableData();},100);
  try{
    while(timed.disk.writes===0&&Date.now()-started<10000)await new Promise(resolve=>setTimeout(resolve,100));
    check(timed.disk.writes>=1,'Periodic timer failed during continuous editing');
    check(Date.now()-started>=900,'Accelerated autosave fired before its interval');
    saved=JSON.parse(timed.disk.text);
    check(saved.workbook.sheets.length===3&&Number(saved.workbook.sheets[2].snapshot.data[2][2])>90,'Timed autosave lost changes or other sheets');
  }finally{realClearInterval.call(w,editing);}
}
if(frame.contentWindow.appReady) runChecks();
else frame.addEventListener('load',runChecks,{once:true});
