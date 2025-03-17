
import { supabase } from '@/integrations/supabase/client';
import { Task, User, TimeMetrics, WeekMetrics, MonthMetrics, TaskColor } from '../types';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export const fetchTasks = async (userId: string): Promise<Task[]> => {
  if (!userId) {
    console.error('Cannot fetch tasks: No user ID provided');
    return [];
  }
  
  try {
    console.log('Fetching tasks for user:', userId);
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('owner', userId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return [];
    }

    if (data) {
      console.log('Tasks found:', data.length);
      
      const formattedTasks: Task[] = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || undefined,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        startedAt: task.started_at || undefined,
        pausedAt: task.paused_at || undefined,
        completedAt: task.completed_at || undefined,
        owner: task.owner,
        status: task.status as 'pending' | 'active' | 'paused' | 'completed',
        position: task.position,
        totalTimeSeconds: task.total_time_seconds || 0,
        activeTimeAccumulatedSeconds: task.active_time_accumulated_seconds || 0,
        color: task.color as TaskColor || undefined
      }));
      
      return formattedTasks;
    }
    
    return [];
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    toast.error('Failed to load tasks');
    return [];
  }
};

export const createTask = async (user: User | null, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'position' | 'totalTimeSeconds' | 'activeTimeAccumulatedSeconds'>) => {
  if (!user) {
    toast.error('You must be logged in to create tasks');
    throw new Error('User not authenticated');
  }

  try {
    const { data: positionData } = await supabase
      .from('tasks')
      .select('position')
      .eq('owner', user.id)
      .order('position', { ascending: false })
      .limit(1);
    
    const nextPosition = positionData && positionData.length > 0 ? positionData[0].position + 1 : 0;
    
    const taskStatus: 'pending' | 'active' | 'paused' | 'completed' = task.status || 'pending';
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description,
        status: taskStatus,
        owner: user.id,
        position: nextPosition,
        total_time_seconds: 0,
        active_time_accumulated_seconds: 0,
        color: task.color || 'gray'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      throw error;
    }

    if (data) {
      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        startedAt: data.started_at,
        pausedAt: data.paused_at,
        completedAt: data.completed_at,
        owner: data.owner,
        status: data.status as 'pending' | 'active' | 'paused' | 'completed',
        position: data.position,
        totalTimeSeconds: data.total_time_seconds || 0,
        activeTimeAccumulatedSeconds: data.active_time_accumulated_seconds || 0,
        color: data.color as TaskColor || undefined
      };
      
      toast.success('Task created');
      return newTask;
    }
    
    throw new Error('No data returned from create task operation');
  } catch (error) {
    console.error('Error in createTask:', error);
    throw error;
  }
};

export const updateTask = async (user: User | null, id: string, taskUpdate: Partial<Task>) => {
  if (!user) {
    toast.error('You must be logged in to update tasks');
    throw new Error('User not authenticated');
  }

  try {
    const updateData: any = {};
    if (taskUpdate.title !== undefined) updateData.title = taskUpdate.title;
    if (taskUpdate.description !== undefined) updateData.description = taskUpdate.description;
    if (taskUpdate.status !== undefined) updateData.status = taskUpdate.status;
    if (taskUpdate.startedAt !== undefined) updateData.started_at = taskUpdate.startedAt;
    if (taskUpdate.pausedAt !== undefined) updateData.paused_at = taskUpdate.pausedAt;
    if (taskUpdate.completedAt !== undefined) updateData.completed_at = taskUpdate.completedAt;
    if (taskUpdate.position !== undefined) updateData.position = taskUpdate.position;
    if (taskUpdate.totalTimeSeconds !== undefined) updateData.total_time_seconds = taskUpdate.totalTimeSeconds;
    if (taskUpdate.activeTimeAccumulatedSeconds !== undefined) 
      updateData.active_time_accumulated_seconds = taskUpdate.activeTimeAccumulatedSeconds;
    if (taskUpdate.color !== undefined) updateData.color = taskUpdate.color;

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('owner', user.id);

    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      throw error;
    }
  } catch (error) {
    console.error('Error in updateTask:', error);
    throw error;
  }
};

export const deleteTask = async (user: User | null, id: string) => {
  if (!user) {
    toast.error('You must be logged in to delete tasks');
    throw new Error('User not authenticated');
  }

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('owner', user.id);

    if (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      throw error;
    }
    
    toast.success('Task deleted');
  } catch (error) {
    console.error('Error in deleteTask:', error);
    throw error;
  }
};

export const createTimeEntry = async (taskId: string) => {
  try {
    const { error } = await supabase
      .from('task_time_entries')
      .insert({
        task_id: taskId,
        start_time: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createTimeEntry:', error);
    throw error;
  }
};

export const endTimeEntry = async (taskId: string, tasks: Task[]) => {
  try {
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('*')
      .eq('task_id', taskId)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching time entry:', error);
      throw error;
    }

    if (data && data.length > 0) {
      const entry = data[0];
      const endTime = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('task_time_entries')
        .update({ end_time: endTime })
        .eq('id', entry.id);

      if (updateError) {
        console.error('Error updating time entry:', updateError);
        throw updateError;
      }

      const startTime = new Date(entry.start_time);
      const durationSeconds = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000);
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const newTotalSeconds = (task.totalTimeSeconds || 0) + durationSeconds;
        return newTotalSeconds;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in endTimeEntry:', error);
    throw error;
  }
};

export const startTask = async (user: User | null, id: string, tasks: Task[]) => {
  if (!user) {
    toast.error('You must be logged in to start tasks');
    throw new Error('User not authenticated');
  }

  try {
    const activeTasks = tasks.filter(task => task.status === 'active');
    for (const activeTask of activeTasks) {
      if (activeTask.id !== id) {
        await pauseTask(user, activeTask.id, tasks);
      }
    }

    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    const now = new Date().toISOString();
    
    await createTimeEntry(id);
    
    await updateTask(user, id, {
      status: 'active',
      startedAt: task.startedAt || now,
      pausedAt: undefined
    });

    toast.success('Task started');
  } catch (error) {
    console.error('Error starting task:', error);
    toast.error('Failed to start task');
    throw error;
  }
};

export const pauseTask = async (user: User | null, id: string, tasks: Task[]) => {
  if (!user) {
    toast.error('You must be logged in to pause tasks');
    throw new Error('User not authenticated');
  }

  try {
    const newTotalSeconds = await endTimeEntry(id, tasks);
    
    if (newTotalSeconds !== null) {
      await updateTask(user, id, {
        status: 'paused',
        pausedAt: new Date().toISOString(),
        totalTimeSeconds: newTotalSeconds
      });
    } else {
      await updateTask(user, id, {
        status: 'paused',
        pausedAt: new Date().toISOString()
      });
    }

    toast.success('Task paused');
  } catch (error) {
    console.error('Error pausing task:', error);
    toast.error('Failed to pause task');
    throw error;
  }
};

export const completeTask = async (user: User | null, id: string, tasks: Task[]) => {
  if (!user) {
    toast.error('You must be logged in to complete tasks');
    throw new Error('User not authenticated');
  }

  try {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    if (task.status === 'active') {
      const newTotalSeconds = await endTimeEntry(id, tasks);
      
      if (newTotalSeconds !== null) {
        await updateTask(user, id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          totalTimeSeconds: newTotalSeconds
        });
      } else {
        await updateTask(user, id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
      }
    } else {
      await updateTask(user, id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    }

    toast.success('Task completed');
  } catch (error) {
    console.error('Error completing task:', error);
    toast.error('Failed to complete task');
    throw error;
  }
};

export const reorderTasks = async (user: User | null, taskIds: string[]) => {
  if (!user || taskIds.length === 0) throw new Error('Invalid parameters');

  try {
    const updates = taskIds.map((id, index) => ({
      id,
      position: index
    }));
    
    for (const update of updates) {
      await updateTask(user, update.id, { position: update.position });
    }
  } catch (error) {
    console.error('Error reordering tasks:', error);
    toast.error('Failed to reorder tasks');
    throw error;
  }
};

export const getTimeMetricsByDay = (tasks: Task[]): TimeMetrics[] => {
  if (!tasks.length) return [];
  
  const tasksByDay: Record<string, Task[]> = {};
  
  tasks.forEach(task => {
    if (task.totalTimeSeconds > 0) {
      const createdDate = format(new Date(task.createdAt), 'yyyy-MM-dd');
      if (!tasksByDay[createdDate]) {
        tasksByDay[createdDate] = [];
      }
      tasksByDay[createdDate].push(task);
    }
  });
  
  return Object.entries(tasksByDay).map(([day, dayTasks]) => {
    const totalSeconds = dayTasks.reduce((acc, task) => acc + task.totalTimeSeconds, 0);
    return {
      day,
      totalSeconds,
      tasks: dayTasks
    };
  });
};

export const getTimeMetricsByWeek = (tasks: Task[]): WeekMetrics[] => {
  const dailyMetrics = getTimeMetricsByDay(tasks);
  if (!dailyMetrics.length) return [];
  
  const weekMap = new Map<string, TimeMetrics[]>();
  
  dailyMetrics.forEach(dayMetric => {
    const date = parseISO(dayMetric.day);
    const weekStart = format(startOfWeek(date), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(date), 'yyyy-MM-dd');
    const weekKey = `${weekStart}|${weekEnd}`;
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    
    weekMap.get(weekKey)?.push(dayMetric);
  });
  
  return Array.from(weekMap.entries()).map(([weekKey, days]) => {
    const [weekStart, weekEnd] = weekKey.split('|');
    const totalSeconds = days.reduce((acc, day) => acc + day.totalSeconds, 0);
    
    return {
      weekStart,
      weekEnd,
      totalSeconds,
      days
    };
  });
};

export const getTimeMetricsByMonth = (tasks: Task[]): MonthMetrics[] => {
  const weeklyMetrics = getTimeMetricsByWeek(tasks);
  if (!weeklyMetrics.length) return [];
  
  const monthMap = new Map<string, WeekMetrics[]>();
  
  weeklyMetrics.forEach(weekMetric => {
    const startDate = parseISO(weekMetric.weekStart);
    const month = format(startDate, 'yyyy-MM');
    
    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }
    
    monthMap.get(month)?.push(weekMetric);
  });
  
  return Array.from(monthMap.entries()).map(([month, weeks]) => {
    const totalSeconds = weeks.reduce((acc, week) => acc + week.totalSeconds, 0);
    
    return {
      month,
      totalSeconds,
      weeks
    };
  });
};
