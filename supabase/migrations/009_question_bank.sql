CREATE TABLE question_bank (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question   text        NOT NULL DEFAULT '',
  answer     text        NOT NULL DEFAULT '',
  source     text,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed with common product design / new grad interview questions
INSERT INTO question_bank (question, sort_order) VALUES
  ('Walk me through a project from your portfolio end to end.', 0),
  ('Tell me about a time you received critical feedback on your design. How did you respond?', 1),
  ('How do you approach designing for a user group you''re not part of?', 2),
  ('Describe your process when you get a vague or ambiguous brief.', 3),
  ('Tell me about a project where you had to make trade-offs under constraints.', 4),
  ('Why product design, and why now?', 5),
  ('Where do you see yourself in 3 years?', 6);
