/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // nada de output: 'export' aqui
  images: {
    // se usar next/image com domínios externos, declare aqui
    // domains: ['images.ctfassets.net', '...']
  },
}
module.exports = nextConfig
