# Creates a NEW upload key only. It never replaces existing signing material.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$androidRoot = Split-Path $PSScriptRoot -Parent
$signingDirectory = Join-Path $androidRoot '.signing'
$signingProperties = Join-Path $androidRoot 'signing.properties'
$keyPath = Join-Path $signingDirectory 'envitefy-upload.p12'
$certificatePath = Join-Path $signingDirectory 'envitefy-upload.cer'

if ((Test-Path -LiteralPath $signingDirectory) -or (Test-Path -LiteralPath $signingProperties)) {
    throw 'Signing material already exists. Reuse it or restore your backup; this script will not replace it.'
}
if ($env:OS -ne 'Windows_NT') {
    throw 'This setup script protects files with Windows ACLs. On other systems configure signing.properties manually.'
}
$keytool = (Get-Command keytool.exe -ErrorAction Stop).Source
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
New-Item -ItemType Directory -Path $signingDirectory | Out-Null
$directoryAcl = Get-Acl -LiteralPath $signingDirectory
$directoryAcl.SetAccessRuleProtection($true, $false)
$directoryAcl.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new(
    $identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'))
Set-Acl -LiteralPath $signingDirectory -AclObject $directoryAcl

# Persist recovery information before key generation so an interrupted run does
# not leave an unrecoverable key. No passwords are passed on the command line.
New-Item -ItemType File -Path $signingProperties | Out-Null
$fileAcl = Get-Acl -LiteralPath $signingProperties
$fileAcl.SetAccessRuleProtection($true, $false)
$fileAcl.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new($identity, 'FullControl', 'Allow'))
Set-Acl -LiteralPath $signingProperties -AclObject $fileAcl
$randomBytes = New-Object byte[] 48
$generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$generator.GetBytes($randomBytes)
$generator.Dispose()
$password = [Convert]::ToBase64String($randomBytes)
@(
    'storeFile=.signing/envitefy-upload.p12'
    "storePassword=$password"
    'keyAlias=envitefy-upload'
    "keyPassword=$password"
) | Set-Content -LiteralPath $signingProperties -Encoding ascii

try {
    $env:ENVITEFY_KEYGEN_PASSWORD = $password
    & $keytool -genkeypair -keystore $keyPath -storetype PKCS12 -alias envitefy-upload -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Envitefy Upload, O=Envitefy' -storepass:env ENVITEFY_KEYGEN_PASSWORD -keypass:env ENVITEFY_KEYGEN_PASSWORD
    if ($LASTEXITCODE -ne 0) { throw 'Upload key generation failed. Retain the signing directory and properties for recovery.' }
    & $keytool -exportcert -keystore $keyPath -alias envitefy-upload -storepass:env ENVITEFY_KEYGEN_PASSWORD -file $certificatePath
    if ($LASTEXITCODE -ne 0) { throw 'Public certificate export failed. The upload key was retained.' }
} finally {
    Remove-Item Env:ENVITEFY_KEYGEN_PASSWORD -ErrorAction SilentlyContinue
    $password = $null
    [Array]::Clear($randomBytes, 0, $randomBytes.Length)
}
Write-Output 'Created the upload key and public certificate in android/.signing/.'
Write-Output 'Back up android/.signing/ AND android/signing.properties in your secure vault before uploading a release.'
