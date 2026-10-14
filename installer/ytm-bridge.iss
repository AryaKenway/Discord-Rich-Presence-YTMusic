#ifndef SourceDir
  #error SourceDir must be defined
#endif
#ifndef OutputDir
  #error OutputDir must be defined
#endif

#define AppName "YouTube Music Discord Presence Bridge"
#define AppVersion "1.0.0"
#define AppPublisher "YouTube Music Discord Presence"

[Setup]
AppId={{9F53E7AB-8CDF-48A1-A3C4-71808FBB42D9}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={localappdata}\Programs\YouTube Music Discord Presence Bridge
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir={#OutputDir}
OutputBaseFilename=YouTube-Music-Discord-Bridge-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName={#AppName}
ArchitecturesInstallIn64BitMode=x64

[Tasks]
Name: "autostart"; Description: "Start the bridge automatically when I sign in to Windows"; Flags: unchecked

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#SourceDir}\..\..\..\installer\start-hidden.vbs"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Start Bridge"; Filename: "{app}\node.exe"; Parameters: """{app}\server.js"""; WorkingDir: "{app}"
Name: "{group}\Uninstall Bridge"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\node.exe"; Parameters: """{app}\server.js"""; WorkingDir: "{app}"; Description: "Launch {#AppName}"; Flags: postinstall nowait skipifsilent

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "YtmDiscordPresenceBridge"; ValueData: """{sys}\wscript.exe"" ""{app}\start-hidden.vbs"""; Flags: uninsdeletevalue; Tasks: autostart
