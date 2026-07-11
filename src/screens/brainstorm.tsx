import * as React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  ConnectionMode,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { useBrainstormNotes, useBrainstormEdges } from '@/queries/hooks';
import {
  useCreateBrainstormNote,
  useUpdateBrainstormNote,
  useDeleteBrainstormNote,
  useCreateBrainstormEdge,
  useDeleteBrainstormEdge,
} from '@/queries/mutations';
import { BrainstormDialog } from '@/components/dialogs/brainstorm-dialog';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
import { type BrainstormNote } from '@/lib/data';
import { useAuth } from '@/auth/auth-context';

const toneBg: Record<string, string> = {
  creative: 'var(--creative-soft)',
  accent: 'var(--accent-soft)',
  info: 'var(--info-soft)',
  warning: 'var(--warning-soft)',
};
const toneBorder: Record<string, string> = {
  creative: 'oklch(0.58 0.19 300 / 0.5)',
  accent: 'var(--accent-soft-border)',
  info: 'oklch(0.62 0.16 250 / 0.5)',
  warning: 'oklch(0.75 0.16 75 / 0.5)',
};

type NoteData = { text: string; color: string };

function NoteNode({ data }: NodeProps) {
  const d = data as NoteData;
  return (
    <div
      className="w-[200px] min-h-[76px] rounded-md p-3 text-[13px] text-primary leading-relaxed border shadow-md whitespace-pre-wrap break-words"
      style={{ background: toneBg[d.color] ?? toneBg.accent, borderColor: toneBorder[d.color] ?? toneBorder.accent }}
    >
      <Handle type="source" position={Position.Left} className="!w-2 !h-2 !bg-[var(--accent-400)]" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[var(--accent-400)]" />
      {d.text}
    </div>
  );
}

const nodeTypes = { note: NoteNode };

export function Brainstorm() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const notesQ = useBrainstormNotes(projectId);
  const edgesQ = useBrainstormEdges(projectId);

  const createNote = useCreateBrainstormNote(projectId);
  const updateNote = useUpdateBrainstormNote(projectId);
  const deleteNote = useDeleteBrainstormNote(projectId);
  const createEdge = useCreateBrainstormEdge(projectId);
  const deleteEdge = useDeleteBrainstormEdge(projectId);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [editing, setEditing] = React.useState<BrainstormNote | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!notesQ.data) return;
    setNodes(
      notesQ.data.map((n) => ({
        id: n.id,
        type: 'note',
        position: { x: n.x, y: n.y },
        data: { text: n.text, color: n.color },
      })),
    );
  }, [notesQ.data, setNodes]);

  React.useEffect(() => {
    if (!edgesQ.data) return;
    setEdges(edgesQ.data.map((e) => ({ id: e.id, source: e.source, target: e.target, animated: true })));
  }, [edgesQ.data, setEdges]);

  const onConnect = React.useCallback(
    (c: Connection) => {
      if (c.source && c.target && c.source !== c.target) {
        setEdges((eds) => addEdge({ ...c, animated: true }, eds));
        createEdge.mutate({ source: c.source, target: c.target });
      }
    },
    [createEdge, setEdges],
  );

  const onNodeDragStop = React.useCallback(
    (_e: MouseEvent | TouchEvent, node: Node) => {
      updateNote.mutate({ id: node.id, x: Math.round(node.position.x), y: Math.round(node.position.y) });
    },
    [updateNote],
  );

  const onNodesDelete = React.useCallback(
    (deleted: Node[]) => deleted.forEach((n) => deleteNote.mutate({ id: n.id })),
    [deleteNote],
  );

  const onEdgesDelete = React.useCallback(
    (deleted: Edge[]) => deleted.forEach((e) => deleteEdge.mutate({ id: e.id })),
    [deleteEdge],
  );

  const onNodeDoubleClick = React.useCallback(
    (_e: React.MouseEvent, node: Node) => {
      const note = notesQ.data?.find((n) => n.id === node.id);
      if (note) {
        setEditing(note);
        setDialogOpen(true);
      }
    },
    [notesQ.data],
  );

  function addNote() {
    createNote.mutate({ text: 'Nova ideia', color: 'accent', x: 120, y: 120 });
  }

  return (
    <>
      <TopBar
        title={`Brainstorm — ${activeProject?.name ?? 'Projeto'}`}
        subtitle="Mapa mental · arraste dos pontos para conectar ideias"
        icon={<Sparkles size={20} />}
        iconTone="warning"
        actions={<Button variant="secondary" onClick={addNote} disabled={createNote.isPending}><Plus size={14} className="mr-1" /> Nota</Button>}
      />
      <div className="flex-1 min-h-0">
        {notesQ.isLoading ? (
          <ScreenLoading />
        ) : notesQ.isError ? (
          <ScreenError />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            colorMode="dark"
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        )}
      </div>
      <BrainstormDialog open={dialogOpen} onOpenChange={setDialogOpen} projectId={projectId} note={editing} />
    </>
  );
}
