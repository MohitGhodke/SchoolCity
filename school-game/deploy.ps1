Write-Host "Deploying to GitHub Pages..."

# Copy files from dist to current directory
Copy-Item "dist\school-game\*" . -Force -Recurse

# Git operations
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main

Write-Host "Deployment complete!"
