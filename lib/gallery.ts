import catalogue from '@/content/gallery-catalogue.json';
import edition from '@/content/gallery-variants.json';
import references from '@/content/gallery.json';
import type { Locale } from './content';

export const galleryRooms = catalogue.rooms;
export const galleryStyles = catalogue.styles;
export const galleryTiers = edition.tiers;
export const gallerySizes = edition.sizes;
export type GalleryRoom = typeof galleryRooms[number];
export type GalleryStyle = typeof galleryStyles[number];
export type GalleryItem = {
  id: string;
  room: string;
  style: string;
  title: Record<Locale, string>;
  image: string;
  detailImage?: string;
  tile?: number;
  crop?: { x: number; y: number; width: number; height: number };
  tier?: string;
  size?: string;
  area?: number;
  architecture?: Record<Locale, string>;
};
// Interleave rooms, styles and specifications so the first screen is a varied selection.
export const galleryConcepts: GalleryItem[] = galleryStyles.flatMap((_, round) =>
  galleryRooms.flatMap((room, roomIndex) => galleryTiers.map((tier, tierIndex) => {
    const style = galleryStyles[(round + roomIndex + tierIndex * 4) % galleryStyles.length];
    const variant = edition.variants.find(item => item.room === room.id && item.style === style.id && item.tier === tier.id)!;
    return {
      ...variant,
      crop: 'crop' in variant ? variant.crop as GalleryItem['crop'] : undefined,
      title: { en: `${style.label.en} · ${room.label.en}`, uk: `${style.label.uk} · ${room.label.uk}` }
    };
  }))
);
export const galleryReferences: GalleryItem[] = references;
export const galleryHighlights = ['living-contemporary-premium', 'living-industrial-economy', 'bedroom-japandi-budget'].map(id => galleryConcepts.find(item => item.id === id)!);
export function galleryVersions(item: GalleryItem) {
  return galleryTiers.map(tier => galleryConcepts.find(other => other.room === item.room && other.style === item.style && other.tier === tier.id)!).filter(Boolean);
}
export function galleryPrompt(item: GalleryItem, locale: Locale) {
  const room = galleryRooms.find(room => room.id === item.room)!;
  const style = galleryStyles.find(style => style.id === item.style)!;
  const tier = galleryTiers.find(tier => tier.id === item.tier);
  const size = gallerySizes.find(size => size.id === item.size);
  const specification = tier ? (locale === 'uk' ? `Рівень комплектації: ${tier.label.uk}. ${tier.brief.uk} ` : `Specification level: ${tier.label.en}. ${tier.brief.en} `) : '';
  const scale = size ? (locale === 'uk' ? `Цей приклад призначений для кімнати категорії «${size.label.uk}». ${edition.sizeBriefs[size.id as keyof typeof edition.sizeBriefs].uk} Орієнтуйтеся на реальні розміри завантаженого фото, а не збільшуйте приміщення. ` : `This direction is for a ${size.label.en.toLowerCase()} room. ${edition.sizeBriefs[size.id as keyof typeof edition.sizeBriefs].en} Adapt to the actual dimensions in my photo rather than enlarging the room. `) : '';
  return locale === 'uk'
    ? `Перетворіть кімнату на завантаженому фото: ${room.label.uk.toLowerCase()}, стиль «${style.label.uk}». Збережіть точку зйомки, масштаб кімнати, вікна, двері й наявні конструктивні елементи. ${specification}${scale}${style.brief.uk} ${room.brief.uk} Створіть виразну архітектурну композицію, продумане світло, узгоджені матеріали й характерні акценти. Покажіть можливості наявної архітектури, не вигадуючи нових конструкцій. Природна експозиція, правдоподібні фактури, легкі складки текстилю й кілька доречних повсякденних речей. Без блиску 3D-візуалізації, штучного HDR-сяйва, людей, тексту чи водяних знаків.`
    : `Redesign the ${room.label.en.toLowerCase()} in my uploaded photo in ${style.label.en} style. Preserve the camera viewpoint, room proportions, windows, doors and existing structural elements. ${specification}${scale}${style.brief.en} ${room.brief.en} Make the architectural composition compelling, with considered light, coordinated materials and confident accents. Use the potential of the existing architecture without inventing structural changes. Natural photographic exposure, plausible material texture, subtly creased textiles and a few appropriate useful everyday objects. No CGI sheen, artificial HDR glow, people, text or watermarks.`;
}
