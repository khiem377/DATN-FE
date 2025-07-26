import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: false,
    
    // Config cho Next.js 15
    experimental: {
        // Turbo config chỉ cần khi dùng --turbopack
        optimizePackageImports: ['antd', 'lucide-react'],
    },
    
    // Đảm bảo build đúng cho Vercel
    typescript: {
        ignoreBuildErrors: false,
    },
    
    eslint: {
        ignoreDuringBuilds: false, 
    },
    
    // Bỏ output: undefined vì nó không cần thiết
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;