'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomRole, createRoleFromTemplate, getAllPermissions } from '@/app/actions/rbac/custom-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getJsonbArrayLength } from '@/lib/utils/jsonb';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateRoleDialogProps {
  templates: any[];
  defaultTemplateId?: number;
  trigger?: React.ReactNode;
}

export function CreateRoleDialog({ templates, defaultTemplateId, trigger }: CreateRoleDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'scratch' | 'template'>('scratch');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(defaultTemplateId || null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '🎭',
    permissionIds: [] as number[],
  });

  useEffect(() => {
    if (open && mode === 'scratch') {
      loadPermissions();
    }
  }, [open, mode]);

  useEffect(() => {
    if (defaultTemplateId) {
      setMode('template');
      setSelectedTemplateId(defaultTemplateId);
    }
  }, [defaultTemplateId]);

  const loadPermissions = async () => {
    const result = await getAllPermissions();
    if (result.success) {
      setAllPermissions(result.permissions || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;

      if (mode === 'template' && selectedTemplateId) {
        result = await createRoleFromTemplate(
          selectedTemplateId,
          formData.name,
          formData.description
        );
      } else {
        result = await createCustomRole(formData);
      }

      if (result.success) {
        setOpen(false);
        router.refresh();
        // Reset form
        setFormData({
          name: '',
          description: '',
          color: '#3B82F6',
          icon: '🎭',
          permissionIds: [],
        });
      } else {
        setError(result.error || 'Failed to create role');
      }
    } catch (err) {
      setError('Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: number) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter(id => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>+ Create Role</Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="!max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Define a custom role with specific permissions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 ">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label>Creation Method</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMode('scratch')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    mode === 'scratch'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">From Scratch</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Choose individual permissions
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('template')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    mode === 'template'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">From Template</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Use pre-configured role
                  </div>
                </button>
              </div>
            </div>

            {/* Template Selection */}
            {mode === 'template' && (
              <div className="space-y-2">
                <Label htmlFor="template">Select Template</Label>
                <select
                  id="template"
                  value={selectedTemplateId || ''}
                  onChange={(e) => setSelectedTemplateId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  required
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {getJsonbArrayLength(template.template_permissions)} permissions
                    </option>
                  ))}
                </select>
                {selectedTemplateId && (
                  <p className="text-sm text-muted-foreground">
                    {templates.find(t => t.id === selectedTemplateId)?.description}
                  </p>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sales Manager"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this role's purpose"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded border"
                    disabled={loading}
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🎭"
                  maxLength={2}
                  disabled={loading}
                />
              </div>
            </div>

            {mode === 'template' && (
              <div className="h-[150px] p-4 m-5">1</div>
            )}

            {/* Permissions Selection */}
            {mode === 'scratch' && allPermissions.length > 0 && (
              <div className="space-y-2">
                <Label>
                  Permissions ({formData.permissionIds.length} selected)
                </Label>
                <div className="border rounded-lg">
                  <ScrollArea className="h-[500]">
                    {allPermissions.map((group: any) => (
                      <div key={group.name} className="border-b last:border-b-0">
                        <div className="p-3 bg-muted/50 font-medium text-sm flex items-center gap-2">
                          <span>{group.icon}</span>
                          <span>{group.name}</span>
                        </div>
                        <div className="p-3 space-y-2">
                          {group.permissions.map((perm: any) => (
                            <label
                              key={perm.id}
                              className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                            >
                              <Checkbox
                                checked={formData.permissionIds.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                                disabled={loading}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{perm.name}</div>
                                <div className="text-xs text-muted-foreground">{perm.description}</div>
                                {perm.is_dangerous && (
                                  <Badge variant="destructive" className="mt-1">
                                    Dangerous
                                  </Badge>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </ScrollArea>

        <DialogFooter className='absolute bottom-4 w-full px-6 flex justify-end gap-2 bg-gradient-to-t from-background/80 backdrop-blur-sm'>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
          >
            {loading ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}