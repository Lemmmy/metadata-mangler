import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const zodStringNumber = (def: number) =>
  z
    .string()
    .regex(/^\d+$/)
    .default((def ?? 0).toString())
    .transform(Number);

export const zodStringBoolean = (def: boolean) =>
  z
    .enum(["true", "false"])
    .default(def ? "true" : "false")
    .transform((v) => v.toLowerCase() === "true");
