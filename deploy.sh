#!/bin/bash
cd /Users/natsus/Desktop/sns
echo "Current git status:"
git status
echo "Adding all changes..."
git add -A
echo "Committing changes..."
git commit -m "Fix configuration conflicts and type issues"
echo "Pushing to GitHub..."
git push origin main
