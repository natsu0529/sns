# Vercel Environment Variables Setup Guide

## Required Environment Variables for Production

Set these in your Vercel dashboard (Settings > Environment Variables):

### NextAuth.js Configuration
```
NEXTAUTH_SECRET=your-production-secret-key-min-32-characters
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### Database Configuration
```
DATABASE_URL=./sns.db
```

## Setup Instructions

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add each variable above with appropriate production values
3. Set Environment: Production, Preview, Development (as needed)
4. Redeploy your application

## Security Notes

- NEXTAUTH_SECRET must be at least 32 characters long
- Use a secure random string generator for production secrets
- Never commit .env.local to version control
- Each environment (dev/preview/prod) should have different secrets

## Generate Secure Secret

You can generate a secure secret using:
```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32
