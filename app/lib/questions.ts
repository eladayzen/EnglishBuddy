export interface QuestionOption {
  label: string;
  emoji: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  topicTag: string;
  difficulty: number;
}

export interface QuestionSequence {
  id: string;
  questions: Question[];
}

export const SEQUENCES: Record<string, QuestionSequence> = {
  sequence_A: {
    id: "sequence_A",
    questions: [
      {
        id: "a1",
        text: "What's your favorite animal?",
        options: [
          { label: "Dog", emoji: "🐕" },
          { label: "Cat", emoji: "🐱" },
          { label: "Fish", emoji: "🐟" },
        ],
        topicTag: "animals",
        difficulty: 1,
      },
      {
        id: "a2",
        text: "What do you like to eat?",
        options: [
          { label: "Pizza", emoji: "🍕" },
          { label: "Ice Cream", emoji: "🍦" },
          { label: "Pasta", emoji: "🍝" },
        ],
        topicTag: "food",
        difficulty: 1,
      },
      {
        id: "a3",
        text: "What do you do after school?",
        options: [
          { label: "Play", emoji: "⚽" },
          { label: "Read", emoji: "📚" },
          { label: "Watch TV", emoji: "📺" },
        ],
        topicTag: "activities",
        difficulty: 2,
      },
      {
        id: "a4",
        text: "Where would you like to travel?",
        options: [
          { label: "Beach", emoji: "🏖️" },
          { label: "Mountains", emoji: "🏔️" },
          { label: "City", emoji: "🏙️" },
        ],
        topicTag: "travel",
        difficulty: 2,
      },
      {
        id: "a5",
        text: "What makes you happy?",
        options: [
          { label: "Friends", emoji: "👫" },
          { label: "Music", emoji: "🎵" },
          { label: "Games", emoji: "🎮" },
        ],
        topicTag: "feelings",
        difficulty: 2,
      },
    ],
  },
  sequence_B: {
    id: "sequence_B",
    questions: [
      {
        id: "b1",
        text: "What do you like to eat?",
        options: [
          { label: "Pizza", emoji: "🍕" },
          { label: "Ice Cream", emoji: "🍦" },
          { label: "Pasta", emoji: "🍝" },
        ],
        topicTag: "food",
        difficulty: 1,
      },
      {
        id: "b2",
        text: "What's your favorite game?",
        options: [
          { label: "Soccer", emoji: "⚽" },
          { label: "Video Games", emoji: "🎮" },
          { label: "Hide and Seek", emoji: "🙈" },
        ],
        topicTag: "games",
        difficulty: 1,
      },
      {
        id: "b3",
        text: "Who do you like to be with?",
        options: [
          { label: "Friends", emoji: "👫" },
          { label: "Family", emoji: "👨‍👩‍👧" },
          { label: "My Pet", emoji: "🐾" },
        ],
        topicTag: "people",
        difficulty: 1,
      },
      {
        id: "b4",
        text: "What's your favorite color?",
        options: [
          { label: "Blue", emoji: "💙" },
          { label: "Red", emoji: "❤️" },
          { label: "Green", emoji: "💚" },
        ],
        topicTag: "colors",
        difficulty: 1,
      },
      {
        id: "b5",
        text: "What do you want to be when you grow up?",
        options: [
          { label: "Teacher", emoji: "👩‍🏫" },
          { label: "Doctor", emoji: "👨‍⚕️" },
          { label: "Astronaut", emoji: "🚀" },
        ],
        topicTag: "dreams",
        difficulty: 3,
      },
    ],
  },
};

export function getRandomSequence(): QuestionSequence {
  return Math.random() < 0.5 ? SEQUENCES.sequence_A : SEQUENCES.sequence_B;
}
