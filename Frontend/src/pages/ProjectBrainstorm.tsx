import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Lightbulb, FileText, Palette } from 'lucide-react';
import { BrainstormCanvas } from '@/components/BrainstormCanvas';
import { ProjectNotes } from '@/components/ProjectNotes';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { BrainstormCanvas as CanvasType, Note, NoteRequest, NoteUpdateRequest } from '@/types';

interface CanvasState {
  nodes: any[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

const ProjectBrainstorm: React.FC = () => {
  const { projectUid } = useParams<{ projectUid: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('canvas');

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

  // Fetch notes data
  const { data: notesResponse, isLoading: isNotesLoading } = useQuery({
    queryKey: ['notes', projectUid],
    queryFn: () => apiService.getNotesByProject(projectUid!),
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

  // Note mutations
  const createNoteMutation = useMutation({
    mutationFn: (noteData: NoteRequest) => apiService.createNote(projectUid!, noteData),
    onSuccess: () => {
      toast({
        title: 'Note created',
        description: 'Your note has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['notes', projectUid] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteUid, noteData }: { noteUid: string; noteData: NoteUpdateRequest }) =>
      apiService.partialUpdateNote(noteUid, noteData),
    onSuccess: () => {
      toast({
        title: 'Note updated',
        description: 'Your note has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['notes', projectUid] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteUid: string) => apiService.deleteNote(noteUid),
    onSuccess: () => {
      toast({
        title: 'Note deleted',
        description: 'Your note has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['notes', projectUid] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCanvasSave = (canvasState: CanvasState) => {
    saveCanvasMutation.mutate(canvasState);
  };

  const handleCreateNote = (noteData: NoteRequest) => {
    createNoteMutation.mutate(noteData);
  };

  const handleUpdateNote = (noteUid: string, noteData: NoteUpdateRequest) => {
    updateNoteMutation.mutate({ noteUid, noteData });
  };

  const handleDeleteNote = (noteUid: string) => {
    deleteNoteMutation.mutate(noteUid);
  };

  if (!projectUid) {
    return <div>Project not found</div>;
  }

  const canvasData = canvasResponse?.data;
  const notes = notesResponse?.data?.notes || [];
  const initialCanvasState = canvasData?.state_json 
    ? JSON.parse(canvasData.state_json) 
    : undefined;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Brainstorm & Planning</h1>
              <p className="text-gray-600">
                {project?.data?.name || 'Project'} • Visual planning and notes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>Canvas elements: {initialCanvasState?.nodes?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Notes: {notes.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="canvas" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Canvas
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Notes
            {notes.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {notes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Visual Project Canvas
              </CardTitle>
              <p className="text-sm text-gray-600">
                Create flowcharts, diagrams, and visual representations of your project structure.
                Use shapes and text to map out your ideas and project flow.
              </p>
            </CardHeader>
            <CardContent>
              {isCanvasLoading ? (
                <div className="flex items-center justify-center h-96 border rounded-lg">
                  <div className="text-center">
                    <div className="animate-pulse">Loading canvas...</div>
                  </div>
                </div>
              ) : (
                <BrainstormCanvas
                  projectUid={projectUid}
                  initialState={initialCanvasState}
                  onSave={handleCanvasSave}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Documentation
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Keep track of project requirements, ideas, meeting notes, and important decisions.
                  Organize your thoughts and document the project evolution.
                </p>
              </CardHeader>
              <CardContent>
                {isNotesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-pulse">Loading notes...</div>
                  </div>
                ) : (
                  <ProjectNotes
                    projectUid={projectUid}
                    notes={notes}
                    onCreateNote={handleCreateNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectBrainstorm;