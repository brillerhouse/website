import content from '@/content/inspiration.json';
import { galleryHighlights } from './gallery';
import { site, type Locale } from './content';

export const inspirationCopy = (locale: Locale) => content[locale];

export function inspirationImage(locale: Locale) {
  const image = galleryHighlights[0];
  return { url: site.origin + (image.detailImage || image.image), alt: image.title[locale] };
}
