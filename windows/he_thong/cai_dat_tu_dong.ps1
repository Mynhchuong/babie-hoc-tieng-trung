# Tu dong cai: chep vao Documents\Hoc tieng Trung, tao bieu tuong Desktop, bat nhac hoc 18:00, mo trang hoc
param([string]$Src)
Add-Type -AssemblyName System.Windows.Forms
$ErrorActionPreference = 'Stop'
try {
  # Cai vao thu muc KHONG DAU de Windows khong bi loi ten (OneDrive / Tai lieu co dau)
  $isAscii = { param($p) -not ($p -match '[^\x20-\x7E]') }
  $base = $env:LOCALAPPDATA
  if (-not (& $isAscii $base)) { $base = $env:SystemDrive + '\' }
  $dest = Join-Path $base 'BabieHocTiengTrung'
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Copy-Item -Path (Join-Path $Src '*') -Destination $dest -Recurse -Force
  Get-ChildItem -Path $dest -Recurse | Unblock-File -ErrorAction SilentlyContinue

  # Don ban cai loi lan truoc (neu co) trong Tai lieu
  $oldDir = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Hoc tieng Trung'
  if (Test-Path $oldDir) {
    foreach ($n in 'On_Tieng_Trung.html','Doi_gio_nhac_hoc.bat','he_thong','Quizlet_Sach1') {
      Remove-Item -LiteralPath (Join-Path $oldDir $n) -Recurse -Force -ErrorAction SilentlyContinue }
    if (-not (Get-ChildItem -LiteralPath $oldDir -Force)) { Remove-Item -LiteralPath $oldDir -Force -ErrorAction SilentlyContinue }
  }

  $html = Join-Path $dest 'On_Tieng_Trung.html'
  $ico  = Join-Path $dest 'he_thong\icon.ico'
  $png  = Join-Path $dest 'he_thong\icon.png'
  $vbs  = Join-Path $dest 'he_thong\nhac_hoc.vbs'
  $cfg  = Join-Path $dest 'he_thong\che_do.txt'

  # Tao shortcut voi ten tam khong dau trong thu muc cai, roi PowerShell doi ten co dau
  $ws = New-Object -ComObject WScript.Shell
  function New-Lnk($target, $args2, $name, $folder) {
    $tmp = Join-Path $dest ('tmp_' + [guid]::NewGuid().ToString('N') + '.lnk')
    $l = $ws.CreateShortcut($tmp)
    $l.TargetPath = $target
    if ($args2) { $l.Arguments = $args2 }
    $l.IconLocation = "$ico,0"
    $l.WorkingDirectory = $dest
    $l.Save()
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
    $final = Join-Path $folder $name
    Move-Item -LiteralPath $tmp -Destination $final -Force
    if (-not (Test-Path -LiteralPath $final)) { throw "Không tạo được biểu tượng ở: $folder" }
    return $final
  }

  # 1. Bieu tuong ngoai man hinh + trong menu Start
  $desk = [Environment]::GetFolderPath('Desktop')
  $deskLnk = New-Lnk $html '' 'Babie học tiếng Trung.lnk' $desk
  # Neu may co 2 Desktop (OneDrive + may), tao o ca hai cho chac
  $desk2 = Join-Path $env:USERPROFILE 'Desktop'
  if ((Test-Path $desk2) -and ((Resolve-Path $desk2).Path -ne (Resolve-Path $desk).Path)) { [void](New-Lnk $html '' 'Babie học tiếng Trung.lnk' $desk2) }
  $start = Join-Path ([Environment]::GetFolderPath('Programs')) 'Babie học tiếng Trung'
  [void](New-Lnk $html '' 'Babie học tiếng Trung.lnk' $start)
  [void](New-Lnk 'wscript.exe' ('"' + (Join-Path $dest 'he_thong\mo_cai_dat.vbs') + '"') 'Đổi giờ nhắc học.lnk' $start)

  # Bao Windows lam moi man hinh + icon ngay
  try {
    Add-Type -Namespace BB -Name Shell -MemberDefinition '[DllImport("shell32.dll")] public static extern void SHChangeNotify(int e, int f, IntPtr a, IntPtr b);'
    [BB.Shell]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
  } catch {}
  try { Start-Process -FilePath 'ie4uinit.exe' -ArgumentList '-show' -WindowStyle Hidden } catch {}

  # 2. Ten + icon cho thong bao Windows
  $k = 'HKCU:\Software\Classes\AppUserModelId\OnTiengTrung.NhacHoc'
  if (-not (Test-Path $k)) { New-Item -Path $k -Force | Out-Null }
  Set-ItemProperty -Path $k -Name 'DisplayName' -Value 'Halken nhắc Babie học tiếng Trung ♥'
  Set-ItemProperty -Path $k -Name 'IconUri' -Value $png
  if (-not (Test-Path $cfg)) { Set-Content -Path $cfg -Value 'toast' -Encoding ASCII }

  # 3. Nhac hoc moi ngay (giu gio cu neu da cai truoc do, mac dinh 18:00)
  $taskName = 'OnTiengTrung_NhacHoc'
  $old = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  $tr = if ($old) { $old.Triggers } else { New-ScheduledTaskTrigger -Daily -At ((Get-Date).Date.AddHours(18)) }
  $a = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"' + $vbs + '"')
  $set = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2)
  Register-ScheduledTask -TaskName $taskName -Action $a -Trigger $tr -Settings $set -Description 'Nhac hoc tieng Trung moi ngay' -Force | Out-Null
  $times = @((Get-ScheduledTask -TaskName $taskName).Triggers | ForEach-Object { ([datetime]$_.StartBoundary).ToString('HH:mm') }) -join ' và '

  $msg = "Cài xong rồi nè ♥`n`n" +
         "•  Biểu tượng nằm ở: $desk`n   (chưa thấy thì bấm chuột phải ngoài màn hình → Làm mới / Refresh)`n`n" +
         "•  Ngoài màn hình có biểu tượng hồng 'Babie học tiếng Trung' — bấm đúp vào là học.`n`n" +
         "•  Mỗi ngày lúc $times máy sẽ nhắc học tiếng Trung.`n`n" +
         "Bấm OK để mở luôn nha!"
  [void][System.Windows.Forms.MessageBox]::Show($msg, 'Halken nhắc Babie học tiếng Trung ♥', 'OK', 'Information')
  Start-Process -FilePath $html
} catch {
  [void][System.Windows.Forms.MessageBox]::Show("Có lỗi khi cài: $($_.Exception.Message)`n`nChụp màn hình này gửi anh Halken nha.", 'Lỗi cài đặt', 'OK', 'Error')
}
