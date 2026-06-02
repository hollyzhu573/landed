-- Allow full access to user_profile for the anon role (single-user app, no auth)
ALTER TABLE user_profile DISABLE ROW LEVEL SECURITY;
