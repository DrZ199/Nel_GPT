-- Create the match_nelson_chunks function for vector similarity search
-- This function uses pgvector to find similar embeddings in the nelson_textbook_chunks table

CREATE OR REPLACE FUNCTION match_nelson_chunks(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  chapter_title text,
  section_title text,
  page_number integer,
  chunk_index integer,
  metadata jsonb,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    nelson_textbook_chunks.id,
    nelson_textbook_chunks.content,
    nelson_textbook_chunks.chapter_title,
    nelson_textbook_chunks.section_title,
    nelson_textbook_chunks.page_number,
    nelson_textbook_chunks.chunk_index,
    nelson_textbook_chunks.metadata,
    nelson_textbook_chunks.created_at,
    1 - (nelson_textbook_chunks.embedding <=> query_embedding) AS similarity
  FROM nelson_textbook_chunks
  WHERE nelson_textbook_chunks.embedding IS NOT NULL
    AND 1 - (nelson_textbook_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY nelson_textbook_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create an index on the embedding column for faster similarity search
CREATE INDEX IF NOT EXISTS idx_nelson_embedding_cosine 
ON nelson_textbook_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Alternative index for different distance metrics (optional)
CREATE INDEX IF NOT EXISTS idx_nelson_embedding_l2 
ON nelson_textbook_chunks 
USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

-- Create a function to search by chapter and similarity
CREATE OR REPLACE FUNCTION match_nelson_chunks_by_chapter(
  query_embedding vector(384),
  chapter_filter text,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  chapter_title text,
  section_title text,
  page_number integer,
  chunk_index integer,
  metadata jsonb,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    nelson_textbook_chunks.id,
    nelson_textbook_chunks.content,
    nelson_textbook_chunks.chapter_title,
    nelson_textbook_chunks.section_title,
    nelson_textbook_chunks.page_number,
    nelson_textbook_chunks.chunk_index,
    nelson_textbook_chunks.metadata,
    nelson_textbook_chunks.created_at,
    1 - (nelson_textbook_chunks.embedding <=> query_embedding) AS similarity
  FROM nelson_textbook_chunks
  WHERE nelson_textbook_chunks.embedding IS NOT NULL
    AND nelson_textbook_chunks.chapter_title = chapter_filter
    AND 1 - (nelson_textbook_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY nelson_textbook_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create a hybrid search function that combines text search and vector search
CREATE OR REPLACE FUNCTION hybrid_search_nelson(
  query_text text,
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  chapter_title text,
  section_title text,
  page_number integer,
  chunk_index integer,
  metadata jsonb,
  created_at timestamp with time zone,
  similarity float,
  text_rank float
)
LANGUAGE SQL STABLE
AS $$
  WITH vector_search AS (
    SELECT
      nelson_textbook_chunks.id,
      nelson_textbook_chunks.content,
      nelson_textbook_chunks.chapter_title,
      nelson_textbook_chunks.section_title,
      nelson_textbook_chunks.page_number,
      nelson_textbook_chunks.chunk_index,
      nelson_textbook_chunks.metadata,
      nelson_textbook_chunks.created_at,
      1 - (nelson_textbook_chunks.embedding <=> query_embedding) AS similarity
    FROM nelson_textbook_chunks
    WHERE nelson_textbook_chunks.embedding IS NOT NULL
      AND 1 - (nelson_textbook_chunks.embedding <=> query_embedding) > match_threshold
  ),
  text_search AS (
    SELECT
      nelson_textbook_chunks.id,
      ts_rank_cd(to_tsvector('english', nelson_textbook_chunks.content), plainto_tsquery('english', query_text)) AS text_rank
    FROM nelson_textbook_chunks
    WHERE to_tsvector('english', nelson_textbook_chunks.content) @@ plainto_tsquery('english', query_text)
  )
  SELECT
    v.id,
    v.content,
    v.chapter_title,
    v.section_title,
    v.page_number,
    v.chunk_index,
    v.metadata,
    v.created_at,
    v.similarity,
    COALESCE(t.text_rank, 0) AS text_rank
  FROM vector_search v
  LEFT JOIN text_search t ON v.id = t.id
  ORDER BY 
    (v.similarity * 0.7 + COALESCE(t.text_rank, 0) * 0.3) DESC
  LIMIT match_count;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION match_nelson_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_nelson_chunks_by_chapter TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search_nelson TO authenticated;

-- Grant execute permissions to anonymous users (for public access)
GRANT EXECUTE ON FUNCTION match_nelson_chunks TO anon;
GRANT EXECUTE ON FUNCTION match_nelson_chunks_by_chapter TO anon;
GRANT EXECUTE ON FUNCTION hybrid_search_nelson TO anon;