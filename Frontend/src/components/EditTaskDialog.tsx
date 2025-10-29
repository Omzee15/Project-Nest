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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { Loader2 } from 'lucide-react';
import { Task, TaskUpdateRequest } from '@/types';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface EditTaskDialogProps {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (updatedTask: Task) => void;
}

export function EditTaskDialog({ task, open, onOpenChange, onTaskUpdated }: EditTaskDialogProps) {
  const [formData, setFormData] = useState<TaskUpdateRequest>({
    title: '',
    description: '',
    priority: undefined,
    status: '',
    color: '#FFFFFF',
    due_date: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when task changes
  useEffect(() => {
    if (task && open) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority || undefined,
        status: task.status,
        color: task.color || '#FFFFFF',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
      });
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      setIsLoading(true);

      // Filter out empty values and prepare the update request
      const updates: TaskUpdateRequest = {};
      if (formData.title?.trim() && formData.title !== task.title) {
        updates.title = formData.title.trim();
      }
      if (formData.description !== task.description) {
        updates.description = formData.description || undefined;
      }
      if (formData.priority !== task.priority) {
        updates.priority = formData.priority;
      }
      if (formData.status && formData.status !== task.status) {
        updates.status = formData.status;
      }
      if (formData.color && formData.color !== task.color) {
        updates.color = formData.color;
      }
      if (formData.due_date !== (task.due_date ? task.due_date.split('T')[0] : '')) {
        updates.due_date = formData.due_date || undefined;
      }

      // Only send request if there are changes
      if (Object.keys(updates).length === 0) {
        toast({
          title: 'No changes',
          description: 'No changes were made to the task.',
        });
        onOpenChange(false);
        return;
      }

      const response = await apiService.partialUpdateTask(task.task_uid, updates);
      
      onTaskUpdated(response.data);
      onOpenChange(false);
      
      toast({
        title: 'Task updated',
        description: 'Task has been successfully updated.',
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TaskUpdateRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
              className="w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority || ''}
                onValueChange={(value) => handleInputChange('priority', value || undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="w-full">
              <ColorPicker
                value={formData.color || '#FFFFFF'}
                onChange={(color) => handleInputChange('color', color)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              className="w-full"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}