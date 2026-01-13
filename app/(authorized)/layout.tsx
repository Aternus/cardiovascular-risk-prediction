import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import Image from "next/image";

export default function AuthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <Image
            src="/brand-mark.svg"
            alt="Cardiovascular Risk Prediction System"
            width={40}
            height={40}
          />
          <div className="min-w-0 flex flex-col gap-2">
            <h1 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              Cardiovascular Risk Prediction System
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              PREVENT™ Risk Assessment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <SignOutButton />
        </div>
      </header>
      <main className="p-8 flex flex-col gap-8">{children}</main>
    </>
  );
}
