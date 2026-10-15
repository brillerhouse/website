'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/content';

function currentDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export function CurrentEffectiveDate({ locale, initialDate }: { locale: Locale; initialDate: string }) {
  const [date, setDate] = useState(initialDate);
  useEffect(() => {
    const refresh = () => setDate(currentDate());
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  const label = new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', {
    timeZone: 'Europe/Kyiv', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));
  return <time dateTime={date}>{label}</time>;
}
