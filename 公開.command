#!/bin/bash
# =====================================================
#  公開.command  —  client-sites を自動でGitHubに公開
#  使い方：このファイルをダブルクリックするだけ
# =====================================================

# このスクリプトが置かれている場所（＝client-sitesフォルダ）に移動
cd "$(dirname "$0")"

echo "======================================"
echo "  サイト公開ツール"
echo "======================================"
echo ""
echo "作業フォルダ: $(pwd)"
echo ""

# gitリポジトリかどうか確認
if [ ! -d ".git" ]; then
  echo "⚠️  ここはgitリポジトリではないようです。"
  echo "    このファイルは client-sites フォルダの中に置いてください。"
  echo ""
  echo "（Enterキーで閉じます）"
  read
  exit 1
fi

# 変更があるか確認
if [ -z "$(git status --porcelain)" ]; then
  echo "📭 新しい変更はありません。"
  echo "    （アップロードするファイルが追加・変更されていません）"
  echo ""
  echo "（Enterキーで閉じます）"
  read
  exit 0
fi

# 変更内容を表示
echo "📂 以下の変更を公開します："
echo "--------------------------------------"
git status --short
echo "--------------------------------------"
echo ""

# 日時入りのコミットメッセージを自動生成
NOW=$(date "+%Y-%m-%d %H:%M")
MSG="サイト更新 $NOW"

echo "⏳ GitHubにアップロード中..."
echo ""

# add → commit → push
git add -A
git commit -m "$MSG"

if git push; then
  echo ""
  echo "======================================"
  echo "✅ 公開が完了しました！"
  echo "======================================"
  echo ""
  echo "数分後、以下の形のURLで見られるようになります："
  echo "  https://kazuki4no.github.io/client-sites/（フォルダ名）/（ファイル名）"
  echo ""
  echo "※ 反映に5〜10分かかることがあります。404の場合は少し待って再読み込みしてください。"
else
  echo ""
  echo "❌ アップロードに失敗しました。"
  echo "   ネット接続、またはGitHubのログイン設定を確認してください。"
  echo "   解決しない場合は、この画面をスクショして相談してください。"
fi

echo ""
echo "（Enterキーで閉じます）"
read
