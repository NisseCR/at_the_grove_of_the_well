import type { TransportMessage, AmbienceWireEntry } from "$lib/types/message";
import type {
  AmbienceAudioState,
  AmbienceId,
  TargetGain,
  VolumeGain,
} from "$lib/types/state";
import { appState } from "$lib/state/appState.svelte";
import { DEFAULT_MUSIC_VOLUME } from "$lib/config/audio";

/**
 * Converts a wire ambience list to AmbienceAudioState.
 * Carries over any existing per-id volume overrides from prevVolumeGains so that
 * local slider positions survive ambience list changes (e.g. toggling a second
 * ambience on does not reset the first one's local volume).
 *
 * @param list           - Wire entries from the incoming message.
 * @param prevVolumeGains - The existing client-local volume gains to preserve.
 */
function wireAmbienceMessageToState(
  list: AmbienceWireEntry[],
  prevVolumeGains: Record<AmbienceId, VolumeGain>,
): AmbienceAudioState {
  const ids: AmbienceId[] = [];
  const targetGains: Record<AmbienceId, TargetGain> = {};
  const volumeGains: Record<AmbienceId, VolumeGain> = {};
  const labels: Record<AmbienceId, string | null> = {};
  for (const { id, targetGain, label } of list) {
    ids.push(id);
    targetGains[id] = targetGain;
    volumeGains[id] = prevVolumeGains[id] ?? 1.0; // preserve existing override, default new ids to unity
    labels[id] = label;
  }
  return { ids, targetGains, volumeGains, labels };
}

/**
 * @param message - Incoming WebSocket message from the relay.
 */
export async function handleMessage(message: TransportMessage): Promise<void> {
  switch (message.type) {
    case "SET_SCENE": {
      const { id, label } = message.payload;
      appState.scene = { id, label };
      break;
    }

    case "SET_AMBIENCES": {
      appState.ambiences = wireAmbienceMessageToState(
        message.payload,
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
      const { id, label, targetGain } = message.payload;
      appState.playlists.id = id;
      appState.playlists.label = label;
      appState.playlists.targetGain = targetGain;
      break;
    }

    case "SET_PLAYLIST_VOLUME": {
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
      const { scene, ambiences, playlists } = message.payload;
      appState.scene = scene ? { id: scene.id, label: null } : null;
      appState.ambiences = wireAmbienceMessageToState(
        ambiences ?? [],
        appState.ambiences.volumeGains,
      );
      appState.playlists = {
        id: playlists?.id ?? null,
        targetGain: playlists?.targetGain ?? DEFAULT_MUSIC_VOLUME,
        volumeGain: appState.playlists.volumeGain,
        label: playlists?.label ?? null,
      };
      break;
    }
  }
}
