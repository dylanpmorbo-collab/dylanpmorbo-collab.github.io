(function(root){
  'use strict';
  function storageKey(gate, scannerPath){
    const page=String(gate?.page||'');
    if(!/^archivo-[a-z0-9-]+\.html$/.test(page))return null;
    const archivePath=String(scannerPath||'').replace(/[^/]*$/,page);
    if(gate.type==='circuito')return 'archivo-circuito-v1:'+archivePath+'|'+gate.key+'|'+gate.level;
    if(gate.type==='imagen'||gate.type==='codigo')return 'archivo-acceso-v1:'+archivePath+'|'+gate.key+'|'+gate.type+'|'+(gate.level||gate.hash||'')+'|'+(gate.image||'');
    return null;
  }
  function isUnlocked(gate,scannerPath,storage){
    const key=storageKey(gate,scannerPath);
    if(!key)return false;
    try{return JSON.parse(storage.getItem(key)||'null')?.solved===true;}
    catch{return false;}
  }
  function isAccessible(item,scannerPath,storage){
    return !item.access?.length||item.access.every(gate=>isUnlocked(gate,scannerPath,storage));
  }
  const api={storageKey,isUnlocked,isAccessible};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ScannerAccess=api;
})(typeof window!=='undefined'?window:globalThis);
