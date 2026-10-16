param([switch]$WithPostgres)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$version = '2.11.0'
$install = Join-Path $repo ".tools/maestro/$version"
$binary = Join-Path $install 'maestro/bin/maestro.bat'
if (-not (Test-Path -LiteralPath $binary)) {
  $downloads = Join-Path $repo '.tools/maestro/downloads'
  New-Item -ItemType Directory -Force -Path $downloads | Out-Null
  $archive = Join-Path $downloads "maestro-$version.zip"
  Invoke-WebRequest -Uri "https://github.com/mobile-dev-inc/Maestro/releases/download/cli-$version/maestro.zip" -OutFile $archive -TimeoutSec 300
  Expand-Archive -LiteralPath $archive -DestinationPath $install -Force
}
if ($WithPostgres -and -not (Test-Path -LiteralPath (Join-Path $repo '.tools/postgres/node_modules/@embedded-postgres/windows-x64/native/bin/initdb.exe'))) {
  & npm install --prefix (Join-Path $repo '.tools/postgres') --no-audit --no-fund '@embedded-postgres/windows-x64@18.4.0-beta.17'
  if ($LASTEXITCODE -ne 0) { throw 'Portable PostgreSQL installation failed.' }
}
$localHome = Join-Path $repo 'qa-artifacts/maestro/home'
New-Item -ItemType Directory -Force -Path $localHome | Out-Null
$env:JAVA_OPTS = "-Duser.home=$($localHome.Replace('\','/'))"
$env:MAESTRO_CLI_NO_ANALYTICS = '1'
$env:MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED = 'true'
& $binary --version
if ($LASTEXITCODE -ne 0) { throw 'Maestro verification failed. Check Java 17+ and JAVA_HOME.' }
Write-Output "Installed in $install. Use npm run test:maestro; no global PATH changes are required."
