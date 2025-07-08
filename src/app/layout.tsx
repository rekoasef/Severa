import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
// Ya no importamos Sidebar aquí


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
      <body className={`${inter.variable} ${poppins.variable}`}>
        {/* Simplemente renderizamos los hijos, sin layout adicional */}
        {children}
      </body>
    </html>
  );
}