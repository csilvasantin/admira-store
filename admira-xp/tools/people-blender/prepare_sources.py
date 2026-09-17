#!/usr/bin/env python3
"""Download verified MakeHuman CC0 data; do not install or execute upstream code."""
import argparse
import hashlib
import json
import shutil
import stat
import tempfile
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def verify(path, record):
    return (path.is_file() and path.stat().st_size == record["bytes"]
            and digest(path) == record["sha256"])


def acquire(record, output):
    destination = output / record["path"]
    destination.parent.mkdir(parents=True, exist_ok=True)
    if verify(destination, record):
        print(f"Verified cached {record['path']}", flush=True)
        return destination
    print(f"Downloading {record['path']}", flush=True)
    partial = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as stream:
            partial = Path(stream.name)
            request = urllib.request.Request(record["url"], headers={"User-Agent": "XpaceOS-CC0-asset-builder/1"})
            with urllib.request.urlopen(request, timeout=180) as response:
                shutil.copyfileobj(response, stream, length=1024 * 1024)
        if not verify(partial, record):
            raise ValueError(f"Size/SHA256 mismatch for {record['path']}; source not accepted")
        partial.replace(destination)
        return destination
    finally:
        if partial and partial.exists():
            partial.unlink()


def extract_selected(archive, output, prefixes):
    root = (output / "system").resolve()
    root.mkdir(parents=True, exist_ok=True)
    count = 0
    with zipfile.ZipFile(archive) as package:
        for item in package.infolist():
            if item.is_dir() or not any(item.filename.startswith(prefix) for prefix in prefixes):
                continue
            name = PurePosixPath(item.filename)
            if name.is_absolute() or ".." in name.parts or stat.S_ISLNK(item.external_attr >> 16):
                raise ValueError(f"Unsafe archive member: {item.filename}")
            if name.suffix.lower() not in {".obj", ".mhclo", ".mhmat", ".mhw", ".png", ".thumb"}:
                raise ValueError(f"Unexpected non-data asset: {item.filename}")
            destination = root.joinpath(*name.parts)
            if not destination.resolve().is_relative_to(root):
                raise ValueError(f"Archive path leaves output: {item.filename}")
            destination.parent.mkdir(parents=True, exist_ok=True)
            with package.open(item) as source, destination.open("wb") as target:
                shutil.copyfileobj(source, target)
            count += 1
    print(f"Extracted {count} selected asset data files into {root}")
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path, help="Local source/cache directory, outside the repository recommended")
    args = parser.parse_args()
    lock_path = Path(__file__).with_name("sources.lock.json")
    lock = json.loads(lock_path.read_text())
    output = args.output.expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    archive = None
    for record in lock["files"]:
        downloaded = acquire(record, output)
        if record["path"].endswith(".zip"):
            archive = downloaded
    if archive is None:
        raise ValueError("Missing source archive in lock file")
    extract_selected(archive, output, lock["extractPrefixes"])
    shutil.copyfile(lock_path, output / "sources.lock.json")
    print(f"Sources ready: {output}")


if __name__ == "__main__":
    main()
