/** @type {import('next').NextConfig} */
const nextConfig = {
  // No rewrites - frontend calls backend directly from browser
  // This allows session cookies to travel with requests
}
module.exports = nextConfig
