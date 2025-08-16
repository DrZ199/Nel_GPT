import { generateEmbedding } from './embeddingService';
import { generateMedicalResponse, streamMedicalResponse, validateMedicalQuery, MistralMessage } from './mistralService';
import { searchSimilarDocuments, saveChatMessage, NelsonDocument, testDatabaseConnection, searchNelsonChunks } from '@/lib/supabase';

export interface RAGResponse {
  content: string;
  confidence: 'high' | 'medium' | 'low';
  citations: Array<{
    chapter: string;
    section: string;
    page?: string;
    edition: string;
  }>;
  retrievedDocuments: NelsonDocument[];
  processingTime: number;
}

export interface RAGConfig {
  maxDocuments: number;
  similarityThreshold: number;
  includeMetadata: boolean;
  temperature: number;
}

const DEFAULT_CONFIG: RAGConfig = {
  maxDocuments: 5,
  similarityThreshold: 0.7,
  includeMetadata: true,
  temperature: 0.1
};

// Main RAG pipeline for Nelson-GPT
export async function processNelsonQuery(
  query: string,
  sessionId?: string,
  conversationHistory: MistralMessage[] = [],
  config: Partial<RAGConfig> = {}
): Promise<RAGResponse> {
  const startTime = Date.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Step 1: Validate the medical query
    const validation = validateMedicalQuery(query);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    // Step 2: Test database connection first
    console.log('Testing database connection...');
    const dbTest = await testDatabaseConnection();
    if (!dbTest.connected) {
      throw new Error('Database connection failed. Please check your Supabase configuration.');
    }
    console.log(`Connected to database. Found ${dbTest.nelsonChunksCount} Nelson textbook chunks.`);

    // Step 3: Generate embedding for the user query
    console.log('Generating query embedding...');
    const { embedding: queryEmbedding } = await generateEmbedding(query);
    console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);

    // Step 4: Retrieve similar documents from Nelson Textbook
    console.log('Searching similar documents...');
    const retrievedDocuments = await searchSimilarDocuments(
      queryEmbedding,
      finalConfig.similarityThreshold,
      finalConfig.maxDocuments
    );

    if (retrievedDocuments.length === 0) {
      console.warn('No relevant documents found for query:', query);
      
      // Fallback: try text search
      console.log('Attempting fallback text search...');
      try {
        const textSearchResults = await searchNelsonChunks(query, 3);
        if (textSearchResults.length > 0) {
          console.log(`Found ${textSearchResults.length} results via text search`);
          // Convert to NelsonDocument format
          const fallbackDocs: NelsonDocument[] = textSearchResults.map(chunk => ({
            id: chunk.id,
            chapter: chunk.chapter_title,
            section: chunk.section_title || 'General',
            content: chunk.content,
            page_number: chunk.page_number || undefined,
            edition: '22nd Edition',
            keywords: [],
            embedding: [],
            created_at: chunk.created_at,
            updated_at: chunk.created_at,
          }));
          
          // Continue with text search results
          const fallbackResponse = await generateMedicalResponse(query, fallbackDocs, conversationHistory);
          
          return {
            content: fallbackResponse.content + '\n\n*Note: This response is based on text search due to limited vector similarity.*',
            confidence: 'medium',
            citations: fallbackResponse.citations,
            retrievedDocuments: fallbackDocs,
            processingTime: Date.now() - startTime
          };
        }
      } catch (textSearchError) {
        console.error('Text search fallback failed:', textSearchError);
      }
      
      return {
        content: `I apologize, but I couldn't find relevant information in the Nelson Textbook of Pediatrics for your query: "${query}". 

This could be because:
- The topic may not be covered in the available Nelson Textbook content
- The query might need to be rephrased using more specific medical terminology
- The similarity threshold may be too restrictive

Please try rephrasing your question with more specific pediatric medical terms, or ask about a different aspect of the topic.`,
        confidence: 'low',
        citations: [],
        retrievedDocuments: [],
        processingTime: Date.now() - startTime
      };
    }

    console.log(`Found ${retrievedDocuments.length} relevant documents`);

    // Step 4: Generate response using Mistral API
    console.log('Generating medical response...');
    const response = await generateMedicalResponse(query, retrievedDocuments, conversationHistory);

    // Step 5: Save to chat history if session provided
    if (sessionId) {
      try {
        await saveChatMessage(sessionId, 'user', query);
        
        // Convert response citations to database citation format
        const dbCitations = response.citations.map((citation, index) => ({
          document_id: retrievedDocuments[index]?.id || `doc_${index}`,
          chapter: citation.chapter,
          section: citation.section,
          page_number: citation.page ? parseInt(citation.page) : undefined,
          edition: citation.edition,
          relevance_score: 0.8 // Default relevance score
        }));
        
        await saveChatMessage(
          sessionId,
          'assistant',
          response.content,
          dbCitations,
          response.confidence,
          {
            retrievedDocumentsCount: retrievedDocuments.length,
            processingTime: Date.now() - startTime,
            model: 'mistral-large-latest',
            embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2'
          }
        );
      } catch (saveError) {
        console.error('Failed to save chat messages:', saveError);
        // Continue without failing the entire request
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`RAG pipeline completed in ${processingTime}ms`);

    return {
      content: response.content,
      confidence: response.confidence,
      citations: response.citations,
      retrievedDocuments,
      processingTime
    };

  } catch (error) {
    console.error('RAG pipeline error:', error);
    const processingTime = Date.now() - startTime;
    
    // Return helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      content: `I encountered an error while processing your query: ${errorMessage}

Please try:
- Rephrasing your question with different medical terminology
- Breaking down complex questions into simpler parts
- Checking your internet connection

If the problem persists, please contact technical support.`,
      confidence: 'low',
      citations: [],
      retrievedDocuments: [],
      processingTime
    };
  }
}

// Streaming version of the RAG pipeline
export async function* streamNelsonQuery(
  query: string,
  sessionId?: string,
  conversationHistory: MistralMessage[] = [],
  config: Partial<RAGConfig> = {}
): AsyncGenerator<string, RAGResponse, unknown> {
  const startTime = Date.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let fullContent = '';

  try {
    // Step 1: Validate the medical query
    const validation = validateMedicalQuery(query);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    // Step 2: Test database connection
    yield '🔍 Connecting to Nelson Textbook database...';
    const dbTest = await testDatabaseConnection();
    if (!dbTest.connected) {
      throw new Error('Database connection failed. Please check your Supabase configuration.');
    }
    console.log(`Connected to database. Found ${dbTest.nelsonChunksCount} Nelson textbook chunks.`);

    // Step 3: Generate embedding for the user query
    yield '🧠 Analyzing your medical query...';
    const { embedding: queryEmbedding } = await generateEmbedding(query);

    // Step 4: Retrieve similar documents from Nelson Textbook
    yield '📚 Searching Nelson Textbook of Pediatrics...';
    const retrievedDocuments = await searchSimilarDocuments(
      queryEmbedding,
      finalConfig.similarityThreshold,
      finalConfig.maxDocuments
    );

    if (retrievedDocuments.length === 0) {
      const errorMessage = `I apologize, but I couldn't find relevant information in the Nelson Textbook of Pediatrics for your query: "${query}".

This could be because:
- The topic may not be covered in the available Nelson Textbook content
- The query might need to be rephrased using more specific medical terminology
- The similarity threshold may be too restrictive

Please try rephrasing your question with more specific pediatric medical terms, or ask about a different aspect of the topic.`;
      
      yield errorMessage;
      
      return {
        content: errorMessage,
        confidence: 'low',
        citations: [],
        retrievedDocuments: [],
        processingTime: Date.now() - startTime
      };
    }

    yield `🎯 Found ${retrievedDocuments.length} relevant medical references. Generating evidence-based response...`;

    // Step 4: Stream the response from Mistral
    const responseGenerator = streamMedicalResponse(query, retrievedDocuments, conversationHistory);
    
    let finalResponse: any = null;
    
    for await (const chunk of responseGenerator) {
      if (typeof chunk === 'string') {
        fullContent += chunk;
        yield chunk;
      } else {
        finalResponse = chunk;
        break;
      }
    }

    // Step 5: Save to chat history if session provided
    if (sessionId && finalResponse) {
      try {
        await saveChatMessage(sessionId, 'user', query);
        
        // Convert response citations to database citation format
        const dbCitations = finalResponse.citations.map((citation, index) => ({
          document_id: retrievedDocuments[index]?.id || `doc_${index}`,
          chapter: citation.chapter,
          section: citation.section,
          page_number: citation.page ? parseInt(citation.page) : undefined,
          edition: citation.edition,
          relevance_score: 0.8 // Default relevance score
        }));
        
        await saveChatMessage(
          sessionId,
          'assistant',
          finalResponse.content,
          dbCitations,
          finalResponse.confidence,
          {
            retrievedDocumentsCount: retrievedDocuments.length,
            processingTime: Date.now() - startTime,
            model: 'mistral-large-latest',
            embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2'
          }
        );
      } catch (saveError) {
        console.error('Failed to save chat messages:', saveError);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      content: finalResponse?.content || fullContent,
      confidence: finalResponse?.confidence || 'medium',
      citations: finalResponse?.citations || [],
      retrievedDocuments,
      processingTime
    };

  } catch (error) {
    console.error('Streaming RAG pipeline error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const finalErrorMessage = `I encountered an error while processing your query: ${errorMessage}

Please try:
- Rephrasing your question with different medical terminology
- Breaking down complex questions into simpler parts
- Checking your internet connection

If the problem persists, please contact technical support.`;

    yield finalErrorMessage;

    return {
      content: finalErrorMessage,
      confidence: 'low',
      citations: [],
      retrievedDocuments: [],
      processingTime: Date.now() - startTime
    };
  }
}

// Enhanced medical query preprocessing
export function preprocessMedicalQuery(query: string): string {
  return query
    // Normalize medical abbreviations
    .replace(/\b(mg|kg|ml|cm|mm|mcg|IU|mEq)\b/gi, (match) => match.toLowerCase())
    // Expand common abbreviations for better search
    .replace(/\bUTI\b/gi, 'urinary tract infection')
    .replace(/\bURI\b/gi, 'upper respiratory infection')
    .replace(/\bRSV\b/gi, 'respiratory syncytial virus')
    .replace(/\bADHD\b/gi, 'attention deficit hyperactivity disorder')
    .replace(/\bGERD\b/gi, 'gastroesophageal reflux disease')
    .replace(/\bCHD\b/gi, 'congenital heart disease')
    // Clean up formatting
    .replace(/\s+/g, ' ')
    .trim();
}

// Get conversation context for follow-up questions
export function buildConversationContext(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxMessages: number = 6
): MistralMessage[] {
  return messages
    .slice(-maxMessages) // Keep only recent messages
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));
}

// Analyze query complexity and adjust retrieval parameters
export function analyzeQueryComplexity(query: string): {
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedDocumentCount: number;
  suggestedThreshold: number;
} {
  const wordCount = query.split(/\s+/).length;
  const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
  const hasMedicalTerms = /\b(diagnosis|treatment|management|protocol|dosing|contraindication|side effect|adverse|complication)\b/i.test(query);
  
  if (wordCount > 20 || hasMultipleQuestions || query.includes('compare') || query.includes('difference')) {
    return {
      complexity: 'complex',
      suggestedDocumentCount: 8,
      suggestedThreshold: 0.65
    };
  } else if (wordCount > 10 || hasMedicalTerms) {
    return {
      complexity: 'moderate',
      suggestedDocumentCount: 6,
      suggestedThreshold: 0.7
    };
  } else {
    return {
      complexity: 'simple',
      suggestedDocumentCount: 4,
      suggestedThreshold: 0.75
    };
  }
}

// Medical speciality detection for better retrieval
export function detectMedicalSpecialty(query: string): string[] {
  const specialties: Record<string, string[]> = {
    cardiology: ['heart', 'cardiac', 'cardiovascular', 'arrhythmia', 'murmur', 'congenital heart'],
    neonatology: ['newborn', 'neonate', 'premature', 'NICU', 'birth', 'delivery'],
    infectious_disease: ['infection', 'fever', 'virus', 'bacteria', 'antibiotic', 'vaccine'],
    pulmonology: ['respiratory', 'lung', 'asthma', 'breathing', 'pneumonia', 'cough'],
    gastroenterology: ['stomach', 'intestinal', 'diarrhea', 'vomiting', 'feeding', 'nutrition'],
    neurology: ['seizure', 'brain', 'developmental', 'neurological', 'epilepsy'],
    endocrinology: ['diabetes', 'growth', 'hormone', 'thyroid', 'puberty'],
    emergency: ['emergency', 'urgent', 'resuscitation', 'shock', 'trauma']
  };

  const detected: string[] = [];
  const queryLower = query.toLowerCase();

  for (const [specialty, keywords] of Object.entries(specialties)) {
    if (keywords.some(keyword => queryLower.includes(keyword.toLowerCase()))) {
      detected.push(specialty);
    }
  }

  return detected;
}