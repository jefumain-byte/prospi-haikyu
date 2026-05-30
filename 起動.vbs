Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = scriptDir & "\起動.bat"

shell.CurrentDirectory = scriptDir
shell.Run """" & batPath & """", 1, False
