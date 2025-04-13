import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as v from "valibot";

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
