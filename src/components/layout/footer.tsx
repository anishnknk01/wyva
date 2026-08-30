"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { AtSign, Globe, MessageCircle } from "lucide-react";

import { navLinks } from "@/lib/content";

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "Post a Task", href: "/create-task" },
      { label: "Find Tasks", href: "/tasks" },
      { label: "Become a Wysa", href: "/become-a-wysa" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#help" },
      { label: "Safety", href: "/safety" },
      { label: "Contact us", href: "#help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/" },
      { label: "Privacy Policy", href: "/" },
      { label: "Community Guidelines", href: "/safety" },
    ],
  },
];

export function Footer() {
  return (
    <footer id="help" className="border-t border-border bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                <Image
                  src="/wysa-logo.png"
                  alt="WYSA logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Find your vibe. Post a task, and let a trusted Wysa nearby
              take it on, built for Mangalore.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[AtSign, MessageCircle, Globe].map((Icon, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label="Social link"
                  onClick={() =>
                    toast.info("Social links are coming soon")
                  }
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-coral hover:text-coral"
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-heading text-sm font-semibold">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-border pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} WYSA. Operating in Mangalore, Karnataka.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
