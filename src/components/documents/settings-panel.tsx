"use client"
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export function PermissionsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Share & permissions</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Invite */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Add people
            </label>
            <div className="flex gap-2">
              <Input
                disabled
                placeholder="Email address"
              />
              <Button disabled variant="secondary">
                Editor
              </Button>
            </div>
            <Button disabled size="sm">
              Send invite
            </Button>
          </div>

          <Separator />

          {/* Access list */}
          <div className="space-y-3">
            <p className="text-sm font-medium">
              People with access
            </p>

            <AccessRow name="You" role="Owner" />
            <AccessRow name="Alice" role="Editor" />
            <AccessRow name="Bob" role="Viewer" />
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Document settings
            </p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Editors can share
              </span>
              <input type="checkbox" disabled />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Viewers can comment
              </span>
              <input type="checkbox" disabled />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AccessRow({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <span className="text-sm">{name}</span>
      </div>

      <span className="text-xs text-muted-foreground">
        {role}
      </span>
    </div>
  );
}
