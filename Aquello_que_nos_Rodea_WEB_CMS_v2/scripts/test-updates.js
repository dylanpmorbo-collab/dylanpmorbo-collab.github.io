const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const code=fs.readFileSync(path.join(__dirname,'../assets/js/updates.js'),'utf8');
const memory=new Map();
function element(){return {
  dataset:{},classList:{toggle(){}},hidden:false,textContent:'',
  querySelector(){return null},querySelectorAll(){return []},
  setAttribute(){},append(){},appendChild(){},replaceChildren(){},
  addEventListener(){},focus(){},remove(){}
}}
function visit(items){
  const toggle=element(),panel=element(),list=element(),count=element();
  const document={
    querySelector(selector){return {'[data-updates-toggle]':toggle,'[data-updates-panel]':panel,'[data-updates-list]':list,'[data-updates-count]':count}[selector]||null},
    querySelectorAll(){return []},createElement:element,addEventListener(){}
  };
  const window={AQNR_UPDATES:items,addEventListener(){}};
  const localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
  vm.runInNewContext(code,{window,document,localStorage,location:{href:'https://example.test/index.html'},URL,console});
  return {window,state:()=>JSON.parse(memory.get('aqnr_updates_v1')),count};
}
const initial=visit([{id:'a',version:'',kind:'page',href:'a.html',notify:true}]);
assert.deepEqual(initial.state().unread,[],'la primera visita establece la línea base');
let result=visit([
  {id:'a',version:'',kind:'page',href:'a.html',notify:true},
  {id:'b',version:'',kind:'file',href:'a.html#foto',notify:true},
  {id:'c',version:'',kind:'file',href:'a.html#secreto',notify:false}
]);
assert.deepEqual(result.state().unread,['b'],'solo se avisa de contenido nuevo no silencioso');
result.window.AQNRUpdates.markOpened('b');
assert.deepEqual(result.state().unread,[],'abrir una pieza quita su aviso');
result=visit([
  {id:'a',version:'2',kind:'page',href:'a.html',notify:true},
  {id:'b',version:'',kind:'file',href:'a.html#foto',notify:true},
  {id:'c',version:'',kind:'file',href:'a.html#secreto',notify:false}
]);
assert.deepEqual(result.state().unread,['a'],'una revisión manual vuelve a notificar');
console.log('Novedades: primera visita, alta, silencio, apertura y revisión correctos.');

