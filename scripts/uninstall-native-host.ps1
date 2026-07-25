$ErrorActionPreference = "Stop"

$hostName = "com.promptbutler.window"
foreach ($registryPath in @(
  "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName",
  "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\$hostName"
)) {
  Remove-Item -LiteralPath $registryPath -Recurse -Force -ErrorAction SilentlyContinue
}

$installDirectory = Join-Path $env:LOCALAPPDATA "PromptButler\NativeHost"
Remove-Item -LiteralPath $installDirectory -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Prompt Butler window pin host uninstalled."
