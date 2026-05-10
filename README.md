# CIEDCheck Lab

植え込み型ペースメーカーのチェック業務を、新人教育、手順確認、操作練習の面から支援するローカルWebアプリ群です。
インストール不要で、フォルダごと他のPCへコピーして使えます。

## 開き方

1. フォルダごとPCへコピーする
2. `CIEDCheckLab.html` をブラウザで開く
3. 入口画面から使いたいツールを選ぶ

Chrome / Edge / Safari などの通常ブラウザで動作します。インターネット接続は基本不要です。
参考文献リンクを開く場合のみインターネット接続が必要です。

## オンライン版（GitHub Pages）

最新ビルドは以下から直接利用できます（インストール不要）。

- 入口: <https://chestnut8811-star.github.io/ppm-app2/CIEDCheckLab.html>
- プログラマー操作シミュレーター（CIEDCheck Arena）: <https://chestnut8811-star.github.io/ppm-app2/CIEDCheck%20Arena/CIEDCheck%20Arena.html>

## GitHub Pagesでのテスト公開

このテスト版では `index.html` は置かず、入口を `CIEDCheckLab.html` にしています。
GitHub Pagesで公開した場合は、以下の形式で直接開いてください。

```text
https://<GitHubユーザー名>.github.io/<リポジトリ名>/CIEDCheckLab.html
```

GitHub Pagesの設定例:

1. GitHubにこのフォルダの中身をアップロードする
2. Repository Settings → Pages を開く
3. Sourceを `Deploy from a branch` にする
4. Branchを `gh-pages`、Folderを `/(root)` にする
5. 表示されたURLの末尾に `/CIEDCheckLab.html` を付けて開く

公開リポジトリにする場合、患者情報・施設固有情報・個人情報は含めないでください。

```text
CIEDCheck Lab
├─ CIEDCheckLab.html
│  ツール選択画面
│
├─ CIEDCheck Studio.html
│  教育・記録・PDF出力ツール
│
├─ CIEDCheck Arena
│  プログラマー操作シミュレーター
│
├─ CIEDCheck CRT
│  CRT-P / CRT-D 教育・最適化シミュレーター
│
└─ CIEDCheck ICD
   ICD / CRT-D 検出・治療設定シミュレーター
```

## 主な機能

- VVI / VVIR、DDD / DDDR を中心にした操作手順チェック
- 疾患別の重点確認項目
- 疾患、駆動状態、確認項目を組み合わせたロジックマトリクス
- AS-VP / AP-VP / AS-VS / AP-VS / VVI-VP / VVI-VS ごとの設定工程表示
- ECGとマーカーを見ながら操作するプログラマー操作シミュレーター
- CRT-P / CRT-DのBiV capture、LV offset、VV delay、AV最適化、LV multipoint pacing教育
- ICD / CRT-DのVT/VF/Monitorゾーン、SVT判別、ATP、ショック設定教育
- A/V波高値、A/V閾値チェックの模擬操作と採点
- 閾値、波高値、リード抵抗の入力と要確認表示
- 施設基準・要確認目安の調整
- 症例シミュレーション
- 印刷・PDF保存用レポート
- ブラウザ内保存

## CIEDCheck Arena 採点仕様

- **満点 100 点・合格基準 80 点**（全シナリオ共通）
- ステップ完了で加点（合計 90 点）＋ 完了時にボーナス +10 点
- 誤操作は一律 **−10 点**
  - 同方向への連続誤操作は最初の 1 回のみ減点（debounce）
  - 「不要な設定変更」は記録系ステップのみ警告、進捗を後退させると減点
- 設定が初期値に戻っていない状態で終了するとボーナスとペナルティが相殺
- AS 中は SAV、AP 中は PAV のみが「AV delay 操作」として認められる
- ステップクリア・合否判定で効果音（トグル可）

## UI / 操作

- ヒント ON / OFF（デフォルト ON）、効果音 ON / OFF をワンクリック切替
- ECG・操作・測定の 3 パネルが画面上部にスティッキー固定
- 設定変更時に初期値からの差分（例: `+20`）を表示
- 各測定項目に番号バッジ（1〜4 / ✓ / —）と進行状態
- モバイル / タブレットで縦積みレイアウトに自動切り替え

## 配布時の注意

- フォルダ名を変更しても動作します。
- フォルダ内のHTML / JS / CSSの相対配置は変更しないでください。
- Windowsでも動作想定です。ZIP化して渡す場合は、展開後に `CIEDCheckLab.html` を開いてください。
- ブラウザの保存データはPCごと・ブラウザごとに保存されます。
- GitHub PagesでトップURLだけを開くと入口は表示されません。必ず `CIEDCheckLab.html` まで含めたURLを共有してください。

## 注意

このツールは教育・手順支援用です。最終判断は施設手順、医師指示、各社プログラマーマニュアルに従ってください。
