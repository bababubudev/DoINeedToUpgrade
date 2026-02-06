'use client';

export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Do I Need An Upgrade',
    description: 'Check if your PC can run any Steam game. Compare your CPU, GPU, RAM and storage against game requirements instantly.',
    url: 'https://do-i-need-to-upgrade.vercel.app',
    applicationCategory: 'UtilityApplication',
    operatingSystem: ['Windows', 'macOS', 'Linux'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    image: 'https://do-i-need-to-upgrade.vercel.app/icon-512.png',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '100',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
