"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Truck,
  Fuel,
  FileText,
  Settings,
  HardHat,
  Monitor,
  ReceiptText,
  ShoppingCart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type IconType = React.ComponentType<{ size?: number; className?: string }> | any;

interface MenuItem {
  name: string;
  path: string;
  icon: IconType;
}

interface MenuGroup {
  title: string;
  icon: IconType;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Operaciones',
    icon: Activity,
    items: [
      { name: 'Personal', path: '/personal', icon: Users },
      { name: 'Asistencias', path: '/asistencias', icon: Monitor },
      { name: 'Viajes', path: '/viajes', icon: Truck },
    ]
  },
  {
    title: 'Logística',
    icon: Package,
    items: [
      { name: 'Dashboard', path: '/logistica', icon: LayoutDashboard },
      { name: 'Equipos', path: '/equipos', icon: HardHat },
      { name: 'Vehículos', path: '/vehiculos', icon: Truck },
      { name: 'Combustible', path: '/combustible', icon: Fuel },
      { name: 'Almacén', path: '/almacen', icon: Package },
    ]
  },
  {
    title: 'Administración',
    icon: ShieldCheck,
    items: [
      { name: 'Vales', path: '/vales', icon: ReceiptText },
      { name: 'Órdenes', path: '/ordenes', icon: ShoppingCart },
      { name: 'Proveedores', path: '/proveedores', icon: Users },
    ]
  },
  {
    title: 'Sistema',
    icon: Settings,
    items: [
      { name: 'Reportes', path: '/reportes', icon: FileText },
      { name: 'Usuarios', path: '/configuracion/usuarios', icon: Users },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user, hasAccess, canEdit } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '260px');
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '0px');
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handler = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handler as EventListener);
    return () => window.removeEventListener('toggleSidebar', handler as EventListener);
  }, []);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  };

  // Auto-expand group containing active page
  useEffect(() => {
    if (!user) return;

    for (const group of menuGroups) {
      const hasActivePath = group.items.some(item => item.path === pathname);
      if (hasActivePath && !expandedGroups.includes(group.title)) {
        setExpandedGroups(prev => [...prev, group.title]);
        break;
      }
    }
  }, [pathname, user]);

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar bg-sidebar border-r border-border h-screen flex flex-col transition-all duration-300 shadow-sm z-50 w-64 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} ${mobileOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-border">
          <div className="p-2 rounded-xl bg-blue-900 shadow-sm transition-transform hover:scale-110">
            <HardHat size={20} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter text-sidebar-foreground uppercase leading-none">
                Miner<span className="text-blue-600">App</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest mt-0.5">leriusDev. 2026</span>
            </div>
          )}
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8 custom-scrollbar">
          {user?.role !== 'conductor' && (
            <div>
              <Link
                href="/"
                onClick={handleLinkClick}
                className={`nav-link h-10 mb-2 flex items-center gap-3 px-3 rounded-lg transition-all ${pathname === '/' ? 'bg-sidebar-active text-blue-600 font-bold shadow-sm' : 'text-sidebar-foreground/60 hover:bg-sidebar-active/50 hover:text-sidebar-foreground'}`}
                title={isCollapsed ? 'Dashboard' : ''}
              >
                <LayoutDashboard size={18} className="flex-shrink-0" />
                {!isCollapsed && <span className="text-sm">Vista General</span>}
              </Link>
            </div>
          )}

          {menuGroups.map(group => {
            if (!user) return null;
            const role = user.role || 'operator';

            const visibleItems = group.items.filter(item => {
              // Special case for Almacenero/Personal which is not in the group items but accessible via sub-path
              // Actually, hasAccess handles this by logic.
              return hasAccess(item.path);
            });

            if (visibleItems.length === 0) return null;

            const isGroupExpanded = expandedGroups.includes(group.title);
            const GroupIcon = group.icon as IconType;

            return (
              <div key={group.title} className="space-y-1">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full px-4 py-2 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GroupIcon size={14} />
                      <span>{group.title}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${isGroupExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}

                {isGroupExpanded && (
                  <div className="space-y-1">
                    {visibleItems.map(item => {
                      const Icon = item.icon as IconType;
                      const isActive = pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={handleLinkClick}
                          className={`nav-link group relative h-10 flex items-center gap-3 px-3 rounded-lg transition-all ${isActive ? 'bg-sidebar-active text-blue-600 font-bold' : 'text-sidebar-foreground/60 hover:bg-sidebar-active/50 hover:text-sidebar-foreground'}`}
                        >
                          {isActive && !isCollapsed && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />
                          )}
                          <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'group-hover:text-sidebar-foreground transition-colors'}`} />
                          {!isCollapsed && <span className="text-sm">{item.name}</span>}
                          {isCollapsed && isActive && (
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 rounded-full mx-3" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border bg-sidebar-active/10">
          <div className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-sidebar-active/30 transition-all cursor-default">
            <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-sidebar-foreground truncate">{user?.name || 'Usuario'}</p>
                  <p className="text-[9px] text-sidebar-foreground/50 font-black uppercase tracking-tight">{user?.role || 'Visitante'}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <div
          className="absolute -right-3 top-10 w-6 h-6 bg-sidebar border border-border text-sidebar-foreground/60 rounded-full flex items-center justify-center cursor-pointer hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm z-51 lg:flex hidden"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </div>
      </aside>
    </>
  );
}
