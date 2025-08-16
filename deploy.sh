#!/bin/bash

# Bash script to deploy Angular app to GitHub Pages

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -d "school-game" ]; then
    echo "❌ Error: school-game directory not found. Please run this from the root of the SchoolCity repository."
    exit 1
fi

echo "📦 Building Angular application..."
cd school-game
npm run build:prod

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "📝 Stashing any changes in main..."
cd ..
git add .
git stash

echo "🔄 Switching to gh-pages branch..."
git checkout gh-pages

if [ $? -ne 0 ]; then
    echo "📄 Creating gh-pages branch..."
    git checkout -b gh-pages
fi

echo "🗂️  Copying built files..."
# Remove old files (keep .git directory and important files)
find . -mindepth 1 -maxdepth 1 ! -name '.git' ! -name 'school-game' ! -name 'deploy.sh' ! -name 'deploy.ps1' ! -name 'README.md' -exec rm -rf {} +

# Copy new built files
cp -r school-game/dist/school-game/browser/* .

echo "💾 Committing changes..."
git add .
git commit -m "Deploy: Color hierarchy system update - $(date '+%Y-%m-%d %H:%M:%S')"

echo "📤 Pushing to GitHub..."
git push origin gh-pages

echo "🔄 Switching back to main branch..."
git checkout main

echo "📦 Restoring any stashed changes..."
git stash pop 2>/dev/null || true

echo "✅ Deployment complete! Your app should be available at:"
echo "🌐 https://mohitghodke.github.io/SchoolCity/"
echo ""
echo "🎨 Changes deployed:"
echo "   • Color hierarchy system implemented"
echo "   • Municipalities maintain consistent color themes"
echo "   • Areas use lighter shades of municipality colors"
echo "   • Units use darker shades of municipality colors"
echo ""
echo "🔧 Technical improvements:"
echo "   • Enhanced color generation algorithm"
echo "   • Better visual consistency across hierarchy levels"
echo "   • Improved user experience for municipal management"
