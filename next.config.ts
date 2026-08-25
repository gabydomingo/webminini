import type { NextConfig } from 'next';

// Cambiar acá si algún día se muda el proyecto de Supabase.
const SUPABASE_HOST = 'syqfekxxiztmlqydtgec.supabase.co';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: SUPABASE_HOST,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Cabeceras de seguridad. Suben la nota de "Best Practices" y, sobre
  // todo, hacen que la web se comporte de forma más predecible frente a
  // proxies y filtros de red.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // Evita que el navegador "adivine" el tipo de un archivo.
            // Sin esto, un proxy o un filtro puede reinterpretar una
            // respuesta y bloquearla por precaución.
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Nadie puede meter la web dentro de un iframe ajeno.
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Al salir del sitio se manda el dominio, nunca la URL
            // completa con los filtros de búsqueda del visitante.
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Apagamos permisos del navegador que la web no usa.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), payment=(), usb=()',
          },
        ],
      },
      {
        // Las fuentes propias no cambian nunca: se cachean para siempre
        // y el visitante recurrente no las vuelve a bajar.
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
