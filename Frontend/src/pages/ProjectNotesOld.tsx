import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Note, NoteContent, NoteBlock, NoteChecklistItem, NoteRequest } from '@/types';

const ProjectNotes: React.FC = () => {
  const { projectUid } = useParams<{ projectUid: string }>();
  const queryClient = useQueryClient();
  
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ['project', projectUid],
    queryFn: () => apiService.getProject(projectUid!),
    enabled: !!projectUid,
  });

  // Fetch notes
  const { data: notesResponse, isLoading: isNotesLoading } = useQuery({
    queryKey: ['notes', projectUid],
    queryFn: () => apiService.getNotesByProject(projectUid!),
    enabled: !!projectUid,
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (noteData: NoteRequest) => 
      apiService.createNote(projectUid!, noteData),
    onSuccess: () => {
      toast({
        title: 'Note created',
        description: 'Your note has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['notes', projectUid] });
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowCreateDialog(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete note mutation
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

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return;

    const content: NoteContent = {
      blocks: [{
        id: Date.now().toString(),
        type: 'text',
        content: newNoteContent
      }]
    };

    createNoteMutation.mutate({
      title: newNoteTitle,
      content: content,
    });
  };

  const handleDeleteNote = (noteUid: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteUid);
    }
  };

  const getTextContent = (blocks: NoteBlock[]): string => {
    return blocks
      .filter(block => block.type === 'text' && block.content)
      .map(block => block.content)
      .join(' ')
      .substring(0, 150);
  };

  const getChecklistSummary = (blocks: NoteBlock[]) => {
    const checklistBlocks = blocks.filter(block => block.type === 'checklist');
    if (checklistBlocks.length === 0) return null;
    
    const allItems = checklistBlocks.flatMap(block => block.items || []);
    const completedCount = allItems.filter(item => item.completed).length;
    
    return {
      total: allItems.length,
      completed: completedCount,
      items: allItems.slice(0, 3)
    };
  };

  if (!projectUid) {
    return <div>Project not found</div>;
  }

  const notes = notesResponse?.data?.notes || [];

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
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Project Notes</h1>
              <p className="text-gray-600">
                {project?.data?.name || 'Project'} • Documentation and ideas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{notes.length} notes</span>
            </div>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Enter note title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Enter note content"
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreateNote} disabled={!newNoteTitle.trim()}>
                  Create Note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notes List */}
      {isNotesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-600 mb-4">
              Start documenting your project ideas and thoughts.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note: Note) => {
            const textContent = getTextContent(note.content.blocks);
            const checklistSummary = getChecklistSummary(note.content.blocks);

            return (
              <Card key={note.note_uid} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{note.title}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.note_uid)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  {textContent && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {textContent}
                    </p>
                  )}
                  {checklistSummary && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>{checklistSummary.completed}/{checklistSummary.total} completed</span>
                      </div>
                      {checklistSummary.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox checked={item.completed} disabled />
                          <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : ''}`}>
                            {item.text || 'Empty item'}
                          </span>
                        </div>
                      ))}
                      {checklistSummary.total > 3 && (
                        <p className="text-xs text-gray-500">
                          +{checklistSummary.total - 3} more items
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectNotes;