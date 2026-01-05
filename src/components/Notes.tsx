import { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Edit2, Save, X, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../contexts/UserContext';
import { db } from '../database';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

const NOTE_COLORS = [
  { name: 'Pink', value: 'bg-pink-50 border-pink-200' },
  { name: 'Yellow', value: 'bg-yellow-50 border-yellow-200' },
  { name: 'Blue', value: 'bg-blue-50 border-blue-200' },
  { name: 'Green', value: 'bg-green-50 border-green-200' },
  { name: 'Purple', value: 'bg-purple-50 border-purple-200' },
  { name: 'Orange', value: 'bg-orange-50 border-orange-200' },
];

export function Notes() {
  const { currentUser } = useUser();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: NOTE_COLORS[0].value,
  });

  // Load notes from database
  useEffect(() => {
    const loadNotes = async () => {
      if (!currentUser?.id) {
        setNotes([]);
        return;
      }

      try {
        const dbNotes = await db.getNotesByUser(currentUser.id);

        // Convert database notes to component format
        const formattedNotes: Note[] = dbNotes.map((dbNote: any) => ({
          id: dbNote.id,
          title: dbNote.title,
          content: dbNote.content,
          color: dbNote.color,
          createdAt: new Date(dbNote.created_at).getTime(),
          updatedAt: new Date(dbNote.updated_at).getTime(),
        }));

        setNotes(formattedNotes);
      } catch (error) {
        console.error('Error loading notes from database:', error);
        toast.error('Failed to load notes');
        setNotes([]);
      }
    };

    loadNotes();
  }, [currentUser]);

  const handleAddNote = async () => {
    if (!newNote.title.trim()) {
      toast.error('Please add a title for your note');
      return;
    }

    if (!currentUser?.id) {
      toast.error('You must be logged in to add notes');
      return;
    }

    try {
      const dbNote: any = await db.createNote({
        user_id: currentUser.id,
        title: newNote.title,
        content: newNote.content,
        color: newNote.color,
        synced: false,
      });

      const formattedNote: Note = {
        id: dbNote.id,
        title: dbNote.title,
        content: dbNote.content,
        color: dbNote.color,
        createdAt: new Date(dbNote.created_at).getTime(),
        updatedAt: new Date(dbNote.updated_at).getTime(),
      };

      setNotes([formattedNote, ...notes]);
      setNewNote({ title: '', content: '', color: NOTE_COLORS[0].value });
      setIsAdding(false);
      toast.success('Note added successfully!');
    } catch (error) {
      console.error('Error adding note to database:', error);
      toast.error('Failed to add note');
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    if (!currentUser?.id) return;

    try {
      await db.updateNote(id, {
        title: updates.title,
        content: updates.content,
        color: updates.color,
      });

      const updatedNotes = notes.map(note =>
        note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
      );
      setNotes(updatedNotes);
      setEditingId(null);
      toast.success('Note updated successfully!');
    } catch (error) {
      console.error('Error updating note in database:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!currentUser?.id) return;

    try {
      await db.deleteNote(id);
      setNotes(notes.filter(note => note.id !== id));
      toast.success('Note deleted successfully!');
    } catch (error) {
      console.error('Error deleting note from database:', error);
      toast.error('Failed to delete note');
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 pt-16 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl mb-2">My Notes</h1>
          <p className="text-gray-600">Organize your study materials and ideas</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-pink-500 hover:bg-pink-600 px-8">
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Add Note Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Create New Note</span>
                  <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    placeholder="Note title..."
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    placeholder="Write your note here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    rows={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Color</label>
                  <div className="flex gap-2">
                    {NOTE_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setNewNote({ ...newNote, color: color.value })}
                        className={`w-10 h-10 rounded-lg border-2 ${color.value} ${
                          newNote.color === color.value ? 'ring-2 ring-pink-500' : ''
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddNote} className="flex-1 bg-pink-500 hover:bg-pink-600">
                    <Save className="w-4 h-4 mr-2" />
                    Save Note
                  </Button>
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No notes yet</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'No notes match your search' : 'Create your first note to get started'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-pink-500 hover:bg-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Note
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`${note.color} border-2 hover:shadow-lg transition-shadow`}>
                <CardContent className="p-4 space-y-3">
                  {editingId === note.id ? (
                    <EditNoteForm
                      note={note}
                      onSave={(updates) => handleUpdateNote(note.id, updates)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg flex-1">{note.title}</h3>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(note.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-6">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                        <span>
                          {new Date(note.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {note.updatedAt !== note.createdAt && (
                          <Badge variant="outline" className="text-xs">Edited</Badge>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function EditNoteForm({
  note,
  onSave,
  onCancel,
}: {
  note: Note;
  onSave: (updates: Partial<Note>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color);

  return (
    <div className="space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
        rows={4}
      />
      <div className="flex gap-2">
        {NOTE_COLORS.map((c) => (
          <button
            key={c.name}
            onClick={() => setColor(c.value)}
            className={`w-8 h-8 rounded border-2 ${c.value} ${
              color === c.value ? 'ring-2 ring-pink-500' : ''
            }`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSave({ title, content, color })}
          size="sm"
          className="flex-1 bg-pink-500 hover:bg-pink-600"
        >
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
