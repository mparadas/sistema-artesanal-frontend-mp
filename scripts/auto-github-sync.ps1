# Sincroniza cambios locales con GitHub de forma periodica.
param(
    [int]$IntervalSeconds = 20,
    [string]$Branch = "main",
    [string]$Remote = "origin"
)

$ErrorActionPreference = "Stop"

function Write-Info($message) {
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $message"
}

try {
    git rev-parse --is-inside-work-tree | Out-Null
} catch {
    Write-Error "Este script debe ejecutarse dentro de un repositorio git."
    exit 1
}

Write-Info "Auto sync activo (cada $IntervalSeconds s) -> $Remote/$Branch"
Write-Info "Presiona Ctrl+C para detener."

while ($true) {
    try {
        git add -A

        git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            Start-Sleep -Seconds $IntervalSeconds
            continue
        }

        $commitMessage = "chore: auto sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git commit -m $commitMessage | Out-Host

        git push $Remote $Branch | Out-Host
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Push rechazado. Intentando pull --rebase..."
            git pull --rebase $Remote $Branch | Out-Host
            if ($LASTEXITCODE -eq 0) {
                git push $Remote $Branch | Out-Host
            } else {
                Write-Info "No se pudo rebasear automaticamente. Requiere revision manual."
            }
        } else {
            Write-Info "Cambios subidos correctamente."
        }
    } catch {
        Write-Info "Error durante sync: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds $IntervalSeconds
}
