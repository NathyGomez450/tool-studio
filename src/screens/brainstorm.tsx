import * as React from 'react';
import { Sparkles, Plus, Download } from 'lucide-react';
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
  getNodesBounds,
  getViewportForBounds,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useBrainstormNotes, useBrainstormEdges } from '@/queries/hooks';
import {
  useCreateBrainstormNote,
  useUpdateBrainstormNote,
  useDeleteBrainstormNote,
  useCreateBrainstormEdge,
  useDeleteBrainstormEdge,
  useUpdateBrainstormEdge,
} from '@/queries/mutations';
import { BrainstormDialog } from '@/components/dialogs/brainstorm-dialog';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
import { type BrainstormNote } from '@/lib/data';
import { useAuth } from '@/auth/auth-context';

const COLORS = ['accent', 'creative', 'info', 'warning'];
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
type ActionsCtx = { addChild: (id: string) => void; setColor: (id: string, color: string) => void };
const Actions = React.createContext<ActionsCtx>({ addChild: () => {}, setColor: () => {} });

function NoteNode({ id, data }: NodeProps) {
  const d = data as NoteData;
  const actions = React.useContext(Actions);
  return (
    <div
      className="group relative w-[200px] min-h-[76px] rounded-md p-3 text-[13px] text-primary leading-relaxed border shadow-md whitespace-pre-wrap break-words"
      style={{ background: toneBg[d.color] ?? toneBg.accent, borderColor: toneBorder[d.color] ?? toneBorder.accent }}
    >
      <Handle type="source" position={Position.Left} className="!w-2 !h-2 !bg-[var(--accent-400)]" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[var(--accent-400)]" />
      {d.text}

      <button
        type="button"
        className="nodrag absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[var(--accent-500)] text-[var(--text-on-accent)] flex items-center justify-center opacity-0 group-hover:opacity-100 shadow transition-opacity"
        onClick={(e) => { e.stopPropagation(); actions.addChild(id); }}
        title="Adicionar ideia conectada"
      >
        <Plus size={13} />
      </button>

      <div className="nodrag absolute -bottom-2.5 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => { e.stopPropagation(); actions.setColor(id, c); }}
            className="w-3.5 h-3.5 rounded-full border border-white/40 hover:scale-110 transition-transform"
            style={{ background: toneBg[c] }}
            title={`Cor ${c}`}
          />
        ))}
      </div>
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
  const updateEdge = useUpdateBrainstormEdge(projectId);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [editing, setEditing] = React.useState<BrainstormNote | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [edgeDlg, setEdgeDlg] = React.useState<{ id: string; label: string } | null>(null);

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
    setEdges(edgesQ.data.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label, animated: true })));
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

  const onEdgeDoubleClick = React.useCallback(
    (_e: React.MouseEvent, edge: Edge) => setEdgeDlg({ id: edge.id, label: (edge.label as string) ?? '' }),
    [],
  );

  const addChild = React.useCallback(
    async (parentId: string) => {
      const parent = notesQ.data?.find((n) => n.id === parentId);
      const x = (parent?.x ?? 100) + 260;
      const y = (parent?.y ?? 100) + 30;
      const child = await createNote.mutateAsync({ text: 'Nova ideia', color: 'accent', x, y });
      await createEdge.mutateAsync({ source: parentId, target: child.id });
    },
    [notesQ.data, createNote, createEdge],
  );

  const setColor = React.useCallback((id: string, color: string) => updateNote.mutate({ id, color }), [updateNote]);

  const actionsValue = React.useMemo<ActionsCtx>(() => ({ addChild, setColor }), [addChild, setColor]);

  function addNote() {
    createNote.mutate({ text: 'Nova ideia', color: 'accent', x: 120, y: 120 });
  }

  function saveEdgeLabel() {
    if (!edgeDlg) return;
    setEdges((eds) => eds.map((e) => (e.id === edgeDlg.id ? { ...e, label: edgeDlg.label } : e)));
    updateEdge.mutate({ id: edgeDlg.id, label: edgeDlg.label });
    setEdgeDlg(null);
  }

  function exportPng() {
    const vpEl = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!vpEl || nodes.length === 0) return;
    const bounds = getNodesBounds(nodes);
    const w = 1200;
    const h = 800;
    const vp = getViewportForBounds(bounds, w, h, 0.5, 2, 0.15);
    toPng(vpEl, {
      backgroundColor: '#0a0a0a',
      width: w,
      height: h,
      style: { width: `${w}px`, height: `${h}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
    }).then((dataUrl) => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'mapa-mental.png';
      a.click();
    });
  }

  const headerActions = (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={exportPng} title="Exportar como PNG"><Download size={14} className="mr-1" /> PNG</Button>
      <Button variant="secondary" onClick={addNote} disabled={createNote.isPending}><Plus size={14} className="mr-1" /> Nota</Button>
    </div>
  );

  return (
    <>
      <TopBar
        title={`Brainstorm — ${activeProject?.name ?? 'Projeto'}`}
        subtitle="Mapa mental · arraste dos pontos p/ conectar · passe o mouse p/ ramificar e recolorir · duplo-clique na linha p/ rotular"
        icon={<Sparkles size={20} />}
        iconTone="warning"
        actions={headerActions}
      />
      <div className="flex-1 min-h-0">
        {notesQ.isLoading ? (
          <ScreenLoading />
        ) : notesQ.isError ? (
          <ScreenError />
        ) : (
          <Actions.Provider value={actionsValue}>
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
              onEdgeDoubleClick={onEdgeDoubleClick}
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
          </Actions.Provider>
        )}
      </div>

      <BrainstormDialog open={dialogOpen} onOpenChange={setDialogOpen} projectId={projectId} note={editing} />

      <Dialog open={!!edgeDlg} onOpenChange={(o) => !o && setEdgeDlg(null)}>
        {edgeDlg && (
          <DialogContent
            title="Rótulo da conexão"
            footer={
              <>
                <Button variant="secondary" onClick={() => setEdgeDlg(null)}>Cancelar</Button>
                <Button onClick={saveEdgeLabel}>Salvar</Button>
              </>
            }
          >
            <Input
              value={edgeDlg.label}
              onChange={(e) => setEdgeDlg({ ...edgeDlg, label: e.target.value })}
              placeholder="Ex.: leva a, depende de…"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveEdgeLabel();
                }
              }}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
