-- Add video_url column to disciplines table
ALTER TABLE disciplines 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN disciplines.video_url IS 'URL to promotional video (YouTube or Instagram)';
