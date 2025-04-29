#!/bin/bash

# Check if a commit message was provided
if [ -z "$1" ]; then
  echo "Error: Please provide a commit message."
  echo "Usage: ./deploy.sh \"Your commit message here\""
  exit 1
fi

# Store the commit message
COMMIT_MESSAGE="$1"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process...${NC}"

# Build the application
echo -e "${YELLOW}Building the application...${NC}"
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Error: Build failed. Aborting deployment."
  exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Add all changes to git
echo -e "${YELLOW}Adding changes to git...${NC}"
git add .

# Commit with the provided message
echo -e "${YELLOW}Committing changes with message: ${NC}\"$COMMIT_MESSAGE\""
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push origin main

# Check if push was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to push to GitHub. Please check your network connection and repository access."
  exit 1
fi

echo -e "${GREEN}✓ Successfully deployed to GitHub!${NC}"
echo -e "${GREEN}Commit message: ${NC}\"$COMMIT_MESSAGE\"" 