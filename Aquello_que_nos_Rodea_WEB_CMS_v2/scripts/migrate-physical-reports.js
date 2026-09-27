// One-time conversion: existing report folders become folders with one document.
const fs=require('fs');
const path=require('path');
for(const collection of ['archivo','personajes']){
  const directory=path.join(__dirname,'..','content',collection);
  if(!fs.existsSync(directory))continue;
  for(const name of fs.readdirSync(directory).filter(name=>name.endsWith('.json'))){
    const file=path.join(directory,name);
    const item=JSON.parse(fs.readFileSync(file,'utf8'));
    let changed=false;
    for(const report of Array.isArray(item.police_reports)?item.police_reports:[]){
      if(!report||Array.isArray(report.documents)&&report.documents.length)continue;
      if(!report.body&&!report.image&&!report.image_2)continue;
      const document={title:report.title||'INFORME',paper:'crema',body:report.body||''};
      for(const key of ['image','image_2','image_3','image_4','image_5','image_6']){
        if(report[key])document[key]=report[key];
        delete report[key];
      }
      delete report.body;
      report.documents=[document];
      changed=true;
    }
    if(changed){fs.writeFileSync(file,JSON.stringify(item,null,2)+'\n');console.log(name);}
  }
}
