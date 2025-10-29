import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Calendar, Loader2, Lock, Globe, ChevronDown, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Project, COLORS } from '@/types';

interface CreateProjectDialogProps {
  onProjectCreate?: (project: Project) => void;
  trigger?: React.ReactNode;
}

export function CreateProjectDialog({ onProjectCreate, trigger }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(COLORS.WHITE);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [dbmlContent, setDbmlContent] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Project name is required',
        variant: 'destructive',
      });
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast({
        title: 'Error',
        description: 'Start date cannot be after end date',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const projectData = {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        is_private: isPrivate,
        dbml_content: dbmlContent.trim() || undefined,
        status: 'active',
      };

      const response = await apiService.createProject(projectData);
      const newProject = response.data;

      // Call the callback with the created project
      onProjectCreate?.(newProject);
      
      // Reset form
      setName('');
      setDescription('');
      setColor(COLORS.WHITE);
      setStartDate('');
      setEndDate('');
      setIsPrivate(false);
      setDbmlContent('');
      setShowAdvanced(false);
      setOpen(false);

      toast({
        title: 'Success',
        description: `Project "${name}" has been created successfully`,
      });

      // Navigate to the new project
      navigate(`/project/${newProject.project_uid}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        )}
      </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-background border border-border">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter the details for your new project below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name *</Label>
            <Input
              id="project-name"
              placeholder="Enter project name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Enter project description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Color</Label>
            <ColorPicker
              value={color}
              onChange={setColor}
              size="md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-privacy">Project Privacy</Label>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-3">
                {isPrivate ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <div className="text-sm font-medium">
                    {isPrivate ? 'Private Project' : 'Public Project'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isPrivate 
                      ? 'Only you can access this project'
                      : 'Project can be shared with others'
                    }
                  </div>
                </div>
              </div>
              <Switch
                id="project-privacy"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Database Schema (DBML)</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <Label htmlFor="dbml-content">DBML Content</Label>
              <Textarea
                id="dbml-content"
                placeholder={`Enter your database schema in DBML format (optional)...

Example:
Table users {
  id integer [primary key]
  username varchar
  email varchar [unique]
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  content text
  user_id integer [ref: > users.id]
}`}
                value={dbmlContent}
                onChange={(e) => setDbmlContent(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Add your database schema in DBML format. This will be saved with your project and can be viewed in the DB Viewer.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}