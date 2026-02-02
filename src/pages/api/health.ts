/**
 * API Route: GET /api/health
 * Health check endpoint for Cloud Run
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
        const isInitialized = dataCache.isInitialized();
        
        if (!isInitialized) {
            return res.status(503).json({
                status: 'initializing',
                message: 'Cache is initializing, please wait...',
                initialized: false,
            });
        }

        const data = dataCache.getData();

        return res.status(200).json({
            status: 'healthy',
            initialized: true,
            stats: {
                tasks: data.tasks.length,
                sites: data.sites.length,
                lastRefresh: data.lastRefresh,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[HEALTH] Error:', error);
        return res.status(500).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
