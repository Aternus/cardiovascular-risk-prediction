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
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-700 flex flex-row justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Image src="/convex.svg" alt="Convex Logo" width={32} height={32} />
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-600"></div>
            <Image
              src="/nextjs-icon-light-background.svg"
              alt="Next.js Logo"
              width={32}
              height={32}
              className="dark:hidden"
            />
            <Image
              src="/nextjs-icon-dark-background.svg"
              alt="Next.js Logo"
              width={32}
              height={32}
              className="hidden dark:block"
            />
          </div>
          <h1 className="font-semibold text-slate-800 dark:text-slate-200">
            Convex + Next.js + Convex Auth
          </h1>
        </div>
        <div className="flex gap-2">
          <ThemeToggleButton />
          <SignOutButton />
        </div>
      </header>
      <main className="p-8 flex flex-col gap-8">{children}</main>
    </>
  );
}
