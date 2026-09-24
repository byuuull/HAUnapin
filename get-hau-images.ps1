# Downloads Holy Angel University's campus map and history photos from hau.edu.ph
# into images/hau/ so the site shows them even offline.
# Windows: right-click this file > Run with PowerShell  (or double-click get-hau-images.bat)
$ErrorActionPreference = 'Continue'
$dest = Join-Path $PSScriptRoot 'images\hau'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$files = @(
  'https://www.hau.edu.ph/upload/history/HAA_1933_pioneerstudents.png',
  'https://www.hau.edu.ph/upload/history/HAC_MGN.png',
  'https://www.hau.edu.ph/images/haucampusmap_2022.jpg',
  'https://www.hau.edu.ph/upload/history/SFJ_2008.png',
  'https://www.hau.edu.ph/upload/history/MGN_2004.png',
  'https://www.hau.edu.ph/upload/history/PGN_2014.png',
  'https://www.hau.edu.ph/upload/history/epiphanyofangels_2013.png'
)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
foreach ($url in $files) {
  $name = Split-Path $url -Leaf
  try {
    Invoke-WebRequest -Uri $url -OutFile (Join-Path $dest $name) -UseBasicParsing
    Write-Host "Saved $name"
  } catch {
    Write-Host "Couldn't download $name ($($_.Exception.Message))"
  }
}
Write-Host "Done. Images are in images\hau"
Read-Host 'Press Enter to close'
