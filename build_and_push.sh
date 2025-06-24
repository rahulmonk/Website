#!/bin/bash

echo "🚀 Starting deployment script..."

# --- Step 1: Define the project path ---
# This makes the script runnable from anywhere (like a cron job)
# It finds the directory where the script itself is located.
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# --- Step 2: Run the Python build script using the venv ---
# This explicitly calls the python executable inside the virtual environment,
# so you don't need to activate it first.
echo "Building site with Python from venv..."
"$SCRIPT_DIR/venv/bin/python3" "$SCRIPT_DIR/build.py"
echo "Site build complete."


# --- Step 3: Add all changes to Git ---
# This includes the newly generated files in /docs and any changes to content.
echo "Adding changes to Git..."
# Navigate to the git repo directory before running git commands
cd "$SCRIPT_DIR"
git add .

# --- Step 4: Commit the changes ---
# We'll use a standard message with the current date and time.
echo "Committing changes..."
# The `|| true` part ensures the script doesn't exit if there's nothing to commit.
git commit -m "Automated build: $(date)" || true

# --- Step 5: Push the changes to GitHub ---
echo "Pushing changes to GitHub..."
git push

echo "✅ Deployment complete!"
