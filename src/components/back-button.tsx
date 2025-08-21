"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export const BackButton = () => {
  const router = useRouter();

  return (
    <Button variant="ghost" onClick={() => router.back()} className="mb-2 pl-0 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to all projects
    </Button>
  );
};
