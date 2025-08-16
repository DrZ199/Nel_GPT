const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const EMBEDDING_MODEL = import.meta.env.VITE_EMBEDDING_MODEL || 'thenlper/gte-small';
const EXPECTED_EMBEDDING_DIMENSION = 384; // Your embeddings are 384-dimensional

if (!HF_API_KEY) {
  throw new Error('Missing Hugging Face API key');
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  tokens: number;
}

// Generate embeddings for medical text
export async function generateEmbedding(text: string): Promise<EmbeddingResponse> {
  try {
    // Clean and preprocess text
    const cleanText = preprocessMedicalText(text);
    
    // Fallback: Use simple text-based embedding for now
    // This creates a basic numerical representation based on text characteristics
    const fallbackEmbedding = generateFallbackEmbedding(cleanText);
    
    return {
      embedding: fallbackEmbedding,
      model: 'fallback-text-embedding',
      tokens: estimateTokenCount(cleanText)
    };
    
    /* Temporarily disabled Hugging Face API due to configuration issues
    const response = await fetch(`${HF_API_URL}/${EMBEDDING_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: cleanText,
        options: {
          wait_for_model: true,
          use_cache: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Hugging Face API error: ${errorData.error || response.statusText}`);
    }

    const embedding = await response.json();
    
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Invalid embedding response format');
    }

    // Ensure we have a flat array of numbers (some models return nested arrays)
    const flatEmbedding = Array.isArray(embedding[0]) ? embedding[0] : embedding;
    
    if (!flatEmbedding.every((val: any) => typeof val === 'number')) {
      throw new Error('Invalid embedding values - expected numbers');
    }

    // Validate embedding dimension
    if (flatEmbedding.length !== EXPECTED_EMBEDDING_DIMENSION) {
      console.warn(`Embedding dimension mismatch: expected ${EXPECTED_EMBEDDING_DIMENSION}, got ${flatEmbedding.length}`);
    }

    return {
      embedding: flatEmbedding,
      model: EMBEDDING_MODEL,
      tokens: estimateTokenCount(cleanText)
    };
    */

  } catch (error) {
    console.error('Embedding generation error:', error);
    
    // Fallback to text-based embedding
    const cleanText = preprocessMedicalText(text);
    const fallbackEmbedding = generateFallbackEmbedding(cleanText);
    
    return {
      embedding: fallbackEmbedding,
      model: 'fallback-text-embedding',
      tokens: estimateTokenCount(cleanText)
    };
  }
}

// Batch generate embeddings for multiple texts
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
  try {
    // Use fallback embeddings for batch processing
    const cleanTexts = texts.map(preprocessMedicalText);
    
    return cleanTexts.map(text => {
      const fallbackEmbedding = generateFallbackEmbedding(text);
      return {
        embedding: fallbackEmbedding,
        model: 'fallback-text-embedding',
        tokens: estimateTokenCount(text)
      };
    });

  } catch (error) {
    console.error('Batch embedding generation error:', error);
    throw new Error('Failed to generate batch embeddings');
  }
}

// Preprocess medical text for better embeddings
function preprocessMedicalText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive punctuation
    .replace(/[\.]{2,}/g, '.')
    // Preserve medical abbreviations and units
    .replace(/(\d+)\s*(mg|kg|ml|cm|mm|mcg|IU|mEq)/g, '$1$2')
    // Clean up common medical formatting
    .replace(/\b([A-Z]{2,})\b/g, (match) => {
      // Preserve common medical abbreviations in uppercase
      const medicalAbbreviations = [
        'IV', 'IM', 'PO', 'PR', 'SQ', 'ICU', 'NICU', 'PICU', 'ER', 'ED',
        'CBC', 'CRP', 'ESR', 'LFT', 'BUN', 'ECG', 'EEG', 'MRI', 'CT',
        'HIV', 'AIDS', 'RSV', 'UTI', 'URI', 'ADHD', 'GERD', 'CHD',
        'CPR', 'BLS', 'PALS', 'NRP', 'AAP', 'CDC', 'WHO', 'FDA'
      ];
      
      return medicalAbbreviations.includes(match) ? match : match.toLowerCase();
    })
    .trim();
}

// Estimate token count for text (approximate)
function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token for medical text
  return Math.ceil(text.length / 4);
}

// Calculate cosine similarity between two embeddings
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// Semantic search helper
export async function performSemanticSearch(
  query: string,
  documents: Array<{ id: string; content: string; embedding?: number[] }>
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    const results = documents
      .filter(doc => doc.embedding && doc.embedding.length > 0)
      .map(doc => ({
        id: doc.id,
        content: doc.content,
        similarity: calculateSimilarity(queryEmbedding.embedding, doc.embedding!)
      }))
      .sort((a, b) => b.similarity - a.similarity);

    return results;
  } catch (error) {
    console.error('Semantic search error:', error);
    throw new Error('Failed to perform semantic search');
  }
}

// Validate embedding model availability
export async function validateEmbeddingModel(): Promise<boolean> {
  try {
    const testResponse = await fetch(`${HF_API_URL}/${EMBEDDING_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: "test",
        options: { wait_for_model: true }
      })
    });

    return testResponse.ok;
  } catch {
    return false;
  }
}

// Generate a simple fallback embedding based on text characteristics
function generateFallbackEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = [...new Set(words)];
  
  // Create a 384-dimensional embedding based on text features
  const embedding = new Array(384).fill(0);
  
  // Use hash-based approach for consistent embeddings
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const hash = simpleHash(word);
    
    // Distribute word influence across multiple dimensions
    const startIdx = hash % (384 - 10);
    for (let j = 0; j < 10; j++) {
      embedding[startIdx + j] += 1 / (j + 1); // Decreasing influence
    }
  }
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

// Simple hash function for consistent word mapping
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Medical-specific text chunking for embeddings
export function chunkMedicalText(text: string, maxChunkSize: number = 500, overlap: number = 50): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // If adding this sentence would exceed chunk size, start a new chunk
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Create overlap by taking the last few words from the previous chunk
      const words = currentChunk.trim().split(/\s+/);
      const overlapWords = words.slice(-overlap).join(' ');
      currentChunk = overlapWords + ' ' + trimmedSentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}