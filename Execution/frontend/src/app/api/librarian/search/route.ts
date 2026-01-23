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

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. Session Authentication
    // ========================================================================
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client (lazy initialization)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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
    // 4. Call Supabase RPC for Vector Search
    // ========================================================================
    const { data: matches, error: rpcError } = await supabase.rpc(
      'match_setup_embeddings',
      {
        query_embedding: queryEmbedding,
        match_threshold,
        match_count,
      }
    );

    if (rpcError) {
      console.error('[Librarian Search] RPC error:', rpcError);
      return NextResponse.json(
        { error: 'Vector search failed', details: rpcError.message },
        { status: 500 }
      );
    }

    // Handle empty results
    if (!matches || matches.length === 0) {
      return NextResponse.json(
        { results: [], message: 'No matching results found' },
        { status: 200 }
      );
    }

    // ========================================================================
    // 5. Enrich Results with Session Metadata
    // ========================================================================
    const sessionIds = matches.map((m: any) => m.session_id);
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('id, event_name, created_at')
      .in('id', sessionIds);

    if (sessionError) {
      console.error('[Librarian Search] Session fetch error:', sessionError);
      // Continue with partial data instead of failing completely
    }

    // Create a lookup map for sessions
    const sessionMap = new Map(
      sessions?.map((s: any) => [s.id, s]) || []
    );

    // ========================================================================
    // 6. Transform to LibrarianResult Format
    // ========================================================================
    const results: LibrarianResult[] = matches.map((match: any) => {
      const session = sessionMap.get(match.session_id);

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
        eventDate: session?.created_at
          ? new Date(session.created_at).toLocaleDateString('en-US', {
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
    // 7. Success Response
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
