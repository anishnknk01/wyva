-- Add location_coordinates column to tasks table for GPS coordinates
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_coordinates JSONB;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS tasks_location_coordinates_idx ON tasks USING GIN (location_coordinates);

-- Create a function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 double precision,
    lng1 double precision,
    lat2 double precision,
    lng2 double precision
) RETURNS double precision AS $$
BEGIN
    RETURN (
        6371 * acos(
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1)) +
            sin(radians(lat1)) * sin(radians(lat2))
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to get nearby tasks within a certain distance
CREATE OR REPLACE FUNCTION get_nearby_tasks(
    user_lat double precision,
    user_lng double precision,
    max_distance_km double precision DEFAULT 10,
    task_limit integer DEFAULT 20
)
RETURNS TABLE (
    id text,
    title text,
    description text,
    category text,
    area text,
    budget integer,
    task_date text,
    task_time text,
    distance_km double precision,
    location_coordinates jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.title,
        t.description,
        t.category,
        t.area,
        t.budget,
        t.task_date,
        t.task_time,
        calculate_distance(
            user_lat,
            user_lng,
            (t.location_coordinates->>'lat')::double precision,
            (t.location_coordinates->>'lng')::double precision
        ) as distance_km,
        t.location_coordinates
    FROM tasks t
    WHERE 
        t.status = 'waiting_for_wysa'
        AND t.location_coordinates IS NOT NULL
        AND t.location_coordinates->>'lat' IS NOT NULL
        AND t.location_coordinates->>'lng' IS NOT NULL
        AND calculate_distance(
            user_lat,
            user_lng,
            (t.location_coordinates->>'lat')::double precision,
            (t.location_coordinates->>'lng')::double precision
        ) <= max_distance_km
    ORDER BY distance_km ASC
    LIMIT task_limit;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for the new function (if RLS is enabled)
-- Users can query nearby tasks regardless of ownership since these are public available tasks