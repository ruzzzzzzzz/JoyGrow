import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from './UserContext';
import { useNotifications } from './NotificationContext';
import { db } from '../database';

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string | null; // ISO date string
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
  color: string;
}

interface TodoContextType {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  getActiveTodos: () => Todo[];
  getCompletedTodos: () => Todo[];
  getOverdueTodos: () => Todo[];
  getTodayTodos: () => Todo[];
  getUpcomingTodos: () => Todo[];
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function TodoProvider({ children }: { children: ReactNode }) {
  const userContext = useUser();
  const { currentUser } = userContext || { currentUser: null };
  const { addNotification } = useNotifications();
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<number>(Date.now());

  // Load user-specific todos from database
  useEffect(() => {
    const loadTodos = async () => {
      if (currentUser) {
        try {
          const dbTodos = await db.getTodosByUser(currentUser.id);
          const mappedTodos: Todo[] = dbTodos.map(todo => ({
            id: todo.id,
            title: todo.title,
            description: todo.description || '',
            completed: todo.completed,
            dueDate: todo.due_date || null,
            priority: todo.priority,
            createdAt: new Date(todo.created_at).getTime(),
            updatedAt: new Date(todo.updated_at).getTime(),
            color: todo.color,
          }));
          setTodos(mappedTodos);
        } catch (error) {
          console.error('Error loading todos from database:', error);
          setTodos([]);
        }
      } else {
        setTodos([]);
      }
    };

    loadTodos();
  }, [currentUser]);

  // Check for upcoming and overdue todos periodically
  useEffect(() => {
    if (!currentUser) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const hoursSinceLastCheck = (now - lastNotificationCheck) / (1000 * 60 * 60);

      // Check every 6 hours
      if (hoursSinceLastCheck >= 6) {
        checkTodoNotifications();
        setLastNotificationCheck(now);
      }
    }, 1000 * 60 * 30); // Check every 30 minutes

    // Initial check
    checkTodoNotifications();

    return () => clearInterval(checkInterval);
  }, [todos, currentUser, lastNotificationCheck]);

  const checkTodoNotifications = useCallback(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    // Check overdue todos
    const overdue = todos.filter(todo => {
      if (todo.completed || !todo.dueDate) return false;
      const dueDate = new Date(todo.dueDate);
      return dueDate < todayStart;
    });

    if (overdue.length > 0) {
      addNotification({
        type: 'reminder',
        title: '⚠️ Overdue Tasks',
        message: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
        icon: '⚠️',
      });
    }

    // Check tasks due today
    const dueToday = todos.filter(todo => {
      if (todo.completed || !todo.dueDate) return false;
      const dueDate = new Date(todo.dueDate);
      return dueDate >= todayStart && dueDate <= todayEnd;
    });

    if (dueToday.length > 0) {
      addNotification({
        type: 'reminder',
        title: '📅 Tasks Due Today',
        message: `You have ${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today`,
        icon: '📅',
      });
    }

    // Check tasks due tomorrow
    const dueTomorrow = todos.filter(todo => {
      if (todo.completed || !todo.dueDate) return false;
      const dueDate = new Date(todo.dueDate);
      return dueDate >= tomorrowStart && dueDate <= tomorrowEnd;
    });

    if (dueTomorrow.length > 0) {
      addNotification({
        type: 'reminder',
        title: '📆 Tasks Due Tomorrow',
        message: `You have ${dueTomorrow.length} task${dueTomorrow.length > 1 ? 's' : ''} due tomorrow`,
        icon: '📆',
      });
    }
  }, [todos, addNotification]);

  const addTodo = useCallback(async (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    try {
      const newTodo = await db.createTodo({
        user_id: currentUser.id,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        due_date: todo.dueDate ?? undefined,
        priority: todo.priority,
        color: todo.color,
        synced: false,
      });

      const mappedTodo: Todo = {
        id: newTodo.id,
        title: newTodo.title,
        description: newTodo.description || '',
        completed: newTodo.completed,
        dueDate: newTodo.due_date || null,
        priority: newTodo.priority,
        createdAt: new Date(newTodo.created_at).getTime(),
        updatedAt: new Date(newTodo.updated_at).getTime(),
        color: newTodo.color,
      };

      setTodos(prev => [mappedTodo, ...prev]);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  }, [currentUser]);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    if (!currentUser) return;

    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.color !== undefined) dbUpdates.color = updates.color;

      const updatedTodo = await db.updateTodo(id, dbUpdates);

      const mappedTodo: Todo = {
        id: updatedTodo.id,
        title: updatedTodo.title,
        description: updatedTodo.description || '',
        completed: updatedTodo.completed,
        dueDate: updatedTodo.due_date || null,
        priority: updatedTodo.priority,
        createdAt: new Date(updatedTodo.created_at).getTime(),
        updatedAt: new Date(updatedTodo.updated_at).getTime(),
        color: updatedTodo.color,
      };

      setTodos(prev => prev.map(todo => todo.id === id ? mappedTodo : todo));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  }, [currentUser]);

  const deleteTodo = useCallback(async (id: string) => {
    if (!currentUser) return;

    try {
      await db.deleteTodo(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  }, [currentUser]);

  const toggleTodo = useCallback(async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo || !currentUser) return;

    try {
      const updatedTodo = await db.updateTodo(id, { completed: !todo.completed });

      const mappedTodo: Todo = {
        id: updatedTodo.id,
        title: updatedTodo.title,
        description: updatedTodo.description || '',
        completed: updatedTodo.completed,
        dueDate: updatedTodo.due_date || null,
        priority: updatedTodo.priority,
        createdAt: new Date(updatedTodo.created_at).getTime(),
        updatedAt: new Date(updatedTodo.updated_at).getTime(),
        color: updatedTodo.color,
      };

      setTodos(prev => prev.map(t => t.id === id ? mappedTodo : t));

      if (!todo.completed) {
        addNotification({
          type: 'achievement',
          title: '✅ Task Completed!',
          message: `You completed: ${todo.title}`,
          icon: '✅',
        });
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  }, [todos, currentUser, addNotification]);

  const getActiveTodos = useCallback(() => {
    return todos.filter(todo => !todo.completed);
  }, [todos]);

  const getCompletedTodos = useCallback(() => {
    return todos.filter(todo => todo.completed);
  }, [todos]);

  const getOverdueTodos = useCallback(() => {
    // Get start of today in local timezone
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return todos.filter(todo => {
      if (todo.completed || !todo.dueDate) return false;
      
      // Parse the due date
      const dueDate = new Date(todo.dueDate);
      
      // Task is overdue if due date is before today (not including today)
      return dueDate < todayStart;
    });
  }, [todos]);

  const getTodayTodos = useCallback(() => {
    // Get today's date normalized to start of day in local timezone
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    return todos.filter(todo => {
      if (todo.completed || !todo.dueDate) return false;
      
      // Parse the due date - handle both date-only strings and ISO datetime strings
      const dueDate = new Date(todo.dueDate);
      
      // Check if due date falls within today (handles midnight and any time during the day)
      return dueDate >= todayStart && dueDate <= todayEnd;
    });
  }, [todos]);

  const getUpcomingTodos = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return todos.filter(todo => 
      !todo.completed && 
      todo.dueDate && 
      todo.dueDate > today
    );
  }, [todos]);

  return (
    <TodoContext.Provider
      value={{
        todos,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleTodo,
        getActiveTodos,
        getCompletedTodos,
        getOverdueTodos,
        getTodayTodos,
        getUpcomingTodos,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within TodoProvider');
  }
  return context;
}