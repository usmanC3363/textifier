import { ArrowLeft, SquareArrowLeft } from 'lucide-react';
import { DocumentTitle } from './document-title';
import { ShareButton } from './share-button';
import { Button } from '@/components/ui/button';

interface DocTopBarProps {
  onOpenPermissions: () => void;
}

export function DocTopBar({ onOpenPermissions }: DocTopBarProps) {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-2">
      <div className="flex min-w-0 items-center gap-x-4 md:gap-x-14">
        <a href='/dashboard' className='w-7 h-6 flex shrink-0 transition-all duration-200 ease-in-out justify-center items-center border group hover:w-8 focus:outline-[0.5px] focus:outline-black/20  border-black rounded-sm' title='Back to Dashboard'>
        <ArrowLeft className='size-4 group-hover:size-5 transition-all duration-200 ease-in-out'/>
        </a>
        <DocumentTitle/>
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
