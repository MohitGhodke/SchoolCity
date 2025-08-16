Write-Host "Deploying to GitHub Pages..."

# Copy files from dist/school-game/browser to current directory (to restore original URL structure)
Copy-Item "dist\school-game\browser\*" . -Force -Recurse

# Git operations
git add .
git commit -m "Deploy to GitHub Pages - Fixed URL structure"
git push origin main

Write-Host "Deployment complete!"
