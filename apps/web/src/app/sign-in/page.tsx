"use client";

import { Suspense } from "react";
import { SignupForm } from "@/components/signup-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Medicine01Icon, Store01Icon } from "@hugeicons/core-free-icons";

export default function SignInPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <HugeiconsIcon icon={Medicine01Icon} strokeWidth={2} className="size-5" />
            </div>
            <span>MedCredit</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Suspense>
              <SignupForm defaultMode="signin" />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:flex flex-col justify-between p-10 border-l border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-4" />
          Multi-Tenant Pharmacy & Inventory Intelligence
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back to MedCredit.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Access your registered business organizations, inspect upcoming batch expiry dates, and manage your inventory with role-based precision.
          </p>
        </div>
        <div className="text-xs text-muted-foreground/80 font-mono">
          MedCredit Platform &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
