/* Carcasa visual compartida por los tres minijuegos. Los formularios de código no la usan. */
(() => {
  function mount(overlay,panel){
    if(!overlay||!panel)return;
    overlay.classList.add('hack-device-overlay');
    const device=document.createElement('div');
    device.className='hack-device';
    device.setAttribute('role','group');
    device.setAttribute('aria-label','Dispositivo de hackeo');
    const screen=document.createElement('div');
    screen.className='hack-device__screen';
    const hud=document.createElement('div');
    hud.className='hack-device__hud';
    hud.innerHTML='<span class="hack-device__glyph" aria-hidden="true">⌬</span><strong>DISPOSITIVO DE HACKEO</strong><span class="hack-device__glyph" aria-hidden="true">⟡</span><span class="hack-device__glyph" aria-hidden="true">◇</span><span class="hack-device__glyph" aria-hidden="true">⌁</span>';
    const body=document.createElement('div');
    body.className='hack-device__body';
    body.append(panel);
    screen.append(hud,body);
    device.append(screen);
    overlay.append(device);
  }
  window.ArchiveHackDevice={mount};
})();
