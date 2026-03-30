# Windows 11 で Jekyll ブログを動かす手順

材料研究者が自分のPCで再現できる、**winget のみを使う**シンプルな手順です。

## 前提

- Windows 11
- 管理者権限は不要（ユーザー単位のインストール）
- このリポジトリをクローン済みで、プロジェクトフォルダで作業する想定

---

## 手順 1: Ruby (with DevKit) のインストール

**PowerShell** または **ターミナル** を開き、次を実行します。

```powershell
winget install RubyInstallerTeam.RubyWithDevKit.3.3 --accept-source-agreements --accept-package-agreements
```

- インストーラーが起動したら、**「Add Ruby executables to your PATH」にチェック** を入れたまま **Install** をクリック。
- インストールが終わったら、**PowerShell/ターミナルを一度閉じ、開き直します**（環境変数 PATH を反映するため）。
- **補足:** 同じ PC にすでに Ruby が入っている場合（例: `C:\Ruby33-x64`）、PATH に `C:\Ruby33-x64\bin` が含まれていれば手順 2 以降に進めます。含まれていない場合は「PATH が反映されない場合」で手動追加するか、いったん `$env:Path = "C:\Ruby33-x64\bin;" + $env:Path` を実行してから続行できます。

---

## 手順 2: インストールと PATH の確認

新しい PowerShell/ターミナルで、次を実行します。

```powershell
ruby -v
```

例: `ruby 3.3.x (2024-xx-xx revision ...) [x64-mingw-ucrt]` のように表示されれば OK です。

`ruby` が見つからない場合は、次のいずれかを試してください。

- もう一度 PowerShell/ターミナルを閉じて開き直す
- PC を再起動する
- 手動で PATH を追加する（後述の「PATH が反映されない場合」を参照）

---

## 手順 3: MSYS2 開発ツールのセットアップ（ridk）

Jekyll の一部 gem はネイティブ拡張をビルドするため、MSYS2 の開発ツールが必要です。

```powershell
ridk install
```

表示されたメニューで **「1」**（MSYS2 base installation）を選び Enter。  
必要に応じて **「2」**（MINGW development toolchain）も選び、完了するまで待ちます。

---

## 手順 4: プロジェクトフォルダで bundle install

このリポジトリのルート（`Gemfile` があるフォルダ）に移動して、依存関係を入れます。

```powershell
cd C:\dev\Shin-ichiro-I.github.io
bundle install
```

`Bundle complete!` と表示されれば成功です。

---

## 手順 5: Jekyll の起動確認

```powershell
bundle exec jekyll serve
```

ブラウザで **http://localhost:4000** を開き、サイトが表示されれば完了です。  
止めるときはターミナルで `Ctrl+C` を押します。

> **注意:** Windows では `jekyll serve --detach`（バックグラウンド起動）は使えません。通常の `bundle exec jekyll serve` でフォアグラウンドで起動してください。

---

## トラブルシューティング

### Cursor のターミナルで `bundle` が認識されない（即効で直す）

**そのターミナルで**、次の 1 行を実行してから `bundle exec jekyll serve` を実行してください。

```powershell
$env:Path = "C:\Ruby33-x64\bin;" + $env:Path
```

その後、同じターミナルで `bundle exec jekyll serve` を実行すれば動きます。  
（この設定はそのターミナルを閉じるまで有効です。毎回必要なら、下記の「PATH を永続的に追加」を行ってください。）

### `ruby` や `bundle` が認識されない（PATH を永続的に追加する）

Ruby のインストール先は、通常次のいずれかです。

- `C:\Ruby33-x64\bin`
- `C:\Users\<あなたのユーザー名>\AppData\Local\Programs\Ruby33-x64\bin`

1. **スタートメニュー** → 「**環境変数を編集**」で **ユーザー環境変数** の **Path** を開く  
2. **編集** → **新規** で、上記の `\bin` まで含めたパスを 1 つ追加  
3. OK で閉じ、**PowerShell/ターミナルを開き直す**

### `ridk` が見つからない

`ridk` は Ruby with DevKit に含まれています。  
`ruby -v` が通っているのに `ridk` だけ見つからない場合は、Ruby のインストール先の `bin` が PATH に含まれているか確認してください。

### `bundle install` でネイティブ拡張のビルドに失敗する

- 手順 3 の `ridk install` で **1** と **2** の両方を実行したか確認する  
- 別の PowerShell/ターミナルを開き直してから、再度 `bundle install` を実行する

### ポート 4000 が使われている

次のように別ポートで起動できます。

```powershell
bundle exec jekyll serve --port 4001
```

---

## まとめ（コマンド一覧）

| 順番 | コマンド / 操作 |
|------|------------------|
| 1 | `winget install RubyInstallerTeam.RubyWithDevKit.3.3 --accept-source-agreements --accept-package-agreements` |
| 2 | インストーラーで「Add Ruby to PATH」にチェック → Install → **ターミナルを閉じて開き直す** |
| 3 | `ruby -v` で確認 |
| 4 | `ridk install` → 1 を選択（必要なら 2 も） |
| 5 | `cd C:\dev\Shin-ichiro-I.github.io`（自分のクローン先に読み替え可） |
| 6 | `bundle install` |
| 7 | `bundle exec jekyll serve` → http://localhost:4000 で確認 |

以上で、Windows 11 上で Jekyll ブログを動かせます。
