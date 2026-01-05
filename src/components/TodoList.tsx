import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Edit2, Save, X, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useTodos } from '../contexts/TodoContext';
import { DatePickerWithPresets } from './DatePickerWithPresets';

const TODO_COLORS = [
  { name: 'Pink', value: 'bg-pink-50 border-pink-200' },
  { name: 'Yellow', value: 'bg-yellow-50 border-yellow-200' },
  { name: 'Blue', value: 'bg-blue-50 border-blue-200' },
  { name: 'Green', value: 'bg-green-50 border-green-200' },
  { name: 'Purple', value: 'bg-purple-50 border-purple-200' },
  { name: 'Orange', value: 'bg-orange-50 border-orange-200' },
];

const PRIORITY_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-gray-100 text-gray-700 border-gray-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  high: 'bg-red-100 text-red-700 border-red-300',
};

// shape of a todo item
type TodoPriority = 'low' | 'medium' | 'high';

interface TodoItem {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: TodoPriority;
  color: string;
  completed: boolean;
}

export function TodoList() {
  const {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    getActiveTodos,
    getCompletedTodos,
    getOverdueTodos,
    getTodayTodos,
  } = useTodos();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'today' | 'overdue'>('all');
  const [newTodo, setNewTodo] = useState<Omit<TodoItem, 'id'>>({
    title: '',
    description: '',
    dueDate: null,
    priority: 'medium',
    color: TODO_COLORS[0].value,
    completed: false,
  });

  const handleAddTodo = () => {
    if (!newTodo.title.trim()) {
      toast.error('Please add a title for your task');
      return;
    }

    addTodo(newTodo);
    setNewTodo({
      title: '',
      description: '',
      dueDate: null,
      priority: 'medium',
      color: TODO_COLORS[0].value,
      completed: false,
    });
    setIsAdding(false);
    toast.success('Task added successfully!');
  };

  const getFilteredTodos = () => {
    switch (filter) {
      case 'active':
        return getActiveTodos();
      case 'completed':
        return getCompletedTodos();
      case 'today':
        return getTodayTodos();
      case 'overdue':
        return getOverdueTodos();
      default:
        return todos;
    }
  };

  const filteredTodos = getFilteredTodos();
  const activeTodos = getActiveTodos();
  const completedTodos = getCompletedTodos();
  const overdueTodos = getOverdueTodos();
  const todayTodos = getTodayTodos();

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDateObj = new Date(dueDate);
    return dueDateObj < todayStart;
  };

  const isDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dueDateObj = new Date(dueDate);
    return dueDateObj >= todayStart && dueDateObj <= todayEnd;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 pt-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-pink-500" />
            My Tasks
          </h1>
          <p className="text-gray-600 mt-1">
            Organize and track your to-do items
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-pink-500 hover:bg-pink-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="cursor-pointer" onClick={() => setFilter('active')}>
          <CardContent className="p-4 text-center">
            <CheckSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xl mb-1">{activeTodos.length}</p>
            <p className="text-sm text-gray-600">Active Tasks</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setFilter('completed')}>
          <CardContent className="p-4 text-center">
            <CheckSquare className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xl mb-1">{completedTodos.length}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setFilter('today')}>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xl mb-1">{todayTodos.length}</p>
            <p className="text-sm text-gray-600">Due Today</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setFilter('overdue')}>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-xl mb-1">{overdueTodos.length}</p>
            <p className="text-sm text-gray-600">Overdue</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 flex-wrap"
      >
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          All
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
          className={filter === 'active' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          Active
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          Completed
        </Button>
        <Button
          variant={filter === 'today' ? 'default' : 'outline'}
          onClick={() => setFilter('today')}
          className={filter === 'today' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          Due Today
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          onClick={() => setFilter('overdue')}
          className={filter === 'overdue' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          Overdue
        </Button>
      </motion.div>

      {/* Add Todo Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Create New Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm mb-2 block">Title *</label>
                  <Input
                    placeholder="Enter task title..."
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm mb-2 block">Description</label>
                  <Textarea
                    placeholder="Enter task description..."
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm mb-2 block">Due Date</label>
                    <DatePickerWithPresets
                      value={newTodo.dueDate}
                      onChange={(date) => setNewTodo({ ...newTodo, dueDate: date })}
                      placeholder="Set due date"
                    />
                  </div>

                  <div>
                    <label className="text-sm mb-2 block">Priority</label>
                    <Select
                      value={newTodo.priority}
                      onValueChange={(value: TodoPriority) =>
                        setNewTodo({ ...newTodo, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm mb-2 block">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {TODO_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setNewTodo({ ...newTodo, color: color.value })}
                        className={`w-10 h-10 rounded-lg border-2 ${color.value} ${
                          newTodo.color === color.value ? 'ring-2 ring-pink-500' : ''
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setNewTodo({
                        title: '',
                        description: '',
                        dueDate: null,
                        priority: 'medium',
                        color: TODO_COLORS[0].value,
                        completed: false,
                      });
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleAddTodo} className="bg-pink-500 hover:bg-pink-600">
                    <Save className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Todos List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {filteredTodos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' ? 'Create your first task to get started!' : `No ${filter} tasks`}
              </p>
              {filter === 'all' && (
                <Button onClick={() => setIsAdding(true)} className="bg-pink-500 hover:bg-pink-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredTodos.map((todo: TodoItem) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  isEditing={editingId === todo.id}
                  onEdit={() => setEditingId(todo.id)}
                  onSave={(updates) => {
                    updateTodo(todo.id, updates);
                    setEditingId(null);
                    toast.success('Task updated!');
                  }}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => {
                    deleteTodo(todo.id);
                    toast.success('Task deleted!');
                  }}
                  onToggle={() => toggleTodo(todo.id)}
                  isOverdue={isOverdue(todo.dueDate)}
                  isDueToday={isDueToday(todo.dueDate)}
                  formatDate={formatDate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface TodoCardProps {
  todo: TodoItem;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<TodoItem>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggle: () => void;
  isOverdue: boolean;
  isDueToday: boolean;
  formatDate: (date: string | null) => string | null;
}

function TodoCard({
  todo,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggle,
  isOverdue,
  isDueToday,
  formatDate,
}: TodoCardProps) {
  const [editData, setEditData] = useState<Partial<TodoItem>>({
    title: todo.title,
    description: todo.description,
    dueDate: todo.dueDate,
    priority: todo.priority,
    color: todo.color,
  });

  // Update editData when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditData({
        title: todo.title,
        description: todo.description,
        dueDate: todo.dueDate,
        priority: todo.priority,
        color: todo.color,
      });
    }
  }, [isEditing, todo]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className={`${todo.color} border-2 ${todo.completed ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editData.title ?? ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="bg-white"
              />
              <Textarea
                value={editData.description ?? ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
                className="bg-white"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DatePickerWithPresets
                  value={(editData.dueDate as string) ?? null}
                  onChange={(date) => setEditData({ ...editData, dueDate: date })}
                  placeholder="Set due date"
                />
                <Select
                  value={(editData.priority as TodoPriority) ?? 'medium'}
                  onValueChange={(value: TodoPriority) =>
                    setEditData({ ...editData, priority: value })
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 flex-wrap">
                {TODO_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setEditData({ ...editData, color: color.value })}
                    className={`w-8 h-8 rounded border-2 ${color.value} ${
                      editData.color === color.value ? 'ring-2 ring-pink-500' : ''
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSave(editData)}
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={onToggle}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h3 className={`${todo.completed ? 'line-through text-gray-500' : ''}`}>
                    {todo.title}
                  </h3>
                  {todo.description && (
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {todo.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs ${PRIORITY_COLORS[todo.priority]}`}>
                  {todo.priority.toUpperCase()}
                </Badge>

                {todo.dueDate && (
                  <Badge
                    variant="outline"
                    className={`text-xs flex items-center gap-1 ${
                      isOverdue
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : isDueToday
                        ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : ''
                    }`}
                  >
                    <CalendarIcon className="w-3 h-3" />
                    {formatDate(todo.dueDate)}
                    {isOverdue && ' (Overdue)'}
                    {isDueToday && ' (Today)'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
