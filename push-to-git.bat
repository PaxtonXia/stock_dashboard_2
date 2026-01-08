@echo off
REM ============================================
REM Push project to Git repository script
REM ============================================
REM Usage:
REM 1. Make sure Git is installed
REM 2. Run this script: push-to-git.bat
REM 3. Enter commit message when prompted

echo ============================================
echo Start pushing project to Git repository
echo ============================================

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed or not in PATH
    exit /b 1
)

echo Current Git repository information:
git remote -v
echo.

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="" (
    echo Warning: Not in a Git repository or cannot determine current branch
    set CURRENT_BRANCH=main
)
echo Current branch: %CURRENT_BRANCH%

REM Show status
echo Checking Git status...
git status --short
echo.

REM Ask to continue
echo Continue with push? (Y/n)
set /p CONTINUE=
if /i not "%CONTINUE%"=="y" if /i not "%CONTINUE%"=="" (
    echo Operation cancelled
    exit /b 0
)

REM Get commit message
echo Please enter commit message (press Enter for default):
set DEFAULT_MSG="%date%"
echo Default commit message: %DEFAULT_MSG%
set /p COMMIT_MSG=
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=%DEFAULT_MSG%
)

echo.
echo Step 1: Adding all changes to staging area...
git add .
if errorlevel 1 (
    echo Error: Failed to add files to staging area
    exit /b 1
)
echo Files added to staging area

echo.
echo Step 2: Committing changes...
git commit -m %COMMIT_MSG%
if errorlevel 1 (
    echo Warning: Commit failed or no changes to commit
    echo Continue with push? (Y/n)
    set /p CONTINUE_PUSH=
    if /i not "%CONTINUE_PUSH%"=="y" if /i not "%CONTINUE_PUSH%"=="" (
        echo Operation cancelled
        exit /b 0
    )
) else (
    echo Changes committed
)

echo.
echo Step 3: Pulling latest changes from remote...
git pull origin %CURRENT_BRANCH%
if errorlevel 1 (
    echo Warning: Failed to pull remote changes, attempting to continue...
)

echo.
echo Step 4: Pushing to remote repository...
git push origin %CURRENT_BRANCH%
if errorlevel 1 (
    echo Error: Failed to push to remote repository
    echo Try force push? (y/N)
    set /p FORCE_PUSH=
    if /i "%FORCE_PUSH%"=="y" (
        echo Force pushing to remote repository...
        git push --force origin %CURRENT_BRANCH%
        if errorlevel 1 (
            echo Error: Force push failed
            exit /b 1
        )
        echo Force push successful
    ) else (
        exit /b 1
    )
) else (
    echo Push successful!
)

echo.
echo ============================================
echo Push completed!
echo ============================================
echo Project successfully pushed to Git repository
echo Branch: %CURRENT_BRANCH%
echo Remote: origin
echo.
echo Repository URL:
echo https://github.com/PaxtonXia/stock_dashboard_2.git
echo ============================================

REM Show latest commit
echo.
echo Latest commit:
git log --oneline -1

pause
