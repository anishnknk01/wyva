-- ============================================================
-- SUPERSEDED — do not run this file on its own.
--
-- This RPC needs the `messages` table to exist first, which this file
-- never created. It's now folded into
-- supabase/migrations/0002_messages_and_notifications.sql, which creates
-- the table AND this function together in the correct order. Run that
-- file instead.
-- ============================================================

-- Creates the get_user_conversations RPC function used by the messages system.
-- Run this in your Supabase SQL Editor to fix the console warning.

CREATE OR REPLACE FUNCTION get_user_conversations(user_id uuid)
RETURNS TABLE (
  task_id          text,
  other_user_id    uuid,
  other_user_name  text,
  other_user_avatar text,
  last_message     text,
  last_message_at  timestamptz,
  unread_count     bigint,
  task_title       text,
  task_status      text,
  conversation_id  text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest AS (
    SELECT DISTINCT ON (m.task_id,
                         LEAST(m.sender_id, m.receiver_id),
                         GREATEST(m.sender_id, m.receiver_id))
      m.task_id,
      CASE WHEN m.sender_id = user_id THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
      m.message_text AS last_message,
      m.created_at   AS last_message_at
    FROM messages m
    WHERE m.sender_id = user_id OR m.receiver_id = user_id
    ORDER BY m.task_id,
             LEAST(m.sender_id, m.receiver_id),
             GREATEST(m.sender_id, m.receiver_id),
             m.created_at DESC
  ),
  unread AS (
    SELECT m.task_id,
           CASE WHEN m.sender_id = user_id THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
           COUNT(*) AS cnt
    FROM messages m
    WHERE m.receiver_id = user_id AND m.read_at IS NULL
    GROUP BY m.task_id, other_user_id
  )
  SELECT
    l.task_id,
    l.other_user_id,
    COALESCE(p.full_name, 'Unknown')     AS other_user_name,
    p.avatar_url                          AS other_user_avatar,
    l.last_message,
    l.last_message_at,
    COALESCE(u.cnt, 0)                   AS unread_count,
    COALESCE(t.title, '')                AS task_title,
    COALESCE(t.status, '')               AS task_status,
    l.task_id || '-' || l.other_user_id::text AS conversation_id
  FROM latest l
  LEFT JOIN profiles p ON p.id = l.other_user_id
  LEFT JOIN tasks     t ON t.id = l.task_id
  LEFT JOIN unread    u ON u.task_id = l.task_id AND u.other_user_id = l.other_user_id
  ORDER BY l.last_message_at DESC;
END;
$$;
