'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, ShoppingCart, History, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

const Sidebar = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
        </nav>
      </div>

      <div>
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