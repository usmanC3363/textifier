"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { PermissionsSheet } from "./settings-panel";


export default function DocumentPage() {
  const [open, setOpen] = useState(false);

  return (
    <section className="min-h-screen flex flex-col bg-muted/40">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-background border-b">
        <div className="flex items-center gap-3 min-w-0">
          <Input
            disabled
            placeholder="Untitled document"
            className="h-9 text-base font-medium border-none shadow-none focus-visible:ring-0 px-0 max-w-xs"
          />
          <span className="text-xs text-muted-foreground hidden sm:block">
            Saved
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
          >
            Share
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
          >
            ⋮
          </Button>
        </div>
      </header>

      {/* Collaborators */}
      <div className="flex items-center gap-2 px-4 py-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <Avatar className="h-7 w-7">
          <AvatarFallback>B</AvatarFallback>
        </Avatar>
        <Avatar className="h-7 w-7 bg-muted">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      </div>

      {/* Editor Area */}
      <main className="flex-1 flex justify-center px-2 sm:px-4 py-6">
        <div className="w-full max-w-4xl bg-card rounded-md shadow-sm border p-6 sm:p-10">
          {/* TipTap mounts here */}
          <p className="text-muted-foreground">
            Start typing your document…
          </p>
        </div>
      </main>

      {/* Permissions / Settings */}
      <PermissionsSheet open={open} onOpenChange={setOpen} />
    </section>
  );
}
