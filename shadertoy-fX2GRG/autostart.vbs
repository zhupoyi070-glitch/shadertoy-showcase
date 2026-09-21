' Roots creature project - hidden auto-start server on port 8097
' (ASCII only: path is derived from this script's own folder, encoding-safe)
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = dir
py = "C:\Users\Cloudy\AppData\Local\Programs\Python\Python312\python.exe"
sh.Run """" & py & """ -m http.server 8097 --bind 127.0.0.1", 0, False
