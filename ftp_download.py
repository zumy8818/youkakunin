"""
ロリポップFTP 指定フォルダ一括ダウンロードスクリプト
保存先: C:\dev\youkakunin\ftp-backup\（フォルダ構成を保持）
"""

import ftplib
import getpass
import os
import sys
from datetime import datetime
from pathlib import Path

# ダウンロード対象フォルダ
TARGET_DIRS = [
    "/website-generator",
    "/hearing",
    "/fs-sumiyaki",
    "/t.uozumi",
    "/home/users",
]

# ローカル保存先
LOCAL_BASE = Path(r"C:\dev\youkakunin\ftp-backup")


def download_file(ftp, remote_path, local_path):
    """ファイルを1件ダウンロードする"""
    local_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(local_path, "wb") as f:
            ftp.retrbinary(f"RETR {remote_path}", f.write)
        return True
    except ftplib.error_perm as e:
        print(f"  [スキップ] {remote_path}: {e}")
        return False
    except Exception as e:
        print(f"  [エラー] {remote_path}: {e}")
        return False


def download_directory(ftp, remote_dir, local_dir, stats):
    """ディレクトリを再帰的にダウンロードする"""
    local_dir.mkdir(parents=True, exist_ok=True)

    entries = []
    try:
        ftp.retrlines(f"LIST {remote_dir}", entries.append)
    except ftplib.error_perm as e:
        print(f"[アクセス拒否] {remote_dir}: {e}")
        stats["skipped_dirs"] += 1
        return
    except Exception as e:
        print(f"[エラー] {remote_dir}: {e}")
        stats["skipped_dirs"] += 1
        return

    for entry in entries:
        parts = entry.split()
        if len(parts) < 9:
            continue

        name = " ".join(parts[8:])
        if name in (".", ".."):
            continue

        remote_path = f"{remote_dir.rstrip('/')}/{name}"
        local_path = local_dir / name

        if entry.startswith("d"):
            # ディレクトリ
            print(f"  フォルダ: {remote_path}")
            download_directory(ftp, remote_path, local_path, stats)
        else:
            # ファイル
            size_str = parts[4] if len(parts) > 4 else "?"
            print(f"  ファイル: {remote_path} ({size_str} bytes)")
            if download_file(ftp, remote_path, local_path):
                stats["downloaded"] += 1
                try:
                    stats["total_bytes"] += int(parts[4])
                except (ValueError, IndexError):
                    pass
            else:
                stats["failed"] += 1


def format_size(size_bytes):
    """バイト数を読みやすい形式に変換する"""
    for unit in ("B", "KB", "MB", "GB"):
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def main():
    host = "ftp.lolipop.jp"

    print("=== ロリポップFTP フォルダ一括ダウンロード ===")
    print(f"接続先: {host}")
    print(f"保存先: {LOCAL_BASE}")
    print()
    print("ダウンロード対象:")
    for d in TARGET_DIRS:
        print(f"  {d}")
    print()

    username = input("ユーザー名: ").strip()
    password = getpass.getpass("パスワード: ")

    print()
    print("接続中...")

    try:
        ftp = ftplib.FTP()
        ftp.connect(host, 21, timeout=60)
        ftp.login(username, password)
        ftp.set_pasv(True)
        print(f"接続成功: {ftp.getwelcome()}")
        print()
    except ftplib.error_perm as e:
        print(f"認証エラー: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"接続エラー: {e}", file=sys.stderr)
        sys.exit(1)

    LOCAL_BASE.mkdir(parents=True, exist_ok=True)

    stats = {
        "downloaded": 0,
        "failed": 0,
        "skipped_dirs": 0,
        "total_bytes": 0,
    }
    start_time = datetime.now()

    for remote_dir in TARGET_DIRS:
        # FTPサーバー上に存在するか確認
        try:
            ftp.cwd(remote_dir)
            ftp.cwd("/")  # ルートに戻す
        except ftplib.error_perm:
            print(f"[存在しない / アクセス不可] {remote_dir} — スキップ")
            print()
            continue

        # ローカルの対応パスを決定（先頭の / を除いた相対パス）
        relative = remote_dir.lstrip("/")
        local_dir = LOCAL_BASE / Path(relative)

        print(f"{'='*50}")
        print(f"ダウンロード開始: {remote_dir}")
        print(f"保存先: {local_dir}")
        print(f"{'='*50}")
        download_directory(ftp, remote_dir, local_dir, stats)
        print()

    ftp.quit()

    elapsed = datetime.now() - start_time
    print("=" * 50)
    print("完了サマリー")
    print("=" * 50)
    print(f"  ダウンロード成功 : {stats['downloaded']} ファイル")
    print(f"  ダウンロード失敗 : {stats['failed']} ファイル")
    print(f"  スキップしたフォルダ: {stats['skipped_dirs']}")
    print(f"  合計サイズ      : {format_size(stats['total_bytes'])}")
    print(f"  所要時間        : {elapsed}")
    print(f"  保存先          : {LOCAL_BASE}")


if __name__ == "__main__":
    main()
