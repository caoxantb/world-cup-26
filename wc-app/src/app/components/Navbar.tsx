"use client";

import { useEffect, useRef } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Navbar() {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!navRef.current) return;
    document.documentElement.style.setProperty(
      "--nav-height",
      `${navRef.current.offsetHeight}px`
    );
  }, []);

  return (
    <header
      ref={navRef}
      className="
    fixed top-0 left-0 right-0
    z-40
    bg-white/70
    supports-[backdrop-filter]:bg-white/60
    backdrop-blur-xl
    backdrop-saturate-150
  "
    >
      <div className="flex w-full items-center justify-between px-20 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs font-semibold uppercase text-muted-foreground">
            Logo
          </div>
          <span className="text-sm font-semibold tracking-tight">
            World Cup 2026
          </span>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button className="text-sm font-semibold transition hover:opacity-80">
              Login
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-2xl font-semibold">
                Log in to your account
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Choose a sign-in method to continue.
              </p>
            </DialogHeader>
            <div className="grid gap-6">
              <section className="space-y-3">
                <button className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-muted/60">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base leading-none text-black shadow">
                    G
                  </span>
                  <span>Continue with Google</span>
                </button>
              </section>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>Or with email and password</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <section className="grid gap-3">
                <label className="grid gap-1 text-sm font-semibold text-foreground">
                  Email address
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-foreground">
                  Password
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <button className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90">
                  Continue
                </button>
                <div className="text-center text-sm text-foreground">
                  <span>New to WC26 Simulator? </span>
                  <span className="">Sign up here</span>
                </div>
              </section>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
