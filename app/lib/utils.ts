import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const containsJapaneseCharacters = (input: string): boolean =>
  /[一-龯ぁ-んァ-ンｧ-ﾝﾞﾟ]/g.test(input);
