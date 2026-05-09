# Deployment Guide - Netra Terminal

This guide explains how to redeploy the Netra Terminal (Frontend) after making changes.

## Git Deployment

### 1. Commit Changes
Commit your changes to your local git repository:
```bash
git add .
git commit -m "Update netra terminal"
```

### 2. Push to GitHub
```bash
git push origin master
```
*(Note: Replace `master` with `main` if that is your default branch name on GitHub).*

## Docker Deployment

### 1. Build Docker Image
```bash
docker build -t netra-terminal .
```

### 2. Run Docker Container Locally
```bash
docker run -p 5173:5173 --env-file .env netra-terminal
```
This will start the frontend on port 5173, reading environment variables from your `.env` file.
