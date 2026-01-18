-- Migration: Create handling_signals table

CREATE TABLE IF NOT EXISTS public.handling_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.racer_profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.handling_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (MVP - assumes single user or application-level filtering)
CREATE POLICY "Users can view their own signals" ON public.handling_signals
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own signals" ON public.handling_signals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own signals" ON public.handling_signals
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own signals" ON public.handling_signals
    FOR DELETE USING (true);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_handling_signals_profile_id ON public.handling_signals(profile_id);
