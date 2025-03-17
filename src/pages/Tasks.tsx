import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import { Task, TaskColor, TimeMetrics, WeekMetrics, MonthMetrics } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Play, Pause, CheckCircle, Clock, MoreVertical,
  Trash2, Edit, ArrowUp, ArrowDown, Calendar, ChevronDown, 
  ChevronRight, X, GripVertical
} from "lucide-react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDistanceToNow, format, parseISO, differenceInSeconds } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const TASK_COLORS: Record<TaskColor, string> = {
  gray: "bg-gray-400 dark:bg-gray-500",
  red: "bg-red-400 dark:bg-red-500",
  orange: "bg-orange-400 dark:bg-orange-500",
  yellow: "bg-yellow-400 dark:bg-yellow-500",
  green: "bg-green-400 dark:bg-green-500",
  blue: "bg-blue-400 dark:bg-blue-500",
  purple: "bg-purple-400 dark:bg-purple-500",
  pink: "bg-pink-400 dark:bg-pink-500"
};

const TaskListItem = ({ task, onAction }: { task: Task, onAction: (action: string, task: Task) => void }) => {
  const [timeElapsed, setTimeElapsed] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    // Set up interval to update time elapsed for active tasks
    let intervalId: NodeJS.Timeout | null = null;
    
    const updateTimeElapsed = () => {
      if (task.status === 'active') {
        const startTime = task.startedAt ? new Date(task.startedAt) : new Date();
        const elapsedSeconds = differenceInSeconds(new Date(), startTime) + (task.activeTimeAccumulatedSeconds || 0);
        setTimeElapsed(formatSeconds(elapsedSeconds));
      } else if (task.status === 'completed' && task.totalTimeSeconds) {
        setTimeElapsed(formatSeconds(task.totalTimeSeconds));
      } else if (task.totalTimeSeconds) {
        setTimeElapsed(formatSeconds(task.totalTimeSeconds));
      }
    };
    
    updateTimeElapsed();
    
    if (task.status === 'active') {
      intervalId = setInterval(updateTimeElapsed, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [task]);
  
  const getStatusColor = () => {
    switch (task.status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  const taskColorClass = task.color ? TASK_COLORS[task.color] : 'bg-gray-300 dark:bg-gray-600';
  
  return (
    <motion.div 
      className="group bg-card rounded-md border border-border p-3 mb-2 flex items-start justify-between gap-2 hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ height: isHovered ? 'auto' : '60px', overflow: 'hidden' }}
    >
      <div className="flex items-center space-x-3 flex-1">
        <div className="flex flex-col items-center">
          <span className={`w-3 h-3 rounded-full ${taskColorClass}`} />
          <div className="h-full w-px bg-border mt-1" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground line-clamp-1">{task.title}</h3>
          {task.description && (
            <p className={`text-sm text-muted-foreground ${isHovered ? '' : 'line-clamp-1'} mt-1`}>
              {task.description}
            </p>
          )}
          <div className="flex items-center mt-1 space-x-4 text-xs">
            <span className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
            </span>
            {timeElapsed && (
              <span className="flex items-center text-muted-foreground">
                <Clock size={12} className="mr-1" />
                {timeElapsed}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        {task.status === 'pending' && (
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onAction('start', task)}
            className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Play size={16} />
          </Button>
        )}
        
        {task.status === 'active' && (
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onAction('pause', task)}
            className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
          >
            <Pause size={16} />
          </Button>
        )}
        
        {(task.status === 'paused' || task.status === 'active') && (
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onAction('complete', task)}
            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <CheckCircle size={16} />
          </Button>
        )}
        
        {task.status === 'paused' && (
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onAction('start', task)}
            className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Play size={16} />
          </Button>
        )}
        
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => onAction('edit', task)}
          className="h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <Edit size={16} />
        </Button>
        
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => onAction('delete', task)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={16} />
        </Button>

        {/* Drag handle */}
        <div className="touch-none text-muted-foreground cursor-grab active:cursor-grabbing h-8 w-8 flex items-center justify-center">
          <GripVertical size={16} />
        </div>
      </div>
    </motion.div>
  );
};

const ColorPicker = ({ selectedColor, onSelectColor }: { selectedColor?: TaskColor, onSelectColor: (color: TaskColor) => void }) => {
  const colors: TaskColor[] = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Task Color</Label>
      <RadioGroup 
        defaultValue={selectedColor || 'gray'} 
        onValueChange={(value) => onSelectColor(value as TaskColor)}
        className="flex flex-wrap gap-2"
      >
        {colors.map((color) => (
          <div key={color} className="flex items-center space-x-2">
            <RadioGroupItem 
              value={color} 
              id={`color-${color}`} 
              className="peer sr-only" 
            />
            <Label
              htmlFor={`color-${color}`}
              className={`w-8 h-8 rounded-full cursor-pointer border-2 border-transparent hover:opacity-90 hover:border-primary peer-data-[state=checked]:border-primary ${TASK_COLORS[color]}`}
            ></Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

const TasksList = () => {
  const { tasks, createTask, updateTask, deleteTask, startTask, pauseTask, completeTask, reorderTasks } = useStore();
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskColor, setNewTaskColor] = useState<TaskColor>("gray");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  
  useEffect(() => {
    setPendingTasks(tasks.filter(task => task.status !== 'completed'));
    setCompletedTasks(tasks.filter(task => task.status === 'completed'));
  }, [tasks]);
  
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    
    try {
      await createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        status: 'pending',
        color: newTaskColor
      });
      
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskColor("gray");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };
  
  const handleUpdateTask = async () => {
    if (!currentTask) return;
    
    if (!newTaskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    
    try {
      await updateTask(currentTask.id, {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        color: newTaskColor
      });
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };
  
  const handleTaskAction = async (action: string, task: Task) => {
    try {
      switch (action) {
        case 'start':
          await startTask(task.id);
          break;
        case 'pause':
          await pauseTask(task.id);
          break;
        case 'complete':
          await completeTask(task.id);
          break;
        case 'edit':
          setCurrentTask(task);
          setNewTaskTitle(task.title);
          setNewTaskDescription(task.description || '');
          setNewTaskColor(task.color || 'gray');
          setIsEditDialogOpen(true);
          break;
        case 'delete':
          await deleteTask(task.id);
          break;
      }
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      toast.error(`Failed to ${action} task`);
    }
  };
  
  const handleReorder = async (reorderedTasks: Task[]) => {
    setPendingTasks(reorderedTasks);
    const taskIds = reorderedTasks.map(task => task.id);
    await reorderTasks(taskIds);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center">
          <Plus size={16} className="mr-2" />
          Add Task
        </Button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">In Progress</h3>
        {pendingTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active tasks. Create a new task to get started.</p>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={pendingTasks} 
            onReorder={handleReorder}
            className="space-y-2"
          >
            <AnimatePresence initial={false}>
              {pendingTasks.map((task) => (
                <Reorder.Item key={task.id} value={task} className="cursor-grab active:cursor-grabbing">
                  <TaskListItem task={task} onAction={handleTaskAction} />
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
        
        {completedTasks.length > 0 && (
          <div>
            <div 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-6 mb-2"
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            >
              {showCompletedTasks ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <h3 className="text-lg font-medium">Completed ({completedTasks.length})</h3>
            </div>
            
            {showCompletedTasks && (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {completedTasks.map((task) => (
                    <motion.div key={task.id}>
                      <TaskListItem task={task} onAction={handleTaskAction} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
              <Textarea
                id="description"
                placeholder="Task description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
              />
            </div>
            <ColorPicker 
              selectedColor={newTaskColor}
              onSelectColor={setNewTaskColor}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
              <Input
                id="edit-title"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">Description (optional)</label>
              <Textarea
                id="edit-description"
                placeholder="Task description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
              />
            </div>
            <ColorPicker 
              selectedColor={newTaskColor}
              onSelectColor={setNewTaskColor}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTask}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TaskMetrics = () => {
  const { getTimeMetricsByDay, getTimeMetricsByWeek, getTimeMetricsByMonth, tasks } = useStore();
  const [activeTab, setActiveTab] = useState("daily");
  
  const dayMetrics = getTimeMetricsByDay();
  const weekMetrics = getTimeMetricsByWeek();
  const monthMetrics = getTimeMetricsByMonth();
  
  const formatTime = (seconds: number) => {
    return formatSeconds(seconds);
  };

  const getTaskColorClass = (task: Task) => {
    return task.color ? TASK_COLORS[task.color] : 'bg-gray-300 dark:bg-gray-600';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Time Tracking</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="py-2">
        {activeTab === "daily" && (
          <div className="space-y-4">
            {dayMetrics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No time tracking data available. Complete some tasks to see your metrics.</p>
              </div>
            ) : (
              dayMetrics.map((day) => (
                <Card key={day.day}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-medium">{format(parseISO(day.day), 'EEEE, MMMM d, yyyy')}</CardTitle>
                      <div className="text-muted-foreground text-sm">{formatTime(day.totalSeconds)}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {day.tasks.map(task => (
                        <li key={task.id} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getTaskColorClass(task)}`}></div>
                            <span>{task.title}</span>
                          </div>
                          <span className="text-muted-foreground">{formatTime(task.totalTimeSeconds)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        
        {activeTab === "weekly" && (
          <div className="space-y-4">
            {weekMetrics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No weekly data available. Complete some tasks to see your metrics.</p>
              </div>
            ) : (
              weekMetrics.map((week, index) => (
                <Accordion type="single" collapsible key={`week-${index}`}>
                  <AccordionItem value={`week-${index}`}>
                    <AccordionTrigger>
                      <div className="flex justify-between items-center w-full pr-4">
                        <span>
                          Week of {format(parseISO(week.weekStart), 'MMM d')} - {format(parseISO(week.weekEnd), 'MMM d, yyyy')}
                        </span>
                        <span className="text-muted-foreground">{formatTime(week.totalSeconds)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-4">
                        {week.days.map(day => (
                          <div key={day.day} className="border-b border-border last:border-0">
                            <div className="flex justify-between items-center text-sm py-2">
                              <span>{format(parseISO(day.day), 'EEEE, MMMM d')}</span>
                              <span className="text-muted-foreground">{formatTime(day.totalSeconds)}</span>
                            </div>
                            {day.tasks.length > 0 && (
                              <div className="pl-4 pb-2">
                                {day.tasks.map(task => (
                                  <div key={task.id} className="flex justify-between items-center text-xs py-1">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${getTaskColorClass(task)}`}></div>
                                      <span>{task.title}</span>
                                    </div>
                                    <span className="text-muted-foreground">{formatTime(task.totalTimeSeconds)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))
            )}
          </div>
        )}
        
        {activeTab === "monthly" && (
          <div className="space-y-4">
            {monthMetrics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No monthly data available. Complete some tasks to see your metrics.</p>
              </div>
            ) : (
              monthMetrics.map((month, index) => (
                <Accordion type="single" collapsible key={`month-${index}`}>
                  <AccordionItem value={`month-${index}`}>
                    <AccordionTrigger>
                      <div className="flex justify-between items-center w-full pr-4">
                        <span>{format(parseISO(`${month.month}-01`), 'MMMM yyyy')}</span>
                        <span className="text-muted-foreground">{formatTime(month.totalSeconds)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-4">
                        {month.weeks.map((week, weekIndex) => (
                          <div key={`week-${weekIndex}`} className="py-2">
                            <div className="flex justify-between items-center text-sm font-medium mb-2">
                              <span>
                                Week of {format(parseISO(week.weekStart), 'MMM d')} - {format(parseISO(week.weekEnd), 'MMM d')}
                              </span>
                              <span className="text-muted-foreground">{formatTime(week.totalSeconds)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format seconds to HH:MM:SS
const formatSeconds = (seconds: number): string => {
  if (!seconds) return "0:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Tasks = () => {
  const [activeView, setActiveView] = useState("list");
  const { tasks } = useStore();
  
  // Setting up a global interval to keep task timers running while on any tab
  useEffect(() => {
    const intervalId = setInterval(() => {
      // This empty interval keeps React's state updates going
      // even when the component isn't in focus
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="list" onValueChange={setActiveView} className="w-full">
            <TabsList className="w-full max-w-md mx-auto mb-6">
              <TabsTrigger value="list" className="flex-1">Task List ({tasks.length})</TabsTrigger>
              <TabsTrigger value="metrics" className="flex-1">Time Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-6">
              <TasksList />
            </TabsContent>
            
            <TabsContent value="metrics" className="mt-6">
              <TaskMetrics />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Tasks;
