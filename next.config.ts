/** @type {import('next').Config} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cvgnpyzgglrclzxxlbsp.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;