@echo off
chcp 65001 >nul
setlocal

echo === Cupidudu GitHub 푸시 ===
echo.

if "%~1"=="" (
    echo 사용법: push-to-github.bat "https://github.com/사용자명/레포지토리명.git"
    echo.
    echo 예시: push-to-github.bat "https://github.com/miric/cupidudu.git"
    exit /b 1
)

set REPO_URL=%~1
cd /d "%~dp0"

echo 대상: %REPO_URL%
echo.

git --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Git이 설치되어 있지 않습니다.
    echo https://git-scm.com/download/win 에서 설치해주세요.
    pause
    exit /b 1
)

if not exist .git (
    echo 1. Git 초기화...
    git init
)

echo 2. 원격 저장소 연결...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo 3. 파일 추가...
git add .

echo 4. 커밋...
git commit -m "Initial commit: Cupidudu 앱" 2>nul
if errorlevel 1 (
    echo    (변경사항 없거나 이미 커밋됨)
)

echo 5. main 브랜치 설정...
git branch -M main

echo 6. GitHub에 푸시...
git push -u origin main

echo.
echo === 완료 ===
pause
