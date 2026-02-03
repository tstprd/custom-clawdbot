import { spawn } from "node:child_process";

export function getShellConfig(): { shell: string; args: string[] } {
  if (process.platform === "win32") {
    // Use PowerShell instead of cmd.exe on Windows.
    // Problem: Many Windows system utilities (ipconfig, systeminfo, etc.) write
    // directly to the console via WriteConsole API, bypassing stdout pipes.
    // When Node.js spawns cmd.exe with piped stdio, these utilities produce no output.
    // PowerShell properly captures and redirects their output to stdout.
    return {
      shell: "powershell.exe",
      args: ["-NoProfile", "-NonInteractive", "-Command"],
    };
  }

  const shell = process.env.SHELL?.trim() || "sh";
  return { shell, args: ["-c"] };
}

/**
 * Transform bash-style commands to be PowerShell-compatible on Windows.
 * Bash operators && and || are not valid in PowerShell, so we wrap commands
 * that use them with cmd.exe /c to let cmd handle the operator parsing.
 */
export function transformCommandForPowerShell(command: string): string {
  if (process.platform !== "win32") {
    return command;
  }

  // Check if command uses bash-style operators that PowerShell doesn't support
  // Match && or || that are not inside quotes
  const hasBashOperators = /(?<![&|])[&]{2}(?![&])|(?<![|])[|]{2}(?![|])/.test(command);

  if (!hasBashOperators) {
    return command;
  }

  // Wrap with cmd.exe /c to handle && and || operators
  // Escape double quotes and special characters for cmd.exe
  const escaped = command.replace(/"/g, '\\"');
  return `cmd.exe /c "${escaped}"`;
}

export function sanitizeBinaryOutput(text: string): string {
  const scrubbed = text.replace(/[\p{Format}\p{Surrogate}]/gu, "");
  if (!scrubbed) return scrubbed;
  const chunks: string[] = [];
  for (const char of scrubbed) {
    const code = char.codePointAt(0);
    if (code == null) continue;
    if (code === 0x09 || code === 0x0a || code === 0x0d) {
      chunks.push(char);
      continue;
    }
    if (code < 0x20) continue;
    chunks.push(char);
  }
  return chunks.join("");
}

export function killProcessTree(pid: number): void {
  if (process.platform === "win32") {
    try {
      spawn("taskkill", ["/F", "/T", "/PID", String(pid)], {
        stdio: "ignore",
        detached: true,
      });
    } catch {
      // ignore errors if taskkill fails
    }
    return;
  }

  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // process already dead
    }
  }
}
