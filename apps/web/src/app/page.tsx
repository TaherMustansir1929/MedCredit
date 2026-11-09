import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Medicine01Icon,
  Store01Icon,
  StoreAdd01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  Building01Icon,
} from "@hugeicons/core-free-icons";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col bg-background selection:bg-primary/20">
      {/* Navigation */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <HugeiconsIcon icon={Medicine01Icon} strokeWidth={2} className="size-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">MedCredit</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gap-1.5">
                Get Started
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
          <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-3.5" />
          Multi-Tenant Inventory & Expiry Tracking
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight">
          Pharmacy & Retail Stock Intake,{" "}
          <span className="text-primary underline decoration-primary/30 underline-offset-8">
            Simplified.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl text-balance">
          Manage inventory across business locations, ingest stock batches, and receive proactive expiry date alerts before medicines reach their shelf-life limit.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="gap-2 px-6 h-11 text-sm font-semibold">
              <HugeiconsIcon icon={StoreAdd01Icon} strokeWidth={2} className="size-4" />
              Create Business Account
            </Button>
          </Link>
          <Link href="/app/dashboard">
            <Button variant="outline" size="lg" className="gap-2 px-6 h-11 text-sm">
              <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-4" />
              Go to Workspace
            </Button>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-left">
          <div className="p-6 rounded-xl border border-border/60 bg-card/50 space-y-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Multi-Tenant Isolation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every pharmacy or retail branch operates with strict organizational boundaries and role-based permissions.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-card/50 space-y-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Batch & Expiry Vigilance</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track stock by specific batch numbers and expiration dates to prevent financial loss and ensure compliance.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-card/50 space-y-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Ephemeral Receipt Ingestion</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scan receipts to auto-populate invoices in memory without permanent cloud image retention.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        MedCredit Inventory &copy; {new Date().getFullYear()} — Built for retail pharmacies and healthcare providers.
      </footer>
    </div>
  );
}
