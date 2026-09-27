const fs=require('node:fs');
const path=require('node:path');

const contentDir=path.join(__dirname,'..','content','personajes');
const apply=process.argv.includes('--apply');
let migrated=0;
for(const filename of fs.readdirSync(contentDir).filter(name=>name.endsWith('.json'))){
  const file=path.join(contentDir,filename);
  const person=JSON.parse(fs.readFileSync(file,'utf8'));
  let changed=false;
  for(const piece of person.digital_footprint||[]){
    for(const media of piece.media||[]){
      if(!['photo','video'].includes(media.kind)||media.quick_entry) continue;
      const lines=[];
      const add=(heading,value)=>lines.push(heading+':'+(value?' '+String(value):''));
      add('TÍTULO',media.title);
      add('FECHA',media.date);
      add('DESCRIPCIÓN',media.description);
      if(media.kind==='photo'){
        add('ALT',media.alt);
        add('AMPLIAR',media.zoom===true?'sí':'no');
        add('OCULTAR',media.sensitive===true?'sí':'no');
      }
      add('REACCIONES',media.reactions);
      add('COMENTARIOS',media.comments_text);
      media.quick_entry=lines.join('\n');
      for(const key of ['title','date','description','alt','zoom','sensitive','reactions','comments_text']) delete media[key];
      changed=true;
      migrated++;
    }
  }
  if(changed){
    console.log(filename+': '+(apply?'convertido':'pendiente'));
    if(apply) fs.writeFileSync(file,JSON.stringify(person,null,2)+'\n');
  }
}
console.log('Fichas '+(apply?'convertidas':'para convertir')+': '+migrated);
