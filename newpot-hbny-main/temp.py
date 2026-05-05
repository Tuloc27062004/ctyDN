#!/usr/bin/env python3
"""
temp.py – pretty directory-tree visualiser focused on source-code structure

Examples
--------
python3 temp.py
python3 temp.py b2b-sales-admin
python3 temp.py b2b-sales-admin --depth 3
python3 temp.py b2b-sales-admin --dirs-only
python3 temp.py b2b-sales-admin --all-files
"""

import argparse
import fnmatch
import sys
from pathlib import Path
from typing import List, Optional


CODE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx",
    ".java", ".c", ".cpp", ".h", ".hpp",
    ".cs", ".go", ".rs", ".php", ".rb",
    ".swift", ".kt", ".scala", ".lua",
    ".sh", ".bash", ".zsh",
    ".html", ".css", ".scss", ".sass",
    ".json", ".yml", ".yaml", ".toml",
    ".xml", ".sql", ".md", ".prisma",
}

ALWAYS_KEEP_FILENAMES = {
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "tsconfig.json",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "tailwind.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    "postcss.config.mjs",
    "README.md",
}


def human_readable(size: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB", "PB"):
        if size < 1024:
            return f"{size:.0f}{unit}"
        size /= 1024
    return f"{size:.0f}EB"


def load_gitignore(root: Path) -> List[str]:
    gi = root / ".gitignore"
    if not gi.is_file():
        return []

    patterns: List[str] = []
    for line in gi.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        patterns.append(line)
    return patterns


def should_ignore(path: Path, root: Path, patterns: List[str]) -> bool:
    try:
        rel = str(path.relative_to(root))
    except ValueError:
        rel = path.name

    rel = rel.replace("\\", "/")
    name = path.name

    for pat in patterns:
        pat = pat.strip()
        if not pat:
            continue

        pat_norm = pat.replace("\\", "/").lstrip("./")

        if pat_norm.endswith("/"):
            dir_pat = pat_norm.rstrip("/")

            if path.is_dir() and (
                fnmatch.fnmatch(name, dir_pat)
                or fnmatch.fnmatch(rel, dir_pat)
                or rel == dir_pat
                or rel.startswith(dir_pat + "/")
                or f"/{dir_pat}/" in f"/{rel}/"
            ):
                return True

            if rel == dir_pat or rel.startswith(dir_pat + "/") or f"/{dir_pat}/" in f"/{rel}/":
                return True

            continue

        if (
            name == pat_norm
            or fnmatch.fnmatch(name, pat_norm)
            or rel == pat_norm
            or fnmatch.fnmatch(rel, pat_norm)
        ):
            return True

        if f"/{pat_norm}/" in f"/{rel}/":
            return True

    return False


def should_show_file(path: Path, code_only: bool) -> bool:
    if not path.is_file():
        return False

    if not code_only:
        return True

    return path.suffix.lower() in CODE_EXTENSIONS or path.name in ALWAYS_KEEP_FILENAMES


def walk(
    path: Path,
    prefix: str,
    depth: int,
    max_depth: Optional[int],
    show_files: bool,
    show_size: bool,
    code_only: bool,
    ignores: List[str],
    root: Path,
) -> None:
    if max_depth is not None and depth >= max_depth:
        return

    try:
        entries = [p for p in path.iterdir() if not should_ignore(p, root, ignores)]
    except PermissionError:
        print(prefix + "⛔ permission denied")
        return
    except OSError:
        print(prefix + "⛔ unable to access")
        return

    dirs = sorted((e for e in entries if e.is_dir()), key=lambda p: p.name.lower())
    files = sorted(
        (e for e in entries if should_show_file(e, code_only)),
        key=lambda p: p.name.lower()
    )

    visible_entries = dirs + (files if show_files else [])

    for idx, entry in enumerate(visible_entries):
        is_last = idx == len(visible_entries) - 1
        connector = "└── " if is_last else "├── "

        if entry.is_dir():
            print(prefix + connector + entry.name)
            extension = "    " if is_last else "│   "
            walk(
                entry,
                prefix + extension,
                depth + 1,
                max_depth,
                show_files,
                show_size,
                code_only,
                ignores,
                root,
            )
        else:
            label = entry.name
            if show_size:
                try:
                    size = human_readable(entry.stat().st_size)
                except Exception:
                    size = "?"
                label += f" ({size})"
            print(prefix + connector + label)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Visualise a directory tree in the console."
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Root directory (default: current dir)",
    )
    parser.add_argument("--depth", type=int, help="Max recursion depth")
    parser.add_argument(
        "--dirs-only",
        action="store_true",
        help="Show only directories",
    )
    parser.add_argument(
        "--size",
        action="store_true",
        help="Show file sizes",
    )
    parser.add_argument(
        "--no-gitignore",
        action="store_true",
        help="Do not apply .gitignore rules",
    )
    parser.add_argument(
        "--ignore",
        action="append",
        default=[],
        help="Additional glob pattern(s) to ignore",
    )
    parser.add_argument(
        "--all-files",
        action="store_true",
        help="Show all files instead of only code/config files",
    )

    args = parser.parse_args()

    root = Path(args.path).expanduser().resolve()
    if not root.exists():
        sys.exit(f"❌ Path '{root}' does not exist.")
    if not root.is_dir():
        sys.exit(f"❌ Path '{root}' is not a directory.")

    default_ignores = [
        ".git",
        ".git/",
        ".next",
        ".next/",
        "node_modules",
        "node_modules/",
        "__pycache__",
        "__pycache__/",
        "venv",
        "venv/",
        ".venv",
        ".venv/",
        "dist",
        "dist/",
        "build",
        "build/",
        "coverage",
        "coverage/",
        ".turbo",
        ".turbo/",
        ".idea",
        ".idea/",
        ".vscode",
        ".vscode/",
        "*.pyc",
        "*.pyo",
        "*.map",
        "*.log",
    ]

    gitignore_patterns: List[str] = [] if args.no_gitignore else load_gitignore(root)
    ignores: List[str] = default_ignores + gitignore_patterns + args.ignore

    print(root)
    walk(
        root,
        prefix="",
        depth=0,
        max_depth=args.depth,
        show_files=not args.dirs_only,
        show_size=args.size,
        code_only=not args.all_files,
        ignores=ignores,
        root=root,
    )


if __name__ == "__main__":
    main()
