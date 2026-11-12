@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%b"
if "%BRANCH%"=="" (
    echo [ERROR] Not a git repository or git not found.
    pause
    exit /b 1
)

echo ========================================
echo  Merge to Main
echo  Current Branch: %BRANCH%
echo ========================================
echo.

where gh >nul 2>&1
if not errorlevel 1 (
    if /i not "%BRANCH%"=="main" (
        echo [INFO] Merging PR via GitHub CLI...
        gh pr merge "%BRANCH%" --merge --delete-branch
        if not errorlevel 1 (
            echo.
            echo [INFO] Switching to main and pulling latest changes...
            git checkout main
            git pull origin main
            echo.
            echo Successfully merged and synced main!
            pause
            exit /b 0
        )
        echo [WARN] gh pr merge failed or PR not approved. Falling back to local merge...
    )
)

if /i not "%BRANCH%"=="main" (
    set "MERGE_BRANCH=%BRANCH%"
) else (
    set /p "MERGE_BRANCH=Enter branch name to merge into main: "
)

if "%MERGE_BRANCH%"=="" (
    echo [ERROR] No branch specified.
    pause
    exit /b 1
)

echo.
echo [1/4] Switching to main...
git checkout main
if errorlevel 1 (
    echo [ERROR] Failed to checkout main. Check for uncommitted changes.
    pause
    exit /b 1
)

echo.
echo [2/4] Pulling latest origin/main...
git pull origin main

echo.
echo [3/4] Merging branch %MERGE_BRANCH% into main...
git merge "%MERGE_BRANCH%"
if errorlevel 1 (
    echo [ERROR] Merge conflict detected. Resolve conflicts manually and commit.
    pause
    exit /b 1
)

echo.
echo [4/4] Pushing updated main to origin...
git push origin main
if errorlevel 1 (
    echo [ERROR] Failed to push main to origin.
    pause
    exit /b 1
)

echo.
echo [OPTIONAL] Delete local branch %MERGE_BRANCH%? (Y/N)
set /p "DEL_CHOICE=> "
if /i "%DEL_CHOICE%"=="Y" (
    git branch -d "%MERGE_BRANCH%" 2>nul || git branch -D "%MERGE_BRANCH%"
)

echo.
echo Done! Branch %MERGE_BRANCH% merged into main.
pause
