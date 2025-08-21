'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, FolderKanban, Workflow } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Main layout component using a Navbar
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/projects"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Workflow className="h-6 w-6 text-primary" />
            <span className="sr-only">ProjectFlow</span>
          </Link>
          <Link
            href="/projects"
            className={cn(
                "transition-colors hover:text-foreground",
                (pathname.startsWith('/projects') || pathname === '/') ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Projects
          </Link>
          <Link
            href="/analytics"
            className={cn(
                "transition-colors hover:text-foreground",
                pathname.startsWith('/analytics') ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Analytics
          </Link>
        </nav>
        {/* Mobile Menu can be added here later */}
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
             {/* Search bar can be added here */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/40x40" alt="User avatar" data-ai-hint="person portrait" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
