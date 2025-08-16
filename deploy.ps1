# PowerShell script to deploy Angular app to GitHub Pages

Write-Host "Building Angular application..." -ForegroundColor Green
Set-Location "school-game"
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Switching to gh-pages branch..." -ForegroundColor Green
Set-Location ".."
git checkout gh-pages

Write-Host "Copying built files..." -ForegroundColor Green
# Remove old files (keep .git directory)
Get-ChildItem -Path "." -Exclude ".git", "school-game", "deploy.ps1" | Remove-Item -Recurse -Force

# Copy new built files
Copy-Item -Path "school-game\dist\school-game\browser\*" -Destination "." -Recurse -Force

Write-Host "Committing changes..." -ForegroundColor Green
git add .
git commit -m "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push origin gh-pages

Write-Host "Switching back to main branch..." -ForegroundColor Green
git checkout main

Write-Host "Deployment complete! Your app should be available at:" -ForegroundColor Green
Write-Host "https://mohitghodke.github.io/SchoolCity/" -ForegroundColor Cyan
