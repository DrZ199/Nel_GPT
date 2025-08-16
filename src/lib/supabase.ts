import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Database types for Nelson Textbook content (matching actual schema)
export interface NelsonTextbookChunk {
  id: string;
  content: string;
  chapter_title: string;
  section_title: string | null;
  page_number: number | null;
  chunk_index: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
  embedding: number[] | null;
}

// For compatibility with existing code
export interface NelsonDocument {
  id: string;
  chapter: string;
  section: string;
  subsection?: string;
  content: string;
  page_number?: number;
  edition: string;
  keywords: string[];
  embedding: number[];
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence?: 'high' | 'medium' | 'low';
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Citation {
  document_id: string;
  chapter: string;
  section: string;
  page_number?: number;
  edition: string;
  relevance_score: number;
}

// Convert NelsonTextbookChunk to NelsonDocument for compatibility
function convertChunkToDocument(chunk: NelsonTextbookChunk): NelsonDocument {
  return {
    id: chunk.id,
    chapter: chunk.chapter_title,
    section: chunk.section_title || 'General',
    subsection: undefined,
    content: chunk.content,
    page_number: chunk.page_number || undefined,
    edition: '22nd Edition', // Default to 22nd edition
    keywords: [], // Could extract from metadata if available
    embedding: chunk.embedding || [],
    created_at: chunk.created_at,
    updated_at: chunk.created_at,
  };
}

// Vector search function using pgvector similarity
export async function searchSimilarDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<NelsonDocument[]> {
  try {
    // Use the match_nelson_chunks RPC function for vector similarity search
    const { data, error } = await supabase.rpc('match_nelson_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });

    if (error) {
      console.error('Error in vector search:', error);
      throw error;
    }

    if (!data) {
      console.warn('No data returned from vector search');
      return [];
    }

    // Convert chunks to documents
    return data.map((chunk: any) => convertChunkToDocument({
      id: chunk.id,
      content: chunk.content,
      chapter_title: chunk.chapter_title,
      section_title: chunk.section_title,
      page_number: chunk.page_number,
      chunk_index: chunk.chunk_index,
      metadata: chunk.metadata,
      created_at: chunk.created_at,
      embedding: null // Don't return embeddings in results
    }));

  } catch (error) {
    console.error('Vector search error:', error);
    throw new Error('Failed to search medical literature');
  }
}

// Create a new chat session
export async function createChatSession(title: string): Promise<ChatSession> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([
        {
          title,
          message_count: 0,
          last_message_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Create session error:', error);
    throw new Error('Failed to create chat session');
  }
}

// Save chat message
export async function saveChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  citations?: Citation[],
  confidence?: 'high' | 'medium' | 'low',
  metadata?: Record<string, any>
): Promise<ChatMessage> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          session_id: sessionId,
          role,
          content,
          citations,
          confidence,
          metadata
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }

    // Update session message count and last message time
    await supabase
      .from('chat_sessions')
      .update({
        message_count: await getMessageCount(sessionId) + 1,
        last_message_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return data;
  } catch (error) {
    console.error('Save message error:', error);
    throw new Error('Failed to save chat message');
  }
}

// Get message count for a session
async function getMessageCount(sessionId: string): Promise<number> {
  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);
  
  return count || 0;
}

// Get chat sessions for user
export async function getChatSessions(limit: number = 10): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching chat sessions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Fetch sessions error:', error);
    throw new Error('Failed to fetch chat sessions');
  }
}

// Get messages for a chat session
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Fetch messages error:', error);
    throw new Error('Failed to fetch chat messages');
  }
}

// Search Nelson textbook chunks directly
export async function searchNelsonChunks(
  queryText: string,
  limit: number = 10
): Promise<NelsonTextbookChunk[]> {
  try {
    const { data, error } = await supabase
      .from('nelson_textbook_chunks')
      .select('*')
      .textSearch('content', queryText)
      .limit(limit);

    if (error) {
      console.error('Error searching Nelson chunks:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Nelson chunks search error:', error);
    throw new Error('Failed to search Nelson textbook');
  }
}

// Get Nelson chunks by chapter
export async function getNelsonChunksByChapter(
  chapterTitle: string,
  limit: number = 20
): Promise<NelsonTextbookChunk[]> {
  try {
    const { data, error } = await supabase
      .from('nelson_textbook_chunks')
      .select('*')
      .eq('chapter_title', chapterTitle)
      .order('chunk_index', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching Nelson chunks by chapter:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Nelson chunks by chapter error:', error);
    throw new Error('Failed to fetch Nelson textbook chapters');
  }
}

// Get all unique chapters
export async function getNelsonChapters(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('nelson_textbook_chunks')
      .select('chapter_title')
      .not('chapter_title', 'is', null);

    if (error) {
      console.error('Error fetching Nelson chapters:', error);
      throw error;
    }

    // Get unique chapter titles
    const uniqueChapters = [...new Set(data?.map(item => item.chapter_title) || [])];
    return uniqueChapters.sort();
  } catch (error) {
    console.error('Nelson chapters error:', error);
    throw new Error('Failed to fetch Nelson textbook chapters');
  }
}

// Get drug dosage information (if you have a separate table for this)
export async function searchDrugDosage(
  drugName: string,
  ageGroup?: string
): Promise<any[]> {
  try {
    let query = supabase
      .from('pediatric_drug_dosage') // Adjust table name as needed
      .select('*')
      .ilike('drug_name', `%${drugName}%`);

    if (ageGroup) {
      query = query.ilike('age_group', `%${ageGroup}%`);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      console.error('Error searching drug dosage:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Drug dosage search error:', error);
    throw new Error('Failed to search drug dosage information');
  }
}

// Test database connection and pgvector
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  nelsonChunksCount: number;
  sampleChapter?: string;
}> {
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('nelson_textbook_chunks')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Database connection test failed:', testError);
      return { connected: false, nelsonChunksCount: 0 };
    }

    // Get total count of chunks
    const { count, error: countError } = await supabase
      .from('nelson_textbook_chunks')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count query failed:', countError);
      return { connected: true, nelsonChunksCount: 0 };
    }

    // Get a sample chapter
    const { data: sampleData, error: sampleError } = await supabase
      .from('nelson_textbook_chunks')
      .select('chapter_title')
      .limit(1);

    const sampleChapter = sampleData?.[0]?.chapter_title;

    return {
      connected: true,
      nelsonChunksCount: count || 0,
      sampleChapter
    };
  } catch (error) {
    console.error('Database test error:', error);
    return { connected: false, nelsonChunksCount: 0 };
  }
}