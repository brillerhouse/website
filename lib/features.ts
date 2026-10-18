import content from '@/content/features.json';
import type { Locale } from './content';

export const featuresCopy = (locale: Locale) => content[locale];
