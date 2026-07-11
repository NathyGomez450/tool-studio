import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { createTask, moveTask, updateTask, deleteTask } from '@/api/tasks';
import { createBug, updateBugStatus, updateBug, deleteBug, updateBugAssignee, addBugComment } from '@/api/bugs';
import { createGddSection, updateGddSection, deleteGddSection, uploadGddDoc, removeGddDoc } from '@/api/gdd';
import { createRoadmapItem, updateRoadmapItem, deleteRoadmapItem } from '@/api/roadmap';
import {
  createBrainstormNote,
  updateBrainstormNote,
  deleteBrainstormNote,
  createBrainstormEdge,
  deleteBrainstormEdge,
  updateBrainstormEdge,
  addNoteComment,
} from '@/api/brainstorm';
import { uploadAsset, deleteAsset } from '@/api/assets';
import { inviteUser } from '@/api/invites';
import { type Task, type Bug, type RoadmapItem } from '@/lib/data';

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { title: string; priority: Task['priority']; tag?: string }) =>
      createTask(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.columns }),
  });
}

export function useCreateBug(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { title: string; severity: Bug['severity'] }) =>
      createBug(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bugs }),
  });
}

export function useUpdateBugStatus(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { bugId: string; status: Bug['status'] }) =>
      updateBugStatus(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bugs }),
  });
}

export function useMoveTask(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { taskId: string; toColumnKey: string; toIndex: number }) =>
      moveTask(projectId, input),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.columns }),
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { taskId: string; title: string; priority: Task['priority']; tags: string[] }) =>
      updateTask(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.columns }),
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { taskId: string }) => deleteTask(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.columns }),
  });
}

export function useUpdateBug(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { bugId: string; title: string; severity: Bug['severity'] }) =>
      updateBug(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bugs }),
  });
}

export function useDeleteBug(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { bugId: string }) => deleteBug(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bugs }),
  });
}

export function useUpdateBugAssignee(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { bugId: string; assignee: string }) => updateBugAssignee(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bugs });
      qc.invalidateQueries({ queryKey: keys.team });
    },
  });
}

export function useAddBugComment(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { bugId: string; text: string }) => addBugComment(projectId, input),
    onSuccess: (_data, input) => qc.invalidateQueries({ queryKey: keys.bugComments(input.bugId) }),
  });
}

export function useCreateGddSection(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { title: string; body: string }) => createGddSection(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.gdd }),
  });
}

export function useUpdateGddSection(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { id: string; title: string; body: string }) => updateGddSection(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.gdd }),
  });
}

export function useDeleteGddSection(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { id: string }) => deleteGddSection(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.gdd }),
  });
}

export function useUploadGddDoc(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { sectionId: string; file: File }) => uploadGddDoc(projectId, input.sectionId, input.file),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.gdd }),
  });
}

export function useRemoveGddDoc(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { sectionId: string; path: string }) => removeGddDoc(projectId, input.sectionId, input.path),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.gdd }),
  });
}

export function useCreateRoadmapItem(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { quarter: string; title: string; status: RoadmapItem['status'] }) =>
      createRoadmapItem(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.roadmap }),
  });
}

export function useUpdateRoadmapItem(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { id: string; title: string; status: RoadmapItem['status']; quarter: string }) =>
      updateRoadmapItem(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.roadmap }),
  });
}

export function useDeleteRoadmapItem(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { id: string }) => deleteRoadmapItem(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.roadmap }),
  });
}

export function useCreateBrainstormNote(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { text: string; color: string; x: number; y: number }) =>
      createBrainstormNote(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.brainstorm }),
  });
}

export function useUpdateBrainstormNote(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { id: string; text?: string; color?: string; x?: number; y?: number }) =>
      updateBrainstormNote(projectId, input),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.brainstorm }),
  });
}

export function useDeleteBrainstormNote(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { id: string }) => deleteBrainstormNote(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.brainstorm });
      qc.invalidateQueries({ queryKey: keys.brainstormEdges });
    },
  });
}

export function useCreateBrainstormEdge(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { source: string; target: string }) => createBrainstormEdge(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.brainstormEdges }),
  });
}

export function useDeleteBrainstormEdge(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { id: string }) => deleteBrainstormEdge(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.brainstormEdges }),
  });
}

export function useUpdateBrainstormEdge(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { id: string; label: string }) => updateBrainstormEdge(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.brainstormEdges }),
  });
}

export function useAddNoteComment(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { noteId: string; text: string }) => addNoteComment(projectId, input),
    onSuccess: (_data, input) => qc.invalidateQueries({ queryKey: keys.noteComments(input.noteId) }),
  });
}

export function useUploadAsset(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { file: File; type: string }) => uploadAsset(projectId, input.file, { type: input.type }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.assets }),
  });
}

export function useDeleteAsset(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { id: string; url: string }) => deleteAsset(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.assets }),
  });
}

export function useInviteUser(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { email: string; name?: string; role: 'owner' | 'admin' | 'member' }) =>
      inviteUser(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.team }),
  });
}
