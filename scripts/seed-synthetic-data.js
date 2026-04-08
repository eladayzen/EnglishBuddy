/**
 * Synthetic Data Generator for English Buddy
 *
 * Generates realistic user data for 200 users over 30 days:
 * - 50/50 split between sequence_A and sequence_B
 * - Realistic retention: ~60% day 1, ~30% day 3, ~15% day 7, ~5% day 14
 * - Sequence B retains slightly better (for A/B test story)
 * - 2-5 sessions per retained user
 * - 1-4 topics per session
 * - 3-8 messages per conversation
 *
 * Usage: node scripts/seed-synthetic-data.js
 * Requires: DATABASE_URL env var pointing to Railway PostgreSQL
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL environment variable');
  process.exit(1);
}

// Config
const NUM_USERS = 200;
const DAYS_SPAN = 30;
const START_DATE = new Date('2026-03-08');

const CHARACTERS = ['mia', 'jake', 'sam', 'nina', 'leo'];

const QUESTIONS = {
  sequence_A: [
    { id: 'a1', text: "What's your favorite animal?", options: ['Dog', 'Cat', 'Fish'], tag: 'animals' },
    { id: 'a2', text: 'What do you like to eat?', options: ['Pizza', 'Ice Cream', 'Pasta'], tag: 'food' },
    { id: 'a3', text: 'What do you do after school?', options: ['Play', 'Read', 'Watch TV'], tag: 'activities' },
    { id: 'a4', text: 'Where would you like to travel?', options: ['Beach', 'Mountains', 'City'], tag: 'travel' },
    { id: 'a5', text: 'What makes you happy?', options: ['Friends', 'Music', 'Games'], tag: 'feelings' },
  ],
  sequence_B: [
    { id: 'b1', text: 'What do you like to eat?', options: ['Pizza', 'Ice Cream', 'Pasta'], tag: 'food' },
    { id: 'b2', text: "What's your favorite game?", options: ['Soccer', 'Video Games', 'Hide and Seek'], tag: 'games' },
    { id: 'b3', text: 'Who do you like to be with?', options: ['Friends', 'Family', 'My Pet'], tag: 'people' },
    { id: 'b4', text: "What's your favorite color?", options: ['Blue', 'Red', 'Green'], tag: 'colors' },
    { id: 'b5', text: 'What do you want to be when you grow up?', options: ['Teacher', 'Doctor', 'Astronaut'], tag: 'dreams' },
  ],
};

const ADJECTIVES = ['Swift', 'Brave', 'Cool', 'Happy', 'Quick', 'Smart', 'Fun', 'Silly', 'Tiny', 'Mighty',
  'Bold', 'Wild', 'Neat', 'Jolly', 'Zippy', 'Cheery', 'Daring', 'Eager', 'Fierce', 'Glowing'];
const NOUNS = ['Fox', 'Panda', 'Eagle', 'Bear', 'Rabbit', 'Owl', 'Monkey', 'Goose', 'Tiger', 'Mouse',
  'Bee', 'Wolf', 'Narwhal', 'Jaguar', 'Zebra', 'Cat', 'Duck', 'Elk', 'Falcon', 'Gecko'];

const USER_MESSAGES = [
  'yes', 'no', 'I like it', 'I don\'t know', 'pizza', 'dogs are cool', 'I play soccer',
  'my friend is nice', 'I like blue', 'I want to be a doctor', 'it\'s fun', 'I go to school',
  'my mom makes pasta', 'I have a cat', 'games are cool', 'I like swimming', 'ice cream is best',
  'I read books', 'music is nice', 'the beach is fun', 'I like my teacher', 'I play with friends',
  'chocolate is yummy', 'I watch cartoons', 'my dog is big', 'I like red too', 'I go to park',
];

const AI_RESPONSES = [
  'That\'s awesome! I love that too! What else do you like?',
  'Cool! Tell me more about it!',
  'No way! That\'s so interesting! Why do you like it?',
  'Haha, me too! By the way, we say "I like" not "I likes" — English is funny like that!',
  'Oh wow! Did you know that\'s super popular? What\'s your favorite part?',
  'That\'s epic! Epic means super super cool! Do you want to tell me more?',
  'Nice! I think that\'s a great choice. What do your friends think?',
  'Really? That\'s different from what I expected! In a good way!',
];

const DIFFICULTY_RATINGS = ['too_easy', 'just_right', 'too_hard'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function randomName() { return pick(ADJECTIVES) + pick(NOUNS) + String(rand(0, 999)).padStart(3, '0'); }

// Retention probability by day (sequence A)
function retentionProbA(daysSinceSignup) {
  if (daysSinceSignup === 0) return 1.0;
  if (daysSinceSignup === 1) return 0.55;
  if (daysSinceSignup <= 3) return 0.28;
  if (daysSinceSignup <= 7) return 0.13;
  if (daysSinceSignup <= 14) return 0.06;
  return 0.03;
}

// Sequence B retains ~15% better
function retentionProbB(daysSinceSignup) {
  return Math.min(1.0, retentionProbA(daysSinceSignup) * 1.15);
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3600000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

async function seed() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database');

  // Run schema
  const fs = require('fs');
  const schema = fs.readFileSync('./server/schema.sql', 'utf8');
  await client.query(schema);
  console.log('Schema created');

  // Clear existing data
  await client.query('DELETE FROM messages');
  await client.query('DELETE FROM conversations');
  await client.query('DELETE FROM sessions');
  await client.query('DELETE FROM users');
  console.log('Cleared existing data');

  let totalUsers = 0;
  let totalSessions = 0;
  let totalConversations = 0;
  let totalMessages = 0;

  for (let i = 0; i < NUM_USERS; i++) {
    const sequenceGroup = i < NUM_USERS / 2 ? 'sequence_A' : 'sequence_B';
    const retentionFn = sequenceGroup === 'sequence_A' ? retentionProbA : retentionProbB;
    const signupDay = rand(0, DAYS_SPAN - 1);
    const signupDate = addDays(START_DATE, signupDay);
    const signupHour = rand(7, 21);
    const createdAt = addHours(signupDate, signupHour);
    const name = randomName();
    const character = pick(CHARACTERS);

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (name, sequence_group, difficulty_level, current_character, created_at, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
      [name, sequenceGroup, rand(1, 3), character, createdAt]
    );
    const userId = userResult.rows[0].id;
    totalUsers++;

    let userTotalMessages = 0;
    let userTotalSessions = 0;
    let lastSeenAt = createdAt;

    // Generate sessions for each day the user returns
    const daysAvailable = DAYS_SPAN - signupDay;
    for (let day = 0; day < daysAvailable; day++) {
      // Check retention
      if (day > 0 && Math.random() > retentionFn(day)) continue;

      const sessionDate = addDays(signupDate, day);
      const sessionHour = rand(7, 21);
      const sessionStart = addHours(sessionDate, sessionHour);

      const questionsAnswered = rand(1, 4);
      const sessionMessages = questionsAnswered * rand(3, 8);
      const durationSeconds = sessionMessages * rand(15, 45); // 15-45 sec per message exchange

      // Insert session
      const sessionResult = await client.query(
        `INSERT INTO sessions (user_id, started_at, ended_at, questions_answered, messages_sent, duration_seconds)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, sessionStart, addHours(sessionStart, durationSeconds / 3600), questionsAnswered, sessionMessages, durationSeconds]
      );
      const sessionId = sessionResult.rows[0].id;
      totalSessions++;
      userTotalSessions++;

      // Generate conversations
      const questions = QUESTIONS[sequenceGroup];
      let conversationTime = sessionStart;

      for (let q = 0; q < questionsAnswered; q++) {
        const question = questions[q % questions.length];
        const selectedOption = pick(question.options);
        const skipped = Math.random() < 0.1;
        const msgCount = skipped ? 0 : rand(3, 8);
        const difficultyRating = skipped ? null : pick(DIFFICULTY_RATINGS);
        const difficultyLevel = rand(1, 3);

        const convResult = await client.query(
          `INSERT INTO conversations (session_id, user_id, question_id, question_text, selected_option, skipped, message_count, difficulty_rating, difficulty_level, topic_tag, started_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
          [sessionId, userId, question.id, question.text, selectedOption, skipped, msgCount, difficultyRating, difficultyLevel, question.tag, conversationTime]
        );
        const convId = convResult.rows[0].id;
        totalConversations++;

        // Generate messages
        if (!skipped) {
          let msgTime = conversationTime;
          for (let m = 0; m < msgCount; m++) {
            const isUser = m % 2 === 1; // AI starts, then alternates
            const role = isUser ? 'user' : 'assistant';
            const content = isUser ? pick(USER_MESSAGES) : pick(AI_RESPONSES);
            msgTime = addHours(msgTime, rand(10, 60) / 3600); // 10-60 seconds between messages

            await client.query(
              `INSERT INTO messages (conversation_id, user_id, role, content, created_at)
               VALUES ($1, $2, $3, $4, $5)`,
              [convId, userId, role, content, msgTime]
            );
            totalMessages++;
            userTotalMessages++;
          }
        }

        conversationTime = addHours(conversationTime, rand(2, 10) / 60); // 2-10 min between topics
      }

      lastSeenAt = conversationTime;
    }

    // Update user totals
    await client.query(
      `UPDATE users SET total_messages = $1, total_sessions = $2, last_seen_at = $3 WHERE id = $4`,
      [userTotalMessages, userTotalSessions, lastSeenAt, userId]
    );

    if ((i + 1) % 20 === 0) console.log(`  Created ${i + 1}/${NUM_USERS} users...`);
  }

  console.log(`\nDone! Generated:`);
  console.log(`  ${totalUsers} users`);
  console.log(`  ${totalSessions} sessions`);
  console.log(`  ${totalConversations} conversations`);
  console.log(`  ${totalMessages} messages`);

  await client.end();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
