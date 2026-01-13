"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-chart-3/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-chart-2/35 blur-3xl"
        />
        <div className="relative z-10 flex w-full max-w-lg flex-col gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border/80 bg-card/80 shadow-lg backdrop-blur">
              <Image
                src="/brand-mark.svg"
                alt="Cardiovascular Risk Prediction System"
                width={64}
                height={64}
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Cardiovascular Risk Prediction System
            </h1>
            <p className="max-w-md text-muted-foreground">
              Sign in to access the risk assessment dashboard, patient insights,
              and model results. Create an account if you are new to the
              platform.
            </p>
          </div>
          <form
            className="flex w-full flex-col gap-4 rounded-2xl border border-border/80 bg-card/80 p-8 shadow-xl backdrop-blur"
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              const formData = new FormData(e.target as HTMLFormElement);
              formData.set("flow", flow);
              void signIn("password", formData)
                .catch((error) => {
                  setError(error.message);
                  setLoading(false);
                })
                .then(() => {
                  router.push("/");
                });
            }}
          >
            <input
              className="rounded-lg border border-input bg-background p-3 text-foreground transition-all outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              type="email"
              name="email"
              placeholder="Email"
              required
            />
            <div className="flex flex-col gap-1">
              <input
                className="rounded-lg border border-input bg-background p-3 text-foreground transition-all outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                type="password"
                name="password"
                placeholder="Password"
                minLength={8}
                required
              />
              {flow === "signUp" && (
                <p className="px-1 text-xs text-muted-foreground">
                  Password must be at least 8 characters
                </p>
              )}
            </div>
            <button
              className="cursor-pointer rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : flow === "signIn"
                  ? "Sign in"
                  : "Sign up"}
            </button>
            <div className="flex flex-row justify-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {flow === "signIn"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </span>
              <span
                className="cursor-pointer font-medium text-foreground/80 underline decoration-2 underline-offset-2 transition-colors hover:text-foreground hover:no-underline"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              >
                {flow === "signIn" ? "Sign up" : "Sign in"}
              </span>
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm font-medium break-words text-destructive">
                  Error: {error}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
