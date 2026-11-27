#!/bin/bash
# RiRi hair サイト公開スクリプト (Mac用)
# このフォルダの中身のうち、前回の公開から変わったファイルだけをサーバーに送ります。
#   ダブルクリック          … 変更一覧を表示 → 確認してから公開
#   ./publish.command --yes … 確認なしで公開 (Claude から実行するとき用)
#   ./publish.command --setup … 接続先の設定をやり直す
#   ./publish.command --all … 全ファイルを送り直す

cd "$(dirname "$0")" || exit 1

CONFIG=".publish-config"
STATE=".publish-state"
KEYCHAIN_SERVICE="riri-hair-ftp"
YES=0; SETUP=0; ALL=0
for a in "$@"; do
  case "$a" in
    --yes) YES=1 ;;
    --setup) SETUP=1 ;;
    --all) ALL=1 ;;
  esac
done

finish() {
  # ダブルクリックで開いたときは、結果を読めるように閉じる前に待つ
  if [ "$YES" -eq 0 ] && [ -t 0 ]; then
    echo
    read -r -p "Enterキーを押すと閉じます。" _
  fi
  exit "$1"
}

hash_file() {
  if command -v shasum >/dev/null 2>&1; then shasum -a 1 "$1" | awk '{print $1}'
  else md5 -q "$1"; fi
}

get_password() {
  if [ -n "$RIRI_FTP_PASSWORD" ]; then printf '%s' "$RIRI_FTP_PASSWORD"; return 0; fi
  security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$FTP_USER" -w 2>/dev/null
}

# curl にはパスワードをコマンドライン引数で渡さない (設定を標準入力で渡す)
run_curl() {
  local u p
  u=$(printf '%s' "$FTP_USER" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
  p=$(printf '%s' "$FTP_PASS" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
  printf 'user = "%s:%s"\n' "$u" "$p" | curl -sS -K - --connect-timeout 20 $SSL_OPT "$@"
}

setup() {
  echo "=== 接続先の設定 ==="
  echo "サーバー会社からもらったFTP情報を入力してください。"
  read -r -p "FTPサーバー名 (例: ftp.example.com): " FTP_HOST
  read -r -p "FTPユーザー名: " FTP_USER
  echo "公開フォルダ: ログイン直後の場所から見た、サイトを置くフォルダ。"
  read -r -p "  (例: public_html / ログイン直後の場所ならそのままEnter): " REMOTE_DIR
  REMOTE_DIR="${REMOTE_DIR#/}"; REMOTE_DIR="${REMOTE_DIR%/}"
  echo "暗号化: 1) 使えれば使う(おすすめ)  2) 必ず使う(FTPS)  3) 使わない"
  read -r -p "  番号を入力 [1]: " m
  case "$m" in 2) SSL_MODE="required" ;; 3) SSL_MODE="none" ;; *) SSL_MODE="try" ;; esac
  {
    echo "FTP_HOST=$(printf '%q' "$FTP_HOST")"
    echo "FTP_USER=$(printf '%q' "$FTP_USER")"
    echo "REMOTE_DIR=$(printf '%q' "$REMOTE_DIR")"
    echo "SSL_MODE=$SSL_MODE"
  } > "$CONFIG"
  chmod 600 "$CONFIG"
  if [ -z "$RIRI_FTP_PASSWORD" ]; then
    echo "FTPパスワードを入力してください (Macのキーチェーンに保存されます。画面には表示されません)。"
    security add-generic-password -U -s "$KEYCHAIN_SERVICE" -a "$FTP_USER" -w || {
      echo "パスワードを保存できませんでした。"; finish 1; }
  fi
  rm -f "$STATE"
  echo "設定を保存しました。"
  echo
}

if [ "$SETUP" -eq 1 ] || [ ! -f "$CONFIG" ]; then
  if [ "$YES" -eq 1 ] && [ ! -t 0 ]; then
    echo "接続先が未設定です。先に publish.command をダブルクリックして設定してください。"; exit 1
  fi
  setup
fi
# shellcheck disable=SC1090
. "./$CONFIG"

case "$SSL_MODE" in required) SSL_OPT="--ssl-reqd" ;; none) SSL_OPT="" ;; *) SSL_OPT="--ssl" ;; esac
FTP_PASS=$(get_password)
if [ -z "$FTP_PASS" ]; then
  echo "保存されたパスワードが見つかりません。./publish.command --setup で設定し直してください。"; finish 1
fi
BASE="ftp://$FTP_HOST/"
[ -n "$REMOTE_DIR" ] && BASE="ftp://$FTP_HOST/$REMOTE_DIR/"

echo "サーバーに接続しています… ($FTP_HOST)"
if ! run_curl --list-only "ftp://$FTP_HOST/" >/dev/null; then
  echo "接続できませんでした。サーバー名・ユーザー名・パスワードを確認してください。"
  echo "設定のやり直し: ./publish.command --setup"
  finish 1
fi

# いまのファイル一覧 (「ハッシュ<TAB>パス」)。隠しファイルとこの仕組み自体は送らない
NEW=$(mktemp); TODO=$(mktemp); FAILED=$(mktemp)
trap 'rm -f "$NEW" "$TODO" "$FAILED"' EXIT
find . -type f ! -path '*/.*' ! -name '*.command' ! -name 'CLAUDE.md' | sed 's|^\./||' | LC_ALL=C sort |
while IFS= read -r f; do
  printf '%s\t%s\n' "$(hash_file "$f")" "$f"
done > "$NEW"

if [ "$ALL" -eq 1 ] || [ ! -s "$STATE" ]; then
  cp "$NEW" "$TODO"
else
  grep -Fxv -f "$STATE" "$NEW" > "$TODO"
fi

COUNT=$(wc -l < "$TODO" | tr -d ' ')
if [ "$COUNT" -eq 0 ]; then
  echo "前回の公開から変更されたファイルはありません。"
  finish 0
fi

echo
echo "公開するファイル ($COUNT 件):"
cut -f2 "$TODO" | sed 's/^/  /'
echo
if [ "$YES" -eq 0 ]; then
  read -r -p "この内容で公開しますか? (y/n): " ans
  case "$ans" in y|Y|yes) ;; *) echo "中止しました。何も送っていません。"; finish 0 ;; esac
fi

OK=0
while IFS=$'\t' read -r h f; do
  # URLに使えない文字を含むファイル名は送らない (半角英数字と - _ . / のみ対応)
  case "$f" in
    *[!A-Za-z0-9._/-]*)
      echo "  × $f (ファイル名は半角英数字にしてください)"; printf '%s\t%s\n' "$h" "$f" >> "$FAILED"; continue ;;
  esac
  if run_curl --ftp-create-dirs -T "$f" "$BASE$f"; then
    echo "  ✓ $f"; OK=$((OK + 1))
  else
    echo "  × $f"; printf '%s\t%s\n' "$h" "$f" >> "$FAILED"
  fi
done < "$TODO"

# 送れなかったファイルは次回もう一度送る
if [ -s "$FAILED" ]; then
  grep -Fxv -f "$FAILED" "$NEW" > "$STATE"
  NG=$(wc -l < "$FAILED" | tr -d ' ')
  echo
  echo "$OK 件を公開しました。$NG 件は送れませんでした (上の × 印)。もう一度実行すると再送します。"
  finish 1
fi
cp "$NEW" "$STATE"
echo
echo "$OK 件を公開しました。"
finish 0
