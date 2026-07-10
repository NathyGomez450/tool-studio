-- ============================================================
-- Migration v2: Colunas faltantes + display_id + RLS team
-- Execute no Supabase SQL Editor APÓS o schema inicial.
-- ============================================================

-- 1. display_id para IDs amigáveis
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS display_id text;
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS display_id text;

-- 2. Colunas faltantes em tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_names text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;

-- 3. Colunas faltantes em gdd_sections
ALTER TABLE public.gdd_sections ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.gdd_sections ADD COLUMN IF NOT EXISTS key text;

-- 4. Colunas faltantes em roadmap_items
ALTER TABLE public.roadmap_items ADD COLUMN IF NOT EXISTS quarter text;

-- 5. Colunas faltantes em brainstorm_notes
ALTER TABLE public.brainstorm_notes ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT 'accent';
ALTER TABLE public.brainstorm_notes ADD COLUMN IF NOT EXISTS x integer NOT NULL DEFAULT 0;
ALTER TABLE public.brainstorm_notes ADD COLUMN IF NOT EXISTS y integer NOT NULL DEFAULT 0;

-- 6. Colunas faltantes em assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS uploaded_by text;

-- 7. Sequences para display_id
CREATE SEQUENCE IF NOT EXISTS public.task_display_seq START WITH 200;
CREATE SEQUENCE IF NOT EXISTS public.bug_display_seq START WITH 2240;

-- 8. Trigger functions para auto-gerar display_id
CREATE OR REPLACE FUNCTION public.generate_task_display_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := 'TASK-' || nextval('public.task_display_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_bug_display_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := 'BUG-' || nextval('public.bug_display_seq');
  END IF;
  RETURN NEW;
END;
$$;

-- 9. Triggers
DROP TRIGGER IF EXISTS tasks_display_id_trigger ON public.tasks;
CREATE TRIGGER tasks_display_id_trigger
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_task_display_id();

DROP TRIGGER IF EXISTS bugs_display_id_trigger ON public.bugs;
CREATE TRIGGER bugs_display_id_trigger
  BEFORE INSERT ON public.bugs
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_bug_display_id();

-- 10. RLS: permitir que membros do projeto vejam profiles de outros membros
CREATE POLICY "members read project member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT pm.user_id
    FROM public.project_members pm
    WHERE public.is_project_member(pm.project_id)
  )
);
