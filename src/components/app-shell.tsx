"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, GanttChartSquare, Calendar, Menu, Mountain, Gamepad2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navLinks = (
        <>
            <Link
                href="/projects"
                className={cn(
                    "transition-colors hover:text-foreground",
                    pathname.includes('/projects') || pathname.startsWith('/project/') ? "text-foreground" : "text-muted-foreground"
                )}
            >
                Projects
            </Link>
            <Link
                href="/analytics"
                className={cn(
                    "transition-colors hover:text-foreground",
                    pathname.includes('/analytics') ? "text-foreground" : "text-muted-foreground"
                )}
            >
                Analytics
            </Link>
            <Link
                href="/calendar"
                className={cn(
                    "transition-colors hover:text-foreground",
                    pathname.includes('/calendar') ? "text-foreground" : "text-muted-foreground"
                )}
            >
                Calendar
            </Link>
            <Link
                href="/party"
                className={cn(
                    "transition-colors hover:text-foreground",
                    pathname.includes('/party') ? "text-foreground" : "text-muted-foreground"
                )}
            >
                Party
            </Link>
        </>
    );

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
                {/* Desktop Navigation */}
                <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                    <Link href="/projects" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                        <Mountain className="h-6 w-6" />
                        <span className="sr-only">ProjectFlow</span>
                    </Link>
                    {navLinks}
                </nav>

                {/* Mobile Navigation */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 md:hidden"
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <nav className="grid gap-6 text-lg font-medium">
                             <Link href="/projects" className="flex items-center gap-2 text-lg font-semibold mb-4">
                                <Mountain className="h-6 w-6" />
                                <span>ProjectFlow</span>
                            </Link>
                            {navLinks}
                        </nav>
                    </SheetContent>
                </Sheet>
                 <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
                    {/* Placeholder for user menu or other right-aligned items */}
                 </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {children}
            </main>
        </div>
    );
}
