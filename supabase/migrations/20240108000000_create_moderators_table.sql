-- Create moderators table
CREATE TABLE IF NOT EXISTS public.moderators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.moderators ENABLE ROW LEVEL SECURITY;

-- Create policies for moderators table
DROP POLICY IF EXISTS "Admins can view all moderators" ON public.moderators;
CREATE POLICY "Admins can view all moderators" ON public.moderators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert moderators" ON public.moderators;
CREATE POLICY "Admins can insert moderators" ON public.moderators
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update moderators" ON public.moderators;
CREATE POLICY "Admins can update moderators" ON public.moderators
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can delete moderators" ON public.moderators;
CREATE POLICY "Admins can delete moderators" ON public.moderators
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_moderators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS on_moderators_updated ON public.moderators;
CREATE TRIGGER on_moderators_updated
    BEFORE UPDATE ON public.moderators
    FOR EACH ROW EXECUTE FUNCTION public.handle_moderators_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS moderators_email_idx ON public.moderators(email);
CREATE INDEX IF NOT EXISTS moderators_user_id_idx ON public.moderators(user_id);
CREATE INDEX IF NOT EXISTS moderators_created_by_idx ON public.moderators(created_by);
CREATE INDEX IF NOT EXISTS moderators_is_active_idx ON public.moderators(is_active);
