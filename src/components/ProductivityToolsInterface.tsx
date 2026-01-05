import { Timer, CheckSquare, FileText, ArrowRight, Clock, ListTodo, StickyNote } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface ProductivityToolsInterfaceProps {
  onNavigateToPomodoro: () => void;
  onNavigateToTasks: () => void;
  onNavigateToNotes: () => void;
}

export function ProductivityToolsInterface({ 
  onNavigateToPomodoro, 
  onNavigateToTasks, 
  onNavigateToNotes 
}: ProductivityToolsInterfaceProps) {
  const tools = [
    {
      id: 'pomodoro',
      title: 'Pomodoro Timer',
      description: 'Boost your focus with the Pomodoro technique. Work in focused intervals with regular breaks.',
      icon: Timer,
      decorativeIcon: Clock,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-300',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      onClick: onNavigateToPomodoro,
      features: ['25-minute focus sessions', 'Break reminders', 'Progress tracking']
    },
    {
      id: 'tasks',
      title: 'My Tasks',
      description: 'Organize your to-do list and stay on top of your study goals. Create, edit, and track your tasks.',
      icon: CheckSquare,
      decorativeIcon: ListTodo,
      gradient: 'from-blue-500 to-indigo-500',
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-300',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: onNavigateToTasks,
      features: ['Task management', 'Mark as complete', 'Easy editing']
    },
    {
      id: 'notes',
      title: 'My Notes',
      description: 'Capture your thoughts and study notes in one place. Create, organize, and access them anytime.',
      icon: FileText,
      decorativeIcon: StickyNote,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-300',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      onClick: onNavigateToNotes,
      features: ['Quick note-taking', 'Rich text editor', 'Search & organize']
    }
  ];

  return (
    <div className="space-y-6 pb-4 pt-16">
      {/* Header */}
      <div className="text-center space-y-2 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-gray-900 mb-2">Productivity Tools</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Enhance your learning experience with our suite of productivity tools. 
            Choose a tool below to get started and boost your study efficiency.
          </p>
        </motion.div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={`relative overflow-hidden bg-gradient-to-br ${tool.bgGradient} border-2 ${tool.borderColor} hover:shadow-xl transition-all duration-300 group cursor-pointer`}
              onClick={tool.onClick}
            >
              {/* Decorative Background Icon */}
              <div className="absolute top-0 right-0 opacity-5 transform translate-x-8 -translate-y-8">
                <tool.decorativeIcon className="w-48 h-48" />
              </div>

              <div className="relative p-6 space-y-4">
                {/* Icon Header */}
                <div className="flex items-start justify-between">
                  <div className={`${tool.iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className={`w-8 h-8 ${tool.iconColor}`} />
                  </div>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ x: 5 }}
                  >
                    <ArrowRight className={`w-5 h-5 ${tool.iconColor}`} />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-gray-900">{tool.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-1.5">
                  {tool.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tool.gradient}`}></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={(e: any) => {
                    e.stopPropagation();
                    tool.onClick();
                  }}
                  className={`w-full bg-gradient-to-r ${tool.gradient} hover:opacity-90 text-white shadow-md group-hover:shadow-lg transition-all duration-300`}
                >
                  <span>Open {tool.title}</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bottom Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="px-4"
      >
        <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-pink-100 p-3 rounded-lg flex-shrink-0">
              <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-1">Pro Tip</h3>
              <p className="text-sm text-gray-600">
                Combine these tools for maximum productivity! Use the Pomodoro Timer while working on your Tasks, 
                and take Notes during your study sessions to reinforce learning.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}