param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('QA01','QA02','QA03','QA04','QA05','QA06','QA07','QA08','QA09','QA10','QA11','QA12')]
    [string[]]$Accounts,
    [switch]$ProvisionTestAccounts
)

$ErrorActionPreference = 'Stop'
if (-not $ProvisionTestAccounts) {
    throw 'Required signup consent and provisioning need owner authorization. Supply -ProvisionTestAccounts only within that authorization.'
}
$qaRoot = Split-Path -Parent $PSScriptRoot
$qaNode = (Get-Command node -ErrorAction Stop).Source
$qaBatchId = 'batch-' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$qaBatchDir = Join-Path $qaRoot ('output/maestro/' + $qaBatchId)
New-Item -ItemType Directory -Path $qaBatchDir -Force | Out-Null
$qaBatchState = @{ kind = 'envitefy-maestro-account-batch'; accounts = $Accounts; results = @(); current = $null; startedAt = [DateTime]::UtcNow.ToString('o') }

function Save-QaBatchState {
    $qaBatchState | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $qaBatchDir 'state.json') -Encoding utf8
}
function Invoke-QaNode {
    param([string[]]$NodeArguments)
    $qaBatchState.current.stage = $NodeArguments -join ' '
    Save-QaBatchState
    & $qaNode @NodeArguments
    if ($LASTEXITCODE -ne 0) { throw "Maestro batch stopped: $($NodeArguments -join ' ') (exit $LASTEXITCODE). Inspect the saved account checkpoint before resuming." }
}

Push-Location -LiteralPath $qaRoot
try {
    foreach ($qaAccount in $Accounts) {
        $qaRunId = 'activity-' + $qaAccount + '-' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $qaBatchState.current = @{ account = $qaAccount; runId = $qaRunId; stage = 'signup'; status = 'running' }
        Save-QaBatchState
        Write-Output "Starting $qaAccount; run $qaRunId; batch $qaBatchId"
        $qaObserver = $null
        try {
            Invoke-QaNode -NodeArguments @('scripts/maestro-activity.mjs','--account',$qaAccount,'--step','switch-google-signup','--provision-test-account','--run',$qaRunId)
            Invoke-QaNode -NodeArguments @('scripts/maestro-google-setup.mjs','chrome-email','--account',$qaAccount)
            Invoke-QaNode -NodeArguments @('scripts/maestro-google-setup.mjs','chrome-password','--account',$qaAccount)
            $qaRunDir = Join-Path $qaRoot ('output/maestro/' + $qaRunId)
            $qaObserver = Start-Process -FilePath $qaNode -ArgumentList @('scripts/maestro-browser-observe.mjs',$qaRunId) -WorkingDirectory $qaRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $qaRunDir 'observer-console.log') -RedirectStandardError (Join-Path $qaRunDir 'observer-error.log') -PassThru
            foreach ($qaStage in @('google-app-consent','verify-account','enter-snap','open-snap-picker','scan-upload','dashboard-persistence','reopen-saved-event')) {
                if ($qaStage -eq 'enter-snap') {
                    $qaObserver.Refresh()
                    if ($qaObserver.HasExited) { throw 'Chrome diagnostics exited before Snap; inspect observer-error.log and resume without repeating any saved creation.' }
                }
                Invoke-QaNode -NodeArguments @('scripts/maestro-activity.mjs','--account',$qaAccount,'--step',$qaStage,'--run',$qaRunId)
            }
            Invoke-QaNode -NodeArguments @('scripts/maestro-activity-verify.mjs',$qaRunId)
            Invoke-QaNode -NodeArguments @('scripts/maestro-activity-finalize.mjs',$qaRunId)
            $qaBatchState.current.status = 'activity_verified'
            $qaBatchState.results += $qaBatchState.current.Clone()
            Save-QaBatchState
        } finally {
            if ($qaObserver) {
                $qaObserver.Refresh()
                if (-not $qaObserver.HasExited) { Stop-Process -Id $qaObserver.Id }
            }
        }
    }
    $qaBatchState.status = 'finished'
    Save-QaBatchState
} catch {
    $qaBatchState.status = 'stopped_requires_inspection'
    if ($qaBatchState.current) { $qaBatchState.current.status = 'stopped_requires_inspection' }
    $qaBatchState.error = $_.Exception.Message
    Save-QaBatchState
    throw
} finally {
    Pop-Location
}
