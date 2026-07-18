@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\vite\bin\vite.js" (
  echo Installing website dependencies...
  call npm install
  if errorlevel 1 (
    echo Installation failed. Please check Node.js and npm.
    pause
    exit /b 1
  )
)

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4178/' -UseBasicParsing -TimeoutSec 1; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  start "UI Pattern Atlas Server" /min cmd /c "npm run dev -- --port 4178"
)

powershell -NoProfile -Command "$end=(Get-Date).AddSeconds(15); do { try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:4178/' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 300 } while ((Get-Date) -lt $end); exit 1"
if errorlevel 1 (
  echo The website server did not start. Keep this window open and check the message above.
  pause
  exit /b 1
)

start "" "http://127.0.0.1:4178/"
exit /b 0
