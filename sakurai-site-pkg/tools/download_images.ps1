# Windows用: このファイルを右クリック→「PowerShellで実行」
# サイトフォルダ直下の images/ に全画像を保存します
$list = Get-Content "$PSScriptRoot\images_list.txt"
$dir = Join-Path (Split-Path $PSScriptRoot) "images"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
foreach ($url in $list) {
  $name = Split-Path $url -Leaf
  Invoke-WebRequest -Uri $url -OutFile (Join-Path $dir $name)
  Write-Host "saved: $name"
}
Write-Host "完了: $($list.Count) 枚"
