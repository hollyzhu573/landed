-- Enums

CREATE TYPE job_status AS ENUM (
  'wishlist',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn'
);

CREATE TYPE contact_status AS ENUM (
  'to_reach_out',
  'reached_out',
  'following_up',
  'connected',
  'dormant'
);

-- jobs

CREATE TABLE jobs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company        text        NOT NULL,
  role           text        NOT NULL,
  status         job_status  NOT NULL DEFAULT 'wishlist',
  date_applied   date,
  job_url        text,
  portfolio_link text,
  salary_min     integer,
  salary_max     integer,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- contacts

CREATE TABLE contacts (
  id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text           NOT NULL,
  company           text,
  role              text,
  linkedin_url      text,
  how_we_met        text,
  last_contact_date date,
  follow_up_days    integer,
  follow_up_due     date           GENERATED ALWAYS AS (
                                     CASE
                                       WHEN last_contact_date IS NOT NULL
                                        AND follow_up_days    IS NOT NULL
                                       THEN last_contact_date + follow_up_days
                                     END
                                   ) STORED,
  status            contact_status NOT NULL DEFAULT 'to_reach_out',
  notes             text,
  job_id            uuid           REFERENCES jobs (id) ON DELETE SET NULL,
  created_at        timestamptz    NOT NULL DEFAULT now(),
  updated_at        timestamptz    NOT NULL DEFAULT now()
);
