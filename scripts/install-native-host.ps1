param(
  [string]$ExtensionId = "kacphaiefjcgokdfakpjdpjplfpnkpai"
)

$ErrorActionPreference = "Stop"

$hostName = "com.promptbutler.window"
$projectRoot = Split-Path -Parent $PSScriptRoot
$projectPath = Join-Path $projectRoot "native\PromptButler.TopMostHost\PromptButler.TopMostHost.csproj"
$publishDirectory = Join-Path $env:TEMP ("prompt-butler-native-host-" + [guid]::NewGuid().ToString("N"))
$installDirectory = Join-Path $env:LOCALAPPDATA "PromptButler\NativeHost"
$hostExecutable = Join-Path $installDirectory "PromptButler.TopMostHost.exe"
$hostManifest = Join-Path $installDirectory "$hostName.json"

try {
  dotnet publish $projectPath `
    --configuration Release `
    --runtime win-x64 `
    --self-contained false `
    -p:PublishSingleFile=true `
    --output $publishDirectory

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to build the window pin host."
  }

  New-Item -ItemType Directory -Path $installDirectory -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $publishDirectory "PromptButler.TopMostHost.exe") -Destination $hostExecutable -Force

  $manifest = [ordered]@{
    name = $hostName
    description = "Prompt Butler same-window topmost host"
    path = $hostExecutable
    type = "stdio"
    allowed_origins = @("chrome-extension://$ExtensionId/")
  }
  $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText(
    $hostManifest,
    ($manifest | ConvertTo-Json -Depth 3),
    $utf8WithoutBom
  )

  foreach ($registryPath in @(
    "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName",
    "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\$hostName"
  )) {
    New-Item -Path $registryPath -Force | Out-Null
    Set-Item -Path $registryPath -Value $hostManifest
  }

  Write-Host "Prompt Butler window pin host installed."
  Write-Host "Allowed extension ID: $ExtensionId"
  Write-Host "Reload the extension before testing."
}
finally {
  Remove-Item -LiteralPath $publishDirectory -Recurse -Force -ErrorAction SilentlyContinue
}
