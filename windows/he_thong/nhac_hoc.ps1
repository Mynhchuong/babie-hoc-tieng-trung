# Nhac hoc tieng Trung - Task Scheduler goi luc 18:00, hien thong bao roi thoat ngay (rat nhe)
param([switch]$Bang)

$appId   = 'OnTiengTrung.NhacHoc'
$root    = Split-Path -Parent $PSScriptRoot
$html    = Join-Path $root 'On_Tieng_Trung.html'
$icon    = Join-Path $PSScriptRoot 'icon.png'
$cfg     = Join-Path $PSScriptRoot 'che_do.txt'
$tieuDe  = 'Anh người yêu nhắc em học tiếng Trung nè ♥'
$loi = @(
  'Học 15 phút thôi là giỏi lắm rồi nè ♥',
  'Mỗi ngày một chút, sang Đài Loan nói tiếng Trung như gió!',
  '加油！Cố lên nha bé ♥',
  'Ôn lại mấy từ hôm qua cho nhớ nha ♥',
  'Học xong anh thưởng một ly 珍珠奶茶 nè!',
  'Giữ chuỗi ngày học liên tiếp nha, đừng để đứt ♥',
  '今天也要努力喔！Hôm nay cũng cố gắng nha!'
)
$phu = $loi | Get-Random

function Register-App {
  # Dang ky ten + icon hien tren thong bao Windows
  $k = "HKCU:\Software\Classes\AppUserModelId\$appId"
  if (-not (Test-Path $k)) { New-Item -Path $k -Force | Out-Null }
  Set-ItemProperty -Path $k -Name 'DisplayName' -Value 'Halken nhắc Babie học tiếng Trung ♥'
  if (Test-Path $icon) { Set-ItemProperty -Path $k -Name 'IconUri' -Value $icon }
  Set-ItemProperty -Path $k -Name 'IconBackgroundColor' -Value 'FFE0218A'
}

function Show-Toast {
  Register-App
  [void][Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
  [void][Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]
  $esc  = { param($t) [System.Security.SecurityElement]::Escape($t) }
  $uri  = & $esc ([System.Uri]::new($html).AbsoluteUri)
  $img  = & $esc ([System.Uri]::new($icon).AbsoluteUri)
  $xmlText = @"
<toast scenario="reminder" activationType="protocol" launch="$uri">
  <visual>
    <binding template="ToastGeneric">
      <text>$(& $esc $tieuDe)</text>
      <text>$(& $esc $phu)</text>
      <image placement="appLogoOverride" hint-crop="circle" src="$img"/>
    </binding>
  </visual>
  <audio src="ms-winsoundevent:Notification.Reminder"/>
  <actions>
    <input id="snoozeTime" type="selection" defaultInput="10">
      <selection id="10" content="10 phút nữa"/>
      <selection id="30" content="30 phút nữa"/>
      <selection id="60" content="1 tiếng nữa"/>
    </input>
    <action activationType="protocol" arguments="$uri" content="Học ngay ♥"/>
    <action activationType="system" arguments="snooze" hint-inputId="snoozeTime" content="Nhắc lại sau"/>
  </actions>
</toast>
"@
  $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
  $xml.LoadXml($xmlText)
  $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
}

# ---------- Bang nhac to (du phong neu may khong hien thong bao) ----------
function Show-Bang {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing
  [System.Windows.Forms.Application]::EnableVisualStyles()
  $pink  = [System.Drawing.Color]::FromArgb(224, 33, 138)
  $white = [System.Drawing.Color]::White
  $f = New-Object System.Windows.Forms.Form
  $f.Text = 'Giờ học tiếng Trung ♥'
  $f.ClientSize = New-Object System.Drawing.Size(500, 220)
  $f.StartPosition = 'CenterScreen'; $f.TopMost = $true
  $f.FormBorderStyle = 'FixedDialog'; $f.MaximizeBox = $false; $f.MinimizeBox = $false
  $f.BackColor = [System.Drawing.Color]::FromArgb(255, 240, 247)
  $f.Tag = 'skip'
  if (Test-Path $icon) {
    $pic = New-Object System.Windows.Forms.PictureBox
    $pic.Image = [System.Drawing.Image]::FromFile($icon)
    $pic.SizeMode = 'Zoom'
    $pic.Location = New-Object System.Drawing.Point(20, 22)
    $pic.Size = New-Object System.Drawing.Size(90, 90)
    $f.Controls.Add($pic)
  }
  $t1 = New-Object System.Windows.Forms.Label
  $t1.Text = $tieuDe
  $t1.Font = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Bold)
  $t1.ForeColor = $pink
  $t1.Location = New-Object System.Drawing.Point(124, 26)
  $t1.Size = New-Object System.Drawing.Size(366, 60)
  $f.Controls.Add($t1)
  $t2 = New-Object System.Windows.Forms.Label
  $t2.Text = $phu
  $t2.Font = New-Object System.Drawing.Font('Segoe UI', 10.5)
  $t2.ForeColor = [System.Drawing.Color]::FromArgb(90, 19, 64)
  $t2.Location = New-Object System.Drawing.Point(126, 88)
  $t2.Size = New-Object System.Drawing.Size(360, 50)
  $f.Controls.Add($t2)
  $mk = {
    param($text, $x, $w, $primary)
    $b = New-Object System.Windows.Forms.Button
    $b.Text = $text
    $b.Location = New-Object System.Drawing.Point($x, 155)
    $b.Size = New-Object System.Drawing.Size($w, 42)
    $b.FlatStyle = 'Flat'
    $b.Font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
    if ($primary) { $b.BackColor = $pink; $b.ForeColor = $white; $b.FlatAppearance.BorderSize = 0 }
    else { $b.BackColor = $white; $b.ForeColor = $pink; $b.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(247, 182, 214) }
    $b
  }
  $b1 = & $mk 'Học ngay ♥' 20 160 $true
  $b2 = & $mk '10 phút nữa' 190 140 $false
  $b3 = & $mk 'Để sau' 340 140 $false
  $b1.Add_Click({ $f.Tag = 'hoc'; $f.Close() })
  $b2.Add_Click({ $f.Tag = 'snooze'; $f.Close() })
  $b3.Add_Click({ $f.Tag = 'skip'; $f.Close() })
  $f.Controls.AddRange(@($b1, $b2, $b3))
  $f.Add_Shown({ $f.Activate() })
  [System.Media.SystemSounds]::Asterisk.Play()
  [void]$f.ShowDialog()
  $r = $f.Tag; $f.Dispose(); return $r
}

$cheDo = 'toast'
if (Test-Path $cfg) { $cheDo = (Get-Content $cfg -Raw).Trim() }
if ($Bang) { $cheDo = 'bang' }

if ($cheDo -ne 'bang') {
  try { Show-Toast; exit 0 } catch { $cheDo = 'bang' }
}
while ($true) {
  $r = Show-Bang
  if ($r -eq 'hoc') { if (Test-Path $html) { Start-Process -FilePath $html }; break }
  elseif ($r -eq 'snooze') { Start-Sleep -Seconds 600 }
  else { break }
}
