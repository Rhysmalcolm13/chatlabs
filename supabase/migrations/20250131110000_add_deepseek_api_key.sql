-- Add DeepSeek API Key column to profiles table
ALTER TABLE profiles
ADD COLUMN deepseek_api_key TEXT;

-- Optional: Add a comment to the column
COMMENT ON COLUMN profiles.deepseek_api_key IS 'API key for accessing DeepSeek models';
