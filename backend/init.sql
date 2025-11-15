CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dati di esempio
INSERT INTO items (name, description) VALUES
  ('Item 1', 'Description for item 1'),
  ('Item 2', 'Description for item 2'),
  ('Item 3', 'Description for item 3');