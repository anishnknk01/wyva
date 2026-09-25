-- Add photos column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS photos text[];

-- Create storage bucket for task photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-photos', 'task-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for task photos
CREATE POLICY "Allow authenticated users to upload task photos" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'task-photos');

CREATE POLICY "Allow public read access to task photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'task-photos');

CREATE POLICY "Allow task owners to delete their photos" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated' 
    AND bucket_id = 'task-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id FROM tasks WHERE customer_id = auth.uid()
    )
  );

-- Update the database types to include photos column
-- This will need to be regenerated with: npx supabase gen types typescript --project-id [your-project-id] > src/lib/supabase/database.types.ts