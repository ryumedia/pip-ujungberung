/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, nextRuntime }) => {
    // Forcefully exclude xlsx from the Edge runtime bundle
    if (isServer && nextRuntime === 'edge') {
      config.externals.push('xlsx');
    }
    return config;
  },
};

export default nextConfig;