'use client';

import { usePrivacy } from '@/contexts/PrivacyContext';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function PrivacyToggle() {
  const { hideBalances, toggleHideBalances } = usePrivacy();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleHideBalances}
            className="h-9 w-9"
          >
            {hideBalances ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hideBalances ? 'Show balances' : 'Hide balances'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
