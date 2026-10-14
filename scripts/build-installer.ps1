$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$stageDir = Join-Path $repoRoot 'build\installer\app'
$outputDir = Join-Path $repoRoot 'dist'
$installerScript = Join-Path $repoRoot 'installer\ytm-bridge.iss'

if (Test-Path $stageDir) {
    Remove-Item -LiteralPath $stageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stageDir -Force | Out-Null
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

Copy-Item (Join-Path $repoRoot 'server.js') $stageDir
$sourcePackage = Get-Content (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json
$stagedPackage = @{
    name = $sourcePackage.name
    version = $sourcePackage.version
    private = $true
    type = 'commonjs'
    dependencies = $sourcePackage.dependencies
}
$stagedPackage | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $stageDir 'package.json') -Encoding utf8
Copy-Item (Join-Path $repoRoot 'package-lock.json') $stageDir

$nodeExecutable = (& node -p 'process.execPath').Trim()
if (-not (Test-Path $nodeExecutable)) {
    throw "Could not locate the Node.js executable at '$nodeExecutable'."
}
$nodeArchitecture = (& node -p 'process.arch').Trim()
if ($nodeArchitecture -ne 'x64') {
    throw "The installer currently targets 64-bit Windows and requires x64 Node.js; found '$nodeArchitecture'."
}
Copy-Item -LiteralPath $nodeExecutable -Destination (Join-Path $stageDir 'node.exe')

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
    throw 'npm.cmd was not found. Install Node.js LTS before building the installer.'
}
& $npmCommand.Source ci --omit=dev --prefix $stageDir
if ($LASTEXITCODE -ne 0) {
    throw "Installing locked production dependencies into the staging directory failed with exit code $LASTEXITCODE."
}

$compiler = Get-Command ISCC.exe -ErrorAction SilentlyContinue
if (-not $compiler) {
    $defaultCompiler = Join-Path ${env:ProgramFiles(x86)} 'Inno Setup 6\ISCC.exe'
    if (Test-Path $defaultCompiler) {
        $compilerPath = $defaultCompiler
    } else {
        throw 'Inno Setup 6 is required to build the installer. Install it from https://jrsoftware.org/isinfo.php and run this script again.'
    }
} else {
    $compilerPath = $compiler.Source
}

& $compilerPath "/DSourceDir=$stageDir" "/DOutputDir=$outputDir" $installerScript
if ($LASTEXITCODE -ne 0) {
    throw "Inno Setup failed with exit code $LASTEXITCODE."
}

Write-Output "Installer created in $outputDir."
