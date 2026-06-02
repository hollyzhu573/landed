-- Single-user profile for resume data and parsed context

CREATE TABLE user_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  location text,
  linkedin_url text,
  portfolio_url text,
  summary text,
  skills text[] NOT NULL DEFAULT '{}',
  tools text[] NOT NULL DEFAULT '{}',
  experience jsonb NOT NULL DEFAULT '[]',
  education jsonb NOT NULL DEFAULT '[]',
  resume_filename text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enforce a single row for the single-user app
CREATE UNIQUE INDEX user_profile_singleton ON user_profile ((true));

-- Reuse or create the updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
