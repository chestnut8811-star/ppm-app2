# PaceCheck Lab

植え込み型ペースメーカーのチェック業務を、新人教育、手順確認、操作練習の面から支援するローカルWebアプリ群です。
インストール不要で、フォルダごと他のPCへコピーして使えます。

## 開き方

1. フォルダごとPCへコピーする
2. `PaceCheckLab.html` をブラウザで開く
3. 入口画面から使いたいツールを選ぶ

Chrome / Edge / Safari などの通常ブラウザで動作します。インターネット接続は基本不要です。
参考文献リンクを開く場合のみインターネット接続が必要です。

## GitHub Pagesでのテスト公開

このテスト版では `index.html` は置かず、入口を `PaceCheckLab.html` にしています。
GitHub Pagesでは、同梱のGitHub Actionsワークフローが静的ファイルを公開します。
Actionsのデプロイが成功した後、以下の形式で直接開いてください。

```text
https://<GitHubユーザー名>.github.io/<リポジトリ名>/PaceCheckLab.html
```

GitHub Pagesの設定例:

1. GitHubにこのフォルダの中身をアップロードする
2. Repository Settings → Pages を開く
3. Build and deployment の Source を `GitHub Actions` にする
4. Actionsタブで `Deploy PaceCheck Lab to GitHub Pages` が成功するまで待つ
5. 表示されたURLの末尾に `/PaceCheckLab.html` を付けて開く

公開リポジトリにする場合、患者情報・施設固有情報・個人情報は含めないでください。

```text
PaceCheck Lab
├─ PaceCheckLab.html
│  ツール選択画面
│
├─ PaceCheck Studio.html
│  教育・記録・PDF出力ツール
│
├─ PaceCheck Arena
│  プログラマー操作シミュレーター
│
├─ PaceCheck CRT
│  CRT-P / CRT-D 教育・最適化シミュレーター
│
└─ PaceCheck ICD
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

## 配布時の注意

- フォルダ名を変更しても動作します。
- フォルダ内のHTML / JS / CSSの相対配置は変更しないでください。
- Windowsでも動作想定です。ZIP化して渡す場合は、展開後に `PaceCheckLab.html` を開いてください。
- ブラウザの保存データはPCごと・ブラウザごとに保存されます。
- GitHub PagesでトップURLだけを開くと入口は表示されません。必ず `PaceCheckLab.html` まで含めたURLを共有してください。

## 注意

このツールは教育・手順支援用です。最終判断は施設手順、医師指示、各社プログラマーマニュアルに従ってください。
