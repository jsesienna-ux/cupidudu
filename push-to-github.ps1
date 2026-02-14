# Cupidudu GitHub 푸시 스크립트
# 사용법: .\push-to-github.ps1 -RepoUrl "https://github.com/사용자명/레포지토리명.git"

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Cupidudu GitHub 푸시 ===" -ForegroundColor Cyan
Write-Host "대상 저장소: $RepoUrl" -ForegroundColor Gray
Write-Host ""

# 1. Git 설치 확인
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "오류: Git이 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "먼저 https://git-scm.com/download/win 에서 Git을 설치해주세요." -ForegroundColor Yellow
    exit 1
}

# 2. Git 초기화 (이미 되어 있으면 스킵)
if (-not (Test-Path .git)) {
    Write-Host "1. Git 저장소 초기화..." -ForegroundColor Green
    git init
} else {
    Write-Host "1. Git 저장소가 이미 있습니다." -ForegroundColor Gray
}

# 3. 원격 저장소 설정
Write-Host "2. 원격 저장소 연결..." -ForegroundColor Green
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    git remote set-url origin $RepoUrl
    Write-Host "   origin을 $RepoUrl 로 업데이트" -ForegroundColor Gray
} else {
    git remote add origin $RepoUrl
}

# 4. 변경사항 스테이징
Write-Host "3. 변경사항 스테이징..." -ForegroundColor Green
git add .

# 5. 커밋
Write-Host "4. 커밋 생성..." -ForegroundColor Green
$hasChanges = git status --porcelain 2>$null
if ($hasChanges) {
    git commit -m "Initial commit: Cupidudu 앱"
    if (-not $?) { Write-Host "   (변경사항 없음)" -ForegroundColor Gray }
} else {
    $hasCommit = git rev-parse HEAD 2>$null
    if (-not $hasCommit) {
        git commit -m "Initial commit: Cupidudu 앱" --allow-empty
    }
    Write-Host "   커밋할 변경사항이 없습니다." -ForegroundColor Gray
}

# 6. 브랜치 이름 설정 (main)
Write-Host "5. main 브랜치로 설정..." -ForegroundColor Green
git branch -M main

# 7. 푸시
Write-Host "6. GitHub에 푸시 중..." -ForegroundColor Green
git push -u origin main

Write-Host ""
Write-Host "=== 완료! ===" -ForegroundColor Green
Write-Host "저장소 주소: $RepoUrl" -ForegroundColor Cyan
