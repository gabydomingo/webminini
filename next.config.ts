/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Permitimos calidad 100 y las estándar de Next.js
    qualities: [25, 50, 75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cvgnpyzgglrclzxxlbsp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;