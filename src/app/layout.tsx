import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';
import ServiceWorkerRegistration from '@/components/pwa/SWRegister';
import InstallPrompt from '@/components/pwa/InstallPrompt';

export const metadata: Metadata = {
  title: 'Pix Swipe — Ofertas X1 Prontas para Rodar',
  description:
    'Acesse uma biblioteca de ofertas prontas para rodar no modelo X1. Criativos, funis de WhatsApp e aulas de implementação. Copie, cole e saia rodando.',
  keywords: [
    'X1',
    'ofertas digitais',
    'tráfego pago',
    'WhatsApp',
    'afiliados',
    'low ticket',
    'Pix',
  ],
  openGraph: {
    title: 'Pix Swipe — Ofertas X1 Prontas para Rodar',
    description:
      'Biblioteca de ofertas X1 com criativos, funis e aulas. Copie e saia rodando.',
    siteName: 'Pix Swipe',
    type: 'website',
    locale: 'pt_BR',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
          <ServiceWorkerRegistration />
          <InstallPrompt />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'toast-custom',
              duration: 3000,
              style: {
                background: '#1e1e2e',
                color: '#f0f0f5',
                border: '1px solid #2a2a3d',
                borderRadius: '10px',
              },
              success: {
                iconTheme: {
                  primary: '#00d4aa',
                  secondary: '#0a0a0f',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff6b6b',
                  secondary: '#0a0a0f',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
