param([switch]$Wait, [switch]$Visible)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:USERPROFILE 'AppData/Local/Android/Sdk' }
$avdRoot = Join-Path $repo '.tools/android/avd'
$avdName = 'Envitefy_Maestro_Play'
$avdPath = Join-Path $avdRoot "$avdName.avd"
$image = 'system-images;android-36.1;google_apis_playstore;x86_64'
if (-not (Test-Path -LiteralPath (Join-Path $sdk 'system-images/android-36.1/google_apis_playstore/x86_64/package.xml'))) {
  throw 'Install the Android 36.1 Google Play x86_64 system image in Android Studio SDK Manager first.'
}
New-Item -ItemType Directory -Force -Path $avdRoot | Out-Null
$env:ANDROID_AVD_HOME = $avdRoot
if (-not (Test-Path -LiteralPath (Join-Path $avdRoot "$avdName.ini"))) {
  'no' | & (Join-Path $sdk 'cmdline-tools/latest/bin/avdmanager.bat') create avd --name $avdName --package $image --device pixel_7 --path $avdPath
  if ($LASTEXITCODE -ne 0) { throw 'Android virtual device creation failed.' }
}
$configPath = Join-Path $avdPath 'config.ini'
$configText = Get-Content -LiteralPath $configPath -Raw
$configText = $configText -replace '(?m)^PlayStore.enabled\s*=.*$', 'PlayStore.enabled = yes'
$configText = $configText -replace '(?m)^avd.id\s*=.*$', "avd.id = $avdName"
$configText = $configText -replace '(?m)^avd.name\s*=.*$', "avd.name = $avdName"
Set-Content -LiteralPath $configPath -Value $configText
$registryPath = Join-Path $avdRoot "$avdName.ini"
$registryText = Get-Content -LiteralPath $registryPath -Raw
$registryText = $registryText -replace '(?m)^target=.*$', 'target=android-36.1'
Set-Content -LiteralPath $registryPath -Value $registryText
$adb = Join-Path $sdk 'platform-tools/adb.exe'
$connected = & $adb devices
if ($connected -match '^emulator-5556\s+') {
  $runningName = & $adb -s emulator-5556 emu avd name
  if ($runningName -notcontains $avdName) { throw 'emulator-5556 belongs to another AVD. It was not stopped or reused.' }
  Write-Output 'Maestro emulator is already running: emulator-5556'
  exit 0
}
$logs = Join-Path $repo 'qa-artifacts/maestro/android-emulator'
New-Item -ItemType Directory -Force -Path $logs | Out-Null
if ($Wait) {
  Write-Output 'Starting dedicated Google Play emulator emulator-5556. Keep this terminal running while using Maestro.'
  $windowArgs = if ($Visible) { @() } else { @('-no-window') }
  & (Join-Path $sdk 'emulator/emulator.exe') -avd $avdName -port 5556 @windowArgs -no-audio -no-snapshot -no-boot-anim -gpu auto
  exit $LASTEXITCODE
}
$process = Start-Process -FilePath (Join-Path $sdk 'emulator/emulator.exe') -ArgumentList @('-avd', $avdName, '-port', '5556', '-no-window', '-no-audio', '-no-snapshot', '-no-boot-anim', '-gpu', 'auto') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logs 'stdout.log') -RedirectStandardError (Join-Path $logs 'stderr.log')
Set-Content -LiteralPath (Join-Path $logs 'process-id.txt') -Value $process.Id
Write-Output "Started dedicated Google Play emulator emulator-5556 (PID $($process.Id)). Boot may take a minute. Maestro will use this device; no Google account login or app installation was performed."
