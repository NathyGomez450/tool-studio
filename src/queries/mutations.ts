import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { createTask, moveTask, updateTask, deleteTask } from '@/api/tasks';
import { createBug, updateBugStatus, updateBug, deleteBug } from '@/api/bugs';

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.columns }),
  });
}

export function useCreateBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBug,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bugs }),
  });
}

export function useUpdateBugStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateBugStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bugs }),
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: moveTask,
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.columns }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.columns }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.columns }),
  });
}

export function useUpdateBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateBug,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bugs }),
  });
}

export function useDeleteBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBug,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bugs }),
  });
}
