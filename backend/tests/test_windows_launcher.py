"""Exercise the launcher's actual cmd command without installing or starting npm."""

import os
from pathlib import Path
import subprocess
import sys

import pytest


pytestmark = pytest.mark.skipif(sys.platform != "win32", reason="Windows launcher")
LAUNCHER = Path(__file__).resolve().parents[2] / "啟動.vbs"


@pytest.mark.parametrize(
    "installed,install_exit,expected",
    [
        (True, 0, ["run dev -- -p 9527"]),
        (False, 0, ["install", "run dev -- -p 9527"]),
        (False, 1, ["install"]),
    ],
)
def test_frontend_command(tmp_path, installed, install_exit, expected):
    # Include spaces to exercise the command's log path quoting.
    working = tmp_path / "app with spaces"
    working.mkdir()
    logs = working / "logs"
    logs.mkdir()
    if installed:
        package = working / "node_modules/next/package.json"
        package.parent.mkdir(parents=True)
        package.write_text("{}")

    (working / "npm.cmd").write_text(
        '@echo off\necho %*>>calls.txt\n'
        f'if "%1"=="install" exit /b {install_exit}\n'
        "exit /b 0\n"
    )
    assignment = next(
        line for line in LAUNCHER.read_text(encoding="utf-8-sig").splitlines()
        if line.startswith("feCmd = ")
    )
    probe = working / "command.vbs"
    probe.write_text(
        'Option Explicit\nDim Q, feport, logs, feCmd\nQ = Chr(34)\n'
        f'feport = "9527"\nlogs = "{logs}"\n'
        f"{assignment}\nWScript.Echo feCmd\n",
        encoding="utf-16",
    )
    command = subprocess.run(
        ["cscript.exe", "//nologo", str(probe)],
        capture_output=True, text=True, check=True, timeout=10,
    ).stdout.strip()
    env = os.environ.copy()
    env["PATH"] = str(working) + os.pathsep + env["PATH"]
    subprocess.run(command, cwd=working, env=env, timeout=10, check=False)
    trace = working / "calls.txt"
    actual = trace.read_text().splitlines() if trace.exists() else []
    assert actual == expected
