-- ============================================================================
-- APEX V3: Vector Search Migration
-- ============================================================================
-- Purpose: Enable semantic search on setup_embeddings using pgvector
-- Dependencies: pgvector extension, setup_embeddings table
-- ============================================================================

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index for fast cosine similarity search
-- HNSW (Hierarchical Navigable Small World) is recommended for production
-- m=16: number of connections per layer (higher = more accurate but slower)
-- ef_construction=64: size of dynamic candidate list (higher = better index quality)
CREATE INDEX IF NOT EXISTS setup_embeddings_embedding_idx
ON setup_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Alternative: IVFFlat index (uncomment if HNSW is not available)
-- CREATE INDEX IF NOT EXISTS setup_embeddings_embedding_idx
-- ON setup_embeddings
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- ============================================================================
-- RPC Function: match_setup_embeddings
-- ============================================================================
-- Purpose: Semantic search using cosine similarity
-- Returns: Setup embeddings ordered by similarity (closest first)
-- ============================================================================

CREATE OR REPLACE FUNCTION match_setup_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    setup_embeddings.id,
    setup_embeddings.session_id,
    setup_embeddings.content,
    setup_embeddings.created_at,
    1 - (setup_embeddings.embedding <=> query_embedding) AS similarity
  FROM setup_embeddings
  WHERE 1 - (setup_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY setup_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- Performance Notes
-- ============================================================================
-- 1. HNSW index provides O(log n) search time vs O(n) for IVFFlat
-- 2. Cosine similarity (<=>) is used: 0 = identical, 2 = opposite
-- 3. Similarity score returned as (1 - distance) for intuitive 0-1 range
-- 4. Default threshold of 0.5 filters out weak matches
-- ============================================================================

-- Grant execute permissions (adjust for your RLS policies)
GRANT EXECUTE ON FUNCTION match_setup_embeddings TO authenticated;
