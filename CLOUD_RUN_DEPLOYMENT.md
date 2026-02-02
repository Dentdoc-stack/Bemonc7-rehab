# Cloud Run Deployment Guide

## Overview
This application is deployed to Google Cloud Run with automatic cache initialization and warmup endpoints.

## Key Features for Cloud Deployment

### 1. Cache Management
- **Singleton cache**: In-memory cache shared across requests
- **Thread-safe initialization**: Prevents race conditions during cold starts
- **Min instances**: Set to 1 to keep cache warm
- **Auto-refresh**: Cache refreshes every 30 minutes automatically

### 2. Warmup Endpoint
**Endpoint:** `GET /api/warmup`

This endpoint initializes the cache and should be called:
- After deployment to warm up the first instance
- By Cloud Scheduler for periodic health checks (optional)

```bash
curl https://your-app.run.app/api/warmup
```

### 3. Health Check Endpoint
**Endpoint:** `GET /api/health`

Returns:
- `200 OK`: Cache is initialized and healthy
- `503 Service Unavailable`: Cache is initializing
- `500 Internal Server Error`: Cache initialization failed

```bash
curl https://your-app.run.app/api/health
```

## Deployment Steps

### 1. Deploy to Cloud Run
```bash
gcloud builds submit --config cloudbuild.yaml
```

### 2. Warm Up the Instance
After deployment, immediately warm up the cache:
```bash
curl https://your-app.run.app/api/warmup
```

### 3. Verify Health
Check that the service is healthy:
```bash
curl https://your-app.run.app/api/health
```

## Configuration

### Cloud Run Settings (in cloudbuild.yaml)
- **Min instances**: 1 (keeps at least one instance warm)
- **Max instances**: 10 (scales up as needed)
- **Memory**: 512Mi (can be increased if needed)
- **CPU**: 1 (sufficient for most loads)
- **Timeout**: 3600s (1 hour for long-running requests)
- **Concurrency**: 80 (requests per instance)
- **CPU Boost**: Enabled for faster cold starts

### Environment Variables
No environment variables are required for basic operation since the app uses:
- **Public Google Sheets** (no API key needed)
- **Published XLSX URLs** (direct access without authentication)

If you want to add Google Sheets API for additional features:
```bash
gcloud run services update bemonc6 \
  --set-env-vars NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=your_api_key_here
```

## Troubleshooting

### Issue: "Cache not initialized" errors
**Solution:**
1. Check if the warmup endpoint was called after deployment
2. Call `/api/warmup` manually to initialize the cache
3. Check logs: `gcloud run logs read bemonc6 --limit 100`

### Issue: Cold start timeouts
**Solution:**
1. Ensure `min-instances` is set to 1 or higher
2. Use CPU boost for faster initialization
3. Consider increasing memory allocation

### Issue: "No tasks received from backend API"
**Solution:**
1. Verify Google Sheets are published and accessible
2. Check the published XLSX URL in `src/lib/backend/config.ts`
3. Test the URL directly in browser: https://docs.google.com/spreadsheets/d/e/...

### Issue: Service unavailable after deployment
**Solution:**
1. Wait 30-60 seconds for cache initialization
2. Call `/api/warmup` to force initialization
3. Check Cloud Run logs for specific errors

## Monitoring

### View Logs
```bash
# View recent logs
gcloud run logs read bemonc6 --limit 100

# Tail logs
gcloud run logs tail bemonc6
```

### View Metrics
```bash
# Open Cloud Console
gcloud run services describe bemonc6 --region asia-southeast1
```

## Cache Behavior

### Initialization
- **On first request**: Cache initializes automatically (may take 3-5 seconds)
- **Concurrent requests**: Subsequent requests wait for initialization to complete
- **Failure**: Returns 503 with retry-after suggestion

### Refresh
- **Automatic**: Every 30 minutes
- **Manual**: Call `POST /api/refresh`
- **On failure**: Returns stale data if available

### Memory Usage
- **Tasks**: ~2916 tasks × ~2KB = ~6MB
- **Processed data**: ~10-15MB total
- **Recommended memory**: 512Mi (with room for Node.js runtime)

## Performance Tips

1. **Keep min-instances at 1**: Eliminates cold starts for most users
2. **Use Cloud CDN**: Cache static assets at edge locations
3. **Enable CPU boost**: Faster cold starts when scaling
4. **Monitor memory**: Increase if seeing OOM errors
5. **Set up Cloud Scheduler**: Call `/api/warmup` every 25 minutes to keep cache fresh

## Cost Optimization

With current settings:
- **Min 1 instance**: Always running (~$40-50/month)
- **Auto-scaling**: Additional cost only during high traffic
- **Network**: Minimal (fetches from Google Sheets every 30 min)

To reduce costs:
- Set `min-instances` to 0 (but expect cold starts)
- Reduce memory to 256Mi if sufficient
- Use Cloud Scheduler to warm up only during business hours

## Example Cloud Scheduler Setup

Create a job to keep the cache warm:
```bash
gcloud scheduler jobs create http cache-warmup \
  --schedule="*/25 * * * *" \
  --uri="https://your-app.run.app/api/warmup" \
  --http-method=GET \
  --location=asia-southeast1
```

This calls the warmup endpoint every 25 minutes, ensuring the cache stays fresh.
