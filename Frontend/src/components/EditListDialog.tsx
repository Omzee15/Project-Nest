import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import { Loader2 } from 'lucide-react';
import { List, ListUpdateRequest } from '@/types';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface EditListDialogProps {
  list?: List;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onListUpdated: (updatedList: List) => void;
}

export function EditListDialog({ list, open, onOpenChange, onListUpdated }: EditListDialogProps) {
  const [formData, setFormData] = useState<ListUpdateRequest>({
    name: '',
    color: '#FFFFFF',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when list changes
  useEffect(() => {
    if (list && open) {
      setFormData({
        name: list.name,
        color: list.color || '#FFFFFF',
      });
    }
  }, [list, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list) return;

    try {
      setIsLoading(true);

      // Filter out empty values and prepare the update request
      const updates: ListUpdateRequest = {};
      if (formData.name?.trim() && formData.name !== list.name) {
        updates.name = formData.name.trim();
      }
      if (formData.color && formData.color !== list.color) {
        updates.color = formData.color;
      }

      // Only send request if there are changes
      if (Object.keys(updates).length === 0) {
        toast({
          title: 'No changes',
          description: 'No changes were made to the list.',
        });
        onOpenChange(false);
        return;
      }

      const response = await apiService.partialUpdateList(list.list_uid, updates);
      
      onListUpdated(response.data);
      onOpenChange(false);
      
      toast({
        title: 'List updated',
        description: 'List has been successfully updated.',
      });
    } catch (error) {
      console.error('Failed to update list:', error);
      toast({
        title: 'Error',
        description: 'Failed to update list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ListUpdateRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background border border-border">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
          <DialogDescription>
            Update the list details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter list name"
              required
              className="text-base"
            />
          </div>

          <div className="space-y-3">
            <Label>Color</Label>
            <ColorPicker
              value={formData.color || '#FFFFFF'}
              onChange={(color) => handleInputChange('color', color)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update List'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}