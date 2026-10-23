const ScannerFolders = (() => {
  const plainLabel = value => String(value ?? '').replace(/\s*\|\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const normalize = value => plainLabel(value).normalize('NFC').toLocaleLowerCase('es');
  const pathOf = item => String(item.folder_path ?? item.folder?.replaceAll(' / ', '/') ?? '');
  const secretsOf = item => Array.isArray(item.secret_folders) ? item.secret_folders : [];
  const isRevealed = (item, revealed) => secretsOf(item).every(path => revealed.has(path));
  const visibleItems = (catalog, revealed) => catalog.filter(item => isRevealed(item, revealed));
  const secretPaths = catalog => [...new Set(catalog.flatMap(secretsOf))];
  const rawLabelOf = (path, labels = {}) => labels[path] || path.split('/').at(-1) || '';
  const labelOf = (path, labels = {}) => plainLabel(rawLabelOf(path, labels));
  const desktopLabelOf = (path, labels = {}) => String(rawLabelOf(path, labels)).replace(/\s*\|\s*/g, '\n').trim();
  const displayPath = (path, labels = {}) => String(path ?? '').split('/').filter(Boolean)
    .map((_, index, segments) => labelOf(segments.slice(0, index + 1).join('/'), labels)).join(' / ');
  const matchingSecrets = (catalog, query, labels = {}) => {
    const sought = normalize(query);
    if (!sought) return [];
    return secretPaths(catalog).filter(path => normalize(labelOf(path, labels)) === sought);
  };
  const hasVisibleContents = (catalog, path, revealed) => visibleItems(catalog, revealed)
    .some(item => pathOf(item) === path || pathOf(item).startsWith(path + '/'));
  const hasUnvisitedSecret = (path, revealed, visited) => [...revealed]
    .some(secret => !visited.has(secret) && (secret === path || secret.startsWith(path + '/')));
  return { normalize, pathOf, secretsOf, isRevealed, visibleItems, secretPaths, labelOf, desktopLabelOf, displayPath, matchingSecrets, hasVisibleContents, hasUnvisitedSecret };
})();

if (typeof window !== 'undefined') window.ScannerFolders = ScannerFolders;
if (typeof module !== 'undefined' && module.exports) module.exports = ScannerFolders;
