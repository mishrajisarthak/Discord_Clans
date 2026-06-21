-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    command_channel_id TEXT,
    join_request_channel_id TEXT,
    clan_logs_channel_id TEXT,
    event_logs_channel_id TEXT,
    leaderboard_channel_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Public settings are viewable by everyone." 
ON public.platform_settings FOR SELECT 
USING ( true );

-- Service role can do everything
CREATE POLICY "Service role can manage platform settings." 
ON public.platform_settings FOR ALL 
USING ( true ) WITH CHECK ( true );

-- Insert default row
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
