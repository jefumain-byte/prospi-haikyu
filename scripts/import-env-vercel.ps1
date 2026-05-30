$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root '.env'

if (-not (Test-Path $envFile)) {
  throw ".env not found at $envFile"
}

$lines = Get-Content $envFile
$targets = @('production', 'preview', 'development')

foreach ($line in $lines) {
  $trimmed = $line.Trim()
  if ($trimmed -eq '' -or $trimmed.StartsWith('#')) { continue }

  $eq = $trimmed.IndexOf('=')
  if ($eq -lt 1) { continue }

  $name = $trimmed.Substring(0, $eq).Trim()
  $value = $trimmed.Substring($eq + 1).Trim()

  if ($name -eq '' -or $value -eq '') {
    Write-Host "Skip empty: $name"
    continue
  }

  if ($value -match '^https://YOUR_PROJECT' -or $value -match 'YOUR_KEY' -or $value -eq 'your-id' -or $value -eq 'your-password') {
    Write-Host "Skip placeholder: $name (edit .env first)"
    continue
  }

  foreach ($target in $targets) {
    Write-Host "Adding $name ($target) ..."
    $value | vercel env add $name $target
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to add $name for $target"
    }
  }
}

Write-Host 'Import complete.'
