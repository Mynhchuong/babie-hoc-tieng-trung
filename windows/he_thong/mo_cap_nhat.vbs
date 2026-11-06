' Bam "Cap nhat app ngay": chay cap nhat va hien ket qua
Set fso = CreateObject("Scripting.FileSystemObject")
d = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File """ & d & "\cap_nhat.ps1"" -Hien", 0, False
