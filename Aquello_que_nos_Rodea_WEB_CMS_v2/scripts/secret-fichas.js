const { createHash } = require('crypto');

function prepareSecretFichas(config, validTargets, secretFolders) {
  const entries = Array.isArray(config.secret_fiches) ? config.secret_fiches : [];
  const seen = new Set();
  const color = value => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '';
  const image = value => /^\/assets\/uploads\/[^?#]+\.(?:png|jpe?g|webp|avif)$/i.test(String(value || '')) ? String(value) : '';
  return entries.filter(entry => entry && entry.enabled !== false).map(entry => {
    let target = String(entry.target || '').trim();
    if (/^https?:\/\//i.test(target)) {
      const url = new URL(target);
      if (url.protocol !== 'https:' || url.hostname !== 'dylanpmorbo-collab.github.io' || url.port) {
        throw Error('La URL de una ficha secreta debe pertenecer a esta web: ' + target);
      }
      target = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    } else {
      target = target.replace(/^\/+/, '').split(/[?#]/, 1)[0];
    }
    if (!validTargets.has(target)) throw Error('Ficha secreta inexistente: ' + target);
    if (seen.has(target)) throw Error('Ficha secreta repetida: ' + target);
    seen.add(target);
    const code = String(entry.code || '').trim();
    const accessType = String(entry.access_type || (code ? 'code' : 'none'));
    if (!['none', 'code'].includes(accessType)) throw Error('Tipo de acceso no admitido en ' + target + ': ' + accessType);
    if (accessType === 'code' && !code) throw Error('Falta el código de ' + target);
    const folder = String(entry.scanner_folder || '').replace(/^\/+|\/+$/g, '');
    if (folder && !secretFolders.has(folder)) throw Error('La ficha ' + target + ' debe enlazarse desde una carpeta secreta configurada: ' + folder);
    return {
      target,
      accessType,
      codeHash: accessType === 'code' ? createHash('sha256').update(code).digest('hex') : '',
      folder,
      icon: {
        label: String(entry.icon_label || 'ABRIR EXPEDIENTE').trim(),
        subtitle: String(entry.icon_subtitle || '').trim(),
        image: image(entry.icon_image),
        color: color(entry.icon_color),
        background: color(entry.icon_background),
        size: Math.max(40, Math.min(110, Number(entry.icon_size) || 64))
      },
      dialog: {
        eyebrow: String(entry.dialog_eyebrow || 'EXPEDIENTE CLASIFICADO').trim(),
        title: String(entry.dialog_title || 'ACCESO RESTRINGIDO').trim(),
        description: String(entry.dialog_description || 'Introduce el código para consultar esta ficha.').trim(),
        label: String(entry.dialog_label || 'CÓDIGO DE ACCESO').trim(),
        placeholder: String(entry.dialog_placeholder || '').trim(),
        submit: String(entry.dialog_submit || 'ABRIR FICHA →').trim(),
        cancel: String(entry.dialog_cancel || 'VOLVER').trim(),
        error: String(entry.dialog_error || 'CÓDIGO INCORRECTO').trim(),
        background: color(entry.dialog_background),
        accent: color(entry.dialog_accent),
        text: color(entry.dialog_text),
        image: image(entry.dialog_image)
      }
    };
  });
}

module.exports = { prepareSecretFichas };
