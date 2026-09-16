' ============================================================
'  Astro Observatory - one-click start (runs fully hidden)
'  Frontend (Next.js) : http://localhost:9527
'  Backend  (FastAPI) : http://127.0.0.1:9528
'  No console windows. Logs -> .\logs\  |  Stop with 關閉.bat
' ============================================================
Option Explicit

Dim sh, fso, env, Q
Dim root, feport, beport, apiurl, feurl, cors, logs
Dim beCmd, feCmd, checkCmd, openCmd
Dim rc, tries

Q = Chr(34)
Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

root   = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
feport = "9527"
beport = "9528"
apiurl = "http://127.0.0.1:" & beport
feurl  = "http://localhost:" & feport
cors   = "http://localhost:" & feport & ",http://127.0.0.1:" & feport
logs   = root & "logs"

If Not fso.FolderExists(logs) Then fso.CreateFolder logs

' wire services together via inherited environment variables
Set env = sh.Environment("Process")
env("NEXT_PUBLIC_API_URL") = apiurl
env("FRONTEND_URL")        = feurl
env("CORS_ORIGINS")        = cors

' backend: install deps if uvicorn missing, then run (no --reload for clean background)
beCmd = "cmd /c " & Q & "( (py -m uvicorn --version >nul 2>&1 || py -m pip install -r requirements.txt) & py -m uvicorn app.main:app --host 127.0.0.1 --port " & beport & " ) > " & Q & logs & "\backend.log" & Q & " 2>&1" & Q
sh.CurrentDirectory = root & "backend"
sh.Run beCmd, 0, False

' frontend: npm install on first run, then dev server
feCmd = "cmd /c " & Q & "( if not exist node_modules\next\package.json call npm install & call npm run dev -- -p " & feport & " ) > " & Q & logs & "\frontend.log" & Q & " 2>&1" & Q
sh.CurrentDirectory = root & "frontend"
sh.Run feCmd, 0, False

' wait until the frontend port is listening, then open the browser
checkCmd = "cmd /c netstat -ano | findstr " & Q & ":" & feport & " " & Q & " | findstr LISTENING"
openCmd  = "cmd /c start " & Q & Q & " " & feurl

tries = 0
rc = 1
Do
  WScript.Sleep 2000
  rc = sh.Run(checkCmd, 0, True)
  tries = tries + 1
Loop While rc <> 0 And tries < 300

If rc = 0 Then sh.Run openCmd, 0, False
