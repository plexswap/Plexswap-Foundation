import { DefaultSeoProps } from 'next-seo'

export const SEO: DefaultSeoProps = {
  titleTemplate: '%s | Plexswap',
  defaultTitle: 'Plexswap',
  description:
    'Discover PlexSwap, an exclusive DEX on BNB Smart Chain (BSC) with special Farms and Crop Silos in DeFi.',
  twitter: {
    cardType: 'summary_large_image',
    handle: '@plex_finance',
    site: '@plex_finance',
  },
  openGraph: {
    title: 'PlexSwap - A simple and consistent DeFi Exchange approach on BNB Smart Chain (BSC)',
    description:
      'Earn WAYA through yield farming, then stake it in Crop Silos to earn more tokens! Initial Farm Offerings (new token launch model pioneered by PlexSwap), NFTs, and more, on a platform you can trust.',
    images: [{ url: 'https://assets.plexfinance.us/images/mix/Where_the_Crops_Begin.png' }],
  },
}
