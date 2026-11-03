@echo off
title Cai dat - Halken nhac Babie hoc tieng Trung
color DF
echo.
echo    ======================================================
echo       Dang cai "Halken nhac Babie hoc tieng Trung" ...
echo       Doi xiu xiu nha, khong can lam gi het  ^<3
echo    ======================================================
echo.
set "BB_SELF=%~f0"
set "BB_TMP=%TEMP%\BabieHocTiengTrung_%RANDOM%%RANDOM%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $f=[IO.File]::ReadAllLines($env:BB_SELF); $i=[Array]::IndexOf($f,'::PAYLOAD::'); $b=[Convert]::FromBase64String(($f[($i+1)..($f.Length-1)] -join '')); New-Item -ItemType Directory -Force -Path $env:BB_TMP | Out-Null; $z=Join-Path $env:BB_TMP 'p.zip'; [IO.File]::WriteAllBytes($z,$b); Expand-Archive -Force -Path $z -DestinationPath (Join-Path $env:BB_TMP 'x')"
if errorlevel 1 (
  echo.
  echo    Co loi khi giai nen. Chup man hinh nay gui anh Halken nha.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File "%BB_TMP%\x\On_Tieng_Trung\he_thong\cai_dat_tu_dong.ps1" -Src "%BB_TMP%\x\On_Tieng_Trung"
rmdir /s /q "%BB_TMP%" 2>nul
exit /b 0
::PAYLOAD::
