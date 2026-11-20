"""Restore the repository's 7-Zip archives to their original paths."""

import os
import shutil
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]
ARCHIVES = {
	"eye-tracking.7z": "data/eye_tracking/eyetracking",
	"schema-paintings.7z": "experiment/Schema paintings",
	"imotions-intro.7z": "iMotions_intro.mp4",
}


def archive_entries(seven_zip: str, archive: Path, target: Path) -> dict[Path, bool]:
	with archive.open("rb") as handle:
		header = handle.read(64)
	if header.startswith(b"version https://git-lfs.github.com/spec/v1"):
		raise ValueError(
			f"{archive.name} is a Git LFS pointer. Run 'git lfs pull' first."
		)

	listing = subprocess.run(
		[seven_zip, "l", "-ba", "-slt", "-sccUTF-8", str(archive)],
		check=True,
		stdout=subprocess.PIPE,
		encoding="utf-8",
	).stdout
	entries = {}
	for block in listing.strip().split("\n\n"):
		fields = dict(
			line.split(" = ", 1) for line in block.splitlines() if " = " in line
		)
		entry = Path(fields.get("Path", ""))
		if entry.drive or entry.root or not entry.parts or ".." in entry.parts:
			raise ValueError(f"Invalid path in {archive.name}: {entry}")
		if entry.parts[0] != target.name:
			raise ValueError(f"Unexpected path in {archive.name}: {entry}")
		entries[entry] = fields.get("Folder") == "+" or fields.get(
			"Attributes", ""
		).startswith("D")
	return entries


def restore(seven_zip: str, archive: Path, target: Path) -> None:
	missing = []
	for entry, is_directory in archive_entries(seven_zip, archive, target).items():
		destination = target.parent / entry
		matches_type = destination.is_dir() if is_directory else destination.is_file()
		if not destination.exists() and not destination.is_symlink():
			missing.append((entry, is_directory))
		elif destination.is_symlink() or not matches_type:
			raise ValueError(f"Cannot restore over {destination}")
	if not missing:
		print(f"Already present: {target.relative_to(ROOT)}", flush=True)
		return

	print(f"Restoring {target.relative_to(ROOT)}", flush=True)
	target.parent.mkdir(parents=True, exist_ok=True)
	with TemporaryDirectory(prefix=".extract-data-", dir=target.parent) as temporary:
		staging = Path(temporary)
		subprocess.run(
			[seven_zip, "x", "-y", "-bso0", f"-o{staging}", str(archive)], check=True
		)
		for entry, is_directory in missing:
			destination = target.parent / entry
			if is_directory:
				destination.mkdir(parents=True, exist_ok=True)
				continue
			source = staging / entry
			if source.is_symlink() or not source.is_file():
				raise ValueError(f"Expected a regular file in {archive.name}: {entry}")
			destination.parent.mkdir(parents=True, exist_ok=True)
			try:
				# Publish a complete file without clobbering local data or another run.
				os.link(source, destination)
			except FileExistsError:
				if destination.is_symlink() or not destination.is_file():
					raise


def main() -> int:
	seven_zip = shutil.which("7zz") or shutil.which("7z") or shutil.which("7za")
	if not seven_zip:
		print("Install 7-Zip and add 7zz, 7z or 7za to PATH.", file=sys.stderr)
		return 1
	try:
		for name, target in ARCHIVES.items():
			restore(seven_zip, ROOT / "archives" / name, ROOT / target)
	except (OSError, ValueError, subprocess.CalledProcessError) as error:
		print(f"Could not restore data: {error}", file=sys.stderr)
		return 1
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
