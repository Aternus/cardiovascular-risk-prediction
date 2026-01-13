export function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex h-36 cursor-pointer flex-col gap-2 overflow-auto rounded-xl border border-slate-300 bg-slate-100 p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-slate-400 hover:bg-slate-200 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-700"
      target="_blank"
    >
      <h3 className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
        {title} →
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </a>
  );
}
