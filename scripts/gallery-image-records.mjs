import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
export async function galleryWebImages(root) {
  const manifest=JSON.parse(await fs.readFile(path.join(root,'content/gallery-web-images.json'),'utf8'));
  if(manifest.version!==1 || !Array.isArray(manifest.images))throw new Error('Invalid gallery web-image manifest');
  const map=new Map();
  for(const image of manifest.images) {
    if(map.has(image.id))throw new Error('Duplicate web-image ID: '+image.id);
    if(!image.src?.startsWith('/images/gallery/individual/') || image.src.includes('..'))throw new Error('Invalid gallery web-image URL: '+image.id);
    map.set(image.id,image);
  }
  return map;
}
export function applyGalleryWebImage(item,collection,images) {
  const webImage=images.get(collection+':'+item.id);
  return webImage?{...item,detailImage:webImage.src,webImage}:item;
}

export async function verifyGalleryWebImages(root,images) {
  for(const image of images.values()) {
    if(!Array.isArray(image.sources)||!image.sources.length||!image.sources.some(source=>source.src===image.src))throw new Error('Missing responsive sources: '+image.id);
    for(const source of image.sources) {
      if(!source.src?.startsWith('/images/gallery/individual/')||source.src.includes('..'))throw new Error('Invalid responsive image path: '+image.id);
      const bytes=await fs.readFile(path.join(root,'public',source.src));
      if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)throw new Error('Responsive image checksum mismatch: '+source.src);
      const metadata=await sharp(bytes).metadata();
      if(metadata.format!=='webp'||metadata.width!==source.width||metadata.height!==source.height)throw new Error('Responsive image dimensions/format mismatch: '+source.src);
      if(source.src===image.src&&(metadata.width!==image.width||metadata.height!==image.height))throw new Error('Full image dimensions mismatch: '+image.id);
    }
  }
}
