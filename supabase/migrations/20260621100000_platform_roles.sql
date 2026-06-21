-- Create platform_roles table
CREATE TABLE IF NOT EXISTS public.platform_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discord_user_id TEXT NOT NULL UNIQUE,
    role_type TEXT NOT NULL CHECK (role_type IN ('OWNER', 'ADMIN', 'STAFF')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up RLS
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read platform roles
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.platform_roles FOR SELECT 
USING ( true );

-- Service role can do everything
CREATE POLICY "Service role can manage platform roles." 
ON public.platform_roles FOR ALL 
USING ( true ) WITH CHECK ( true );
