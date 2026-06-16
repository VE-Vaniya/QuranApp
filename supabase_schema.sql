-- Database schema for QuranChat MVP
-- Create this schema in your Supabase SQL Editor.

-- Enable Row Level Security (RLS) on all tables.

----------------------------------------------------
-- 1. PROFILES TABLE
----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    streak INTEGER DEFAULT 1,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Allow public read access to profiles" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);


----------------------------------------------------
-- 2. DUA REQUESTS TABLE
----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dua_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    display_name TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    pray_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dua_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for dua requests
CREATE POLICY "Allow public read access to dua_requests" 
    ON public.dua_requests FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to create dua requests" 
    ON public.dua_requests FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own dua requests" 
    ON public.dua_requests FOR DELETE 
    USING (auth.uid() = user_id);


----------------------------------------------------
-- 3. DUA PRAYERS TABLE (support interactions)
----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dua_prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dua_id UUID REFERENCES public.dua_requests ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dua_id, user_id)
);

-- Enable RLS
ALTER TABLE public.dua_prayers ENABLE ROW LEVEL SECURITY;

-- Create policies for dua prayers
CREATE POLICY "Allow public read access to dua_prayers" 
    ON public.dua_prayers FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to toggle prayers" 
    ON public.dua_prayers FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Allow users to remove their prayers" 
    ON public.dua_prayers FOR DELETE 
    USING (auth.uid() = user_id);


----------------------------------------------------
-- 4. USER NOTES TABLE
----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    surah_number INTEGER NOT NULL,
    ayah_number INTEGER NOT NULL,
    note_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, surah_number, ayah_number)
);

-- Enable RLS
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for user notes
CREATE POLICY "Allow users to view their own notes" 
    ON public.user_notes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create their own notes" 
    ON public.user_notes FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Allow users to update their own notes" 
    ON public.user_notes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own notes" 
    ON public.user_notes FOR DELETE 
    USING (auth.uid() = user_id);


----------------------------------------------------
-- 5. AUTOMATIC TRIGGER FOR CREATING PROFILE
----------------------------------------------------
-- This trigger automatically inserts a profile row when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, streak, last_active_at)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        1,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


----------------------------------------------------
-- 6. PRAY COUNT INCREMENT / DECREMENT TRIGGERS
----------------------------------------------------
-- Increment/Decrement the pray_count in dua_requests when someone supports
CREATE OR REPLACE FUNCTION public.handle_dua_prayer_inserted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.dua_requests
    SET pray_count = pray_count + 1
    WHERE id = NEW.dua_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_dua_prayer_inserted
    AFTER INSERT ON public.dua_prayers
    FOR EACH ROW EXECUTE FUNCTION public.handle_dua_prayer_inserted();

CREATE OR REPLACE FUNCTION public.handle_dua_prayer_deleted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.dua_requests
    SET pray_count = GREATEST(0, pray_count - 1)
    WHERE id = OLD.dua_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_dua_prayer_deleted
    AFTER DELETE ON public.dua_prayers
    FOR EACH ROW EXECUTE FUNCTION public.handle_dua_prayer_deleted();
