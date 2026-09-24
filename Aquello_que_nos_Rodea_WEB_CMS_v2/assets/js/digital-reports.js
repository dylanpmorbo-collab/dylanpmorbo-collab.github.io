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

    function desktop(){return workspace.querySelector('[data-retro-desktop]');}
    function folderWindow(){return desktop()?.querySelector('[data-retro-folder-window]');}
    function fileWindow(){return desktop()?.querySelector('[data-retro-file-window]');}
    function pauseVideos(container){container?.querySelectorAll('video').forEach(video=>video.pause());}
    function closeFile(restoreFocus=true){
      const window=fileWindow();
      if(!window || window.hidden)return;
      pauseVideos(window);
      window.hidden=true;
      window.classList.remove('is-maximized');
      window.querySelector('[data-retro-file-content]').replaceChildren();
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
      const video=window.querySelector('video');
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
      window.hidden=false;
      window.querySelector('[data-retro-file-close]').focus();
    }
    function openReport(button){
      const template=group.querySelector('template[data-digital-report-template="'+button.dataset.digitalOpen+'"]');
      if(!template)return;
      reportTrigger=button;
      workspace.replaceChildren(template.content.cloneNode(true));
      dialog.querySelector('[data-digital-dialog-title]').textContent=button.querySelector('strong')?.textContent||'INFORME DIGITAL';
      dialog.showModal();
      document.body.classList.add('archive-digital-dialog-open');
      closeReport.focus();
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
      if(button.hasAttribute('data-retro-folder'))openFolder(button);
      else if(button.hasAttribute('data-retro-file'))openFile(button);
      else if(button.hasAttribute('data-retro-file-close'))closeFile();
      else if(button.hasAttribute('data-retro-folder-close'))closeFolder();
      else if(button.hasAttribute('data-retro-video-expand'))expandVideo(button);
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
      pauseVideos(workspace);
      workspace.replaceChildren();
      document.body.classList.remove('archive-digital-dialog-open');
      if(reportTrigger?.isConnected)reportTrigger.focus();
      reportTrigger=null;
      folderTrigger=null;
      fileTrigger=null;
      fullscreenReturnPending=false;
      fullscreenExitAt=0;
    });
  });
})();
