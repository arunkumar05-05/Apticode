import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

interface McqItem {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  answer: string;
  topic: string;
  aiExplanation: string;
}

// In-Memory Shared Quiz Database mapping students to admin CMS live
const activeMcqs: McqItem[] = [
  {
    id: '1',
    text: 'A can complete a task in 10 days, and B can complete the same task in 15 days. If they work together, how many days will they take?',
    options: ['5 Days', '6 Days', '8 Days', '4 Days'],
    correctIndex: 1,
    answer: 'B',
    topic: 'Time and Work',
    aiExplanation: '**Step-by-Step Mathematical Explanation:**\n\n1. **Identify the individual rates:**\n   - A\'s work rate per day = $1/10$\n   - B\'s work rate per day = $1/15$\n\n2. **Combine their rates when working together:**\n   - Combined Rate = 1/10 + 1/15 = 5/30 = 1/6\n\n3. **Compute total days required:**\n   - Days = Reciprocal of Rate = 6 days.\n\nTherefore, A and B together take 6 Days.'
  },
  {
    id: '2',
    text: 'Two dice are thrown simultaneously. What is the probability that the sum of the numbers on the two dice is a prime number?',
    options: ['5/12', '7/12', '1/3', '15/36'],
    correctIndex: 0,
    answer: 'A',
    topic: 'Probability & Combination',
    aiExplanation: '**Step-by-Step Probability Explanation:**\n\n1. Throwing two dice gives 36 outcomes.\n2. Favorable sums (Prime sums: 2, 3, 5, 7, 11) give 15 outcomes.\n3. Probability = 15/36 = 5/12.'
  }
];

app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    res.status(500).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: e.message
    });
  }
});

// Challenges REST API
app.get('/api/challenges', async (req: Request, res: Response) => {
  res.json({
    status: 'success',
    data: [
      { id: '1', title: 'Two Sum', difficulty: 'EASY', solvedCount: 420 },
      { id: '2', title: 'Container With Most Water', difficulty: 'MEDIUM', solvedCount: 184 },
      { id: '3', title: 'Longest Palindromic Substring', difficulty: 'MEDIUM', solvedCount: 92 }
    ]
  });
});

// MCQ SYNC REST API
app.get('/api/mcqs', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    data: activeMcqs
  });
});

app.post('/api/mcqs', (req: Request, res: Response) => {
  const { text, options, correctIndex, answer, topic, aiExplanation } = req.body;

  if (!text || !options || correctIndex === undefined || !answer) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing required MCQ params.'
    });
  }

  const newItem: McqItem = {
    id: String(activeMcqs.length + 1),
    text,
    options,
    correctIndex: Number(correctIndex),
    answer,
    topic: topic || 'Quantitative Aptitude',
    aiExplanation: aiExplanation || `**Correct Answer Choice: Option ${answer}**.\n\nAI Breakdown: Step-by-step breakdown has been verified.`
  };

  activeMcqs.push(newItem);
  res.status(201).json({
    status: 'success',
    data: newItem
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ status: 'fail', message: 'Email and password credentials required.' });
  }

  res.json({
    status: 'success',
    token: 'mock-jwt-access-token-string',
    user: {
      name: email === 'admin@college.edu' ? 'Prof. Shastri' : 'Rahul Sharma',
      email,
      role: email === 'admin@college.edu' ? 'ADMIN' : 'STUDENT'
    }
  });
});

app.listen(PORT, () => {
  console.log(`[AptiCode Backend] Node Express server online on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
