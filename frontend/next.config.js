/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    eslint: {
        ignoreDuringBuilds: true,
    },
    distDir: process.env.NODE_ENV === 'production' ? '.next' : '.next-dev',
    allowedDevOrigins: [
        'localhost',
        '127.0.0.1',
        '*.fly.dev',
        '*.builder.codes',
        'c350229c13f84ae7a41cd6c2bbf50f24-c1cbf6f7ad97404492f69e772.projects.builder.codes',
    ],
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.module.rules.push({
                test: /\.worker\.(js|ts)$/,
                use: {
                    loader: 'worker-loader',
                    options: {
                        filename: 'static/[hash].worker.js',
                        publicPath: '/_next/',
                    }
                },
            });
        }

        config.output.globalObject = 'self';

        return config;
    },
    async rewrites() {
        return [
            {
                // Proxy API requests to backend in production
                source: '/api/:path*',
                destination: process.env.NEXT_PUBLIC_BACKEND_URL + '/:path*'
            }
        ];
    },
    async redirects() {
        return [
            {
                source: '/data',
                destination: '/dashboard/data',
                permanent: true,
            },
            {
                source: '/data/:path*',
                destination: '/dashboard/data/:path*',
                permanent: true,
            },
            {
                source: '/result',
                destination: '/dashboard/result',
                permanent: true,
            },
            {
                source: '/results',
                destination: '/dashboard/results',
                permanent: true,
            },
            {
                source: '/variables',
                destination: '/dashboard/variables',
                permanent: true,
            }
        ];
    },
}

module.exports = nextConfig
