import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionNumber: number;
  versionName?: string;
  onConfirm: (customName?: string) => Promise<void>;
  isRestoring: boolean;
}

export function RestoreDialog({
  open,
  onOpenChange,
  versionNumber,
  versionName,
  onConfirm,
  isRestoring,
}: RestoreDialogProps) {
  const [customName, setCustomName] = useState('');
  const [saveAsNamed, setSaveAsNamed] = useState(false);

  const handleConfirm = async () => {
    await onConfirm(saveAsNamed && customName ? customName : undefined);
    setCustomName('');
    setSaveAsNamed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-600" />
            Restore Version {versionNumber}
          </DialogTitle>
          <DialogDescription>
            {versionName ? `"${versionName}"` : 'This version'} will become the
            current version of your document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <p className="mb-1 font-medium">This will create a new version</p>
              <p className="text-amber-700">
                Your current work will be saved as a new version before
                restoring. No changes will be lost.
              </p>
            </div>
          </div>

          {/* Optional: Name the restored version */}
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={saveAsNamed}
                onChange={(e) => setSaveAsNamed(e.target.checked)}
                className="rounded border-gray-300"
              />
              Give this restored version a custom name
            </label>

            {saveAsNamed && (
              <Input
                placeholder="e.g., Final draft, Review copy"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isRestoring || (saveAsNamed && !customName.trim())}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRestoring ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore Version
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
