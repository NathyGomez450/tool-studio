import { supabase } from '@/lib/supabase';

type BrainstormNote = {
  text: string;
  color: string;
  x: number;
  y: number;
};

type DbBrainstorm = {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
};

function dbNoteToNote(n: DbBrainstorm): BrainstormNote {
  return {
    text: n.text,
    color: n.color,
    x: n.x,
    y: n.y,
  };
}

export async function fetchBrainstormNotes(): Promise<BrainstormNote[]> {
  const { data, error } = await supabase
    .from('brainstorm_notes')
    .select('*');

  if (error) throw error;
  return (data ?? []).map(dbNoteToNote);
}
