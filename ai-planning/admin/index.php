<?php
/* =====================================================================
   コラム管理画面（admin/index.php）
   - ログイン後、記事の追加・編集・削除・並び替えができます
   - 保存すると ../column-data.js が書き換わり、即サイトに反映されます
   - 保存のたびに backups/ に直前のデータを自動バックアップします
   ===================================================================== */
session_start();
require __DIR__ . '/config.php';

/* ---------- データ入出力 ---------- */
function load_posts(): array {
  if (!is_file(DATA_FILE)) return [];
  $s = file_get_contents(DATA_FILE);
  $a = strpos($s, '[');
  $b = strrpos($s, ']');
  if ($a === false || $b === false) return [];
  $posts = json_decode(substr($s, $a, $b - $a + 1), true);
  return is_array($posts) ? $posts : [];
}

function save_posts(array $posts): bool {
  // バックアップ
  if (is_file(DATA_FILE)) {
    if (!is_dir(BACKUP_DIR)) mkdir(BACKUP_DIR, 0755, true);
    copy(DATA_FILE, BACKUP_DIR . 'column-data.' . date('Ymd-His') . '.js');
    $olds = glob(BACKUP_DIR . 'column-data.*.js');
    sort($olds);
    foreach (array_slice($olds, 0, max(0, count($olds) - BACKUP_KEEP)) as $f) unlink($f);
  }
  // 書き込み（一時ファイル→リネームで安全に）
  $json = json_encode(array_values($posts), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  $out = "/* コラム記事データ - 管理画面(admin/)から自動更新されます。手動編集も可能ですが、形式(JSON)を崩さないでください。 */\nwindow.COLUMN_POSTS = " . $json . ";\n";
  $tmp = DATA_FILE . '.tmp';
  if (file_put_contents($tmp, $out, LOCK_EX) === false) return false;
  return rename($tmp, DATA_FILE);
}

function find_index(array $posts, string $id): int {
  foreach ($posts as $i => $p) if (($p['id'] ?? '') === $id) return $i;
  return -1;
}

function new_id(array $posts): string {
  $max = 0;
  foreach ($posts as $p) {
    if (preg_match('/^col_(\d+)$/', $p['id'] ?? '', $m)) $max = max($max, (int)$m[1]);
  }
  return 'col_' . str_pad((string)($max + 1), 3, '0', STR_PAD_LEFT);
}

/* ---------- 画像アップロード ---------- */
function handle_upload(): string {
  if (empty($_FILES['image_file']['tmp_name'])) return '';
  $f = $_FILES['image_file'];
  if ($f['error'] !== UPLOAD_ERR_OK) return '';
  $info = @getimagesize($f['tmp_name']);
  $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
  if (!$info || !isset($types[$info[2]])) return '';
  $ext = $types[$info[2]];
  if (!is_dir(IMAGE_DIR)) mkdir(IMAGE_DIR, 0755, true);
  $name = date('Ymd-His') . '-' . substr(bin2hex(random_bytes(4)), 0, 6) . '.' . $ext;
  $dest = IMAGE_DIR . $name;

  // GDが使えて幅1200px超なら縮小して保存（サイト表示用に十分なサイズ）
  if (function_exists('imagecreatetruecolor') && $info[0] > 1200) {
    $src = match ($info[2]) {
      IMAGETYPE_JPEG => @imagecreatefromjpeg($f['tmp_name']),
      IMAGETYPE_PNG  => @imagecreatefrompng($f['tmp_name']),
      IMAGETYPE_WEBP => @imagecreatefromwebp($f['tmp_name']),
    };
    if ($src) {
      $w = 1200; $h = (int)round($info[1] * 1200 / $info[0]);
      $dst = imagecreatetruecolor($w, $h);
      if ($info[2] === IMAGETYPE_PNG) { imagealphablending($dst, false); imagesavealpha($dst, true); }
      imagecopyresampled($dst, $src, 0, 0, 0, 0, $w, $h, $info[0], $info[1]);
      $ok = match ($info[2]) {
        IMAGETYPE_JPEG => imagejpeg($dst, $dest, 85),
        IMAGETYPE_PNG  => imagepng($dst, $dest),
        IMAGETYPE_WEBP => imagewebp($dst, $dest, 85),
      };
      if ($ok) return IMAGE_URL . $name;
    }
  }
  return move_uploaded_file($f['tmp_name'], $dest) ? IMAGE_URL . $name : '';
}

/* ---------- 認証 ---------- */
if (isset($_GET['logout'])) { session_destroy(); header('Location: index.php'); exit; }

if (!isset($_SESSION['ok'])) {
  $err = '';
  if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if (hash_equals(ADMIN_PASSWORD, (string)$_POST['password'])) {
      session_regenerate_id(true);
      $_SESSION['ok'] = true;
      $_SESSION['csrf'] = bin2hex(random_bytes(16));
      header('Location: index.php'); exit;
    }
    sleep(1); // 総当たり対策
    $err = 'パスワードが違います。';
  }
  ?><!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
  <title>コラム管理 ログイン</title>
  <style>body{font-family:sans-serif;background:#0d2d4a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  form{background:#fff;padding:2.5rem;border-radius:10px;width:min(320px,90vw)}h1{font-size:1.1rem;color:#0d2d4a;margin:0 0 1.2rem}
  input{width:100%;box-sizing:border-box;padding:.7em;margin-bottom:1rem;border:1px solid #ccc;border-radius:6px}
  button{width:100%;padding:.8em;background:#c5a059;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer}
  .err{color:#c62828;font-size:.85rem;margin-bottom:.8rem}</style></head><body>
  <form method="post"><h1>コラム管理画面</h1>
  <?php if ($err) echo '<p class="err">' . htmlspecialchars($err) . '</p>'; ?>
  <input type="password" name="password" placeholder="パスワード" autofocus>
  <button>ログイン</button></form></body></html><?php
  exit;
}

/* ---------- 操作（POST + CSRF） ---------- */
$msg = $_GET['msg'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
  if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) { http_response_code(400); exit('不正なリクエストです'); }
  $posts = load_posts();
  $act = $_POST['action'];
  $id = (string)($_POST['id'] ?? '');

  if ($act === 'save') { // 追加・更新兼用
    $body = preg_split('/\n\s*\n/', str_replace("\r", '', trim((string)($_POST['body'] ?? ''))));
    $body = array_values(array_filter(array_map('trim', $body), fn($p) => $p !== ''));
    $uploaded = handle_upload();
    $i = $id !== '' ? find_index($posts, $id) : -1;
    $post = [
      'id'       => $i >= 0 ? $id : new_id($posts),
      'date'     => trim((string)($_POST['date'] ?? '')),
      'category' => trim((string)($_POST['category'] ?? '')) ?: '建築徒然草',
      'title'    => trim((string)($_POST['title'] ?? '')) ?: '（無題）',
      'image'    => $uploaded ?: trim((string)($_POST['image'] ?? '')),
      'body'     => $body,
    ];
    if ($i >= 0) $posts[$i] = $post; else array_unshift($posts, $post); // 新規は先頭（最新）へ
    save_posts($posts);
    header('Location: index.php?msg=' . urlencode('保存しました。サイトに反映済みです。')); exit;
  }
  if ($act === 'delete') {
    $i = find_index($posts, $id);
    if ($i >= 0) { array_splice($posts, $i, 1); save_posts($posts); }
    header('Location: index.php?msg=' . urlencode('削除しました。')); exit;
  }
  if ($act === 'move') {
    $i = find_index($posts, $id);
    $j = $_POST['dir'] === 'up' ? $i - 1 : $i + 1;
    if ($i >= 0 && $j >= 0 && $j < count($posts)) {
      [$posts[$i], $posts[$j]] = [$posts[$j], $posts[$i]];
      save_posts($posts);
    }
    header('Location: index.php'); exit;
  }
}

/* ---------- 画面表示 ---------- */
$posts = load_posts();
$editing = null;
if (isset($_GET['edit'])) {
  $i = find_index($posts, (string)$_GET['edit']);
  if ($i >= 0) $editing = $posts[$i];
}
$csrf = htmlspecialchars($_SESSION['csrf']);
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES); }
?><!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>コラム管理 | 合同会社アイ・プランニング</title>
<style>
:root { --navy:#0d2d4a; --gold:#c5a059; --line:#e3e8ef; --muted:#5a6b7e; }
* { box-sizing: border-box; }
body { font-family:"Hiragino Sans","Noto Sans JP",sans-serif; margin:0; background:#f4f6f9; color:#233; }
header { background:var(--navy); color:#fff; padding:1rem 1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.5rem; }
header h1 { font-size:1.05rem; margin:0; }
header a { color:#cdd9e6; font-size:.85rem; margin-left:1rem; }
.wrap { max-width:860px; margin:1.5rem auto; padding:0 1rem; }
.msg { background:#e7f5ea; border:1px solid #b5dcbe; color:#1d6b32; padding:.7em 1em; border-radius:8px; margin-bottom:1.2rem; font-size:.92rem; }
.card { background:#fff; border:1px solid var(--line); border-radius:10px; padding:1.4rem 1.6rem; margin-bottom:1.2rem; }
.card h2 { font-size:1rem; color:var(--navy); margin:0 0 1rem; }
label { display:block; font-size:.82rem; font-weight:700; color:var(--navy); margin:.9rem 0 .3rem; }
input[type=text], input[type=date], select, textarea { width:100%; padding:.6em .8em; border:1px solid #c8d2dd; border-radius:6px; font-size:.95rem; font-family:inherit; }
textarea { min-height:180px; line-height:1.7; }
small.hint { color:var(--muted); font-size:.76rem; }
.btn { display:inline-block; border:none; border-radius:6px; padding:.6em 1.4em; font-weight:700; cursor:pointer; font-size:.9rem; }
.btn-gold { background:var(--gold); color:#fff; }
.btn-gray { background:#e7ebf0; color:#445; }
.btn-danger { background:#fff; color:#c62828; border:1px solid #e5b4b4; }
.post-row { display:flex; align-items:center; gap:.8rem; padding:.8rem 0; border-bottom:1px solid var(--line); flex-wrap:wrap; }
.post-row:last-child { border-bottom:none; }
.post-row .t { flex:1; min-width:200px; }
.post-row .t b { color:var(--navy); }
.post-row .meta { font-size:.78rem; color:var(--muted); }
.badge { display:inline-block; font-size:.68rem; font-weight:700; color:#fff; background:var(--gold); border-radius:999px; padding:.15em .8em; margin-right:.4em; }
.badge.p { background:#3d5a78; }
.ops { display:flex; gap:.4rem; align-items:center; }
.ops form { margin:0; }
.ops button { font-size:.8rem; padding:.4em .8em; }
img.thumb { width:64px; height:48px; object-fit:cover; border-radius:4px; background:#eee; }
</style>
</head>
<body>
<header>
  <h1>コラム管理画面</h1>
  <nav><a href="../column.html" target="_blank">コラムページを見る</a><a href="?logout=1">ログアウト</a></nav>
</header>
<div class="wrap">

<?php if ($msg): ?><div class="msg"><?= h($msg) ?></div><?php endif; ?>

<!-- 追加・編集フォーム -->
<div class="card">
  <h2><?= $editing ? '記事を編集：' . h($editing['title']) : '新しい記事を書く' ?></h2>
  <form method="post" enctype="multipart/form-data">
    <input type="hidden" name="action" value="save">
    <input type="hidden" name="csrf" value="<?= $csrf ?>">
    <input type="hidden" name="id" value="<?= h($editing['id'] ?? '') ?>">

    <label>タイトル</label>
    <input type="text" name="title" value="<?= h($editing['title'] ?? '') ?>" required>

    <label>日付（任意）</label>
    <input type="date" name="date" value="<?= h($editing['date'] ?? date('Y-m-d')) ?>">
    <small class="hint">空欄にすると日付なしで表示されます。</small>

    <label>カテゴリ</label>
    <input type="text" name="category" list="cats" value="<?= h($editing['category'] ?? '建築徒然草') ?>">
    <datalist id="cats">
      <option value="建築徒然草"><option value="プライベート"><option value="お知らせ">
    </datalist>

    <label>本文</label>
    <textarea name="body" placeholder="本文を入力。空行で段落が分かれます。"><?= h(implode("\n\n", $editing['body'] ?? [])) ?></textarea>

    <label>写真（任意）</label>
    <input type="file" name="image_file" accept=".jpg,.jpeg,.png,.webp">
    <?php if (!empty($editing['image'])): ?>
      <small class="hint">現在の写真：<?= h($editing['image']) ?>（新しい写真を選ぶと置き換わります）</small>
      <input type="hidden" name="image" value="<?= h($editing['image']) ?>">
    <?php endif; ?>

    <p style="margin-top:1.4rem;">
      <button class="btn btn-gold"><?= $editing ? '更新して反映する' : '投稿して反映する' ?></button>
      <?php if ($editing): ?><a class="btn btn-gray" href="index.php" style="text-decoration:none;">キャンセル</a><?php endif; ?>
    </p>
  </form>
</div>

<!-- 記事一覧 -->
<div class="card">
  <h2>記事一覧（上が最新・サイトの表示順）</h2>
  <?php if (!$posts): ?><p>まだ記事がありません。</p><?php endif; ?>
  <?php foreach ($posts as $p): ?>
  <div class="post-row">
    <?php if (!empty($p['image'])): ?><img class="thumb" src="../<?= h($p['image']) ?>" alt=""><?php endif; ?>
    <div class="t">
      <span class="badge<?= ($p['category'] ?? '') === 'プライベート' ? ' p' : '' ?>"><?= h($p['category'] ?? '') ?></span>
      <b><?= h($p['title'] ?? '') ?></b>
      <div class="meta"><?= h($p['date'] ?: '日付なし') ?>｜<?= mb_strimwidth(h(implode(' ', $p['body'] ?? [])), 0, 60, '…') ?></div>
    </div>
    <div class="ops">
      <form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="dir" value="up"><input type="hidden" name="id" value="<?= h($p['id']) ?>"><input type="hidden" name="csrf" value="<?= $csrf ?>"><button class="btn btn-gray" title="上へ">↑</button></form>
      <form method="post"><input type="hidden" name="action" value="move"><input type="hidden" name="dir" value="down"><input type="hidden" name="id" value="<?= h($p['id']) ?>"><input type="hidden" name="csrf" value="<?= $csrf ?>"><button class="btn btn-gray" title="下へ">↓</button></form>
      <a class="btn btn-gray" href="?edit=<?= h($p['id']) ?>" style="text-decoration:none;">編集</a>
      <form method="post" onsubmit="return confirm('「<?= h($p['title']) ?>」を削除します。よろしいですか？');">
        <input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= h($p['id']) ?>"><input type="hidden" name="csrf" value="<?= $csrf ?>">
        <button class="btn btn-danger">削除</button>
      </form>
    </div>
  </div>
  <?php endforeach; ?>
</div>

<p style="font-size:.78rem;color:var(--muted);">保存のたびに直前のデータが admin/backups/ に自動保存されます（最新<?= BACKUP_KEEP ?>世代）。誤って削除した場合は制作者までご連絡ください。</p>
</div>
</body>
</html>
