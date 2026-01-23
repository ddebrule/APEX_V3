import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ============================================================================
// API Route: /api/vectorize
// ============================================================================
// Purpose: Generate embeddings for setup content and store in Supabase
// Auth: Requires active Supabase session
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { text, session_id } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "text" field' },
        { status: 400 }
      );
    }

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "session_id" field' },
        { status: 400 }
      );
    }

    // Validate text length (text-embedding-3-small supports up to ~8k tokens)
    const maxChars = 32000; // Conservative estimate (~8k tokens)
    if (text.length > maxChars) {
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${maxChars} characters` },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. Deduplication Check
    // ========================================================================
    const { data: existingEmbeddings, error: checkError } = await supabase
      .from('setup_embeddings')
      .select('id')
      .eq('session_id', session_id)
      .eq('content', text)
      .limit(1);

    if (checkError) {
      console.error('[Vectorize] Deduplication check failed:', checkError);
      return NextResponse.json(
        { error: 'Database error during deduplication check' },
        { status: 500 }
      );
    }

    if (existingEmbeddings && existingEmbeddings.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Embedding already exists (deduplicated)',
          id: existingEmbeddings[0].id,
        },
        { status: 200 }
      );
    }

    // ========================================================================
    // 4. Generate OpenAI Embedding
    // ========================================================================
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    let embedding: number[];
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      embedding = response.data[0].embedding;

      if (!embedding || embedding.length !== 1536) {
        throw new Error('Invalid embedding dimension');
      }
    } catch (openaiError: any) {
      console.error('[Vectorize] OpenAI API error:', openaiError);
      return NextResponse.json(
        {
          error: 'Failed to generate embedding',
          details: openaiError.message || 'Unknown OpenAI error',
        },
        { status: 500 }
      );
    }

    // ========================================================================
    // 5. Store in Supabase
    // ========================================================================
    const { data: insertedData, error: insertError } = await supabase
      .from('setup_embeddings')
      .insert({
        session_id,
        content: text,
        embedding,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Vectorize] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store embedding', details: insertError.message },
        { status: 500 }
      );
    }

    // ========================================================================
    // 6. Success Response
    // ========================================================================
    return NextResponse.json(
      {
        success: true,
        message: 'Embedding generated and stored successfully',
        id: insertedData.id,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[Vectorize] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
