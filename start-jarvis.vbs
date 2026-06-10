' Starts the Jarvis Node server silently, then opens Chrome to localhost:1515
Dim shell
Set shell = CreateObject("WScript.Shell")

' Start Node server without a visible console window
shell.Run "cmd /c node """ & WScript.Arguments(0) & "\server.js""", 0, False

' Wait 3 seconds for the server to be ready
WScript.Sleep 3000

' Open Chrome minimised to the Jarvis HUD
shell.Run "chrome --start-minimized http://localhost:1515", 7, False

Set shell = Nothing
