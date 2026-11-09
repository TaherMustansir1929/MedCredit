"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { cn } from "cn";
import { authClient } from "@workspace/auth/client";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Spinner } from "@workspace/ui/components/spinner";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";

interface SignupFormProps extends React.ComponentProps<"div"> {
  defaultMode?: "signup" | "signin";
}

export function SignupForm({
  className,
  defaultMode = "signup",
  ...props
}: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramMode = searchParams?.get("mode");
  const [mode, setMode] = React.useState<"signup" | "signin">(
    paramMode === "signin" || paramMode === "signup" ? paramMode : defaultMode
  );

  const [serverError, setServerError] = React.useState<string | null>(null);

  // TanStack Form for Sign Up
  const signupForm = useForm({
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        const { error } = await authClient.signUp.email({
          email: value.email.trim(),
          password: value.password,
          name: value.fullName.trim(),
          username: value.username.trim() || undefined,
        });

        if (error) {
          setServerError(error.message || "Sign up failed. Please check your credentials.");
          return;
        }

        window.location.href = "/app/dashboard";
      } catch (err: any) {
        setServerError(err?.message || "An unexpected error occurred during sign up.");
      }
    },
  });

  // TanStack Form for Sign In
  const signinForm = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const identifier = value.identifier.trim();

      try {
        let error = null;

        if (identifier.includes("@")) {
          const res = await authClient.signIn.email({
            email: identifier,
            password: value.password,
          });
          error = res.error;
        } else {
          const res = await authClient.signIn.username({
            username: identifier,
            password: value.password,
          });
          error = res.error;
        }

        if (error) {
          setServerError(error.message || "Invalid credentials. Please verify your details.");
          return;
        }

        window.location.href = "/app/dashboard";
      } catch (err: any) {
        setServerError(err?.message || "An unexpected error occurred during sign in.");
      }
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            {mode === "signup"
              ? "Fill in your details below to create your MedCredit account"
              : "Enter your username/email and password to access your businesses"}
          </p>
        </div>

        {serverError && (
          <Alert variant="destructive" className="py-2.5">
            <AlertDescription className="text-xs">{serverError}</AlertDescription>
          </Alert>
        )}

        {mode === "signup" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              signupForm.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            {/* Full Name Field */}
            <signupForm.Field
              name="fullName"
              validators={{
                onChange: ({ value }) => (!value.trim() ? "Full name is required." : undefined),
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    placeholder="Dr. Alex Rivera"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    className="bg-background"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </Field>
              )}
            </signupForm.Field>

            {/* Username Field */}
            <signupForm.Field
              name="username"
              validators={{
                onChange: ({ value }) =>
                  !value.trim()
                    ? "Username is required."
                    : value.length < 3
                    ? "Username must be at least 3 characters."
                    : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    placeholder="arivera"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    className="bg-background"
                  />
                  <FieldDescription>
                    Your unique handle for logging in.
                  </FieldDescription>
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </Field>
              )}
            </signupForm.Field>

            {/* Email Field */}
            <signupForm.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  !value.trim()
                    ? "Email is required."
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                    ? "Invalid email address."
                    : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="alex@medcredit.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    className="bg-background"
                  />
                  <FieldDescription>
                    Used for notifications and multi-tenant invitations.
                  </FieldDescription>
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </Field>
              )}
            </signupForm.Field>

            {/* Password Field */}
            <signupForm.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  !value
                    ? "Password is required."
                    : value.length < 8
                    ? "Password must be at least 8 characters long."
                    : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    className="bg-background"
                  />
                  <FieldDescription>Must be at least 8 characters.</FieldDescription>
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </Field>
              )}
            </signupForm.Field>

            {/* Confirm Password Field */}
            <signupForm.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ["password"],
                onChange: ({ value, fieldApi }) => {
                  if (!value) return "Please confirm your password.";
                  if (value !== fieldApi.form.getFieldValue("password")) {
                    return "Passwords do not match.";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    className="bg-background"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </Field>
              )}
            </signupForm.Field>

            <signupForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Field className="mt-2">
                  <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2 size-4" />}
                    Create Account
                  </Button>
                </Field>
              )}
            </signupForm.Subscribe>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              signinForm.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            {/* Identifier Field */}
            <signinForm.Field
              name="identifier"
              validators={{
                onChange: ({ value }) => (!value.trim() ? "Username or email is required." : undefined),
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Username or Email</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    placeholder="arivera or alex@medcredit.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    className="bg-background"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </Field>
              )}
            </signinForm.Field>

            {/* Password Field */}
            <signinForm.Field
              name="password"
              validators={{
                onChange: ({ value }) => (!value ? "Password is required." : undefined),
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    className="bg-background"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </Field>
              )}
            </signinForm.Field>

            <signinForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Field className="mt-2">
                  <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2 size-4" />}
                    Sign In
                  </Button>
                </Field>
              )}
            </signinForm.Subscribe>
          </form>
        )}

        <FieldSeparator>Or</FieldSeparator>

        <Field>
          <FieldDescription className="px-4 text-center">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setServerError(null);
                    setMode("signin");
                  }}
                  className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setServerError(null);
                    setMode("signup");
                  }}
                  className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Sign up
                </button>
              </>
            )}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  );
}
