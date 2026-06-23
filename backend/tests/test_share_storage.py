"""Tests for ephemeral share storage."""

from app.services.share_storage import create_share, get_share


def test_create_and_get_share(tmp_path, monkeypatch):
    monkeypatch.setattr("app.services.share_storage.SHARE_DIR", tmp_path)
    png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
    record = create_share(png_bytes=png, title="測試", description="描述")
    loaded = get_share(record.token)
    assert loaded is not None
    assert loaded.title == "測試"
    assert loaded.image_path.exists()
