import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as v from "valibot";

export const nts = (n: number): string => n.toLocaleString();
export const plural = (
  n: number,
  singularStr: string,
  pluralStr?: string,
): string => (n === 1 ? singularStr : pluralStr || singularStr + "s");
export const pluralN = (
  n: number,
  singularStr: string,
  pluralStr?: string,
): string => nts(n) + " " + plural(n, singularStr, pluralStr);

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const vStringNumber = (def: number) =>
  v.pipe(
    v.optional(v.string(), (def ?? 0).toString()),
    v.regex(/^\d+$/),
    v.transform(Number),
  );

export const vStringBoolean = (def: boolean) =>
  v.pipe(
    v.optional(v.string(), def ? "true" : "false"),
    v.picklist(["true", "false"]),
    v.transform((v) => v === "true"),
  );

export const shouldNeverHappen = (msg: string, ...args: any[]): never => {
  console.error(msg, ...args);
  if (isDev()) {
    // eslint-disable-next-line no-debugger
    debugger;
  }

  throw new Error(`This should never happen: ${msg}`);
};

// Helper to check if we're in development mode
function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}
