<table border="0" cellpadding="0" cellspacing="0"><tr>
<td width="112"><img src="media/icon.png" alt="Quick Ignore" width="96" /></td>
<td><h1>Quick Ignore for VS Code</h1>Right-click any file or folder in the Explorer to add it to <code>.gitignore</code> — either locally in your repo, or globally across all projects.</td>
</tr></table>

## Features

- **Context menu actions** — two options on every right-click in the Explorer: add to local or global `.gitignore`
- **Local `.gitignore`** — writes to the `.gitignore` at your repository root (creates it if it doesn't exist)
- **Global `.gitignore`** — writes to your `core.excludesfile` (falls back to `~/.gitignore`)
- **Smart patterns** — files get a relative path from the repo root; folders get a trailing-slash pattern (`dirname/`)
- **Duplicate protection** — won't add a pattern that already exists in the file
- **Instant feedback** — opens the resulting `.gitignore` file in the editor after writing so you can review or edit

## Screenshots

Right-click any file or folder in the Explorer and choose either:

| Option | What it does |
| --- | --- |
| **Quick Ignore: Add to local .gitignore** | Appends a pattern to `.gitignore` at your repo root. Creates the file if it doesn't exist. |
| **Quick Ignore: Add to global .gitignore** | Appends a pattern to your global excludes file (`~/.gitignore` or `core.excludesfile`). |

![Quick Ignore context menu](media/screenshot-menu.png)

## Usage

1. Install the extension from the VS Code Marketplace
2. Right-click any file or folder in the Explorer sidebar
3. Choose **Add to local .gitignore** or **Add to global .gitignore**
4. The pattern is appended and the `.gitignore` file opens for review

That's it — no configuration needed.

## Requirements

- VS Code **1.104** or newer

## Commands

| Command | Title |
| --- | --- |
| `quickIgnore.addToLocalGitignore` | Quick Ignore: Add to local .gitignore |
| `quickIgnore.addToGlobalGitignore` | Quick Ignore: Add to global .gitignore |

Both commands are available in the Explorer context menu for any file or folder.

## How patterns work

- **Folders** — added as `foldername/` so only that directory (and its contents) is ignored
- **Files in a git repo** — added as a path relative to the repository root (e.g., `build/output.js`)
- **Files outside a git repo** — added as just the basename (e.g., `output.js`)
- **Global ignores** — always use the basename, since they apply across all repos

## Development

```bash
npm install
npm run compile      # one-shot bundle to dist/extension.js
npm run watch        # incremental rebuild
npm run package:vsix # produce a .vsix to install locally
```

Press `F5` in VS Code to launch an Extension Development Host with the extension active.

## License

MIT
