import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quantis Crypto Algo Trading Simulator',
    short_name: 'Quantis',
    description:
      'Build, backtest, and run crypto algorithmic trading strategies with real-time market data.',
    start_url: '/',
    display: 'standalone',
    background_color: '#D6EAFF',
    theme_color: '#FF90E8',
    icons: [
      {
        src: '/icon.svg',
        sizes: '64x64',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  };
}
