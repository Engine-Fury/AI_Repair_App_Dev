import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Truck, BarChart3, Upload, Settings, FileText, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Upload PO', href: '/upload', icon: Upload },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const NavigationItems = ({ mobile = false }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => mobile && setIsMenuOpen(false)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mobile ? 'w-full justify-start' : ''
            } ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center justify-center">
              <img src="/img/logo.png" alt="Fury Logo" className="h-8 w-auto sm:h-10" />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              <NavigationItems />
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="p-2"
                    onClick={() => setIsMenuOpen(true)}
                  >
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 sm:w-80">
                  <div className="flex flex-col space-y-4 mt-6">
                    <div className="flex items-center justify-center pb-4 border-b border-border">
                      <img src="/img/logo.png" alt="Fury Logo" className="h-8 w-auto" />
                    </div>
                    <nav className="flex flex-col space-y-2">
                      <NavigationItems mobile={true} />
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <main>{children}</main>
      </div>
    </div>
  );
};