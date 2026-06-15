import type { TransportMessage } from "$lib/types/message";
import type { AmbienceAudioState, AmbienceWireEntry } from "$lib/types/state";
import { appState } from "$lib/stores/appState.svelte";
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
  for (const { id, volume, label } of list) {
    activeIds.push(id);
    targetGains[id] = volume;
    volumes[id] = prevVolumes[id] ?? 1.0;  // preserve existing override, default new ids to unity
    labels[id] = label;
  }
  return { activeIds, targetGains, volumes, labels };
}

/**
 * @param message - Incoming WebSocket message from the relay.
 */
export async function handleMessage(message: TransportMessage): Promise<void> {
  switch (message.type) {
    case "SET_SCENE": {
      const { sceneId, label } = message.payload;
      appState.scene = { id: sceneId, label };
      break;
    }

    case "SET_AMBIENCES": {
      appState.ambiences = wireToAmbiences(
        message.payload.ambiences,
        appState.ambiences.volumes,
      );
      break;
    }

    case "SET_AMBIENCE_VOLUME": {
      const { id, volume } = message.payload;
      appState.ambiences.volumes[id] = volume;
      break;
    }

    case "SET_PLAYLIST": {
      const { id, label, volume } = message.payload;
      appState.music.activeId = id;
      appState.music.label = label;
      appState.music.targetGain = volume;
      break;
    }

    case "SET_MUSIC_VOLUME": {
      appState.music.volume = message.payload.volume;
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
      const { scene, ambiences, music } = message.payload;
      appState.scene = scene ? { id: scene.id, label: null } : null;
      appState.ambiences = wireToAmbiences(ambiences ?? [], appState.ambiences.volumes);
      appState.music = {
        activeId: music?.id ?? null,
        targetGain: music?.volume ?? DEFAULT_MUSIC_VOLUME,
        volume: appState.music.volume,
        label: music?.label ?? null,
      };
      break;
    }
  }
}
