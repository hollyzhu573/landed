CREATE TYPE prep_category AS ENUM (
  'behavioral',
  'portfolio',
  'take_home',
  'product_critique',
  'hiring_manager',
  'whiteboard'
);

CREATE TABLE interview_prep (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     uuid          NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  category   prep_category NOT NULL,
  answer     text          NOT NULL DEFAULT '',
  sort_order integer       NOT NULL DEFAULT 0,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX interview_prep_job_id_idx ON interview_prep(job_id);
