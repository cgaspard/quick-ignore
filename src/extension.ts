import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolve the user's global gitignore file path.
 * Falls back to ~/.gitignore if config lookup fails.
 */
function getGlobalGitignorePath(): string {
  try {
    const cp = require('child_process');
    const output = cp.execSync('git config --global core.excludesfile', { encoding: 'utf-8' }).trim();
    if (output) return output;
  } catch {
    // git config not set, fall through
  }
  return path.join(require('os').homedir(), '.gitignore');
}

/**
 * Compute the pattern string to append for the given URI.
 * Folders get a trailing slash; files use the basename (or relative path from repo root).
 */
function patternFor(uri: vscode.Uri, gitRoot: string | undefined): string {
  const isFolder = fs.statSync(uri.fsPath).isDirectory();

  if (gitRoot && !isFolder) {
    // Use path relative to the repo root so patterns are scoped properly
    const rel = path.relative(gitRoot, uri.fsPath);
    if (rel.startsWith('..')) return path.basename(uri.fsPath);
    return rel;
  }

  if (isFolder) {
    return path.basename(uri.fsPath) + '/';
  }
  return path.basename(uri.fsPath);
}

/**
 * Find the nearest parent directory that contains a .git folder (repo root).
 */
function findGitRoot(folderUri: vscode.Uri): string | undefined {
  let dir = folderUri.fsPath;
  const home = require('os').homedir();
  while (dir !== path.dirname(dir) && dir !== home) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return undefined;
}

/**
 * Append a pattern to a gitignore file. Creates the file if it doesn't exist.
 */
function appendToGitignore(filePath: string, pattern: string): vscode.Uri {
  const uri = vscode.Uri.file(filePath);

  let existing = '';
  try {
    existing = fs.readFileSync(filePath, 'utf-8');
  } catch {
    // file doesn't exist yet — that's fine
  }

  // Avoid duplicates
  const lines = existing.split('\n').map(l => l.trim());
  if (lines.includes(pattern)) {
    vscode.window.showInformationMessage(`"${pattern}" is already in .gitignore`);
    return uri;
  }

  const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  fs.writeFileSync(filePath, existing + separator + pattern + '\n', 'utf-8');

  // If the file already existed and is open, reload it so VS Code sees the change
  return uri;
}

/**
 * Add the selected resource to the .gitignore in its current folder.
 */
async function addToLocalGitignore(uri: vscode.Uri): Promise<void> {
  const folder = vscode.Uri.file(path.dirname(uri.fsPath));
  const gitRoot = findGitRoot(folder);
  const ignoreDir = gitRoot ?? folder.fsPath;

  const pattern = patternFor(uri, gitRoot);
  const targetPath = path.join(ignoreDir, '.gitignore');

  const fileUri = appendToGitignore(targetPath, pattern);

  // If .gitignore already existed, try to reveal the change in the editor
  if (fs.existsSync(targetPath)) {
    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc, { preview: false });
    vscode.window.showInformationMessage(`Added "${pattern}" to .gitignore`);
  } else {
    vscode.window.showInformationMessage(`Created .gitignore with "${pattern}"`);
  }
}

/**
 * Add the selected resource to the global .gitignore.
 */
async function addToGlobalGitignore(uri: vscode.Uri): Promise<void> {
  const globalPath = getGlobalGitignorePath();
  const pattern = path.basename(uri.fsPath) + (fs.statSync(uri.fsPath).isDirectory() ? '/' : '');

  const fileUri = appendToGitignore(globalPath, pattern);
  vscode.window.showInformationMessage(`Added "${pattern}" to global .gitignore`);

  if (fs.existsSync(globalPath)) {
    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc, { preview: false });
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('quickIgnore.addToLocalGitignore', async (uri?: vscode.Uri | { uri: vscode.Uri; name: string }) => {
      if (!uri) return;
      const targetUri = 'uri' in uri ? uri.uri : uri;
      await addToLocalGitignore(targetUri);
    }),

    vscode.commands.registerCommand('quickIgnore.addToGlobalGitignore', async (uri?: vscode.Uri | { uri: vscode.Uri; name: string }) => {
      if (!uri) return;
      const targetUri = 'uri' in uri ? uri.uri : uri;
      await addToGlobalGitignore(targetUri);
    }),
  );
}

export function deactivate(): void {}
