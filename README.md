# Synz VSCode Extension

A utility for injecting, executing, and debugging scripts using Synapse Z. Unlike others, this uses a custom API wrapper to interact with Synapse Z. We do not rely on websockets to execute, and you can attach directly from VSCode.

## Features

- Attach to Roblox
- Execute Scripts
- Log the output
- Auto-Attach

## Requirements

- You must have the Synapse Z executor with a valid key.
- A windows machine is necessary for some features like auto-attach and game detection.

## Extension Settings

This extension contributes the following settings:

- `synz.autoAttach`: Automatically inject when Roblox is detected.
- `synz.automaticallyDetectRobloxProcess`: Only disable this if you are on a non-windows operating system.
- `synz.logOutput`: Show messages from the Roblox console in the VSCode output panel. This executes a script after attaching.
- `synz.quickAccess`: Show status bar buttons for executing and attaching when Roblox is open.

## Known Issues

- You are unable to use the output logging feature when auto-attaching.
- Auto-attach tries to inject again when leaving the game.

## Upcoming Features

- Easily access global scripts as well as your own in the quick-access menu.
- Apply fixes related to auto-attaching
