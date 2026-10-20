const ScannerFolders = (() => {
  const normalize = value => String(value ?? '').trim().normalize('NFC').toLocaleLowerCase('es');
  const pathOf = item => String(item.folder_path ?? item.folder?.replaceAll(' / ', '/') ?? '');
  const secretsOf = item => Array.isArray(item.secret_folders) ? item.secret_folders : [];
  const isRevealed = (item, revealed) => secretsOf(item).every(path => revealed.has(path));
  const visibleItems = (catalog, revealed) => catalog.filter(item => isRevealed(item, revealed));
  const secretPaths = catalog => [...new Set(catalog.flatMap(secretsOf))];
  const matchingSecrets = (catalog, query) => {
    const sought = normalize(query);
    if (!sought) return [];
    return secretPaths(catalog).filter(path => normalize(path.split('/').at(-1)) === sought);
  };
  const hasVisibleContents = (catalog, path, revealed) => visibleItems(catalog, revealed)
    .some(item => pathOf(item) === path || pathOf(item).startsWith(path + '/'));
  return { normalize, pathOf, secretsOf, isRevealed, visibleItems, secretPaths, matchingSecrets, hasVisibleContents };
})();

if (typeof window !== 'undefined') window.ScannerFolders = ScannerFolders;
if (typeof module !== 'undefined' && module.exports) module.exports = ScannerFolders;
