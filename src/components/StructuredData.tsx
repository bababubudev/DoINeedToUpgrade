const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://do-i-need-to-upgrade.vercel.app';

export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Do I Need An Upgrade',
    description: 'Check if your PC can run any Steam game. Compare your CPU, GPU, RAM and storage against game requirements instantly.',
    url: baseUrl,
    applicationCategory: 'UtilityApplication',
    operatingSystem: ['Windows', 'macOS', 'Linux'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    image: `${baseUrl}/icon-512.png`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
