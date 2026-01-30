import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Trash2 } from "lucide-react";

export function AccessRow({
    name,
    role,
    roleIcon,
    isPending,
    canRemove,
    onRemove,
    isRemoving,
  }: {
    name: string;
    role: string;
    roleIcon?: React.ReactNode;
    isPending: boolean;
    canRemove?: boolean;
    onRemove?: () => void;
    isRemoving?: boolean;
  }) {
    return (
      <div className="flex items-center justify-between gap-2 py-1.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{name}</p>
          </div>
        </div>
  
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPending ? (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Pending
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              {roleIcon}
              {role}
            </Badge>
          )}
  
          {canRemove && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRemove}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }