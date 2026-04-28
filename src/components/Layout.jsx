import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Film, LayoutGrid, Settings, LogOut, ChevronRight } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isTeamleider = user?.role === 'teamleider' || isAdmin;

  const navItems = [
    { to: '/', label: 'Instructies', icon: LayoutGrid },
    ...(isTeamleider ? [{ to: '/beheer', label: 'Beheer', icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground tracking-tight">ProdInstructie</span>
              <span className="hidden sm:block text-xs text-muted-foreground">Werkinstructies</span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => logout()}
              className="ml-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title="Uitloggen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}