# Cap nhat app tu mang: CHI thay file app (On_Tieng_Trung.html + file nghe), KHONG dung toi tien do hoc, gio nhac, bieu tuong.
# Chay ngam boi Task Scheduler moi 2 gio (chay_cap_nhat.vbs) hoac khi bam "Cap nhat app ngay" (mo_cap_nhat.vbs -> -Hien).
param([switch]$Hien)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # PowerShell 5.1: thanh tien trinh lam tai file rat cham
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = Split-Path -Parent $here
$log  = Join-Path $here 'cap_nhat.log'
$tmp  = Join-Path $dest '.cap_nhat_tmp'

function Log($m) {
  try {
    Add-Content -Path $log -Value ('{0:yyyy-MM-dd HH:mm:ss} {1}' -f (Get-Date), $m) -Encoding UTF8
    if ((Get-Item -LiteralPath $log).Length -gt 65536) { Get-Content -LiteralPath $log -Tail 100 | Set-Content -LiteralPath $log -Encoding UTF8 }
  } catch {}
}
function Hien-ThongBao($m, $icon) {
  if (-not $Hien) { return }
  try {
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show($m, 'Cập nhật Babie học tiếng Trung', 'OK', $icon)
  } catch {}
}

$mx = New-Object System.Threading.Mutex($false, 'Local\BabieHocTiengTrungCapNhat')
$coKhoa = $false
try {
  $coKhoa = $mx.WaitOne(0)
  if (-not $coKhoa) { Hien-ThongBao 'App đang được cập nhật rồi, đợi một chút nha ♥' 'Information'; return }

  $cfgPath = Join-Path $here 'cap_nhat.json'
  if (-not (Test-Path -LiteralPath $cfgPath)) { Log 'Chua co cap_nhat.json'; Hien-ThongBao 'Bản cài này chưa bật tự cập nhật.' 'Information'; return }
  $cfg = Get-Content -LiteralPath $cfgPath -Raw | ConvertFrom-Json
  $base = ([string]$cfg.url).Trim().TrimEnd('/')
  if (-not $base) { Log 'cap_nhat.json khong co url'; Hien-ThongBao 'Bản cài này chưa bật tự cập nhật.' 'Information'; return }

  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $r = Invoke-WebRequest -Uri ($base + '/manifest.json?t=' + $stamp) -UseBasicParsing -TimeoutSec 10
  $txt = if ($r.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($r.Content) } else { [string]$r.Content }
  $man = $txt.TrimStart([char]0xFEFF) | ConvertFrom-Json
  $files = @($man.files)
  if (-not $man.ver -or $files.Count -eq 0) { throw 'manifest.json khong hop le' }

  # Chi nhan dung 2 loai file: trang app va file nghe (chong ten file la)
  foreach ($f in $files) {
    if ($f.p -notmatch '^(On_Tieng_Trung\.html|audio/[A-Za-z0-9_\-\.]+)$' -or $f.p -match '\.\.' -or $f.h -notmatch '^[0-9A-Fa-f]{64}$') { throw ('muc khong hop le trong manifest: ' + $f.p) }
  }
  if (-not ($files | Where-Object { $_.p -eq 'On_Tieng_Trung.html' })) { throw 'manifest thieu On_Tieng_Trung.html' }

  # File nao khac ban tren mang (hoac chua co) thi can tai
  $can = @()
  foreach ($f in $files) {
    $lp = Join-Path $dest ($f.p -replace '/', '\')
    $giong = $false
    if (Test-Path -LiteralPath $lp) { $giong = ((Get-FileHash -LiteralPath $lp -Algorithm SHA256).Hash -eq $f.h.ToUpper()) }
    if (-not $giong) { $can += $f }
  }
  if ($can.Count -eq 0) { Log ('Da la ban moi nhat: ' + $man.ver); Hien-ThongBao ('Đang là bản mới nhất rồi ♥' + "`n" + '(' + $man.ver + ')') 'Information'; return }

  # Tai vao thu muc tam + kiem tra ma SHA256 tung file; loi o dau thi bo, KHONG dung toi ban dang dung
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  $i = 0
  foreach ($f in $can) {
    $i++
    $t = Join-Path $tmp ('f' + $i + '.tmp')
    Invoke-WebRequest -Uri ($base + '/' + $f.p + '?v=' + $man.ver) -OutFile $t -UseBasicParsing -TimeoutSec 120
    if ((Get-FileHash -LiteralPath $t -Algorithm SHA256).Hash -ne $f.h.ToUpper()) { throw ('file tai ve bi loi: ' + $f.p) }
    $f | Add-Member -NotePropertyName tmpPath -NotePropertyValue $t -Force
  }

  # Thay file: file nghe truoc, trang app sau cung (giu .bak ban cu cua trang app)
  $thuTu = @($can | Where-Object { $_.p -ne 'On_Tieng_Trung.html' }) + @($can | Where-Object { $_.p -eq 'On_Tieng_Trung.html' })
  foreach ($f in $thuTu) {
    $lp = Join-Path $dest ($f.p -replace '/', '\')
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $lp) | Out-Null
    if ($f.p -eq 'On_Tieng_Trung.html' -and (Test-Path -LiteralPath $lp)) { Copy-Item -LiteralPath $lp -Destination ($lp + '.bak') -Force }
    Move-Item -LiteralPath $f.tmpPath -Destination $lp -Force
  }

  # Xoa file nghe cu da bi go khoi ban moi (chi trong thu muc audio)
  $localMan = Join-Path $here 'manifest_local.json'
  if (Test-Path -LiteralPath $localMan) {
    try {
      $cu = @((Get-Content -LiteralPath $localMan -Raw | ConvertFrom-Json).files)
      $moi = @($files | ForEach-Object { $_.p })
      foreach ($f in $cu) {
        if ($f.p -match '^audio/[A-Za-z0-9_\-\.]+$' -and ($moi -notcontains $f.p)) { Remove-Item -LiteralPath (Join-Path $dest ($f.p -replace '/', '\')) -Force -ErrorAction SilentlyContinue }
      }
    } catch {}
  }
  Set-Content -LiteralPath $localMan -Value $txt -Encoding UTF8

  Log ('Da cap nhat len ban ' + $man.ver + ' (' + $can.Count + ' file)')
  Hien-ThongBao ('Đã cập nhật app lên bản mới ♥' + "`n`n" + 'Mở lại app (hoặc bấm F5 nếu đang mở) để dùng bản mới. Tiến độ học vẫn còn nguyên nha.') 'Information'
} catch {
  Log ('LOI: ' + $_.Exception.Message)
  Hien-ThongBao ('Chưa cập nhật được (có thể máy chưa có mạng). Thử lại sau nha.' + "`n`n" + $_.Exception.Message) 'Warning'
} finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
  if ($coKhoa) { try { $mx.ReleaseMutex() } catch {} }
}
