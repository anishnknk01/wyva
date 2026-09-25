"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { navLinks } from "@/lib/content";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/hooks/use-role";
import { signOut } from "@/app/auth/actions";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const role = useRole();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center shrink-0">
          <span className="font-heading text-2xl font-extrabold tracking-tight text-gray-900">
            wysa<span className="text-teal-600">.</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {user && (
            <li>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            </li>
          )}
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <form action={signOut}>
              <Button variant="ghost" size="lg" type="submit">
                <LogOut className="size-4" />
                Log out
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="lg" render={<Link href="/login" />}>
              Login
            </Button>
          )}
          {role !== "worker" && (
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700" render={<Link href="/create-task" />}>
              Post a Task
            </Button>
          )}        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="lg:hidden"
            render={
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="Open menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="sr-only">WYSA menu</SheetTitle>
              <span className="font-heading text-xl font-extrabold tracking-tight text-gray-900">
                wysa<span className="text-teal-600">.</span>
              </span>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {user && (
                <SheetClose
                  render={<Link href="/dashboard" />}
                  onClick={() => setOpen(false)}
                >
                  <span className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                    Dashboard
                  </span>
                </SheetClose>
              )}
              {navLinks.map((link) => (
                <SheetClose
                  key={link.href}
                  render={<Link href={link.href} />}
                  onClick={() => setOpen(false)}
                >
                  <span className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                    {link.label}
                  </span>
                </SheetClose>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                {user ? (
                  <form action={signOut}>
                    <Button variant="outline" size="lg" type="submit" className="w-full">
                      <LogOut className="size-4" />
                      Log out
                    </Button>
                  </form>
                ) : (
                  <SheetClose
                    render={<Link href="/login" />}
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex h-9 w-full items-center justify-center rounded-lg border border-border text-sm font-medium">
                      Login
                    </span>
                  </SheetClose>
                )}
                {role !== "worker" && (
                  <SheetClose
                    render={<Link href="/create-task" />}
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex h-9 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
                      Post a Task
                    </span>
                  </SheetClose>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
