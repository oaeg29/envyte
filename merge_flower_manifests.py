#!/usr/bin/env python3
"""Merge multiple flower atlas manifest files into one master manifest.

Usage:
  python3 merge_flower_manifests.py
  python3 merge_flower_manifests.py --root . --output flowers/flowers_atlas_manifest_master.json

Default behavior:
- Finds files named flowers_atlas_manifest*.json under --root.
- If duplicate variant keys exist across manifests, the newest file wins.
- Writes one merged manifest JSON.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple


def _is_obj(value: Any) -> bool:
    return isinstance(value, dict)


def _load_manifest(path: Path) -> Dict[str, Any]:
    raw = path.read_text(encoding="utf-8")
    data = json.loads(raw)
    if not _is_obj(data):
        raise ValueError("manifest root is not an object")
    variants = data.get("variants")
    if not _is_obj(variants):
        raise ValueError("manifest missing object field: variants")
    return data


def _json_canon(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Merge flower atlas manifests into one file.")
    parser.add_argument(
        "--root",
        default=".",
        help="Workspace root to scan recursively (default: current directory)",
    )
    parser.add_argument(
        "--pattern",
        default="flowers_atlas_manifest*.json",
        help="Filename glob pattern to match (default: flowers_atlas_manifest*.json)",
    )
    parser.add_argument(
        "--output",
        default="flowers/flowers_atlas_manifest_master.json",
        help="Output master manifest path",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    root = Path(args.root).resolve()
    output = Path(args.output).resolve()

    if not root.exists() or not root.is_dir():
        print(f"ERROR: root directory does not exist: {root}", file=sys.stderr)
        return 2

    candidates = sorted(p for p in root.rglob(args.pattern) if p.is_file())
    candidates = [p for p in candidates if p.resolve() != output]

    if not candidates:
        print(f"ERROR: no manifests found with pattern '{args.pattern}' under {root}", file=sys.stderr)
        return 1

    loaded: List[Tuple[Path, float, Dict[str, Any]]] = []
    for path in candidates:
        try:
            data = _load_manifest(path)
        except Exception as exc:  # noqa: BLE001
            print(f"WARN: skipping invalid manifest {path}: {exc}", file=sys.stderr)
            continue
        loaded.append((path, path.stat().st_mtime, data))

    if not loaded:
        print("ERROR: no valid manifest files were parsed", file=sys.stderr)
        return 1

    loaded.sort(key=lambda item: item[1])  # oldest -> newest

    newest_path, newest_mtime, newest_manifest = loaded[-1]
    merged_version = max(
        int(item[2].get("version", 1)) if str(item[2].get("version", "")).isdigit() else 1
        for item in loaded
    )

    # If exportSettings differ, keep newest and record warning.
    newest_settings = newest_manifest.get("exportSettings", {}) if _is_obj(newest_manifest.get("exportSettings")) else {}
    settings_mismatch = False
    newest_settings_canon = _json_canon(newest_settings)
    for _, _, manifest in loaded[:-1]:
        other_settings = manifest.get("exportSettings", {}) if _is_obj(manifest.get("exportSettings")) else {}
        if _json_canon(other_settings) != newest_settings_canon:
            settings_mismatch = True
            break

    # Variant merge: newest manifest wins on key collisions.
    chosen_variants: Dict[str, Dict[str, Any]] = {}
    chosen_variant_source: Dict[str, str] = {}
    duplicate_variant_keys: Dict[str, List[str]] = {}

    for path, _mtime, manifest in loaded:
        variants = manifest.get("variants", {})
        if not _is_obj(variants):
            continue
        for key, entry in variants.items():
            if not isinstance(key, str) or not _is_obj(entry):
                continue
            if key in chosen_variants:
                duplicate_variant_keys.setdefault(key, []).append(str(path))
            chosen_variants[key] = entry
            chosen_variant_source[key] = str(path)

    # Build page file metadata index from all manifests (newest wins per fileName).
    page_meta_by_name: Dict[str, Dict[str, Any]] = {}
    page_meta_time: Dict[str, float] = {}
    for path, mtime, manifest in loaded:
        page_files = manifest.get("pageFiles", [])
        if not isinstance(page_files, list):
            continue
        for raw in page_files:
            if not _is_obj(raw):
                continue
            file_name = raw.get("fileName")
            if not isinstance(file_name, str) or not file_name:
                continue
            prev_mtime = page_meta_time.get(file_name, float("-inf"))
            if mtime >= prev_mtime:
                page_meta_by_name[file_name] = raw
                page_meta_time[file_name] = mtime

    merged_page_files: List[Dict[str, Any]] = []
    seen_page_names = set()

    # Prefer explicit variant.pages entries for deterministic ordering and variant mapping.
    for variant_key in sorted(chosen_variants.keys()):
        variant = chosen_variants[variant_key]
        pages = variant.get("pages", [])
        if not isinstance(pages, list):
            continue
        for page in pages:
            if not _is_obj(page):
                continue
            file_name = page.get("fileName")
            if not isinstance(file_name, str) or not file_name:
                continue
            if file_name in seen_page_names:
                continue
            seen_page_names.add(file_name)
            merged_page_files.append(
                {
                    "fileName": file_name,
                    "width": int(page.get("width", 0) or 0),
                    "height": int(page.get("height", 0) or 0),
                    "variantKey": variant_key,
                    "pageIndex": int(page.get("pageIndex", 0) or 0),
                }
            )

    # Include any frame-referenced files that were not present in variant.pages.
    for variant_key in sorted(chosen_variants.keys()):
        variant = chosen_variants[variant_key]
        frames = variant.get("frames", [])
        if not isinstance(frames, list):
            continue
        for frame in frames:
            if not _is_obj(frame):
                continue
            file_name = frame.get("fileName")
            if not isinstance(file_name, str) or not file_name or file_name in seen_page_names:
                continue
            seen_page_names.add(file_name)
            fallback = page_meta_by_name.get(file_name, {})
            merged_page_files.append(
                {
                    "fileName": file_name,
                    "width": int(fallback.get("width", 0) or 0),
                    "height": int(fallback.get("height", 0) or 0),
                    "variantKey": variant_key,
                    "pageIndex": int(frame.get("pageIndex", 0) or 0),
                }
            )

    fingerprints = [
        str(manifest.get("configFingerprint", ""))
        for _path, _mtime, manifest in loaded
        if manifest.get("configFingerprint") is not None
    ]
    fingerprints_unique = sorted(set(fingerprints))
    merged_fingerprint = (
        fingerprints_unique[0]
        if len(fingerprints_unique) == 1
        else str(newest_manifest.get("configFingerprint", ""))
    )

    merged_manifest: Dict[str, Any] = {
        "version": merged_version,
        "exportSettings": newest_settings,
        "configFingerprint": merged_fingerprint,
        "pageFiles": merged_page_files,
        "variants": {key: chosen_variants[key] for key in sorted(chosen_variants.keys())},
        "_merged": {
            "generatedAtUtc": _dt.datetime.now(_dt.timezone.utc).isoformat(),
            "sourceFiles": [str(path) for path, _mtime, _manifest in loaded],
            "sourceCount": len(loaded),
            "newestSource": str(newest_path),
            "newestSourceMtime": newest_mtime,
            "variantCount": len(chosen_variants),
            "settingsMismatchDetected": settings_mismatch,
            "duplicateVariantKeys": duplicate_variant_keys,
            "variantSourceByKey": chosen_variant_source,
        },
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(merged_manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Merged {len(loaded)} manifest(s) into: {output}")
    print(f"Variants: {len(chosen_variants)}")
    print(f"Pages: {len(merged_page_files)}")
    if settings_mismatch:
        print("WARN: exportSettings differ across source manifests. Newest manifest settings were used.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
