import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import Image from "next/image";
import Link from "next/link";

export default function AuthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background/80 p-4 shadow-sm backdrop-blur-md">
        <Link href="/" aria-label="Go to the main page">
          <div className="flex min-w-0 items-center gap-4">
            <Image
              src="/brand-mark.svg"
              alt="Cardiovascular Risk Prediction System"
              width={40}
              height={40}
            />

            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-base leading-tight font-semibold text-foreground sm:text-lg">
                Cardiovascular Risk Prediction System
              </h1>
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                PREVENT™ Risk Assessment
              </p>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-col gap-8 p-8">{children}</main>
    </>
  );
}
