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
      className="flex flex-col gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-5 rounded-xl h-36 overflow-auto border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] group cursor-pointer"
      target="_blank"
    >
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
        {title} →
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </a>
  );
}
