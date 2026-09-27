-- ============================================================
-- DEAD / DO NOT RUN — conflicts with the real ratings table.
--
-- The actual `ratings` table already exists (created in
-- supabase/migrations/0001_init.sql) with columns `ratee_id` + `stars`
-- and is what src/lib/task-store.ts and the app's rating UI actually use.
-- This file defines a DIFFERENT, incompatible shape (`rated_id`, `rating`,
-- `rating_type`) and references columns that don't exist on tasks
-- (`tasks.user_id`, `tasks.wysa_id`). Running this against the real
-- database would either fail (table already exists) or, if somehow
-- applied to a fresh database, leave you with a ratings table the rest
-- of the app cannot read from. Kept here for historical reference only.
-- ============================================================

-- Create ratings table for task completion ratings
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  rating_type VARCHAR(20) NOT NULL CHECK (rating_type IN ('task_completion', 'task_posting')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one rating per task per rater
  UNIQUE(task_id, rater_id, rating_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ratings_task_id ON ratings(task_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating_type ON ratings(rating_type);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);

-- Add rating statistics to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_tasks_posted INTEGER DEFAULT 0;

-- Create function to update rating statistics
CREATE OR REPLACE FUNCTION update_rating_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statistics for the rated user
  UPDATE profiles 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0.0) 
      FROM ratings 
      WHERE rated_id = COALESCE(NEW.rated_id, OLD.rated_id)
    ),
    total_ratings = (
      SELECT COUNT(*) 
      FROM ratings 
      WHERE rated_id = COALESCE(NEW.rated_id, OLD.rated_id)
    )
  WHERE id = COALESCE(NEW.rated_id, OLD.rated_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating statistics
DROP TRIGGER IF EXISTS trigger_update_rating_statistics ON ratings;
CREATE TRIGGER trigger_update_rating_statistics
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_rating_statistics();

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ratings
CREATE POLICY "Users can view all ratings" ON ratings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert ratings for completed tasks" ON ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Only allow ratings for completed tasks
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_id 
      AND status = 'completed'
      AND (user_id = auth.uid() OR wysa_id = auth.uid())
    )
    -- Ensure rater is authenticated user
    AND rater_id = auth.uid()
  );

CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE TO authenticated
  USING (rater_id = auth.uid())
  WITH CHECK (rater_id = auth.uid());

CREATE POLICY "Users can delete their own ratings" ON ratings
  FOR DELETE TO authenticated
  USING (rater_id = auth.uid());

-- Create helpful views
CREATE OR REPLACE VIEW user_rating_summary AS
SELECT 
  p.id,
  p.full_name,
  p.average_rating,
  p.total_ratings,
  p.total_tasks_completed,
  p.total_tasks_posted,
  CASE 
    WHEN p.total_ratings = 0 THEN 'New'
    WHEN p.average_rating >= 4.5 THEN 'Excellent'
    WHEN p.average_rating >= 4.0 THEN 'Very Good'
    WHEN p.average_rating >= 3.5 THEN 'Good'
    WHEN p.average_rating >= 3.0 THEN 'Average'
    ELSE 'Below Average'
  END as rating_badge
FROM profiles p;

-- Insert some sample ratings (optional, for testing)
-- This would be done by the application, not in schema