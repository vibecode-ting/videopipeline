@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%b"
if "%BRANCH%"=="" (
    echo [ERROR] Not a git repository or git not found.
    pause
    exit /b 1
)

if /i "%BRANCH%"=="main" (
    echo [ERROR] Never push directly to main! Checkout a feature branch first:
    echo         git checkout -b your-branch-name
    pause
    exit /b 1
)

echo ========================================
echo  Branch : %BRANCH%
echo ========================================
echo.

echo [1/2] Pushing branch to origin...
git push -u origin "%BRANCH%"
if errorlevel 1 (
    echo [ERROR] git push failed.
    pause
    exit /b 1
)

echo.
echo [2/2] Opening Pull Request...
where gh >nul 2>&1
if errorlevel 1 (
    echo [INFO] GitHub CLI ^(gh^) not found. Open PR manually on GitHub:
    echo        https://github.com/vibecode-ting/videopipeline/pull/new/%BRANCH%
    pause
    exit /b 0
)

gh pr view "%BRANCH%" >nul 2>&1
if errorlevel 1 (
    gh pr create --fill
    if errorlevel 1 (
        echo [WARN] Could not auto-create PR. Opening browser...
        gh pr create --web
    )
) else (
    echo [INFO] PR already exists for %BRANCH%:
    gh pr view "%BRANCH%" --web
)

echo.
echo Done!
pause
