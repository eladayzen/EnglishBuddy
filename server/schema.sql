-- English Buddy Database Schema
-- Production-ready tables for the AI English tutor app

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    sequence_group VARCHAR(20) NOT NULL DEFAULT 'sequence_A',
    difficulty_level INT NOT NULL DEFAULT 1,
    total_messages INT NOT NULL DEFAULT 0,
    total_sessions INT NOT NULL DEFAULT 0,
    current_character VARCHAR(20) NOT NULL DEFAULT 'mia',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    questions_answered INT NOT NULL DEFAULT 0,
    messages_sent INT NOT NULL DEFAULT 0,
    duration_seconds INT,
    device VARCHAR(20) DEFAULT 'web'
);

-- Conversations table (one per topic/question picked)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES sessions(id),
    user_id INT NOT NULL REFERENCES users(id),
    question_id VARCHAR(20) NOT NULL,
    question_text VARCHAR(200),
    selected_option VARCHAR(50),
    skipped BOOLEAN NOT NULL DEFAULT FALSE,
    message_count INT NOT NULL DEFAULT 0,
    difficulty_rating VARCHAR(20),  -- 'too_easy', 'just_right', 'too_hard'
    difficulty_level INT NOT NULL DEFAULT 1,
    topic_tag VARCHAR(50),
    started_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT NOT NULL REFERENCES conversations(id),
    user_id INT NOT NULL REFERENCES users(id),
    role VARCHAR(10) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_sequence_group ON users(sequence_group);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_topic_tag ON conversations(topic_tag);
CREATE INDEX IF NOT EXISTS idx_conversations_difficulty_rating ON conversations(difficulty_rating);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
