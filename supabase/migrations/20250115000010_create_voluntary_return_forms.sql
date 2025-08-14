-- Create voluntary_return_forms table
CREATE TABLE IF NOT EXISTS voluntary_return_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name_tr TEXT NOT NULL,
    full_name_ar TEXT NOT NULL,
    kimlik_no TEXT NOT NULL,
    sinir_kapisi TEXT NOT NULL,
    gsm TEXT,
    request_date DATE DEFAULT CURRENT_DATE,
    custom_date DATE,
    refakat_entries JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_voluntary_return_forms_user_id ON voluntary_return_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_voluntary_return_forms_created_at ON voluntary_return_forms(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE voluntary_return_forms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own forms" ON voluntary_return_forms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forms" ON voluntary_return_forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all forms" ON voluntary_return_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@tevasul.group'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_voluntary_return_forms_updated_at 
    BEFORE UPDATE ON voluntary_return_forms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
