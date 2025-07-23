import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* This meta tag prevents mobile zoom when focusing on inputs */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        
        {/* SEO Meta Tags */}
        <meta name="theme-color" content="#FF69B4" />
        <meta name="description" content="The Smith Agency - Professional booking management platform for entertainment and events. Streamline your bookings, staff management, and client relationships." />
        <meta name="keywords" content="The Smith Agency, booking management, entertainment agency, staff management, event booking, TSA" />
        <meta name="author" content="The Smith Agency" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="The Smith Agency - Booking Management Platform" />
        <meta property="og:description" content="Professional booking management platform for entertainment and events. Streamline your bookings, staff management, and client relationships." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thesmithagency.com" />
        <meta property="og:image" content="https://thesmithagency.com/tsa-social.jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="The Smith Agency Logo" />
        <meta property="og:site_name" content="The Smith Agency" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Smith Agency - Booking Management Platform" />
        <meta name="twitter:description" content="Professional booking management platform for entertainment and events." />
        <meta name="twitter:image" content="https://thesmithagency.com/tsa-social.jpeg" />
        <meta name="twitter:image:alt" content="The Smith Agency Logo" />
        
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TSA" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Favicon and Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        
        {/* Apple Splash Screen Images */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 