-- Create user_facts table to store information about users
CREATE TABLE public.user_facts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fact_category TEXT NOT NULL, -- e.g., 'location', 'interests', 'preferences', 'personal'
  fact_key TEXT NOT NULL, -- e.g., 'city', 'hobby', 'favorite_food'
  fact_value TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 1.0, -- How confident we are about this fact (0-1)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, fact_category, fact_key)
);

-- Enable Row Level Security
ALTER TABLE public.user_facts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own facts" 
ON public.user_facts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own facts" 
ON public.user_facts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facts" 
ON public.user_facts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facts" 
ON public.user_facts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_facts_updated_at
BEFORE UPDATE ON public.user_facts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();