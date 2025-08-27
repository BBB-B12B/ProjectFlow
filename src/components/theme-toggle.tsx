"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

export function ThemeToggle({ onThemeChange }: { onThemeChange?: (theme: string) => void }) {
    const { setTheme } = useTheme();
    const { toast } = useToast();

    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleSelect = (theme: string) => {
        if (theme === "dark") {
            setIsPasswordDialogOpen(true);
        } else {
            setTheme(theme);
            if (onThemeChange) {
                onThemeChange(theme);
            }
        }
    };

    const handlePasswordSubmit = async () => {
        setIsAuthenticating(true);
        try {
            const response = await fetch("/api/check-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password: passwordInput }),
            });

            const data = await response.json();

            if (data.success) {
                setTheme("dark");
                if (onThemeChange) {
                    onThemeChange("dark");
                }
                setIsPasswordDialogOpen(false);
                setPasswordInput("");
                toast({
                    title: "Success",
                    description: data.message,
                });
            } else {
                toast({
                    title: "Error",
                    description: data.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Password check failed:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsAuthenticating(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSelect("light")}>Light</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSelect("dark")}>Dark</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Enter Password for Dark Mode</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please enter the team password to enable dark mode.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="col-span-3"
                                disabled={isAuthenticating}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handlePasswordSubmit();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isAuthenticating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePasswordSubmit} disabled={isAuthenticating || passwordInput.length === 0}>
                            {isAuthenticating ? "Verifying..." : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
