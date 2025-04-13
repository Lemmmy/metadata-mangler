import { cn } from "~/lib/utils";

const widths = ["w-1/2", "w-1/4", "w-1/3"];

export function DirectorySkeleton() {
  return (
    <ul className="list-none">
      {widths.map((w, i) => (
        <li
          key={i}
          className={cn("flex h-8 items-center justify-center px-2 py-1", w)}
        >
          <div className="bg-muted h-full w-full animate-pulse rounded" />
        </li>
      ))}
    </ul>
  );
}
