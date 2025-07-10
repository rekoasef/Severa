import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast'; // Importa Toaster

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Severa',
  description: 'Severa: Tus cuentas, claras.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${poppins.variable} bg-background`}>
        {/* Componente para mostrar notificaciones en toda la app */}
        <Toaster position="bottom-center" />
        {children}
      </body>
    </html>
  );
}