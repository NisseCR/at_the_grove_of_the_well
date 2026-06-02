# Hosting

## Running Without VS Code

Double-click `run.bat` in the project root to start both servers in separate terminal windows. No VS Code needed — closing it frees up meaningful CPU and memory during sessions.

## Streaming the Player View (Discord)

To share the player view via Discord without the browser pausing when minimised:

1. **OBS** — create a new scene with a Browser source pointing to the player view URL. In the Browser source settings, enable **"Control audio via OBS"**. Interact with the page once to unlock audio.
2. **OBS preview** — right-click the OBS preview → **Open Preview Projector**. This opens the player view in a dedicated window that keeps rendering regardless of browser state.
3. **Discord** — start a stream, go to the **Applications** tab, select **Projector - Preview**. Application audio is included automatically.

VoiceMeeter and OBS Virtual Camera are not needed.

## Remote Players (Tailscale)

Install [Tailscale](https://tailscale.com) on your PC and invite each player to your network. They install Tailscale once, accept the invite, then open the player view via your Tailscale IP in their browser. No port forwarding needed — works behind CGNAT and 5G internet.

### Instructions for Players

> **Requirements:** Discord + Tailscale
>
> Tailscale is a free app that creates a private, encrypted connection directly between your device and my PC — similar to how self-hosted Foundry VTT works when connecting to a GM's server, except Tailscale handles the networking automatically without any port forwarding.
>
> Your traffic goes directly to my machine and nowhere else. Tailscale's servers only help your device find mine — they never see your data. Only people I explicitly invite can connect, and I can revoke access at any time.
>
> Setup is a one-time install and a Google/GitHub/Microsoft login. After that you just open a link in your browser.
