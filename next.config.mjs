import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

export default function config(phase) {
  const development = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // Export-only route validation turns unknown URLs into runtime errors in dev.
    // Production still builds the same static site served by nginx.
    ...(development ? {} : { output: 'export' }),
    trailingSlash: true,
    images: { unoptimized: true },
    poweredByHeader: false,
    // nginx owns these 301s in production; Next handles them for npm run dev.
    ...(development ? {
      async redirects() {
        return [{ source: '/blog/:path*', destination: '/en/blog/:path*/', permanent: true }];
      }
    } : {})
  };
}
