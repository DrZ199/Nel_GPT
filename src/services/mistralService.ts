import { NelsonDocument } from '@/lib/supabase';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  throw new Error('Missing Mistral API key');
}

export interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MistralStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }[];
}

export interface GeneratedResponse {
  content: string;
  confidence: 'high' | 'medium' | 'low';
  citations: Array<{
    chapter: string;
    section: string;
    page?: string;
    edition: string;
  }>;
}

// System prompt for Nelson-GPT
const NELSON_SYSTEM_PROMPT = `You are Nelson-GPT, an advanced pediatric medical AI assistant powered exclusively by the Nelson Textbook of Pediatrics (22nd Edition). Your responses must follow this strict chain of thought process:

1. UNDERSTAND → Parse the medical query with precision
2. BASICS → Identify the relevant pediatric domain (cardiology, neonatology, etc.)
3. BREAK DOWN → Decompose into sub-questions (definitions, diagnosis, management, prognosis)
4. ANALYZE → Cross-check retrieved Nelson content for consistency
5. BUILD → Construct evidence-based response with citations
6. EDGE CASES → Consider age groups, comorbidities, contraindications
7. FINAL ANSWER → Present polished, clinically reliable response

CRITICAL REQUIREMENTS:
- Only provide information from the Nelson Textbook context provided
- Always include specific citations (chapter, section, page when available)
- Use professional medical terminology appropriate for healthcare professionals
- Format responses in markdown with clear structure
- If information isn't in the provided context, explicitly state this limitation
- Never speculate or provide information beyond the Nelson Textbook
- Include confidence level assessment based on evidence strength
- Consider pediatric-specific factors (age, weight, development stage)

For each response, provide:
- Clear, evidence-based clinical guidance
- Specific Nelson Textbook citations
- Confidence level (high/medium/low) based on evidence strength
- Relevant warnings or contraindications
- Age-specific considerations when applicable`;

// Generate response using retrieved context
export async function generateMedicalResponse(
  userQuery: string,
  retrievedDocuments: NelsonDocument[],
  conversationHistory: MistralMessage[] = []
): Promise<GeneratedResponse> {
  try {
    // Build context from retrieved documents
    const contextText = retrievedDocuments
      .map(doc => 
        `**Chapter ${doc.chapter} - ${doc.section}**${doc.subsection ? ` - ${doc.subsection}` : ''}\n` +
        `(Edition: ${doc.edition}${doc.page_number ? `, Page: ${doc.page_number}` : ''})\n\n` +
        `${doc.content}\n\n---\n`
      )
      .join('\n');

    const messages: MistralMessage[] = [
      { role: 'system', content: NELSON_SYSTEM_PROMPT },
      ...conversationHistory,
      {
        role: 'user',
        content: `Context from Nelson Textbook of Pediatrics:\n\n${contextText}\n\nUser Query: ${userQuery}\n\nPlease provide a comprehensive, evidence-based response following the chain of thought process.`
      }
    ];

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages,
        temperature: 0.1, // Low temperature for medical accuracy
        max_tokens: parseInt(import.meta.env.VITE_MAX_RESPONSE_TOKENS || '2048'),
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Mistral API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('No response content from Mistral API');
    }

    // Extract citations and determine confidence
    const citations = retrievedDocuments.map(doc => ({
      chapter: doc.chapter,
      section: doc.section,
      page: doc.page_number?.toString(),
      edition: doc.edition
    }));

    // Determine confidence based on retrieved document relevance and content quality
    const confidence = determineConfidence(retrievedDocuments, content);

    return {
      content,
      confidence,
      citations
    };

  } catch (error) {
    console.error('Mistral API error:', error);
    throw new Error('Failed to generate medical response');
  }
}

// Stream response for real-time display
export async function* streamMedicalResponse(
  userQuery: string,
  retrievedDocuments: NelsonDocument[],
  conversationHistory: MistralMessage[] = []
): AsyncGenerator<string, GeneratedResponse, unknown> {
  try {
    const contextText = retrievedDocuments
      .map(doc => 
        `**Chapter ${doc.chapter} - ${doc.section}**${doc.subsection ? ` - ${doc.subsection}` : ''}\n` +
        `(Edition: ${doc.edition}${doc.page_number ? `, Page: ${doc.page_number}` : ''})\n\n` +
        `${doc.content}\n\n---\n`
      )
      .join('\n');

    const messages: MistralMessage[] = [
      { role: 'system', content: NELSON_SYSTEM_PROMPT },
      ...conversationHistory,
      {
        role: 'user',
        content: `Context from Nelson Textbook of Pediatrics:\n\n${contextText}\n\nUser Query: ${userQuery}\n\nPlease provide a comprehensive, evidence-based response following the chain of thought process.`
      }
    ];

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages,
        temperature: 0.1,
        max_tokens: parseInt(import.meta.env.VITE_MAX_RESPONSE_TOKENS || '2048'),
        top_p: 0.9,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '').trim();
          
          if (data === '[DONE]') {
            break;
          }

          try {
            const parsed: MistralStreamResponse = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              fullContent += content;
              yield content;
            }
          } catch (parseError) {
            // Skip malformed JSON chunks
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Return final response with metadata
    const citations = retrievedDocuments.map(doc => ({
      chapter: doc.chapter,
      section: doc.section,
      page: doc.page_number?.toString(),
      edition: doc.edition
    }));

    const confidence = determineConfidence(retrievedDocuments, fullContent);

    return {
      content: fullContent,
      confidence,
      citations
    };

  } catch (error) {
    console.error('Mistral streaming error:', error);
    throw new Error('Failed to stream medical response');
  }
}

// Determine confidence level based on retrieved documents and response quality
function determineConfidence(
  retrievedDocuments: NelsonDocument[],
  responseContent: string
): 'high' | 'medium' | 'low' {
  // High confidence: Multiple relevant documents with clear citations
  if (retrievedDocuments.length >= 3 && responseContent.includes('Nelson Textbook')) {
    return 'high';
  }
  
  // Medium confidence: Some relevant documents
  if (retrievedDocuments.length >= 1 && responseContent.length > 200) {
    return 'medium';
  }
  
  // Low confidence: Limited or unclear information
  return 'low';
}

// Validate medical query for safety
export function validateMedicalQuery(query: string): {
  isValid: boolean;
  reason?: string;
} {
  const query_lower = query.toLowerCase();
  
  // Check for emergency situations
  const emergencyKeywords = ['emergency', 'urgent', 'dying', 'crisis', 'help me', 'overdose'];
  if (emergencyKeywords.some(keyword => query_lower.includes(keyword))) {
    return {
      isValid: false,
      reason: 'This appears to be an emergency situation. Please contact emergency services immediately (911) or seek immediate medical attention.'
    };
  }
  
  // Check for personal medical advice
  const personalKeywords = ['my child', 'my baby', 'should i', 'what should i do'];
  if (personalKeywords.some(keyword => query_lower.includes(keyword))) {
    return {
      isValid: false,
      reason: 'This system is designed for healthcare professional education only and cannot provide personal medical advice. Please consult with a qualified healthcare provider for personal medical concerns.'
    };
  }
  
  return { isValid: true };
}