import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { aiLimiter, codeSubmissionLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/authController';
import * as coachController from '../controllers/coachController';
import * as profileController from '../controllers/profileController';
import * as dashboardController from '../controllers/dashboardController';
import * as aptitudeController from '../controllers/aptitudeController';
import * as codingController from '../controllers/codingController';
import * as commController from '../controllers/commController';
import * as interviewController from '../controllers/interviewController';
import * as resumeController from '../controllers/resumeController';
import * as analyticsController from '../controllers/analyticsController';
import * as leaderboardController from '../controllers/leaderboardController';
import * as mcqController from '../controllers/mcqController';
import * as adminController from '../controllers/adminController';
import * as aiMonitoringController from '../controllers/aiMonitoringController';
import * as codingMonitoringController from '../controllers/codingMonitoringController';

const router = Router();

// Auth routes (public)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/supabase-verify', authController.supabaseVerify);
router.post('/auth/firebase-verify', authController.firebaseVerify);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
router.post('/auth/password-reset/request', authController.requestPasswordReset);
router.post('/auth/password-reset/confirm', authController.confirmPasswordReset);

// Protect all following routes with JWT token checks
router.use(authMiddleware as any);

router.post('/auth/email/resend', authController.resendVerification);
router.get('/auth/sessions', authController.getSessions);
router.delete('/auth/sessions/:id', authController.revokeSession);

// AI Coach chat (rate-limited — Phase 4)
router.post('/ai/coach', aiLimiter as any, coachController.chat as any);

// Profile
router.get('/profile', profileController.getProfile as any);
router.put('/profile', profileController.updateProfile as any);

// Dashboard
router.get('/dashboard', dashboardController.getDashboard as any);

// Aptitude
router.get('/topics', aptitudeController.getTopics as any);
router.post('/mcqs/progress', aptitudeController.saveAttempt as any);
router.get('/mcqs/progress', aptitudeController.getHistory as any);

// MCQ Admin (CMS)
router.post('/mcqs', mcqController.create as any);
router.get('/mcqs', mcqController.list as any);
router.delete('/mcqs/:id', mcqController.remove as any);
router.post('/mcqs/generate', aiLimiter as any, mcqController.generate as any);

// Coding Arena
router.get('/coding/challenges', codingController.getChallenges as any);
router.post('/coding/challenges', codingController.createChallenge as any);
router.delete('/coding/challenges/:id', codingController.deleteChallenge as any);
router.post('/coding/challenges/:id/testcases', codingController.addTestcase as any);
router.post('/coding/submissions', codeSubmissionLimiter as any, codingController.submitCode as any);
router.get('/coding/submissions', codingController.getHistory as any);
router.get('/coding/submissions/:id', codingController.getSubmission as any);

// Speech Audit Coach
router.post('/communication/eval', aiLimiter as any, commController.evaluate as any);
router.get('/communication/history', commController.getHistory as any);

// Interview Simulation
router.post('/interview/start', aiLimiter as any, interviewController.start as any);
router.post('/interview/submit', interviewController.submit as any);
router.get('/interview/history', interviewController.getHistory as any);

// Resume Builder
router.get('/resume', resumeController.getResume as any);
router.post('/resume', resumeController.saveResume as any);
router.post('/resume/audit', aiLimiter as any, resumeController.audit as any);

// Analytics
router.get('/analytics', analyticsController.getAnalytics as any);

// Leaderboard standings
router.get('/leaderboard', leaderboardController.getLeaderboard as any);

// Admin routes (protected, role-based)
router.get('/admin/students', requireRole(['ADMIN']), adminController.getStudents as any);
router.delete('/admin/students/:id', requireRole(['ADMIN']), adminController.deleteStudent as any);
router.get('/admin/analytics', requireRole(['ADMIN']), adminController.getAnalytics as any);
router.get('/admin/reports/placement-readiness', requireRole(['ADMIN']), adminController.getPlacementReport as any);

// Phase 4 — AI monitoring endpoints (admin-only)
router.get('/admin/ai/metrics', requireRole(['ADMIN']), aiMonitoringController.getAiMetrics as any);
router.get('/admin/ai/providers', requireRole(['ADMIN']), aiMonitoringController.getAiProviders as any);
router.get('/admin/ai/health', requireRole(['ADMIN']), aiMonitoringController.getAiHealth as any);
router.get('/admin/ai/usage', requireRole(['ADMIN']), aiMonitoringController.getAiUsage as any);
router.post('/admin/ai/metrics/flush', requireRole(['ADMIN']), aiMonitoringController.flushAiMetrics as any);

// Phase 5 — code pipeline monitoring endpoints (admin-only)
router.get('/admin/code/queue', requireRole(['ADMIN']), codingMonitoringController.getQueueStatus as any);
router.get('/admin/code/worker', requireRole(['ADMIN']), codingMonitoringController.getWorkerStatus as any);
router.post('/admin/code/queue/requeue-failed', requireRole(['ADMIN']), codingMonitoringController.requeueFailed as any);

export default router;
