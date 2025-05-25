import { useMemo, type ReactElement, type ReactNode } from "react";
import { BreadcrumbCurrent, type BreadcrumbHandle } from "./Breadcrumb";
import { useMatches, type UIMatch } from "react-router";
import { cn } from "~/lib/utils";

type BreadcrumbMatch = UIMatch<unknown, BreadcrumbHandle<unknown>>;

interface Props {
  className?: string;
  outerClassName?: string;
}

export function BreadcrumbMenu({
  className,
  outerClassName,
}: Props): ReactElement | null {
  const rawMatches = useMatches();

  // Look for a breadcrumb handle on each matched route
  const matches = useMemo(
    () =>
      rawMatches
        .filter(
          (m) =>
            m.handle &&
            typeof m.handle === "object" &&
            "breadcrumb" in m.handle,
        )
        .map((m) => m as BreadcrumbMatch),
    [rawMatches],
  );
  const crumbs = useMemo(
    () => matches.flatMap((m) => m.handle.breadcrumb(m.data)),
    [matches],
  );

  // Gather all the extra elements too
  const extras = useMemo(
    () =>
      matches
        .map((m) => m.handle.extra && m.handle.extra(m.data))
        .filter(Boolean) as ReactNode[],
    [matches],
  );
  const extraEnd = useMemo(
    () =>
      matches
        .map((m) => m.handle.extraEnd && m.handle.extraEnd(m.data))
        .filter(Boolean) as ReactNode[],
    [matches],
  );

  if (matches.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={outerClassName}>
      <ol className={cn("flex list-none flex-wrap", className)}>
        {/* Render each breadcrumb component */}
        {crumbs.map((match, i) => (
          <li key={`${i}`}>
            {/* Separator */}
            {i > 0 && <Sep />}

            {/* Pass down current=true via BreadcrumbContext if this is the last (current) page in the list. */}
            <BreadcrumbCurrent current={i === crumbs.length - 1}>
              {match}
            </BreadcrumbCurrent>
          </li>
        ))}

        {/* Render any extra elements */}
        {extras ? extras.map((extra, i) => <li key={i}>{extra}</li>) : null}

        {extraEnd ? (
          <>
            {/* Spacer */}
            <div className="flex-1" />
            {extraEnd.map((extra, i) => (
              <li key={i} className="place-self-end">
                {extra}
              </li>
            ))}
          </>
        ) : null}
      </ol>
    </nav>
  );
}

const Sep = () => (
  <span role="separator" aria-hidden className="mx-1 text-zinc-500 select-none">
    /
  </span>
);
