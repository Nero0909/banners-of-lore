# Banners of Lore

An autobattler above the Claude prompt: Slavs against orcs. You hire the army, and Claude's work deals the event cards.

This is an unofficial mod. Anthropic did not make it and does not endorse it.

## Install

In Claude Desktop, on the Code tab:

1. Click `+` next to the prompt box, then **Plugins**.
2. Choose **Add marketplace** and enter `Nero0909/banners-of-lore`.
3. Choose **Add plugin** and pick Banners of Lore.
4. Open a new session and give Claude a task. The game appears above the prompt while Claude works.

The game speaks English and Russian. Pick the language in the title's settings.

From a terminal:

```bash
claude plugin install banners-of-lore --marketplace Nero0909/banners-of-lore
```

## What you need

- Any system Claude Desktop runs on: macOS 13 or newer on Apple Silicon or Intel, Windows 10 or 11 on x64 or ARM64, or Linux (Ubuntu 22.04+ or Debian 12+) on x64 or arm64.
- Claude Desktop for the full picture. In a terminal the game shows text and buttons only.

## What the mod does on your computer

- Runs the game inside Claude: the core is JavaScript in `hooks/core`. The mod contains no program files.
- Keeps the match in Claude's data.
- Writes match records to `~/.claude/banners-of-lore/matches` (on Windows, `%USERPROFILE%\.claude\banners-of-lore\matches`). If it cannot find your home folder, it writes them to `matches` in the mod's own folder.
- Once a day, reads this repository's `.claude-plugin/plugin.json` from GitHub to learn the newest version. The title then shows it, and a click on it copies the command that updates the mod. Nothing is sent but the request for that file.
- Starts these programs, and no others:
  - `printenv HOME` on macOS and Linux, to find your home folder for the match records;
  - your system's link opener (`open`, `xdg-open` or `cmd /c start`), when you click a link on the title.

The game's sources are not in this repository: `hooks/core` holds the game compiled to JavaScript, the same files on every system.

## Remove

Open **Plugins** in Claude Desktop and remove Banners of Lore, or run:

```bash
claude plugin uninstall banners-of-lore@banners-of-lore
```

## По-русски

Автобатлер над полем ввода Claude: славяне против орков.

В Claude Desktop на вкладке Code нажми `+` у поля ввода, затем **Plugins** и **Add marketplace**. Введи `Nero0909/banners-of-lore`, нажми **Add plugin** и выбери Banners of Lore. Открой новую сессию и дай Claude задачу: игра появится над полем ввода, пока Claude работает. Язык игры выбирается в настройках на титульном экране.

Раз в день мод читает с GitHub файл `.claude-plugin/plugin.json` этого репозитория, чтобы узнать номер новой версии, и показывает его на титульном экране.

Игра работает внутри Claude: её ядро — JavaScript в папке `hooks/core`, одно на все системы. Программ в моде нет. Сам он запускает только системную команду для ссылок, когда ты кликаешь ссылку, и на macOS и Linux — `printenv HOME`, чтобы найти домашнюю папку для записей партий.

Работает везде, где есть Claude Desktop: macOS, Windows и Linux. Мод бесплатен для личного некоммерческого использования. Распространять, продавать и менять его нельзя: подробности в [LICENSE](LICENSE).

## License

Copyright 2026 Nikita Makarov. The mod is free for personal, noncommercial use under the [PolyForm Strict License 1.0.0](LICENSE). You may not redistribute it, sell it or change it. Paid content, if it comes, will have terms of its own.
