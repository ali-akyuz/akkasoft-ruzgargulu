@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
  start "RuzgarGulu Local Server" cmd /k "cd /d ""%~dp0"" && py -3 -m http.server 8000 --bind 127.0.0.1"
  goto wait-for-server
)

where python >nul 2>nul
if not errorlevel 1 (
  start "RuzgarGulu Local Server" cmd /k "cd /d ""%~dp0"" && python -m http.server 8000 --bind 127.0.0.1"
  goto wait-for-server
)

echo Python bulunamadi. Python 3 kurun veya VS Code Live Server kullanin.
pause
exit /b 1

:wait-for-server
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(15); do { try { $response = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8000/'; if ($response.StatusCode -eq 200) { Start-Process 'http://127.0.0.1:8000/index.html'; exit 0 } } catch { }; Start-Sleep -Milliseconds 500 } while ((Get-Date) -lt $deadline); Write-Host 'Yerel sunucu baslatilamadi. Sunucu penceresindeki hata mesajini kontrol edin.'; pause; exit 1"
