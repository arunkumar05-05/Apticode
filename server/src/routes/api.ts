import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
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

const router = Router();

// Auth routes (public)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/firebase-verify', authController.firebaseVerify);

// Protect all following routes with JWT token checks
router.use(authMiddleware as any);

// AI Coach chat
router.post('/ai/coach', coachController.chat as any);

// Profile
router.get('/profile', profileController.getProfile as any);
router.put('/profile', profileController.updateProfile as any);

// Dashboard
router.get('/dashboard', dashboardController.getDashboard as any);

// Aptitude
router.get('/topics', aptitudeController.getTopics as any);
router.post('/mcqs/progress', aptitudeController.saveAttempt as any);
router.get('/mcqs/progress', aptitudeController.getHistory as any);

// Coding Arena
router.get('/coding/challenges', codingController.getChallenges as any);
router.post('/coding/submissions', codingController.submitCode as any);
router.get('/coding/submissions', codingController.getHistory as any);

// Speech Audit Coach
router.post('/communication/eval', commController.evaluate as any);
router.get('/communication/history', commController.getHistory as any);

// Interview Simulation
router.post('/interview/start', interviewController.start as any);
router.post('/interview/submit', interviewController.submit as any);
router.get('/interview/history', interviewController.getHistory as any);

// Resume Builder
router.get('/resume', resumeController.getResume as any);
router.post('/resume', resumeController.saveResume as any);
router.post('/resume/audit', resumeController.audit as any);

// Analytics
router.get('/analytics', analyticsController.getAnalytics as any);

// Leaderboard standings
router.get('/leaderboard', leaderboardController.getLeaderboard as any);

export default router;
