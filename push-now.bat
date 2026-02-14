@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo === Cupidudu -> GitHub 푸시 ===
echo 저장소: https://github.com/jsesienna-ux/cupidudu.git
echo.

git --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Git이 설치되어 있지 않습니다.
    echo.
    echo 1. https://git-scm.com/download/win 에서 Git 설치
    echo 2. 설치 후 이 파일을 다시 실행해주세요.
    echo.
    start https://git-scm.com/download/win
    pause
    exit /b 1
)

if not exist .git (
    echo 1. Git 초기화...
    git init
)

echo 2. 원격 저장소 연결...
git remote remove origin 2>nul
git remote add origin https://github.com/jsesienna-ux/cupidudu.git

echo 3. 파일 추가...
git add .

echo 4. 커밋...
git commit -m "Initial commit: Cupidudu 앱" 2>nul

echo 5. main 브랜치 설정...
git branch -M main

echo 6. GitHub에 푸시...
git push -u origin main

echo.
echo === 완료 ===
echo https://github.com/jsesienna-ux/cupidudu 에서 확인하세요.
pause
