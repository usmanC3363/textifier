"use client"
import { useState } from "react";

import { Avatar, AvatarFallback } from "../ui/avatar";
import { PermissionsSheet } from "./settings-panel";
import { DocTopBar } from "./topbar/doc-topbar";
import { useDocumentContext } from "@/features/documents/context/useDocumentContext";



export default function DocPage() {
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const { documentId } = useDocumentContext();

  return (
    <section className="min-h-screen flex flex-col bg-muted/40">
      {/* Top Bar */}
      <DocTopBar
        onOpenPermissions={() => setPermissionsOpen(true)}
      />

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
      <PermissionsSheet
        documentId={documentId}
        open={permissionsOpen}
        onOpenChange={setPermissionsOpen}
      />
      </section>
  );
}
