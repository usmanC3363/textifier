
import { DocumentTitle } from "./document-title";
import { ShareButton } from "./share-button";
import { Button } from "@/components/ui/button";

interface DocTopBarProps {
  onOpenPermissions: () => void;
}

export function DocTopBar({  onOpenPermissions }: DocTopBarProps) {

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-background border-b">
      <div className="flex items-center gap-3 min-w-0">
        <DocumentTitle  />
        <span className="text-xs text-muted-foreground hidden sm:block">
          Saved
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ShareButton  />

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenPermissions}
        >
          ⋮
        </Button>
      </div>
    </header>
  );
}
