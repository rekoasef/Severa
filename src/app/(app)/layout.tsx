import Sidebar from '@/components/Sidebar';
import SyncProvider from '@/components/SyncProvider'; // <-- 1. IMPORTA EL COMPONENTE

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SyncProvider /> {/* <-- 2. AÑADE EL COMPONENTE AQUÍ */}
      <Sidebar />
      <main className="flex-grow p-8 bg-background">{children}</main>
    </div>
  );
}