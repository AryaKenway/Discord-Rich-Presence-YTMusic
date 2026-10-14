Set fileSystem = CreateObject("Scripting.FileSystemObject")
baseDirectory = fileSystem.GetParentFolderName(WScript.ScriptFullName)
Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = baseDirectory
WScript.Sleep 15000
shell.Run """" & baseDirectory & "\node.exe"" """ & baseDirectory & "\server.js""", 0, False
