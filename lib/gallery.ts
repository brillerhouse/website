import catalogue from '@/content/gallery-catalogue.json';
import references from '@/content/gallery.json';
import type { Locale } from './content';

export const galleryRooms = catalogue.rooms;
export const galleryStyles = catalogue.styles;
export type GalleryRoom = typeof galleryRooms[number];
export type GalleryStyle = typeof galleryStyles[number];
export type GalleryItem = {
  id: string;
  room: string;
  style: string;
  title: Record<Locale, string>;
  image: string;
  tile?: number;
  crop?: { x: number; y: number; width: number; height: number };
};
export const galleryConcepts: GalleryItem[] = galleryStyles.flatMap((_, round) =>
  galleryRooms.map((room, index) => {
    const style = galleryStyles[(round + index) % galleryStyles.length];
    return {
      id: `${room.id}-${style.id}`,
      room: room.id,
      style: style.id,
      title: { en: `${style.label.en} · ${room.label.en}`, uk: `${style.label.uk} · ${room.label.uk}` },
      image: style.image,
      tile: index,
      crop: style.crops[index]
    };
  })
);
export const galleryReferences: GalleryItem[] = references;
export function galleryPrompt(item: GalleryItem, locale: Locale) {
  const room = galleryRooms.find(room => room.id === item.room)!;
  const style = galleryStyles.find(style => style.id === item.style)!;
  return locale === 'uk'
    ? `Перетворіть кімнату на завантаженому фото: ${room.label.uk.toLowerCase()}, стиль «${style.label.uk}». Збережіть точку зйомки, масштаб кімнати, вікна, двері й наявні конструктивні елементи. ${style.brief.uk} ${room.brief.uk} Покажіть реалістичний цілісний редизайн із правдоподібним денним і штучним освітленням. Не додавайте людей, текст чи водяні знаки.`
    : `Redesign the ${room.label.en.toLowerCase()} in my uploaded photo in ${style.label.en} style. Preserve the camera viewpoint, room proportions, windows, doors and existing structural elements. ${style.brief.en} ${room.brief.en} Show a realistic, cohesive redesign with believable daylight and artificial lighting. Do not add people, text or watermarks.`;
}
export function galleryTileStyle(crop: NonNullable<GalleryItem['crop']>) {
  return {
    backgroundSize: `${100 / crop.width}% ${100 / crop.height}%`,
    backgroundPosition: `${100 * crop.x / (1 - crop.width)}% ${100 * crop.y / (1 - crop.height)}%`
  };
}
