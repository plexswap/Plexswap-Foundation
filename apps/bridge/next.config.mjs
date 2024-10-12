import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin'
import { withAxiom } from 'next-axiom'

const withVanillaExtract = createVanillaExtractPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [
      '@plexswap/ui-plex',
      '@plexswap/style',
      '@plexswap/hooks',
      '@plexswap/localization',
      '@plexswap/utils',
  ],

  compiler: {
    styledComponents: true,
  },
}


export default withAxiom(withVanillaExtract(nextConfig))
