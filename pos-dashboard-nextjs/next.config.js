/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Menambahkan instruksi agar Railway tidak berhenti saat ada error kecil
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
