'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { WalletAddressInput } from '@/components/wallet/WalletAddressInput';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PrivacyToggle } from '@/components/ui/privacy-toggle';
import { DataSourceToggle } from '@/components/dashboard/DataSourceToggle';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Journal', href: '/journal', icon: BookOpen },
];

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Build query string for nav links, stripping mock mode when a wallet is connected
  const rawParams = new URLSearchParams(searchParams.toString());
  const wallet = rawParams.get('wallet');
  if (wallet) {
    // Wallet connected ⇒ always live; drop any mock-only mode flag
    rawParams.delete('mode');
  }
  const search = rawParams.toString();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold hidden sm:inline">Deriverse Analytics</span>
          <span className="text-lg font-bold sm:hidden">Deriverse</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={search ? `${item.href}?${search}` : item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Wallet Address & Controls */}
        <div className="hidden md:flex items-center gap-2">
          <PrivacyToggle />
          <ThemeToggle />
          <DataSourceToggle />
          <WalletAddressInput />
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="container py-4 space-y-4">
            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={search ? `${item.href}?${search}` : item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Wallet Section */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <PrivacyToggle />
              <ThemeToggle />
              <DataSourceToggle />
            </div>
            <WalletAddressInput />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
