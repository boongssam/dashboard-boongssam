@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist node_modules (
  echo 처음 실행이라 필요한 패키지를 설치합니다. 잠시만 기다려주세요...
  call npm install
)

start "" /min cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"

echo 서버를 시작합니다. 이 창을 닫으면 대시보드도 꺼집니다.
npm run dev
