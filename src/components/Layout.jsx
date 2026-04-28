import { Link, useLocation, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Film, LayoutGrid, Settings, LogOut, Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Layout() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isTeamleider = user?.role === 'teamleider' || isAdmin;

  const navItems = [
    { to: '/', label: language === 'nl' ? 'Instructies' : language === 'fr' ? 'Instructions' : 'Instructions', icon: LayoutGrid },
    ...(isTeamleider ? [{ to: '/beheer', label: language === 'nl' ? 'Beheer' : language === 'fr' ? 'Gestion' : 'Management', icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-lg text-foreground tracking-tight block">ProdInstructie</span>
              <span className="hidden sm:block text-xs text-muted-foreground">Werkinstructies</span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
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
                  <span>{label}</span>
                </Link>
              );
            })}
            <div className="ml-2 pl-2 border-l border-border">
              <LanguageSwitcher />
            </div>
            <Button
              onClick={() => logout()}
              variant="ghost"
              size="icon"
              className="ml-2 text-muted-foreground hover:text-foreground"
              title={language === 'nl' ? 'Uitloggen' : language === 'fr' ? 'Se déconnecter' : 'Logout'}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border bg-card/95 backdrop-blur-sm">
            <nav className="flex flex-col px-3 py-3 space-y-2">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
              <div className="px-3 py-2.5 flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <LanguageSwitcher />
                </div>
              </div>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>{language === 'nl' ? 'Uitloggen' : language === 'fr' ? 'Se déconnecter' : 'Logout'}</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 px-3 sm:px-0">
        <Outlet />
      </main>
    </div>
  );
}