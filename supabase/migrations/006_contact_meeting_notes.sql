CREATE TYPE meeting_kind AS ENUM (
  'touchpoint'
);

CREATE TABLE contact_notes (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id     uuid         NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  kind           meeting_kind NOT NULL,
  content        text         NOT NULL DEFAULT '',
  freeform_note  text         NOT NULL DEFAULT '',
  meeting_date   date,
  sort_order     integer      NOT NULL DEFAULT 0,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX contact_notes_contact_id_idx ON contact_notes(contact_id);
