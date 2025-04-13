import { cn } from "~/lib/utils";
import {
  type ReactNode,
  type ReactElement,
  createContext,
  useContext,
} from "react";
import { Button } from "./ui/button";
import { NavLink } from "react-router";

interface Props {
  to: string;
  children?: ReactNode;
}

export type BreadcrumbFn<T> = (
  matchData: T | undefined,
) => ReactNode | ReactNode[];

export interface BreadcrumbHandle<T> {
  breadcrumb: BreadcrumbFn<T>;
  extra?: BreadcrumbFn<T>;
  extraEnd?: BreadcrumbFn<T>;
}

export const makeBreadcrumbFn = <T,>(
  fn: (matchData: T | undefined) => ReactNode | ReactNode[],
) => fn;

// Represents if the breadcrumb refers to the current page (passed down by BreadcrumbMenu)
const BreadcrumbContext = createContext<boolean>(false);

export function BreadcrumbCurrent({
  current,
  children,
}: {
  current: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <BreadcrumbContext.Provider value={current}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function Breadcrumb({ to, children }: Props): ReactElement {
  const current = useContext(BreadcrumbContext);

  return (
    <Button
      variant="link"
      asChild
      className={cn(
        "!p-1",
        current
          ? "!text-white"
          : "!text-zinc-400 underline hover:!text-zinc-300",
        "[&.pending]:animate-pulse",
      )}
    >
      <NavLink
        // If the breadcrumb refers to the current page, add aria-current="page"
        {...(current ? { "aria-current": "page" } : {})}
        to={to}
        end
      >
        {children ?? to}
      </NavLink>
    </Button>
  );
}
