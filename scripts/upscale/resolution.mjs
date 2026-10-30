const profiles = {
  '1080p': { id: '1080p', width: 1440, height: 1080, imageSize: '2K', suffix: '1080' },
  '4k': { id: '4k', width: 4096, height: 3072, imageSize: '4K', suffix: '4k' }
};
export function resolutionProfile(value = '1080p') {
  const profile = profiles[String(value).toLowerCase()];
  if (!profile) throw new Error('--resolution must be 1080p or 4k (4096×3072, preserving 4:3)');
  return profile;
}
export function profileForHeight(height) {
  const profile = Object.values(profiles).find(p => p.height === height);
  if (!profile) throw new Error('Unsupported comparison height');
  return profile;
}
