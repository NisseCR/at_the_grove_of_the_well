import * as Tone from "tone";
import { audioEngine } from "@/lib/engines/audioEngine";
import { musicApiClient } from "@/lib/services/musicApiClient";
import { appState } from "@/stores/appState.svelte";
import type { Playlist } from "@/types/music";

const FADE_IN = 3.0;
const FADE_OUT = 3.0;
const FADE_VOLUME = 0.2;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

class MusicEngine {
  private masterGain: Tone.Gain | null = null;
  private player: Tone.Player | null = null;
  private playlist: Playlist | null = null;
  private trackIndex = 0;
  private generation = 0;
  private advanceTimer: ReturnType<typeof setTimeout> | null = null;

  private getOrCreateMasterGain(): Tone.Gain {
    if (!this.masterGain) {
      this.masterGain = new Tone.Gain(0).toDestination();
    }
    return this.masterGain;
  }

  async setPlaylist(id: string | null): Promise<void> {
    const gen = ++this.generation;

    if (this.playlist && this.masterGain) {
      audioEngine.fadeTo(this.masterGain, 0, FADE_OUT);
      await sleep(FADE_OUT * 1000);
      if (gen !== this.generation) return;
    }

    this.stopPlayer();
    this.playlist = null;
    this.trackIndex = 0;

    if (id === null) return;

    const playlist = await musicApiClient.fetchPlaylist(id);
    if (gen !== this.generation) return;

    this.playlist = playlist;
    await this.playTrack(gen, true);
  }

  private async playTrack(gen: number, fadeIn: boolean): Promise<void> {
    if (!this.playlist) return;

    const track = this.playlist.tracks[this.trackIndex];
    const masterGain = this.getOrCreateMasterGain();

    const stem = await audioEngine.createStem(track.url!);
    if (gen !== this.generation) {
      stem.player.dispose();
      stem.gain.dispose();
      return;
    }

    stem.gain.dispose();
    stem.player.disconnect();
    stem.player.connect(masterGain);

    this.player = stem.player;
    this.player.start();

    if (fadeIn) {
      const volume = appState.music?.volume ?? 0.8;
      audioEngine.fadeTo(masterGain, volume, FADE_IN);
    }

    const duration = this.player.buffer.duration * 1000;
    this.advanceTimer = setTimeout(() => {
      if (gen !== this.generation || !this.playlist) return;
      this.stopPlayer();
      this.trackIndex = (this.trackIndex + 1) % this.playlist.tracks.length;
      this.playTrack(gen, false);
    }, duration);
  }

  private stopPlayer(): void {
    if (this.advanceTimer !== null) {
      clearTimeout(this.advanceTimer);
      this.advanceTimer = null;
    }
    if (this.player) {
      this.player.stop();
      this.player.dispose();
      this.player = null;
    }
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      audioEngine.fadeTo(this.masterGain, volume, FADE_VOLUME);
    }
  }

  reset(): void {
    this.generation++;
    this.stopPlayer();
    if (this.masterGain) {
      this.masterGain.dispose();
      this.masterGain = null;
    }
    this.playlist = null;
    this.trackIndex = 0;
  }
}

export const musicEngine = new MusicEngine();
