# Render Deployment Guide

## Environment Variables for Render

When deploying to Render, set the following environment variables:

### Required Environment Variables:
- `DATABASE_URL`: `postgresql://pikachu:nZBILujlGA0eQuHXwc3swI4aJ0s3g2SE@dpg-d4b0bm6uk2gs739pnji0-a.oregon-postgres.render.com/projectnest`
- `APP_ENV`: `production`
- `LOG_LEVEL`: `info`
- `SERVER_HOST`: `0.0.0.0`
- `JWT_SECRET`: Generate a strong random secret (at least 32 characters)
- `CORS_ALLOWED_ORIGINS`: Your frontend domain(s), e.g., `https://yourapp.netlify.app`
- `GEMINI_API_KEY`: `AIzaSyDEn3AMm8LqR-soo8huGeztwF88cf66fYY`

### Optional Environment Variables:
- `PORT`: Render will automatically set this (usually 10000)

## Deployment Steps:

1. **Connect Repository**: 
   - Go to Render Dashboard
   - Create new Web Service
   - Connect your GitHub repository

2. **Configure Service**:
   - Name: `projectnest-backend`
   - Environment: `Docker`
   - Dockerfile Path: `./backend/Backend/Dockerfile`
   - Docker Context: `./backend/Backend`
   - Branch: `main`
   - Region: `Oregon` (same as your database)

3. **Set Environment Variables**:
   - Add all the environment variables listed above
   - Use the "Generate" option for JWT_SECRET for security

4. **Health Check**:
   - Health Check Path: `/health`
   - This endpoint returns the server status

5. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

## Database Connection:

The application is configured to use `DATABASE_URL` when available (production) and fall back to individual database components for local development.

## CORS Configuration:

Update `CORS_ALLOWED_ORIGINS` with your actual frontend domain once it's deployed.

## Local Development vs Production:

- **Local**: Uses individual DB environment variables (DB_HOST, DB_PORT, etc.)
- **Production**: Uses DATABASE_URL for the full connection string
- Both configurations are supported simultaneously

## Build Process:

The Dockerfile uses multi-stage build:
1. **Builder stage**: Downloads dependencies and compiles the Go application
2. **Final stage**: Creates a minimal Alpine Linux container with just the binary

## Monitoring:

- Health check endpoint: `GET /health`
- Logs are available in the Render dashboard
- Log level is set to `info` for production