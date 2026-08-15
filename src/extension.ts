import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Compute the anchored gitignore pattern for a resource, relative to the
 * directory that holds the .gitignore. Folders get a trailing slash.
 */
function patternFor(uri: vscode.Uri, baseDir: string): string {
  const rel = path.relative(baseDir, uri.fsPath).split(path.sep).join('/');
  const isFolder = fs.statSync(uri.fsPath).isDirectory();
  return '/' + rel + (isFolder ? '/' : '');
}

/**
 * Append a pattern to a gitignore file, creating the file if needed.
 * Returns false if the pattern was already present.
 */
function appendToGitignore(filePath: string, pattern: string): boolean {
  let existing = '';
  try {
    existing = fs.readFileSync(filePath, 'utf-8');
  } catch {
    // file doesn't exist yet — that's fine
  }

  const lines = existing.split('\n').map(l => l.trim());
  if (lines.includes(pattern)) {
    return false;
  }

  const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  fs.writeFileSync(filePath, existing + separator + pattern + '\n', 'utf-8');
  return true;
}

/**
 * Append the pattern, then open the .gitignore and report what happened.
 */
async function addPatternAndReveal(gitignorePath: string, pattern: string, label: string): Promise<void> {
  const existed = fs.existsSync(gitignorePath);

  if (!appendToGitignore(gitignorePath, pattern)) {
    vscode.window.showInformationMessage(`"${pattern}" is already in ${label}`);
    return;
  }

  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(gitignorePath));
  await vscode.window.showTextDocument(doc, { preview: false });
  vscode.window.showInformationMessage(
    existed ? `Added "${pattern}" to ${label}` : `Created ${label} with "${pattern}"`,
  );
}

/**
 * Add the selected resource to a .gitignore in the same folder as the resource.
 */
async function addToLocalGitignore(uri: vscode.Uri): Promise<void> {
  const folder = path.dirname(uri.fsPath);
  const pattern = patternFor(uri, folder);
  await addPatternAndReveal(path.join(folder, '.gitignore'), pattern, `${path.basename(folder)}/.gitignore`);
}

/**
 * Add the selected resource to the .gitignore at the root of its workspace folder.
 */
async function addToGlobalGitignore(uri: vscode.Uri): Promise<void> {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Quick Ignore: the selected item is not inside an open workspace folder.');
    return;
  }

  const root = workspaceFolder.uri.fsPath;
  if (path.relative(root, uri.fsPath) === '') {
    vscode.window.showErrorMessage('Quick Ignore: cannot add the workspace root folder to its own .gitignore.');
    return;
  }

  const pattern = patternFor(uri, root);
  await addPatternAndReveal(path.join(root, '.gitignore'), pattern, 'workspace .gitignore');
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
