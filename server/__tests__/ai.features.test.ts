import { isAiEnabled } from '../src/utils/ai';
import { generateQuestions } from '../src/services/mcqService';
import { startInterview } from '../src/services/interviewService';
import { auditResume } from '../src/services/resumeService';
import { evaluateSpeech } from '../src/services/commService';
import { db } from '../src/prisma/db';

/**
 * LIVE AI integration tests — prove every AI feature works under the configured
 * provider key (vsllm by default).
 *
 * These tests hit a real provider and are gated behind RUN_LIVE_AI_TESTS=true.
 * They are SKIPPED by default in CI to avoid quota/network flakiness.
 */
const RUN_LIVE = process.env.RUN_LIVE_AI_TESTS === 'true';
const enabled = isAiEnabled();
// Whole describe blocks are skipped (not just their bodies) unless live tests are enabled.
const liveDescribe = RUN_LIVE && enabled ? describe : describe.skip;

describe('AI Features (live provider)', () => {
  beforeAll(async () => {
    if (!enabled || !RUN_LIVE) return;
    const existing = await db.user.findUnique({ where: { id: 'ai-test-user' } });
    if (!existing) {
      await db.user.create({
        data: { id: 'ai-test-user', email: 'ai-test@college.edu', fullName: 'AI Test', role: 'STUDENT' }
      });
    }
  });

  liveDescribe('Dynamic question generation', () => {
    it('generates valid MCQs for a topic', async () => {
      if (!enabled || !RUN_LIVE) return;
      const questions = await generateQuestions({ topic: 'Time and Work', count: 3, difficulty: 'MEDIUM' });
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(3);
      for (const q of questions) {
        expect(typeof q.questionText).toBe('string');
        expect(q.questionText.length).toBeGreaterThan(0);
        expect(q.options).toHaveLength(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThanOrEqual(3);
        expect(typeof q.answer).toBe('string');
        expect(q.answer).toBe(q.options[q.correctIndex]);
        expect(q.isAI).toBe(true);
      }
    }, 90000);
  });

  liveDescribe('AI Mock Interview', () => {
    it('generates interview questions', async () => {
      if (!enabled || !RUN_LIVE) return;
      const questions = await startInterview('ai-test-user', 'TECHNICAL', 'Google');
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBe(3);
      for (const q of questions) {
        expect(typeof q.q).toBe('string');
        expect(q.q.length).toBeGreaterThan(0);
        expect(typeof q.optimal).toBe('string');
      }
    }, 90000);
  });

  liveDescribe('Resume ATS audit', () => {
    it('returns an ATS score and feedback', async () => {
      if (!enabled || !RUN_LIVE) return;
      const result = await auditResume('ai-test-user', {
        personal: { name: 'Rahul Sharma', email: 'rahul@college.edu' },
        skills: 'JavaScript, React, Node.js',
        projectText: 'Built an AI placement pipeline using Express and Prisma.'
      });
      expect(typeof result.atsScore).toBe('number');
      expect(result.atsScore).toBeGreaterThanOrEqual(0);
      expect(result.atsScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.auditFeedback)).toBe(true);
    }, 90000);
  });

  liveDescribe('Communication evaluation', () => {
    it('returns speech scores', async () => {
      if (!enabled || !RUN_LIVE) return;
      const result = await evaluateSpeech('ai-test-user', {
        sessionType: 'SPEAKING',
        transcript: 'I was building a web application and I ran into a bug. I debugged it using the console.',
        promptText: 'Describe a time you overcame a technical challenge.',
        durationSeconds: 20
      });
      expect(typeof result.grammarScore).toBe('number');
      expect(typeof result.fluencyScore).toBe('number');
      expect(typeof result.confidenceScore).toBe('number');
      expect(result.recommendations.length).toBeGreaterThan(0);
    }, 90000);
  });
});
