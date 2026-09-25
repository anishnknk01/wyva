-- Create messages table for chat functionality
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  image_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_messages_task_id ON messages(task_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view messages they sent or received" ON messages
  FOR SELECT
  USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid()
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- Create conversation view for easier querying
CREATE OR REPLACE VIEW conversations AS
SELECT DISTINCT
  CASE 
    WHEN m.sender_id < m.receiver_id 
    THEN m.sender_id || ',' || m.receiver_id
    ELSE m.receiver_id || ',' || m.sender_id
  END as conversation_id,
  m.task_id,
  CASE 
    WHEN m.sender_id = auth.uid() THEN m.receiver_id
    ELSE m.sender_id
  END as other_user_id,
  p.full_name as other_user_name,
  p.avatar_url as other_user_avatar,
  t.title as task_title,
  t.status as task_status,
  latest.message_text as last_message,
  latest.created_at as last_message_at,
  COALESCE(unread.unread_count, 0) as unread_count
FROM messages m
JOIN profiles p ON (
  CASE 
    WHEN m.sender_id = auth.uid() THEN p.id = m.receiver_id
    ELSE p.id = m.sender_id
  END
)
JOIN tasks t ON t.id = m.task_id
JOIN LATERAL (
  SELECT message_text, created_at
  FROM messages m2
  WHERE (m2.sender_id = m.sender_id AND m2.receiver_id = m.receiver_id)
     OR (m2.sender_id = m.receiver_id AND m2.receiver_id = m.sender_id)
  ORDER BY created_at DESC
  LIMIT 1
) latest ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) as unread_count
  FROM messages m3
  WHERE m3.receiver_id = auth.uid()
    AND m3.sender_id = CASE 
      WHEN m.sender_id = auth.uid() THEN m.receiver_id
      ELSE m.sender_id
    END
    AND m3.read_at IS NULL
) unread ON true
WHERE m.sender_id = auth.uid() OR m.receiver_id = auth.uid();