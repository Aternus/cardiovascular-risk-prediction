import { api } from "@/convex/_generated/api";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import Image from "next/image";

import Home from "./inner";

export default async function ServerPage() {
  const preloaded = await preloadQuery(api.numbers.listNumbers, {
    count: 3,
  });

  const data = preloadedQueryResult(preloaded);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-4">
          <Image src="/convex.svg" alt="Convex Logo" width={48} height={48} />
          <div className="h-12 w-px bg-border"></div>
          <Image
            src="/nextjs-icon-light-background.svg"
            alt="Next.js Logo"
            width={48}
            height={48}
            className="dark:hidden"
          />
          <Image
            src="/nextjs-icon-dark-background.svg"
            alt="Next.js Logo"
            width={48}
            height={48}
            className="hidden dark:block"
          />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Convex + Next.js</h1>
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-md">
        <h2 className="text-xl font-bold text-foreground">
          Non-reactive server-loaded data
        </h2>
        <code className="overflow-x-auto rounded-lg border border-border bg-background p-4">
          <pre className="text-sm text-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        </code>
      </div>
      <Home preloaded={preloaded} />
    </div>
  );
}
