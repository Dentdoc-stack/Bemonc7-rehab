/**
 * API Route: GET /api/tasks
 * Returns task-level data, optionally filtered by site_uid
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { dataCache } from '@/lib/backend/cache';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Initialize cache if not already done
        if (!dataCache.isInitialized()) {
            console.log('[TASKS] Cache not initialized, initializing now...');
            try {
                await dataCache.initialize();
            } catch (initError) {
                console.error('[TASKS] Cache initialization failed:', initError);
                return res.status(503).json({
                    error: 'Service initializing',
                    message: 'Cache is being initialized. Please try again in a few seconds.',
                    details: initError instanceof Error ? initError.message : 'Unknown error',
                });
            }
        }

        const { site_uid } = req.query;

        let tasks;
        try {
            if (site_uid) {
                tasks = dataCache.getTasksBySite(site_uid as string);
            } else {
                tasks = dataCache.getTasks();
            }
        } catch (cacheError) {
            console.error('[TASKS] Error retrieving tasks from cache:', cacheError);
            return res.status(503).json({
                error: 'Cache error',
                message: 'Failed to retrieve tasks from cache',
                details: cacheError instanceof Error ? cacheError.message : 'Unknown error',
            });
        }

        return res.status(200).json({
            success: true,
            data: tasks,
            count: tasks.length,
            filters: {
                site_uid: site_uid || null,
            },
            lastRefresh: dataCache.getData().lastRefresh,
        });
    } catch (error) {
        console.error('[TASKS] Unexpected error:', error);
        return res.status(500).json({
            error: 'Failed to fetch tasks',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
