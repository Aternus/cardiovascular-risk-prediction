"use client";

import { api } from "@/convex/_generated/api";
import { Preloaded, useMutation, usePreloadedQuery } from "convex/react";

export default function Home({
  preloaded,
}: {
  preloaded: Preloaded<typeof api.numbers.listNumbers>;
}) {
  const data = usePreloadedQuery(preloaded);
  const addNumber = useMutation(api.numbers.addNumber);
  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-md">
        <h2 className="text-xl font-bold text-foreground">
          Reactive client-loaded data
        </h2>
        <code className="overflow-x-auto rounded-lg border border-border bg-background p-4">
          <pre className="text-sm text-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        </code>
      </div>
      <button
        className="mx-auto cursor-pointer rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg"
        onClick={() => {
          void addNumber({ value: Math.floor(Math.random() * 10) });
        }}
      >
        Add a random number
      </button>
    </>
  );
}
