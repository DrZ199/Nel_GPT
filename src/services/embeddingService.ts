const HF_API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction';
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const EMBEDDING_MODEL = import.meta.env.VITE_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
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

  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error('Failed to generate text embedding');
  }
}

// Batch generate embeddings for multiple texts
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
  try {
    const cleanTexts = texts.map(preprocessMedicalText);
    
    const response = await fetch(`${HF_API_URL}/${EMBEDDING_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: cleanTexts,
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

    const embeddings = await response.json();
    
    if (!Array.isArray(embeddings)) {
      throw new Error('Invalid batch embedding response format');
    }

    return embeddings.map((embedding, index) => {
      const flatEmbedding = Array.isArray(embedding[0]) ? embedding[0] : embedding;
      
      return {
        embedding: flatEmbedding,
        model: EMBEDDING_MODEL,
        tokens: estimateTokenCount(cleanTexts[index])
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