-- ============================================================================
-- MIGRATION: PASANG UNIQUE CONSTRAINT PADA INDIKATOR_NODE
-- Menjamin setiap parent tidak bisa memiliki dua anak dengan kode yang sama.
-- Menjamin keunikan kode root (SKA) yang parent_id-nya NULL.
-- ============================================================================

-- 1. Constraint untuk node yang memiliki parent (parent_id IS NOT NULL)
ALTER TABLE public.indikator_node
ADD CONSTRAINT uq_indikator_node_parent_kode UNIQUE (parent_id, kode);

-- 2. Index unique khusus untuk root node level SKA (di mana parent_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_indikator_node_root_kode
ON public.indikator_node (kode)
WHERE parent_id IS NULL;

