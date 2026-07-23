━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLC ランディングページ　GitHub Pages公開用データ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ 公開URL（設定済み）
https://kazuki4no.github.io/client-sites/plc-language/plc_lp.html

■ フォルダ構成（このままリポジトリに配置してください）
client-sites/                 ← リポジトリ「kazuki4no/client-sites」
└── plc-language/
    ├── plc_lp.html           … LP本体（CSS/JS内蔵の1ファイル完結）
    ├── README.txt            … このファイル（公開不要ならアップ対象外でOK）
    └── images/
        ├── daigo-sato.jpg      … 代表 佐藤大悟
        ├── gary-rapport.jpg    … Gary Rapport
        └── carl-valentino.jpg  … Carl Valentino

■ 公開手順
1. リポジトリ直下に「plc-language」フォルダごとコミット＆プッシュ
2. GitHub Pagesが有効なら、数分で上記URLに反映されます
3. PC・スマホ両方で表示確認

■ 設定済みの内容
・OGPタグ：og:url / og:image とも上記の公開URLで設定済み。
  シェア時の画像は images/daigo-sato.jpg を指定しています。
  ※OGP専用の横長画像（1200×630px）を作成した場合は、
    plc_lp.html内の og:image のパスを差し替えてください。
・CTAリンク：全ボタンが https://plc-language.com/inquiry に接続済み
  （ヘッダー／ヒーロー／体験セクション／最終CTA／モバイル固定バーの5箇所）

■ 公開後にやると良いこと
・Google Analytics等の計測タグを </head> 直前に追記
・シェアデバッガーでOGP表示確認
  （X: https://cards-dev.twitter.com/validator 相当、
    Facebook: https://developers.facebook.com/tools/debug/）
・本番運用時に独自ドメイン配下（plc-language.com側）へ移す場合は、
  og:url / og:image の2箇所を新URLに書き換えるだけでOKです。
