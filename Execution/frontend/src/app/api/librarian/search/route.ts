import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ============================================================================
// API Route: /api/librarian/search
// ============================================================================
// Purpose: Semantic search using vector similarity
// Auth: Requires active Supabase session
// Returns: LibrarianResult[] with event metadata
// ============================================================================

interface LibrarianResult {
  eventDate: string;
  symptom: string;
  fix: string;
  orpImprovement: number;
  confidence: number;
}

// ============================================================================
// SINGLETON PATTERN: OpenAI Client
// ============================================================================
let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// ============================================================================
// SINGLETON PATTERN: Supabase Client
// ============================================================================
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. Session Authentication
    // ========================================================================
    const supabase = getSupabaseClient();

    // Get session from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing session token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      );
    }

    // ========================================================================
    // 2. Parse Request Body
    // ========================================================================
    const body = await request.json();
    const { query, match_threshold = 0.5, match_count = 10 } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid "query" field' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. Generate Query Embedding
    // ========================================================================
    const openai = getOpenAIClient();

    let queryEmbedding: number[];
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query.trim(),
      });

      queryEmbedding = response.data[0].embedding;

      if (!queryEmbedding || queryEmbedding.length !== 1536) {
        throw new Error('Invalid embedding dimension');
      }
    } catch (openaiError: any) {
      console.error('[Librarian Search] OpenAI API error:', openaiError);
      return NextResponse.json(
        {
          error: 'Failed to generate query embedding',
          details: openaiError.message || 'Unknown OpenAI error',
        },
        { status: 500 }
      );
    }

    // ========================================================================
    // 4. Call Supabase RPC for Vector Search (WITH SESSION JOIN)
    // ========================================================================
    const { data: matches, error: rpcError } = await supabase.rpc(
      'match_setup_embeddings' as any,
      {
        query_embedding: queryEmbedding,
        match_threshold,
        match_count,
      } as any
    ) as any;

    if (rpcError) {
      console.error('[Librarian Search] RPC error:', rpcError);
      return NextResponse.json(
        { error: 'Vector search failed', details: rpcError.message },
        { status: 500 }
      );
    }

    // Handle empty results
    if (!matches || (Array.isArray(matches) && matches.length === 0)) {
      return NextResponse.json(
        { results: [], message: 'No matching results found' },
        { status: 200 }
      );
    }

    // ========================================================================
    // 5. Transform to LibrarianResult Format
    // ========================================================================
    // Note: event_name and session_created_at now come from the RPC JOIN
    const results: LibrarianResult[] = (matches as any[]).map((match: any) => {
      // Parse content (expecting JSON format: {symptom, fix, orpImprovement})
      let parsedContent: any = {};
      try {
        parsedContent = JSON.parse(match.content);
      } catch {
        // If content is not JSON, treat it as plain text symptom
        parsedContent = {
          symptom: match.content,
          fix: 'See session details',
          orpImprovement: 0,
        };
      }

      return {
        eventDate: match.session_created_at
          ? new Date(match.session_created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
          : 'Unknown',
        symptom: parsedContent.symptom || 'No symptom recorded',
        fix: parsedContent.fix || 'No fix recorded',
        orpImprovement: parsedContent.orpImprovement || 0,
        confidence: match.similarity || 0,
      };
    });

    // ========================================================================
    // 6. Success Response
    // ========================================================================
    return NextResponse.json(
      {
        success: true,
        results,
        count: results.length,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[Librarian Search] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
