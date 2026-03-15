import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Truck, Map, LogOut, PackageCheck, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { role, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-sm shadow-primary/20">
              <Truck className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MeterTrack</span>
          </div>

          {role && (
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-1">
                {role === 'SENDER' ? (
                  <Link 
                    href="/" 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                ) : (
                  <Link 
                    href="/receiver" 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location === '/receiver' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <PackageCheck className="w-4 h-4" />
                    Deliveries
                  </Link>
                )}
              </nav>

              <div className="flex items-center gap-3 border-l pl-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Logged in as</span>
                  <span className="text-sm font-medium">{role === 'SENDER' ? 'Sender Admin' : 'Receiver Site'}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
