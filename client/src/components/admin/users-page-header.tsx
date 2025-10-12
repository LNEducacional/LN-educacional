import { Download, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface UsersPageHeaderProps {
  onExport: () => void;
  onCreateUser: () => void;
}

export function UsersPageHeader({ onExport, onCreateUser }: UsersPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
        <p className="text-muted-foreground">Gerencie os usuários da plataforma</p>
      </div>
    </div>
  );
}
