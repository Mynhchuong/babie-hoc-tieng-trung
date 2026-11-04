# Cua so cai dat nhac hoc tieng Trung
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$taskName = 'OnTiengTrung_NhacHoc'
$appId    = 'OnTiengTrung.NhacHoc'
$vbs      = Join-Path $PSScriptRoot 'nhac_hoc.vbs'
$icon     = Join-Path $PSScriptRoot 'icon.png'
$cfg      = Join-Path $PSScriptRoot 'che_do.txt'

$pink  = [System.Drawing.Color]::FromArgb(224, 33, 138)
$soft  = [System.Drawing.Color]::FromArgb(255, 240, 247)
$plum  = [System.Drawing.Color]::FromArgb(90, 19, 64)
$white = [System.Drawing.Color]::White
function Pt($x, $y) { New-Object System.Drawing.Point($x, $y) }
function Sz($w, $h) { New-Object System.Drawing.Size($w, $h) }

$f = New-Object System.Windows.Forms.Form
$f.Text = 'Cài đặt nhắc học ♥'
$f.ClientSize = Sz 460 420
$f.StartPosition = 'CenterScreen'
$f.FormBorderStyle = 'FixedDialog'
$f.MaximizeBox = $false
$f.BackColor = $soft
$f.Font = New-Object System.Drawing.Font('Segoe UI', 11)
if (Test-Path $icon) { $f.Icon = [System.Drawing.Icon]::FromHandle(([System.Drawing.Bitmap]::FromFile($icon)).GetHicon()) }

function Lbl($text, $x, $y, $w, $h, $size, $bold, $color) {
  $l = New-Object System.Windows.Forms.Label
  $l.Text = $text; $l.Location = Pt $x $y; $l.Size = Sz $w $h; $l.ForeColor = $color
  $style = if ($bold) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
  $l.Font = New-Object System.Drawing.Font('Segoe UI', $size, $style)
  $f.Controls.Add($l); return $l
}
[void](Lbl 'Nhắc học tiếng Trung mỗi ngày ♥' 20 16 420 34 15 $true $pink)
[void](Lbl 'Đúng giờ, Windows hiện: "Anh người yêu nhắc em học tiếng Trung nè ♥"' 22 52 420 40 9.5 $false $plum)

[void](Lbl 'Nhắc lúc:' 24 104 170 28 11 $false $plum)
function New-Time($y, $h, $m) {
  $d = New-Object System.Windows.Forms.DateTimePicker
  $d.Format = 'Custom'; $d.CustomFormat = 'HH:mm'; $d.ShowUpDown = $true
  $d.Font = New-Object System.Drawing.Font('Segoe UI', 13)
  $d.Location = Pt 210 $y; $d.Size = Sz 110 32
  $d.Value = (Get-Date).Date.AddHours($h).AddMinutes($m)
  $f.Controls.Add($d); return $d
}
$t1 = New-Time 100 18 0
$c2 = New-Object System.Windows.Forms.CheckBox
$c2.Text = 'Nhắc thêm lần 2:'; $c2.ForeColor = $plum
$c2.Location = Pt 24 146; $c2.Size = Sz 180 30
$f.Controls.Add($c2)
$t2 = New-Time 142 21 0
$t2.Enabled = $false
$c2.Add_CheckedChanged({ $t2.Enabled = $c2.Checked })

[void](Lbl 'Kiểu nhắc:' 24 190 170 26 11 $false $plum)
$r1 = New-Object System.Windows.Forms.RadioButton
$r1.Text = 'Thông báo Windows (góc màn hình)'; $r1.ForeColor = $plum
$r1.Location = Pt 40 216; $r1.Size = Sz 400 28; $r1.Checked = $true
$r2 = New-Object System.Windows.Forms.RadioButton
$r2.Text = 'Bảng nhắc to giữa màn hình'; $r2.ForeColor = $plum
$r2.Location = Pt 40 244; $r2.Size = Sz 400 28
$f.Controls.AddRange(@($r1, $r2))
if ((Test-Path $cfg) -and ((Get-Content $cfg -Raw).Trim() -eq 'bang')) { $r2.Checked = $true }

$st = Lbl '' 24 278 420 26 10 $true $pink

function Update-Status {
  $old = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($old) {
    $times = @($old.Triggers | ForEach-Object { ([datetime]$_.StartBoundary).ToString('HH:mm') })
    $st.Text = 'Đang bật nhắc lúc: ' + ($times -join ', ')
    return $times
  }
  $st.Text = 'Chưa bật nhắc học.'
  return @()
}
$cur = @(Update-Status)
if ($cur.Count -ge 1) { $t1.Value = [datetime]::ParseExact($cur[0], 'HH:mm', $null) }
if ($cur.Count -ge 2) { $c2.Checked = $true; $t2.Value = [datetime]::ParseExact($cur[1], 'HH:mm', $null) }

function Save-Mode {
  $m = if ($r2.Checked) { 'bang' } else { 'toast' }
  Set-Content -Path $cfg -Value $m -Encoding ASCII
  $k = "HKCU:\Software\Classes\AppUserModelId\$appId"
  if (-not (Test-Path $k)) { New-Item -Path $k -Force | Out-Null }
  Set-ItemProperty -Path $k -Name 'DisplayName' -Value 'Halken nhắc Babie học tiếng Trung ♥'
  if (Test-Path $icon) { Set-ItemProperty -Path $k -Name 'IconUri' -Value $icon }
}

function New-Btn($text, $x, $y, $w, $primary) {
  $b = New-Object System.Windows.Forms.Button
  $b.Text = $text; $b.Location = Pt $x $y; $b.Size = Sz $w 42
  $b.FlatStyle = 'Flat'
  $b.Font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
  $b.Cursor = [System.Windows.Forms.Cursors]::Hand
  if ($primary) { $b.BackColor = $pink; $b.ForeColor = $white; $b.FlatAppearance.BorderSize = 0 }
  else { $b.BackColor = $white; $b.ForeColor = $pink; $b.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(247, 182, 214) }
  $f.Controls.Add($b); return $b
}
$bSave  = New-Btn 'Lưu && bật nhắc ♥' 20 312 205 $true
$bTest  = New-Btn 'Thử nhắc ngay' 235 312 205 $false
$bNoti  = New-Btn 'Mở cài đặt thông báo' 20 362 205 $false
$bOff   = New-Btn 'Tắt nhắc học' 235 362 205 $false

$bSave.Add_Click({
  try {
    Save-Mode
    $a = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"' + $vbs + '"')
    $tr = @(New-ScheduledTaskTrigger -Daily -At $t1.Value)
    if ($c2.Checked) { $tr += New-ScheduledTaskTrigger -Daily -At $t2.Value }
    $set = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2)
    Register-ScheduledTask -TaskName $taskName -Action $a -Trigger $tr -Settings $set -Description 'Nhac hoc tieng Trung moi ngay' -Force | Out-Null
    $times = @(Update-Status)
    [void][System.Windows.Forms.MessageBox]::Show("Xong rồi! Mỗi ngày lúc $($times -join ' và ') máy sẽ nhắc học tiếng Trung ♥`n`nBấm 'Thử nhắc ngay' để xem thử nha.`n(Nếu lúc đó máy tắt, mở máy lên sẽ nhắc bù.)", 'Nhắc học')
  } catch {
    [void][System.Windows.Forms.MessageBox]::Show("Không cài được: $($_.Exception.Message)", 'Lỗi')
  }
})
$bTest.Add_Click({ Save-Mode; Start-Process -FilePath 'wscript.exe' -ArgumentList ('"' + $vbs + '"') })
$bNoti.Add_Click({ Start-Process 'ms-settings:notifications' })
$bOff.Add_Click({
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  [void](Update-Status)
  [void][System.Windows.Forms.MessageBox]::Show('Đã tắt nhắc học.', 'Nhắc học')
})

[void]$f.ShowDialog()
