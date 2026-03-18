'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreateRoleModal } from './create-role-modal';

interface CreateRoleButtonProps {
  templates: any[];
  defaultTemplateId?: number;
  children?: React.ReactNode;
}

export function CreateRoleButton({ 
  templates, 
  defaultTemplateId, 
  children 
}: CreateRoleButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children || (
          <Button>
            + Create Role
          </Button>
        )}
      </div>
      
      <CreateRoleModal
        open={open}
        onClose={() => setOpen(false)}
        templates={templates}
        defaultTemplateId={defaultTemplateId}
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}