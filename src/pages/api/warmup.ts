/**
 * API Route: GET /api/warmup
 * Warmup endpoint to initialize cache for Cloud Run cold starts
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { dataCache } from '@/lib/backend/cache';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const startTime = Date.now();
        
        // Initialize cache if not already done
        if (!dataCache.isInitialized()) {
            console.log('[WARMUP] Initializing cache...');
            await dataCache.initialize();
        } else {
            console.log('[WARMUP] Cache already initialized');
        }

        const data = dataCache.getData();
        const duration = Date.now() - startTime;

        return res.status(200).json({
            success: true,
            message: 'Cache warmed up successfully',
            duration: `${duration}ms`,
            stats: {
                tasks: data.tasks.length,
                sites: data.sites.length,
                lastRefresh: data.lastRefresh,
            },
        });
    } catch (error) {
        console.error('[WARMUP] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to warm up cache',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
