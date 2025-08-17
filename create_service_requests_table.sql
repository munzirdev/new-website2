-- Create service_requests table for service request submissions
-- Run this in Supabase Dashboard > SQL Editor

-- Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('translation', 'consultation', 'legal', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    file_url TEXT,
    file_name TEXT,
    file_data TEXT, -- For base64 encoded files
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own service requests" ON public.service_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own service requests" ON public.service_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service requests" ON public.service_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin and moderator policies
CREATE POLICY "Admins can view all service requests" ON public.service_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins can update all service requests" ON public.service_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS on_service_requests_updated ON public.service_requests;
CREATE TRIGGER on_service_requests_updated
    BEFORE UPDATE ON public.service_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_service_requests_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS service_requests_user_id_idx ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS service_requests_status_idx ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS service_requests_service_type_idx ON public.service_requests(service_type);
CREATE INDEX IF NOT EXISTS service_requests_created_at_idx ON public.service_requests(created_at);

-- Grant necessary permissions
GRANT ALL ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
