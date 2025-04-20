import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useTRPC } from "~/lib/trpc";
import { Button, type ButtonProps } from "../ui/button";
import { cn } from "~/lib/utils";
import type { ReactNode } from "react";
import { Disc3 } from "lucide-react";

interface Props extends ButtonProps {
  directory: string;
  prefetch?: boolean;
  children?: ReactNode;
}

export function OpenAsAlbum({
  directory,
  prefetch = false,
  children,
  ...props
}: Props) {
  const navigate = useNavigate();

  const trpc = useTRPC();
  const precheck = useQuery(
    trpc.browse.albumPrecheck.queryOptions(
      {
        path: directory,
      },
      {
        enabled: !!directory && prefetch, // Don't pre-check the root
      },
    ),
  );

  const openAsAlbum = () => {
    if (directory) {
      precheck.refetch().then(({ data }) => {
        if (data?.success) {
          navigate(`/album/${encodeURIComponent(directory)}`);
        }
      });
    }
  };

  return (
    <Button
      variant={
        precheck.data?.success === false ? "destructiveOutline" : "outline"
      }
      {...props}
      disabled={
        props.disabled || precheck.isLoading || precheck.data?.success === false
      }
      className={cn(props.className, precheck.isLoading && "animate-pulse")}
      onClick={openAsAlbum}
    >
      <Disc3 />
      {children}
    </Button>
  );
}
