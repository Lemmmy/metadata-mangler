import * as React from "react";

import { cn } from "~/lib/utils";
import { Button } from "./button";
import { Undo2, Lock, LockOpen } from "lucide-react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base",
        "shadow-xs transition-[color,box-shadow] outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

interface ResettableInputProps extends React.ComponentProps<"input"> {
  onReset: () => void;
  onLockChange?: (locked: boolean) => void;
  locked?: boolean;
  isUpdated: boolean;
  inputClassName?: string;
  extra?: React.ReactNode;
}

function ResettableInput({
  className,
  inputClassName,
  onReset,
  locked,
  onLockChange,
  isUpdated,
  extra,
  ...props
}: ResettableInputProps) {
  return (
    <div
      className={cn(
        "flex",
        className,
        "[&_button]:rounded-none [&_button]:border-l-0",
      )}
    >
      {/* Input */}
      <Input
        {...props}
        className={cn(
          "flex-1 rounded-r-none",
          isUpdated && "bg-lime-600/20 dark:bg-lime-600/20",
          inputClassName,
        )}
      />

      {extra}

      {/* Lock button */}
      {onLockChange && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onLockChange(!locked)}
          className={cn(
            "flex-shrink-0 !rounded-none",
            locked &&
              "bg-red-500/20 !text-red-200 hover:bg-red-500/30 dark:bg-red-500/20 dark:hover:bg-red-500/30",
          )}
        >
          {locked ? <Lock /> : <LockOpen />}
        </Button>
      )}

      {/* Reset button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        disabled={!isUpdated}
        className="flex-shrink-0 !rounded-r-md"
      >
        <Undo2 />
      </Button>
    </div>
  );
}

export { Input, ResettableInput };
