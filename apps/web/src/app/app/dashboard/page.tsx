"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { authClient } from "@workspace/auth/client";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@workspace/ui/components/dialog";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { Spinner } from "@workspace/ui/components/spinner";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Medicine01Icon,
  Store01Icon,
  StoreAdd01Icon,
  Building01Icon,
  UserIcon,
  Logout01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  role: string;
  logo?: string | null;
  metadata?: {
    category?: string;
    phone?: string;
    address?: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [businesses, setBusinesses] = React.useState<BusinessItem[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const redirectedRef = React.useRef(false);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Fetch businesses for the logged-in user
  const fetchBusinesses = React.useCallback(async (userId: string) => {
    setLoadingBusinesses(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/business/list?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        credentials: "include",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.businesses)) {
          setBusinesses(json.businesses);
          setLoadingBusinesses(false);
          return;
        }
      }

      // Fallback to Better Auth client organization list
      const orgs = await authClient.organization.list();
      if (orgs?.data && Array.isArray(orgs.data)) {
        const mapped: BusinessItem[] = orgs.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          role: "owner",
          metadata: item.metadata
            ? typeof item.metadata === "string"
              ? JSON.parse(item.metadata)
              : item.metadata
            : {},
          createdAt: item.createdAt || new Date().toISOString(),
        }));
        setBusinesses(mapped);
      }
    } catch (err) {
      console.warn("Could not fetch businesses from API, falling back to client list:", err);
      try {
        const orgs = await authClient.organization.list();
        if (orgs?.data && Array.isArray(orgs.data)) {
          const mapped: BusinessItem[] = orgs.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            role: "owner",
            metadata: {},
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          setBusinesses(mapped);
        }
      } catch (clientErr) {
        console.error("Failed to fetch organizations:", clientErr);
      }
    } finally {
      setLoadingBusinesses(false);
    }
  }, []);

  React.useEffect(() => {
    if (!sessionLoading) {
      const userId = session?.user?.id;
      if (!userId) {
        // Redirect at most once per lost-auth event. useSession re-emits on
        // focus refetches/session rotations; without this guard every emission
        // would add another redirect.
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          // `replace` (not `push`): repeated pushes stack /sign-in history
          // entries and the Back button re-enters this route, re-triggering
          // the redirect — the perceived infinite reload loop.
          router.replace("/sign-in");
        }
        return;
      }
      redirectedRef.current = false;
      fetchBusinesses(userId);
    }
  }, [session?.user?.id, sessionLoading, router, fetchBusinesses]);

  // TanStack Form for Registering a Business
  const registerForm = useForm({
    defaultValues: {
      name: "",
      slug: "",
      category: "Retail Pharmacy",
      phone: "",
      address: "",
    },
    onSubmit: async ({ value, formApi }) => {
      setFormError(null);

      if (!session?.user?.id) {
        setFormError("User session not found. Please log in again.");
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const payload = {
          name: value.name.trim(),
          slug: value.slug.trim() || undefined,
          category: value.category.trim() || undefined,
          phone: value.phone.trim() || undefined,
          address: value.address.trim() || undefined,
          userId: session.user.id,
        };

        const res = await fetch(`${apiUrl}/api/business/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": session.user.id,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to register business.");
        }

        // Also sync Better Auth client cache
        try {
          await authClient.organization.create({
            name: value.name.trim(),
            slug: data.business.slug,
          });
        } catch {
          // Handled silently
        }

        setSuccessMessage(`Business "${data.business.name}" registered successfully!`);
        setDialogOpen(false);
        formApi.reset();

        // Refresh business list
        await fetchBusinesses(session.user.id);
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setFormError(err.message || "An error occurred while creating the business.");
      }
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/sign-in";
  };

  if (sessionLoading || (!session && !sessionLoading)) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm">Loading your MedCredit workspace...</p>
        </div>
      </div>
    );
  }

  const userDisplayName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <HugeiconsIcon icon={Medicine01Icon} strokeWidth={2} className="size-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">MedCredit</span>
              <span className="ml-2 text-xs text-muted-foreground hidden sm:inline-block">
                Workspace Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/40">
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-3.5 text-primary" />
              <span className="font-medium text-foreground">{session?.user?.name}</span>
              <span>({session?.user?.email})</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-2 p-4 text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {userDisplayName}!
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Select an active business to manage inventory, track expiry dates, or register a new store.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button className="gap-2 shrink-0 shadow-sm" />}>
              <HugeiconsIcon icon={StoreAdd01Icon} strokeWidth={2} className="size-4" />
              Register Business
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  registerForm.handleSubmit();
                }}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-5 text-primary" />
                    Register New Business
                  </DialogTitle>
                  <DialogDescription>
                    Enter your pharmacy, clinic, or store information. You will automatically become the owner of this business.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">{formError}</AlertDescription>
                    </Alert>
                  )}

                  <FieldGroup>
                    <registerForm.Field
                      name="name"
                      validators={{
                        onChange: ({ value }) =>
                          !value.trim() ? "Business name is required." : undefined,
                      }}
                    >
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Business Name *</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            placeholder="e.g. Apex Health Pharmacy"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            required
                          />
                          {field.state.meta.errors.length > 0 && (
                            <span className="text-xs text-destructive">
                              {field.state.meta.errors.join(", ")}
                            </span>
                          )}
                        </Field>
                      )}
                    </registerForm.Field>

                    <registerForm.Field name="slug">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Business Handle / Slug</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            placeholder="apex-health-pharmacy"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          <FieldDescription>
                            Unique identifier used for tenant routing. If empty, one will be generated.
                          </FieldDescription>
                        </Field>
                      )}
                    </registerForm.Field>

                    <registerForm.Field name="category">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            placeholder="e.g. Retail Pharmacy, Clinic, Supermarket"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </Field>
                      )}
                    </registerForm.Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <registerForm.Field name="phone">
                        {(field) => (
                          <Field>
                            <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              placeholder="+1 555-0199"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                            />
                          </Field>
                        )}
                      </registerForm.Field>

                      <registerForm.Field name="address">
                        {(field) => (
                          <Field>
                            <FieldLabel htmlFor={field.name}>City / Address</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              placeholder="Main St, Block 4"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                            />
                          </Field>
                        )}
                      </registerForm.Field>
                    </div>
                  </FieldGroup>
                </div>

                <DialogFooter className="gap-2">
                  <DialogClose render={<Button variant="outline" type="button" />}>
                    Cancel
                  </DialogClose>
                  <registerForm.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                  >
                    {([canSubmit, isSubmitting]) => (
                      <Button type="submit" disabled={!canSubmit || isSubmitting}>
                        {isSubmitting && <Spinner className="mr-2 size-4" />}
                        Register Business
                      </Button>
                    )}
                  </registerForm.Subscribe>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Business Grid Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-5 text-muted-foreground" />
              Your Businesses ({businesses.length})
            </h2>
          </div>

          {loadingBusinesses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="animate-pulse bg-muted/40 p-6">
                  <div className="h-6 w-3/4 bg-muted rounded mb-3" />
                  <div className="h-4 w-1/2 bg-muted rounded mb-6" />
                  <div className="h-8 w-full bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            /* Empty State */
            <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/40 flex flex-col items-center justify-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <HugeiconsIcon icon={Store01Icon} strokeWidth={1.5} className="size-7" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No businesses registered yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mt-1 mb-6">
                You are not currently associated with any businesses. Register your store to start tracking inventory batches and expiring items.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <HugeiconsIcon icon={StoreAdd01Icon} strokeWidth={2} className="size-4" />
                Register Your First Business
              </Button>
            </div>
          ) : (
            /* Business Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((biz) => {
                const isOwner = biz.role.toLowerCase() === "owner";
                return (
                  <Card
                    key={biz.id}
                    className="flex flex-col justify-between border border-border/80 hover:border-primary/50 transition-colors shadow-xs"
                  >
                    <CardHeader className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                          <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-5" />
                        </div>
                        <Badge
                          variant={isOwner ? "default" : "secondary"}
                          className="font-mono text-[10px] tracking-wider"
                        >
                          {biz.role.toUpperCase()}
                        </Badge>
                      </div>

                      <CardTitle className="text-lg font-semibold tracking-tight text-foreground mt-2">
                        {biz.name}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono text-muted-foreground truncate">
                        slug: @{biz.slug}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="px-5 py-2 space-y-1.5 text-xs text-muted-foreground flex-1">
                      {biz.metadata?.category && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">Category:</span>
                          <span>{biz.metadata.category}</span>
                        </div>
                      )}
                      {biz.metadata?.address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-medium text-foreground">Location:</span>
                          <span className="truncate">{biz.metadata.address}</span>
                        </div>
                      )}
                      {biz.metadata?.phone && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">Phone:</span>
                          <span>{biz.metadata.phone}</span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-5 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        Added {new Date(biz.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs hover:bg-primary hover:text-primary-foreground group"
                        onClick={async () => {
                          try {
                            await authClient.organization.setActive({
                              organizationId: biz.id,
                            });
                          } catch {}
                        }}
                      >
                        Select Store
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          strokeWidth={2}
                          className="size-3.5 group-hover:translate-x-0.5 transition-transform"
                        />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
