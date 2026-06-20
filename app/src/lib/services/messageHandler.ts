import type { TransportMessage } from "$lib/types/message";
import type { AmbienceAudioState, AmbienceWireEntry } from "$lib/types/state";
import { appState } from "$lib/state/appState.svelte";
import { DEFAULT_MUSIC_VOLUME } from "$lib/config/audio";

/**
 * Converts a wire ambience list to AmbienceAudioState.
 * Carries over any existing per-id volume overrides from prevVolumes so that
 * local slider positions survive ambience list changes (e.g. toggling a second
 * ambience on does not reset the first one's local volume).
 *
 * @param list       - Wire entries from the incoming message.
 * @param prevVolumes - The existing client-local volumes to preserve.
 */
function wireToAmbiences(
  list: AmbienceWireEntry[],
  prevVolumes: Record<string, number>,
): AmbienceAudioState {
  const activeIds: string[] = [];
  const targetGains: Record<string, number> = {};
  const volumes: Record<string, number> = {};
  const labels: Record<string, string | null> = {};
  for (const { id, targetGain: volume, label } of list) {
    activeIds.push(id);
    targetGains[id] = volume;
    volumes[id] = prevVolumes[id] ?? 1.0; // preserve existing override, default new ids to unity
    labels[id] = label;
  }
  return { ids: activeIds, targetGains, volumeGains: volumes, labels };
}

/**
 * @param message - Incoming WebSocket message from the relay.
 */
export async function handleMessage(message: TransportMessage): Promise<void> {
  switch (message.type) {
    case "SET_SCENE": {
      const { id: sceneId, label } = message.payload;
      appState.scene = { id: sceneId, label };
      break;
    }

    case "SET_AMBIENCES": {
      appState.ambiences = wireToAmbiences(
        message.payload.ambiences,
        appState.ambiences.volumeGains,
      );
      break;
    }

    case "SET_AMBIENCE_VOLUME": {
      const { id, volume } = message.payload;
      appState.ambiences.volumeGains[id] = volume;
      break;
    }

    case "SET_PLAYLIST": {
      const { id, label, targetGain: volume } = message.payload;
      appState.playlists.id = id;
      appState.playlists.label = label;
      appState.playlists.targetGain = volume;
      break;
    }

    case "SET_MUSIC_VOLUME": {
      appState.playlists.volumeGain = message.payload.volume;
      break;
    }

    case "RESET_AUDIO": {
      appState.resetAudioVersion++;
      break;
    }

    case "SET_DEBUG": {
      appState.debug = message.payload.debug;
      break;
    }

    case "CLIENT_CONNECTED": {
      appState.clientConnectedVersion++;
      break;
    }

    case "SYNC": {
      const { scene, ambiences, playlists: music } = message.payload;
      appState.scene = scene ? { id: scene.id, label: null } : null;
      appState.ambiences = wireToAmbiences(
        ambiences ?? [],
        appState.ambiences.volumeGains,
      );
      appState.playlists = {
        id: music?.id ?? null,
        targetGain: music?.targetGain ?? DEFAULT_MUSIC_VOLUME,
        volumeGain: appState.playlists.volumeGain,
        label: music?.label ?? null,
      };
      break;
    }
  }
}
