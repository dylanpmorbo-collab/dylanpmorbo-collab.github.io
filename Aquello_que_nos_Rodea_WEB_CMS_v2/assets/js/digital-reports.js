(function(){
  document.querySelectorAll('.archive-digital-report-group').forEach(group=>{
    const dialog=group.querySelector('.archive-digital-dialog');
    const workspace=dialog.querySelector('[data-digital-workspace]');
    const closeReport=dialog.querySelector('[data-digital-close]');
    let reportTrigger=null;
    let folderTrigger=null;
    let fileTrigger=null;
    let fullscreenExitAt=0;
    let fullscreenReturnPending=false;
    let primaryMediaNodes=null;
    let bootTimers=[];

    function clearBootTimers(){bootTimers.forEach(id=>{clearTimeout(id);clearInterval(id)});bootTimers=[];}
    function finishBoot(){
      clearBootTimers();
      const boot=workspace.querySelector('[data-retro-boot]');
      if(boot)boot.hidden=true;
      const surface=desktop();
      if(surface)surface.hidden=false;
      surface?.querySelector('[data-retro-folder]')?.focus();
    }
    function startBoot(){
      const boot=workspace.querySelector('[data-retro-boot]');
      if(!boot){finishBoot();return;}
      if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){finishBoot();return;}
      const duration=Math.min(5,Math.max(1,Number(boot.dataset.bootDuration)||1))*1000;
      const log=boot.querySelector('[data-retro-boot-log]');
      const bar=boot.querySelector('[data-retro-boot-bar]');
      const percent=boot.querySelector('[data-retro-boot-percent]');
      const emblem=boot.querySelector('[data-retro-boot-emblem]');
      const flash=boot.querySelector('[data-retro-boot-flash]');
      const custom=Array.from(boot.querySelectorAll('[data-retro-boot-line]'),line=>line.textContent);
      const lines=['DUB.SAR BIOS 16-BIT // ARCHIVO DIGITAL','COMPROBANDO MEMORIA .......... OK','LEYENDO UNIDAD MMC ........... OK',...custom,'MONTANDO DIRECTORIOS ......... OK','ACCESO AUTORIZADO'];
      const began=performance.now();
      let shown=0;
      const tick=()=>{
        const progress=Math.min(1,(performance.now()-began)/duration);
        const target=Math.min(lines.length,Math.floor(progress*lines.length));
        while(shown<target){const row=document.createElement('div');row.textContent='> '+lines[shown++];log.append(row);log.scrollTop=log.scrollHeight;}
        bar.style.width=Math.round(progress*100)+'%';
        percent.textContent=Math.round(progress*100)+'%';
      };
      bootTimers.push(setInterval(tick,40));
      bootTimers.push(setTimeout(()=>{emblem.hidden=true;boot.classList.add('is-scrolling');},Math.min(220,duration*.2)));
      if(flash?.querySelector('img')){
        const at=Math.min(duration-550,Math.max(250,duration*.4));
        bootTimers.push(setTimeout(()=>{flash.hidden=false;},at));
        bootTimers.push(setTimeout(()=>{flash.hidden=true;},at+500));
      }
      bootTimers.push(setTimeout(()=>{tick();finishBoot();},duration));
      boot.querySelector('[data-retro-boot-skip]')?.focus();
    }

    function desktop(){return workspace.querySelector('[data-retro-desktop]');}
    function folderWindow(){return desktop()?.querySelector('[data-retro-folder-window]');}
    function fileWindow(){return desktop()?.querySelector('[data-retro-file-window]');}
    function pauseVideos(container){container?.querySelectorAll('video').forEach(video=>video.pause());}
    function fileEntries(){return Array.from(folderWindow()?.querySelectorAll('[data-retro-file]')||[]);}
    function updateFileNavigation(){
      const window=fileWindow();
      const entries=fileEntries();
      const index=entries.indexOf(fileTrigger);
      window.querySelector('[data-retro-file-prev]').disabled=index<=0;
      window.querySelector('[data-retro-file-next]').disabled=index<0||index>=entries.length-1;
    }
    function pixelateImage(window){
      const wrap=window.querySelector('[data-conceal-mode="pixelado"]');
      const image=wrap?.querySelector('img');
      if(!image)return;
      const draw=()=>{
        if(!image.naturalWidth || !wrap.classList.contains('is-concealed'))return;
        try{
          const canvas=document.createElement('canvas');
          canvas.width=32;
          canvas.height=Math.max(1,Math.round(32*image.naturalHeight/image.naturalWidth));
          canvas.setAttribute('aria-hidden','true');
          canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
          image.after(canvas);
          wrap.classList.add('is-pixelated');
        }catch(e){}
      };
      if(image.complete)draw();
      else image.addEventListener('load',draw,{once:true});
    }
    function closeFile(restoreFocus=true){
      const window=fileWindow();
      if(!window || window.hidden)return;
      pauseVideos(window);
      window.hidden=true;
      window.classList.remove('is-maximized');
      window.querySelector('[data-retro-file-content]').replaceChildren();
      primaryMediaNodes=null;
      if(restoreFocus && fileTrigger?.isConnected)fileTrigger.focus();
      fileTrigger=null;
    }
    function closeFolder(restoreFocus=true){
      const window=folderWindow();
      if(!window || window.hidden)return;
      closeFile(false);
      window.hidden=true;
      window.querySelector('[data-retro-folder-content]').replaceChildren();
      if(restoreFocus && folderTrigger?.isConnected)folderTrigger.focus();
      folderTrigger=null;
    }
    function openFolder(button){
      const surface=desktop();
      const template=surface?.querySelector('template[data-retro-folder-template="'+button.dataset.retroFolder+'"]');
      if(!template)return;
      closeFolder(false);
      folderTrigger=button;
      const window=folderWindow();
      window.dataset.folderIndex=button.dataset.retroFolder;
      window.querySelector('[data-retro-folder-title]').textContent=button.textContent.trim();
      window.querySelector('[data-retro-folder-content]').replaceChildren(template.content.cloneNode(true));
      window.hidden=false;
      window.querySelector('[data-retro-folder-close]').focus();
    }
    function openFile(button){
      const surface=desktop();
      const folder=folderWindow();
      if(!surface || !folder || folder.hidden)return;
      const template=surface.querySelector('template[data-retro-file-template="'+folder.dataset.folderIndex+':'+button.dataset.retroFile+'"]');
      if(!template)return;
      closeFile(false);
      fileTrigger=button;
      const window=fileWindow();
      window.querySelector('[data-retro-file-title]').textContent=button.querySelector('.retro-file-name')?.textContent||'ARCHIVO';
      window.querySelector('[data-retro-file-content]').replaceChildren(template.content.cloneNode(true));
      updateFileNavigation();
      pixelateImage(window);
      const video=window.querySelector('video');
      watchVideo(video);
      window.hidden=false;
      window.querySelector('[data-retro-file-close]').focus();
    }
    function watchVideo(video){
      video?.addEventListener('fullscreenchange',()=>{
        if(!document.fullscreenElement){
          fullscreenExitAt=Date.now();
          setTimeout(()=>{fullscreenReturnPending=false;},500);
        }
      });
      video?.addEventListener('webkitendfullscreen',()=>{
        fullscreenExitAt=Date.now();
        setTimeout(()=>{fullscreenReturnPending=false;},500);
      });
    }
    function showAttachment(button){
      const detail=button.closest('.retro-file-detail');
      const media=detail?.querySelector('.retro-file-media');
      const template=detail?.querySelector('template[data-retro-attachment-template="'+button.dataset.retroAttachment+'"]');
      if(!media || !template)return;
      pauseVideos(media);
      if(!primaryMediaNodes)primaryMediaNodes=Array.from(media.childNodes);
      media.classList.remove('is-zoomed');
      media.replaceChildren(template.content.cloneNode(true));
      watchVideo(media.querySelector('video'));
      detail.querySelectorAll('[data-retro-primary-tools]').forEach(tools=>tools.hidden=true);
      detail.querySelectorAll('[data-retro-attachment]').forEach(entry=>entry.setAttribute('aria-pressed',String(entry===button)));
      detail.querySelector('[data-retro-attachment-return]').hidden=false;
      detail.querySelector('[data-retro-attachment-expand]').hidden=template.dataset.retroAttachmentKind!=='video';
      const zoom=detail.querySelector('[data-retro-attachment-zoom]');
      zoom.hidden=template.dataset.retroAttachmentKind!=='image';
      zoom.textContent='AMPLIAR IMAGEN';
      fileWindow()?.classList.remove('is-maximized');
    }
    function returnToDocument(button){
      const detail=button.closest('.retro-file-detail');
      const media=detail?.querySelector('.retro-file-media');
      if(!media || !primaryMediaNodes)return;
      pauseVideos(media);
      media.classList.remove('is-zoomed');
      media.replaceChildren(...primaryMediaNodes);
      primaryMediaNodes=null;
      detail.querySelectorAll('[data-retro-primary-tools]').forEach(tools=>tools.hidden=false);
      detail.querySelectorAll('[data-retro-attachment]').forEach(entry=>entry.setAttribute('aria-pressed','false'));
      button.hidden=true;
      detail.querySelector('[data-retro-attachment-expand]').hidden=true;
      detail.querySelector('[data-retro-attachment-zoom]').hidden=true;
      fileWindow()?.classList.remove('is-maximized');
    }
    function stepFile(offset){
      const entries=fileEntries();
      const next=entries[entries.indexOf(fileTrigger)+offset];
      if(next)openFile(next);
    }
    function openReport(button){
      const template=group.querySelector('template[data-digital-report-template="'+button.dataset.digitalOpen+'"]');
      if(!template)return;
      reportTrigger=button;
      workspace.replaceChildren(template.content.cloneNode(true));
      dialog.querySelector('[data-digital-dialog-title]').textContent=button.querySelector('strong')?.textContent||'INFORME DIGITAL';
      dialog.showModal();
      document.body.classList.add('archive-digital-dialog-open');
      startBoot();
    }
    function expandVideo(button){
      const video=button.closest('.retro-file-detail')?.querySelector('video');
      const window=fileWindow();
      if(!video || !window)return;
      if(window.classList.contains('is-maximized')){
        window.classList.remove('is-maximized');
        button.textContent='⛶ VER VÍDEO ENTERO';
        return;
      }
      const maximizeWindow=()=>{
        window.classList.add('is-maximized');
        button.textContent='AJUSTAR VENTANA';
      };
      if(video.requestFullscreen)video.requestFullscreen().then(()=>{fullscreenReturnPending=true;},maximizeWindow);
      else if(video.webkitEnterFullscreen){
        try{video.webkitEnterFullscreen();fullscreenReturnPending=true;}catch{maximizeWindow();}
      }else maximizeWindow();
    }

    group.addEventListener('click',event=>{
      const button=event.target.closest('[data-digital-open]');
      if(button && group.contains(button))openReport(button);
    });
    workspace.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(!button)return;
      if(button.hasAttribute('data-retro-boot-skip'))finishBoot();
      else if(button.hasAttribute('data-retro-folder'))openFolder(button);
      else if(button.hasAttribute('data-retro-file'))openFile(button);
      else if(button.hasAttribute('data-retro-file-close'))closeFile();
      else if(button.hasAttribute('data-retro-file-prev'))stepFile(-1);
      else if(button.hasAttribute('data-retro-file-next'))stepFile(1);
      else if(button.hasAttribute('data-retro-folder-close'))closeFolder();
      else if(button.hasAttribute('data-retro-video-expand'))expandVideo(button);
      else if(button.hasAttribute('data-retro-attachment'))showAttachment(button);
      else if(button.hasAttribute('data-retro-attachment-return'))returnToDocument(button);
      else if(button.hasAttribute('data-retro-reveal')){
        const wrap=button.closest('[data-retro-image-wrap]');
        const image=wrap?.querySelector('[data-retro-image]');
        if(!image)return;
        if(wrap.dataset.concealMode==='falso')image.src=image.dataset.original;
        wrap.classList.remove('is-concealed','is-pixelated');
        wrap.querySelector('canvas')?.remove();
        wrap.querySelector('.retro-image-warning')?.remove();
        fileWindow().querySelectorAll('[data-retro-zoom],[data-retro-annotated]').forEach(control=>control.hidden=false);
      }
      else if(button.hasAttribute('data-retro-zoom')){
        const media=button.closest('.retro-file-detail')?.querySelector('.retro-file-media');
        if(!media)return;
        media.classList.toggle('is-zoomed');
        button.textContent=media.classList.contains('is-zoomed')?'AJUSTAR':'AMPLIAR';
      }else if(button.hasAttribute('data-retro-annotated')){
        const image=button.closest('.retro-file-detail')?.querySelector('[data-retro-image]');
        if(!image || !image.dataset.annotated)return;
        const marked=image.getAttribute('src')===image.dataset.annotated;
        image.src=marked?image.dataset.original:image.dataset.annotated;
        button.textContent=marked?'VER MARCAS':'VER ORIGINAL';
      }
    });
    workspace.addEventListener('keydown',event=>{
      if(fileWindow()?.hidden || !fileWindow()?.contains(event.target))return;
      if(event.target.closest('video,button'))return;
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
        event.preventDefault();
        stepFile(event.key==='ArrowLeft'?-1:1);
      }
    });
    closeReport.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.addEventListener('cancel',event=>{
      if(fullscreenReturnPending || Date.now()-fullscreenExitAt<500){
        event.preventDefault();
        if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
        else fullscreenReturnPending=false;
      }
      else if(fileWindow() && !fileWindow().hidden){event.preventDefault();closeFile();}
      else if(folderWindow() && !folderWindow().hidden){event.preventDefault();closeFolder();}
    });
    dialog.addEventListener('close',()=>{
      clearBootTimers();
      pauseVideos(workspace);
      workspace.replaceChildren();
      document.body.classList.remove('archive-digital-dialog-open');
      if(reportTrigger?.isConnected)reportTrigger.focus();
      reportTrigger=null;
      folderTrigger=null;
      fileTrigger=null;
      primaryMediaNodes=null;
      fullscreenReturnPending=false;
      fullscreenExitAt=0;
    });
  });
})();
