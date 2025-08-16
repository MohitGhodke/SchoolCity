# PowerShell script to deploy Angular app to GitHub Pages

Write-Host "Building Angular application..." -ForegroundColor Green
Set-Location "school-game"
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Stashing any changes in main..." -ForegroundColor Green
Set-Location ".."
git add .
git stash

Write-Host "Switching to gh-pages branch..." -ForegroundColor Green
git checkout gh-pages

Write-Host "Copying built files..." -ForegroundColor Green
# Remove old files (keep .git directory and deploy script)
Get-ChildItem -Path "." -Exclude ".git", "school-game", "deploy.ps1" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy new built files
Copy-Item -Path "school-game\dist\school-game\browser\*" -Destination "." -Recurse -Force

Write-Host "Committing changes..." -ForegroundColor Green
git add .
git commit -m "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push origin gh-pages

Write-Host "Switching back to main branch..." -ForegroundColor Green
git checkout main

Write-Host "Restoring any stashed changes..." -ForegroundColor Green
git stash pop 2>$null

Write-Host "Deployment complete! Your app should be available at:" -ForegroundColor Green
Write-Host "https://mohitghodke.github.io/SchoolCity/" -ForegroundColor Cyan
