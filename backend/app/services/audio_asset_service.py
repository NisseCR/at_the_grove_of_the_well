"""Audio asset service."""

from uuid import UUID

from app.models.assets import AudioAsset
from app.services._audio_processing import AudioProcessor
from app.services._base_asset_service import BaseAssetService, PreparedUpload
from app.services._media_utils import extract_duration


class AudioAssetService(BaseAssetService[AudioAsset]):
    """Manages audio assets: normalises to -16 LUFS, resamples to 48000 Hz OGG."""

    _model = AudioAsset
    _resource_name = "AudioAsset"

    def __init__(self) -> None:
        self._processor = AudioProcessor()

    def _keys(self, asset_id: UUID) -> list[str]:
        """Return the R2 key for this audio asset."""
        return [f"assets/audio/{asset_id}.ogg"]

    def _prepare(self, asset_id: UUID, data: bytes) -> PreparedUpload:
        """Process audio bytes, extract duration, and return the OGG file ready for upload."""
        processed = self._processor.process(data)
        src = f"assets/audio/{asset_id}.ogg"
        duration = extract_duration(processed, ".ogg")
        return PreparedUpload(
            files={src: (processed, "audio/ogg")},
            src=src,
            extra={"duration": duration},
        )


audio_asset_service = AudioAssetService()
