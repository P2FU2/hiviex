import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hiviex — Social & AI Studio',
    short_name: 'Hiviex',
    description:
      'Plataforma para criadores e agências: agentes de IA, fluxos, integrações sociais e publicação.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#09090b',
    theme_color: '#6366f1',
    categories: ['business', 'productivity', 'social'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
