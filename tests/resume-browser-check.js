// All data is synthetic and confined to a separate test origin/browser profile.
const frame = document.getElementById('app');
const result = document.getElementById('result');
const fixture = () => ({kind:'oil-filters-project',version:8,sheetCount:3,
  workbook:{activeSheetId:'three',nextSheetId:4,sheets:['Фильтры','Свечи','Третий лист'].map((name,i)=>({
    id:['one','two','three'][i],name,snapshot:{rows:1500,data:{0:['TEST',`A${i}`,'5',`00${i}`,'CROSS','Авто','3/4']},
      rowMeta:{0:{itemId:`test-${i}`}},merges:[],nextMasterId:1}}))},
  stock:{revision:2,movements:[{id:'old-movement',quantityAfter:5}]},
  inventory:{sessions:[{id:'old-inventory',status:'applied',lines:[]}],activeSessionId:null},changeHistory:[]});
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function write(handle,text){const stream=await handle.createWritable();await stream.write(text);await stream.close();}
async function reload(){await new Promise(resolve=>{frame.addEventListener('load',resolve,{once:true});frame.contentWindow.location.reload();});await frame.contentWindow.appReady;}
function mockHandle(w){
  const disk={text:JSON.stringify(fixture()),permission:'prompt',requests:0,writes:0};
  return {name:'permission-test.json',disk,
    queryPermission:async()=>disk.permission,
    requestPermission:async()=>{disk.requests++;disk.permission='granted';return 'granted';},
    getFile:async()=>new w.File([disk.text],'permission-test.json'),
    isSameEntry:async other=>other.disk===disk,
    createWritable:async()=>{let text;return {write:async value=>{text=value;},close:async()=>{disk.text=text;disk.writes++;},abort:async()=>{}};}};
}
async function run(){
  let w=frame.contentWindow,d=w.document,passed=0;
  const check=(ok,message)=>{if(!ok)throw Error(message);passed++;result.textContent=`Running: ${passed} resume checks complete`;};
  try{
    await w.appReady;
    // A real FileSystemFileHandle survives IndexedDB structured cloning and an
    // actual iframe reload. OPFS is only a synthetic file source for these tests;
    // production never uses OPFS or stores the database there.
    let directory=await w.navigator.storage.getDirectory();
    let handle=await directory.getFileHandle('last-source.json',{create:true});
    const raw=JSON.stringify(fixture());await write(handle,raw);
    check(await w.openProjectFromFileHandle(handle),'Could not open the test file');
    check(await (await w.readPersistedProjectFileHandle()).isSameEntry(handle),'Actual IndexedDB did not retain the file handle');
    check(d.getElementById('projectStartup').hidden,'Startup card not hidden after open');
    const meta=w.readLastProjectReference();
    check(meta.name==='last-source.json'&&meta.ready&&meta.hasHandle,'Wrong remembered file metadata');
    check(!('workbook' in meta)&&!('data' in meta)&&!('payload' in meta),'File metadata contains the database');
    const external=fixture();external.workbook.sheets[2].name='СВЕЖЕЕ НАЗВАНИЕ';external.workbook.sheets[2].snapshot.data[0][2]='77';
    const externalText=JSON.stringify(external);await write(handle,externalText);
    const cache=JSON.stringify({data:[['STALE BROWSER DATABASE']]});w.localStorage.setItem('oil-filters-table-v1',cache);
    await reload();w=frame.contentWindow;d=w.document;
    // Reacquire host objects from the new document; promises belonging to the
    // destroyed iframe realm must not be awaited after navigation.
    directory=await w.navigator.storage.getDirectory();handle=await directory.getFileHandle('last-source.json');
    check(w.getCell(0,2).dataset.raw==='77','Restart did not load current file contents');
    check(d.querySelectorAll('.sheet-tab').length===3&&d.getElementById('tableTitle').textContent==='СВЕЖЕЕ НАЗВАНИЕ','Restart lost sheets or names');
    check(d.getElementById('projectStartup').hidden&&!d.querySelector('.table-section').hidden,'Loaded project still hidden');
    check(await (await handle.getFile()).text()===externalText,'Automatic reopening rewrote source bytes');
    check(w.localStorage.getItem('oil-filters-table-v1')===cache,'Startup modified the old cache');
    check(w.serializeCurrentProject().stock.movements[0].id==='old-movement','Reopen lost movement journal');
    check(d.getElementById('syncStatus').textContent.includes('каждые 5 минут'),'Reopen disabled autosave');
    // Save As remembers the new source, not the previous file.
    const copy=await directory.getFileHandle('saved-copy.json',{create:true});await write(copy,'');
    check(await w.saveProjectToFileHandle(copy),'Could not save a separate file');
    const newer=fixture();newer.workbook.sheets[2].snapshot.data[0][2]='88';await write(copy,JSON.stringify(newer));
    await reload();w=frame.contentWindow;d=w.document;
    check(w.getCurrentProjectFileName()==='saved-copy.json'&&w.getCell(0,2).dataset.raw==='88','Restart opened the old Save As source');
    directory=await w.navigator.storage.getDirectory();handle=await directory.getFileHandle('last-source.json');
    // Historical handles stored without reference metadata remain supported.
    w.localStorage.removeItem('oil-filters-last-project-reference-v1');
    const db=await w.openFileSystemDb();
    await new Promise((resolve,reject)=>{const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(handle,'project-file-handle');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
    await reload();w=frame.contentWindow;d=w.document;
    check(w.getCurrentProjectFileName()==='last-source.json'&&w.getCell(0,2).dataset.raw==='77','Legacy remembered handle did not migrate');
    // Permission expiry is simulated; renew with the real on-screen button.
    await w.newProject();
    const permission=mockHandle(w);w.readPersistedProjectFileHandle=async()=>permission;w.persistProjectFileHandle=async()=>true;
    let pickerCalls=0;w.showOpenFilePicker=async()=>{pickerCalls++;throw Error('Picker must not be used');};
    await w.initApp();
    check(permission.disk.requests===0,'Startup requested permission without a user gesture');
    check(!d.getElementById('projectStartup').hidden&&d.querySelector('.table-section').hidden,'Expired access looks like an empty workbook');
    check(d.getElementById('projectStartupTitle').textContent.includes(permission.name),'Missing last filename in startup card');
    check(!d.getElementById('reopenLastProject').hidden&&!d.getElementById('reopenLastProject').disabled,'Resume button not available');
    check(!await w.saveProject()&&!await w.downloadLocalProjectCopy(),'Unopened last file could be replaced by a blank project');
    const updated=fixture();updated.workbook.sheets[2].snapshot.data[0][2]='99';permission.disk.text=JSON.stringify(updated);
    d.getElementById('reopenLastProject').click();
    for(let i=0;i<100&&!d.getElementById('projectStartup').hidden;i++)await delay(30);
    check(permission.disk.requests===1&&pickerCalls===0,'Resume did not renew access directly');
    check(w.getCell(0,2).dataset.raw==='99'&&d.querySelectorAll('.sheet-tab').length===3,'Resume used old data or lost sheets');
    check(permission.disk.writes===0,'Resume wrote the source file');
    // Cancelled and malformed replacements must retain the valid last source.
    permission.disk.text='{';check(!await w.reopenLastProject(),'Malformed source accepted');
    check(w.getCell(0,2).dataset.raw==='99','Malformed source destroyed current cells');
    permission.disk.text=JSON.stringify(updated);check(await w.reopenLastProject(),'Could not retry a repaired source');
    // Test real failed persistence: functions cannot be cloned into IndexedDB.
    // A metadata tombstone must prevent the previous valid handle from winning.
    await reload();w=frame.contentWindow;d=w.document;
    directory=await w.navigator.storage.getDirectory();handle=await directory.getFileHandle('last-source.json');
    await w.openProjectFromFileHandle(handle);
    const uncloneable=mockHandle(w);uncloneable.disk.permission='granted';
    check(await w.openProjectFromFileHandle(uncloneable),'Valid database rejected because remembering failed');
    check(!w.readLastProjectReference().ready,'Failed persistence marked itself ready');
    check(await w.readPersistedProjectFileHandle()===null,'Failed persistence exposed the previous file as latest');
    check(!d.getElementById('projectStartup').hidden&&d.getElementById('projectStartupTitle').textContent.includes('не смог'),'Remember failure was hidden');
    await reload();w=frame.contentWindow;d=w.document;
    check(d.getElementById('projectStartupTitle').textContent.includes('permission-test.json'),'Failure restart forgot the last chosen name');
    check(d.getElementById('reopenLastProject').hidden,'Unusable old handle offered as the last file');
    check(Object.keys(w.serializeCurrentProject().workbook.sheets[0].snapshot.data).length===0,'Failure restart restored an unrelated database');
    // File-input browsers remember only a name; they must not load an old handle.
    check(await w.importProjectFile(new w.File([raw],'input-only.json')),'File input rejected');
    await reload();w=frame.contentWindow;d=w.document;
    check(d.getElementById('projectStartupTitle').textContent.includes('input-only.json'),'File input name was not remembered');
    check(d.getElementById('reopenLastProject').hidden&&await w.readPersistedProjectFileHandle()===null,'File input restarted with another writable file');
    check(w.localStorage.getItem('oil-filters-table-v1')===cache,'File input changed browser database cache');
    // The latest steering still holds.
    check(!d.getElementById('newProject'),'New-base button reappeared');
    result.textContent=`PASS: ${passed} resume checks (actual reload, actual handle storage, latest bytes, permissions, legacy handles, failures, file input).`;
  }catch(error){result.textContent=`FAIL after ${passed}: ${error.stack}`;}
}
if(frame.contentWindow.appReady)run();else frame.addEventListener('load',run,{once:true});
