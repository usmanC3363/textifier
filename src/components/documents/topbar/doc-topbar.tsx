import { DocumentTitle } from './document-title';
import { ShareButton } from './share-button';
import { Button } from '@/components/ui/button';

interface DocTopBarProps {
  onOpenPermissions: () => void;
}

export function DocTopBar({ onOpenPermissions }: DocTopBarProps) {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <DocumentTitle />
        <span className="hidden text-xs text-muted-foreground sm:block">
          Saved
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ShareButton />

        <Button variant="ghost" size="icon" onClick={onOpenPermissions}>
          ⋮
        </Button>
      </div>
    </header>
  );
}
