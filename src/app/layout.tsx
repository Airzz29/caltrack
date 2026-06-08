import type { Metadata, Viewport } from 'next';
import { Syne, DM_Sans, DM_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import ThemeProvider from '@/components/ThemeProvider';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import InstallGate from '@/components/pwa/InstallGate';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
  title: 'CalTrack',
  description: 'Your personal calorie & nutrition tracker',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="bg-bg text-primary antialiased">
        <ServiceWorkerRegister />
        <InstallGate>
          <ToastProvider>
            <ThemeProvider>
              <div className="min-h-screen">{children}</div>
            </ThemeProvider>
          </ToastProvider>
        </InstallGate>
      </body>
    </html>
  );
}
