import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as adminService from '../services/adminService';

export async function getStudents(req: AuthenticatedRequest, res: Response) {
  try {
    const students = await adminService.getStudents();
    res.json({ status: 'success', data: students });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const analytics = await adminService.getAdminAnalytics();
    res.json({ status: 'success', data: analytics });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function deleteStudent(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await adminService.deleteStudent(id);
    res.json({ status: 'success' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function getPlacementReport(req: AuthenticatedRequest, res: Response) {
  try {
    const report = await adminService.getPlacementReadinessReport();
    res.json({ status: 'success', data: report });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}