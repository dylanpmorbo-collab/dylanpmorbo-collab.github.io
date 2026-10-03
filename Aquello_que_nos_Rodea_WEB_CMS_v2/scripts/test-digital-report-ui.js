const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(
  path.join(__dirname, '..', 'dist', 'archivo-sucesos-homicidio-richard-alcoy.html'),
  'utf8'
);

assert.match(page, /data-retro-boot[^>]*data-boot-duration="[1-5]"/);
assert.match(page, /data-retro-boot-skip/);
assert.match(page, /data-retro-desktop hidden/);

for (const marker of ['data-retro-attachment-zoom', 'data-retro-zoom']) {
  const position = page.indexOf(marker);
  assert.notEqual(position, -1, `${marker} is missing`);
  const mediaColumn = page.lastIndexOf('<div class="retro-file-media-column">', position);
  const infoPanel = page.lastIndexOf('<aside class="retro-file-info">', position);
  assert.ok(mediaColumn > infoPanel, `${marker} is not under the image`);
}

console.log('Digital report boot and image controls: OK');
