import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette } from 'lucide-react';
import { BrainstormCanvas } from '@/components/BrainstormCanvas';
import { CanvasToolbar } from '@/components/CanvasToolbar';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface CanvasState {
  nodes: any[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

const ProjectCanvas: React.FC = () => {
  const { projectUid } = useParams<{ projectUid: string }>();
  const queryClient = useQueryClient();
  const [toolbarProps, setToolbarProps] = useState<any>(null);

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ['project', projectUid],
    queryFn: () => apiService.getProject(projectUid!),
    enabled: !!projectUid,
  });

  // Fetch canvas data
  const { data: canvasResponse, isLoading: isCanvasLoading } = useQuery({
    queryKey: ['canvas', projectUid],
    queryFn: () => apiService.getCanvas(projectUid!),
    enabled: !!projectUid,
  });

  // Canvas mutations
  const saveCanvasMutation = useMutation({
    mutationFn: (canvasState: CanvasState) => 
      apiService.updateCanvas(projectUid!, { state_json: JSON.stringify(canvasState) }),
    onSuccess: () => {
      toast({
        title: 'Canvas saved',
        description: 'Your canvas has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['canvas', projectUid] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save canvas. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCanvasSave = (canvasState: CanvasState) => {
    saveCanvasMutation.mutate(canvasState);
  };

  if (!projectUid) {
    return <div>Project not found</div>;
  }

  const canvasData = canvasResponse?.data;
  const initialCanvasState = canvasData?.state_json 
    ? JSON.parse(canvasData.state_json) 
    : undefined;

  return (
    <div className="flex h-screen bg-background">
      {/* Toolbar - Left Column */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Project Canvas</h1>
              <p className="text-sm text-muted-foreground">
                {project?.data?.name || 'Project'}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Content */}
        <div className="flex-1 p-4">
          {isCanvasLoading ? (
            <div className="text-center">
              <div className="animate-pulse">Loading tools...</div>
            </div>
          ) : toolbarProps ? (
            <CanvasToolbar {...toolbarProps} />
          ) : (
            <div className="text-center text-muted-foreground">
              Loading toolbar...
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Visual Canvas</h2>
          <p className="text-sm text-muted-foreground">
            Create flowcharts, diagrams, and visual representations of your project structure
          </p>
        </div>

        <div className="flex-1 p-6">
          {isCanvasLoading ? (
            <div className="flex items-center justify-center h-full border rounded-lg">
              <div className="text-center">
                <div className="animate-pulse">Loading canvas...</div>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <BrainstormCanvas
                projectUid={projectUid}
                initialState={initialCanvasState}
                onSave={handleCanvasSave}
                useExternalToolbar={true}
                onToolbarProps={setToolbarProps}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCanvas;