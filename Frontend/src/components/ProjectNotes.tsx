import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Note, NoteRequest, NoteUpdateRequest } from '@/types';

interface ProjectNotesProps {
  projectUid: string;
  notes: Note[];
  onCreateNote?: (noteData: NoteRequest) => void;
  onUpdateNote?: (noteUid: string, noteData: NoteUpdateRequest) => void;
  onDeleteNote?: (noteUid: string) => void;
  readOnly?: boolean;
}

interface NoteFormData {
  title: string;
  content: string;
}

export const ProjectNotes: React.FC<ProjectNotesProps> = ({
  projectUid,
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  readOnly = false
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState<NoteFormData>({ title: '', content: '' });

  const handleCreateNote = () => {
    if (!formData.title.trim() || !onCreateNote) return;

    onCreateNote({
      title: formData.title.trim(),
      content: formData.content.trim(),
    });

    setFormData({ title: '', content: '' });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !formData.title.trim() || !onUpdateNote) return;

    onUpdateNote(editingNote.note_uid, {
      title: formData.title.trim(),
      content: formData.content.trim(),
    });

    setFormData({ title: '', content: '' });
    setEditingNote(null);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content });
  };

  const handleDeleteNote = (noteUid: string) => {
    if (!onDeleteNote) return;
    onDeleteNote(noteUid);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetForm = () => {
    setFormData({ title: '', content: '' });
    setEditingNote(null);
    setIsCreateDialogOpen(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Notes
            <Badge variant="secondary" className="ml-2">
              {notes.length}
            </Badge>
          </CardTitle>
          
          {!readOnly && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
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
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter note title..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your note content here..."
                      className="mt-1 min-h-32"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateNote}
                      disabled={!formData.title.trim()}
                    >
                      Create Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No notes yet</p>
              <p className="text-sm">Create your first note to get started with project planning.</p>
            </div>
          ) : (
            notes.map((note) => (
              <Card key={note.note_uid} className="relative">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{note.title}</h3>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap mb-3">
                        {note.content || 'No content'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Created {formatDate(note.created_at)}</span>
                        {note.updated_at && note.updated_at !== note.created_at && (
                          <span>• Updated {formatDate(note.updated_at)}</span>
                        )}
                      </div>
                    </div>
                    
                    {!readOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditNote(note)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Note
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteNote(note.note_uid)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Note
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Note Dialog */}
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your note content here..."
                  className="mt-1 min-h-32"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateNote}
                  disabled={!formData.title.trim()}
                >
                  Update Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};