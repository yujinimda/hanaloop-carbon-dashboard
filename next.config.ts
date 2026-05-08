import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Dev-only overlay badge clutters our automated screenshots and is not
  // user-facing in production anyway.
  devIndicators: false,
}

export default nextConfig
