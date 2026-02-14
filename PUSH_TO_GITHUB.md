# GitHub에 Cupidudu 올리기

## 사전 준비

### 1. Git 설치
- 설치되어 있지 않다면: https://git-scm.com/download/win
- 설치 후 터미널을 **다시 열어야** 합니다.

### 2. GitHub 레포지토리 생성
1. https://github.com/new 접속
2. 레포지토리 이름 입력 (예: `cupidudu`)
3. **Public** 선택
4. **"Add a README file" 체크 해제** (이미 로컬에 코드가 있으므로)
5. **Create repository** 클릭
6. 생성된 저장소 URL 복사 (예: `https://github.com/사용자명/cupidudu.git`)

---

## 방법 1: PowerShell 스크립트 (간편)

GitHub 주소를 넣고 아래 한 줄만 실행:

```powershell
cd C:\ui
# (필요 시 1회) 현재 세션에서만 스크립트 실행 허용
Set-ExecutionPolicy -Scope Process Bypass -Force
.\push-to-github.ps1 -RepoUrl "여기에_깃허브_주소_붙여넣기"
```

**예시:**
```powershell
.\push-to-github.ps1 -RepoUrl "https://github.com/miric/cupidudu.git"
```

---

## 방법 2: 직접 명령어 실행

```powershell
# 1. 프로젝트 폴더로 이동
cd C:\ui

# 2. Git 초기화
git init

# 3. 원격 저장소 연결 (본인 GitHub 주소로 변경)
git remote add origin https://github.com/사용자명/레포지토리명.git

# 4. 파일 추가
git add .

# 5. 커밋
git commit -m "Initial commit: Cupidudu 앱"

# 6. main 브랜치로 설정
git branch -M main

# 7. GitHub에 푸시
git push -u origin main
```

---

## 주의사항

- **.env.local**은 자동으로 제외됩니다 (비밀키 보호)
- 푸시 전 GitHub에 **빈 레포지토리**를 먼저 만들어야 합니다
- `git push` 시 GitHub 로그인(또는 토큰)이 필요할 수 있습니다
