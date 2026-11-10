# Banners of Lore

An autobattler above the Claude prompt: Slavs against orcs. You hire the army, and Claude's work deals the event cards.

This is an unofficial mod. Anthropic did not make it and does not endorse it.

## Install

In Claude Desktop, on the Code tab:

1. Click `+` next to the prompt box, then **Plugins**.
2. Choose **Add marketplace** and enter `Nero0909/banners-of-lore`.
3. Choose **Add plugin** and pick Banners of Lore.
4. Open a new session and give Claude a task. The game appears above the prompt while Claude works.

The game speaks English and Russian. Pick the language in the title's settings, or run `/banners-of-lore lang ru`.

From a terminal:

```bash
claude plugin install banners-of-lore --marketplace Nero0909/banners-of-lore
```

## What you need

- Any system Claude Desktop runs on: macOS 13 or newer on Apple Silicon or Intel, Windows 10 or 11 on x64 or ARM64, or Linux (Ubuntu 22.04+ or Debian 12+) on x64 or arm64.
- Claude Desktop for the full picture. In a terminal the game shows text and buttons only.

## What the mod does on your computer

- Runs the game core from the `core` folder.
- Keeps the match in Claude's data.
- Writes match records to `~/.claude/banners-of-lore/matches` (on Windows, `%USERPROFILE%\.claude\banners-of-lore\matches`).
- Once a day, reads this repository's `.claude-plugin/plugin.json` from GitHub to learn the newest version. The title then shows it, and a click on it copies the command that updates the mod. Nothing is sent but the request for that file.
- Opens a link in your browser when you click it on the title.

The game's sources are not in this repository: `core` holds one compiled file for each system, and the mod picks the one for yours.

## Check the cores

Below is the SHA-256 of each file in `core`, also in [SHA256SUMS](SHA256SUMS). Hash your copy and compare: a match means the file is the one published here. The VirusTotal link opens that file's page, where antivirus engines report on it. If VirusTotal has not seen the file yet, you can upload your copy there.

Your copy is in `~/.claude/plugins/cache/banners-of-lore/banners-of-lore/<version>/core` (on Windows, `%USERPROFILE%\.claude\plugins\cache\banners-of-lore\banners-of-lore\<version>\core`). Hash a file with `shasum -a 256 <file>` on macOS, `sha256sum <file>` on Linux, or `Get-FileHash <file>` in Windows PowerShell.

<!-- cores:start -->
| File | SHA-256 | |
|---|---|---|
| `banners-of-lore-core-darwin-arm64` | `2cba4ae519f86a605db940571308d483ef228676929731a839efdfe80f9ab61f` | [VirusTotal](https://www.virustotal.com/gui/file/2cba4ae519f86a605db940571308d483ef228676929731a839efdfe80f9ab61f) |
| `banners-of-lore-core-darwin-x86_64` | `c16adfa031dbdc38a2297fcbb830d7ead8681578cf7c0861b32b3fe3016fe6d1` | [VirusTotal](https://www.virustotal.com/gui/file/c16adfa031dbdc38a2297fcbb830d7ead8681578cf7c0861b32b3fe3016fe6d1) |
| `banners-of-lore-core-linux-aarch64` | `39dbe29e8fdbf8d4f06dc741447c6bc59e7d345c7e7adc56e04565bdbca4f925` | [VirusTotal](https://www.virustotal.com/gui/file/39dbe29e8fdbf8d4f06dc741447c6bc59e7d345c7e7adc56e04565bdbca4f925) |
| `banners-of-lore-core-linux-x86_64` | `77c68fa7f6daa83882026dd8e072cee59b08db03f25dd4d3889f0f9fbfbbe104` | [VirusTotal](https://www.virustotal.com/gui/file/77c68fa7f6daa83882026dd8e072cee59b08db03f25dd4d3889f0f9fbfbbe104) |
| `banners-of-lore-core-windows-aarch64.exe` | `c73a7b24be9206f6bd75ad3c255990f2e24fb38e304e54aee469ed815af82048` | [VirusTotal](https://www.virustotal.com/gui/file/c73a7b24be9206f6bd75ad3c255990f2e24fb38e304e54aee469ed815af82048) |
| `banners-of-lore-core-windows-x86_64.exe` | `d1d90958ca6a0d90f1713794a643053e02d1b95f38dfc9cb556328ded101f7b8` | [VirusTotal](https://www.virustotal.com/gui/file/d1d90958ca6a0d90f1713794a643053e02d1b95f38dfc9cb556328ded101f7b8) |
<!-- cores:end -->

## Remove

Open **Plugins** in Claude Desktop and remove Banners of Lore, or run:

```bash
claude plugin uninstall banners-of-lore
```

## По-русски

Автобатлер над полем ввода Claude: славяне против орков.

В Claude Desktop на вкладке Code нажми `+` у поля ввода, затем **Plugins** и **Add marketplace**. Введи `Nero0909/banners-of-lore`, нажми **Add plugin** и выбери Banners of Lore. Открой новую сессию и дай Claude задачу: игра появится над полем ввода, пока Claude работает. Язык игры выбирается в настройках на титульном экране или командой `/banners-of-lore lang ru`.

Раз в день мод читает с GitHub файл `.claude-plugin/plugin.json` этого репозитория, чтобы узнать номер новой версии, и показывает его на титульном экране.

Проверить ядра можно в разделе **Check the cores**: там сумма SHA-256 каждого файла и ссылка на его страницу в VirusTotal. Посчитай сумму своей копии и сравни: если совпала, файл тот же, что опубликован здесь.

Работает везде, где есть Claude Desktop: macOS, Windows и Linux. Мод бесплатен для личного некоммерческого использования. Распространять, продавать и менять его нельзя: подробности в [LICENSE](LICENSE).

## License

Copyright 2026 Nikita Makarov. The mod is free for personal, noncommercial use under the [PolyForm Strict License 1.0.0](LICENSE). You may not redistribute it, sell it or change it. Paid content, if it comes, will have terms of its own.
