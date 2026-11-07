# Banners of Lore

An autobattler above the Claude prompt: Slavs against orcs. You hire the army, and Claude's work deals the event cards.

This is an unofficial mod. Anthropic did not make it and does not endorse it.

## Install

In Claude Desktop, on the Code tab:

1. Click `+` next to the prompt box, then **Plugins**.
2. Choose **Add marketplace** and enter `Nero0909/banners-of-lore`.
3. Choose **Add plugin** and pick Banners of Lore.
4. Open a new session and give Claude a task. The game appears above the prompt while Claude works.

From a terminal:

```bash
claude plugin install banners-of-lore --marketplace Nero0909/banners-of-lore
```

## What you need

- One of these systems:
  - a Mac with Apple Silicon (M1 or newer) and macOS 11 or newer;
  - Windows 10 or 11, 64-bit. Windows on ARM runs the x64 core through its built-in emulation.

  There is no build for Intel Macs or Linux yet.
- Claude Desktop for the full picture. In a terminal the game shows text and buttons only.

## What the mod does on your computer

- Runs the game core from the `core` folder.
- Keeps the match in Claude's data.
- Writes match records to `~/.claude/banners-of-lore/matches` (on Windows, `%USERPROFILE%\.claude\banners-of-lore\matches`).

The hooks make no network calls. The game's sources are not in this repository: `core` holds one compiled file for each system, and the mod picks the one for yours.

## Remove

Open **Plugins** in Claude Desktop and remove Banners of Lore, or run:

```bash
claude plugin uninstall banners-of-lore
```

## По-русски

Автобатлер над полем ввода Claude: славяне против орков.

В Claude Desktop на вкладке Code нажми `+` у поля ввода, затем **Plugins** и **Add marketplace**. Введи `Nero0909/banners-of-lore`, нажми **Add plugin** и выбери Banners of Lore. Открой новую сессию и дай Claude задачу: игра появится над полем ввода, пока Claude работает.

Нужен Mac на Apple Silicon (M1 или новее) или 64-битная Windows 10 или 11. Мод бесплатен для личного некоммерческого использования. Распространять, продавать и менять его нельзя: подробности в [LICENSE](LICENSE).

## License

Copyright 2026 Nikita Makarov. The mod is free for personal, noncommercial use under the [PolyForm Strict License 1.0.0](LICENSE). You may not redistribute it, sell it or change it. Paid content, if it comes, will have terms of its own.
