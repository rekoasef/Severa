'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, ShoppingCart, History, LogOut, LoaderCircle, Archive } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { deleteDb } from '@/lib/db'; // Importamos la nueva función

const Sidebar = () => {
  const router = useRouter();
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    const handleSyncStatus = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setSyncStatus(customEvent.detail);
    };
    window.addEventListener('sync-status', handleSyncStatus);
    return () => {
      window.removeEventListener('sync-status', handleSyncStatus);
    };
  }, []);

  const handleLogout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.auth.signOut();
    if (session) {
      await deleteDb(session.user.id);
    }
    router.push('/login');
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-card p-6 flex flex-col justify-between">
      <div>
        <Link href="/" className="mb-10 block">
          <Image src="/logo.png" alt="Logo de Severa" width={130} height={35} />
        </Link>
        <nav className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-3 p-2 rounded-lg hover:bg-background font-body text-text">
            <LayoutDashboard size={20} />
            <span>Panel de Control</span>
          </Link>
          <Link href="/nueva-compra" className="flex items-center gap-3 p-2 rounded-lg hover:bg-background font-body text-text">
            <ShoppingCart size={20} />
            <span>Nueva Compra</span>
          </Link>
          <Link href="/historial" className="flex items-center gap-3 p-2 rounded-lg hover:bg-background font-body text-text">
            <History size={20} />
            <span>Historial</span>
          </Link>
          <Link href="/alacena" className="flex items-center gap-3 p-2 rounded-lg hover:bg-background font-body text-text">
            <Archive size={20} />
            <span>Alacena</span>
          </Link>
        </nav>
      </div>
      <div className="flex flex-col gap-2">
        {syncStatus === 'syncing' && (
          <div className="flex items-center justify-center gap-2 text-sm text-primary p-2 bg-primary/10 rounded-lg">
            <LoaderCircle size={16} className="animate-spin" />
            <span>Sincronizando...</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background font-body text-text"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;