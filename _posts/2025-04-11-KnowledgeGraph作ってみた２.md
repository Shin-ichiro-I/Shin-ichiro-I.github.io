---
layout: post
title: "化学分野のKnowledge Graph作ってみた１"
date: 2025-04-01
---

<div align="center">
<img src="/assets/img/20250214_KG/KnowledgeGraph_pagetop.gif" width="80%" alt="MS_SSO">
</div>

前回は、実際に**Knowledge Graph**を作成するために行った準備作業について話をしました。

今回は、実際にテストコードを書いて、動かしてみるところまでの話をしたいと思います。

<br>

## 目次
1. [SPARQL queryに慣れる](#SPARQL)
2. [テストコードを書いてみる](#test_code)

<br>

## SPARQL queryに慣れる <a id="SPARQL"></a>

### SPARQLとは？

Wikidataから欲しい情報を抽出するためには、SPARQL言語で問いかける必要があります。なじみがない方も多いと思いますので、少し丁寧に説明します。

先ずは、Gemini作成の説明を読んでみてください。

---

**SPARQL（スパークル）** は、RDF（Resource Description Framework） というデータモデルで記述された`データを検索・操作するためのクエリ言語`です。

簡単に言うと、

  - RDFデータ：`主語、述語、目的語の3つの要素（トリプル）`で関係性を表現するデータ形式です。例：「渋谷」は「位置する」「東京都」。
  - SPARQL：このRDFデータに対して、「渋谷はどこに位置する？」といった質問（クエリ）をするための言語です。

**SPARQLの主な特徴**

  - トリプルパターン: 検索したいデータの関係性をトリプルのパターンで記述します。
  - グラフ構造: RDFデータがグラフ構造で表現されるため、SPARQLはグラフ構造のデータを効率的に検索できます。
  - 多様なクエリ形式: `データの選択 (SELECT)`、`構造化 (CONSTRUCT)`、`記述 (DESCRIBE)`、`存在確認 (ASK)` など、様々な形式のクエリが可能です。
  - 複数のデータソース: 複数のRDFデータソース（SPARQLエンドポイント）に対して同時にクエリを実行できる（Federated Query）機能があります。

**SQLとの違い**

従来のデータベースで使われるSQLは、テーブル構造でデータを管理するのに対し、SPARQLはグラフ構造のRDFデータを扱う点が大きく異なります。SQLはスキーマ（テーブル定義）に依存しますが、SPARQLはデータの意味的な関係性に基づいて柔軟な検索が可能です。

**SPARQLの用途**

  - Linked Open Data (LOD) の検索・活用
  - セマンティックWeb技術の基盤
  - 知識グラフの構築・検索
  - 異種データ間の統合・連携

SPARQLは、データ間の関係性を重視するアプリケーションや、分散したデータを統合的に扱いたい場合に非常に強力なツールとなります。

---

Wikidataは、Knowledge Graphで使われるトリプルの関係をもっているということがお判りいただけたと思います。このトリプルの関係を使って／辿って、自分が欲しい情報にアクセスしていく、というイメージを持ってください。

例えば、`ポリエチレン`をトリプルパターンで考えてみると、`ポリエチレン`は`サブクラス`, `ポリマー`、となります。

また、ポリマーに分類されるアイテムを全て選択したい時には、`アイテム`は`サブクラス`, `ポリマー`というトリプルに、選択クエリである`SELECT`などを組み合わせて使うことになります。

<br>

### WikidataのSPARQLを試してみる

実際にSPARQLクエリを使って、慣れてみましょう。

Wikidataには、`Wikidata Query Service`というページが用意されており、SPARQLクエリを使って簡易検索などが行えるようになっています。このページの機能を使い、実際にPythonコードにSPARQLクエリを組み込む前のテストを行うことができます。

それでは、[Wikidata Query Service]( https://query.wikidata.org/)にアクセスし、次のようにクエリを入力し、実行してください。

```
SELECT (COUNT(?item) AS ?count) WHERE {
    ?item wdt:P31 wd:Q178593 .
}
```

私の結果は`2`でした。

このクエリでは、`アイテム: ?item`は`分類: wdt:P31`, `高分子: wd:Q178593`というトリプルのものを`選択:SELECT`し、`アイテム: ?item`の数を`カウント:COUNT`します。

つまり、高分子を分類とする(インスタンスとする)種類や概念は**2つ**しかない、ということが分かりました。

それでは、具体的に高分子を分類とするインスタンスつの２つ種類や概念が何なのかを確認してみましょう。

```
SELECT ?item WHERE {
    ?item wdt:P31 wd:Q178593 .
}
```

私の結果は、`wd Q7553318`と`wd Q47521607`でした。

`Q7553318`をwikidataのページで検索すると`sodium ferric gluconate complex`という化学物質でした。同様に、`Q47521607`を検索すると、`Ferrlecit`という医薬品であることが分かりました。

`高分子: wd:Q178593`と分類される物質は多く存在する中で、先程の検索式では、たった2つの物質しか抽出することができませんでしたが、これは、個々の物質が、`高分子: wd:Q178593`というかなり上位の概念／分類として登録されているのではなく、もっと下位の概念／分類の中にも登録されているからです。

それでは、もう一例だけwikidataのページでQuery検索を行ってみましょう。今回は、高分子よりも下位概念であるビニルポリマー（Q1812439）で検索してみます。

```
SELECT ?item WHERE {
    ?item wdt:P31 wd:Q1812439 .
}
```

結果は、`ポリエチレン(Q143429)`、`ポリプロピレン(Q146174)`、`ポリスチレン(Q146243)`、`ポリビニルピロリドン(Q413433)`、`ポリビニリデン N-オキシド(Q73646921)`の5件がヒットしました。間違った分類にはなっていませんが、違和感が残ると思うので、さらに深堀していきたいと思います。

<br>

### Knowledge Graph作成に必要なSPARQLを考える

`ビニルポリマー（Q1812439）`での検索で5件の登録しかないのは、かなり少ないと感じたのではないでしょうか。これは、個人が登録作業を行っているため、登録者がどの分類で登録したか、あるいは複数の分類(ラベル付け)が可能な場合に、考えうる全ての分類ラベルを付与したか、が関係していると思います。

具体的に確認してみます。下の表は`ビニルポリマー（Q1812439）`での検索でヒットした5件のポリマーにどのような分類がタグ付けされているかをまとめたものです。

|  | 分類1 | 分類2 | 分類3 | 分類4 | 分類5 |
| - | - | - | - | - | - |
| ポリエチレン | polymer | resin | Vinyl polymer | polyolefin | saturated compound |
| ポリプロピレン | polymer | polyolefin | Vinyl polymer |  |  |
| ポリスチレン | type of polymer | Vinyl polymer |  |  |  |
| ポリビニルピロリドン | excipient | polymer | amides | nitrogen heterocycle | Vinyl polymer |
| ポリビニリデン N-オキシド | chemical compound | pyridine | Vinyl polymer |  |  |  |

上の５つのポリマーで共通している分類は`Vinyl polymer`だけだということが分かります。そして、非常に似通ったポリマーである`ポリエチレン`と`ポリプロピレン`でも登録されているタグの数が異なります。

ここまで見てきた通り、wikidataの分類は必ずしも網羅的ではないため、抽出する際に工夫が必要です。また、いくら工夫を凝らしたとしても、自分が思い描く領域の関係性が全て抽出できるとは限りませんので、その点はご留意ください。

今回は、自分が欲しい化学領域でなるべく上位階層に存在する分類を選び、その下位概念を再帰的に検索する方法を採用します。ここでは`重合体(Q81163)`を例にとります。

先ずは、これまで通り、`重合体(Q81163)`という分類に何件登録されているか調べてみます。

```
SELECT (COUNT(?item) AS ?count) WHERE {
?item wdt:P31 wd:Q81163 .  
}
```

結果は`128`件でした。

次に、再帰的な検索を試してみます。

```
SELECT (COUNT(?item) AS ?count) WHERE {
?item wdt:P279/wdt:P279* wd:Q81163 .  
}
```

上のQueryは、`重合体(Q81163)`の`サブクラス(P279)`、またはその`再帰的サブクラス（P279*、サブクラスのサブクラス、サブクラスのサブクラスのサブクラス・・・）`であるアイテム数をカウントします。

私が実行した結果は`877147`でした。これは、ただ単に`重合体(Q81163)`というQueryで検索した時よりも3桁増えています。この方法を使えば、ごっそりポリマー関連の言葉を抽出できそうです。

最後に注意点を記しておきます。それは、今回のやり方が使えない分類も存在する、ということです。私がいろいろな分類で上記のやり方を試したところ、例えば、`高分子(Q178593)`で再帰的サブクラス検索を実施すると、ほぼ毎回タイムエラーとなりました。あまりにも上位階層の分類を選んでしまうと、多くの下位階層が存在し、検索経路が複雑化しすぎるためだと思います。

従って、今回ご紹介したようなやり方で、自分が得たい分野のなるべく上位階層かつタイムエラーが起こらない分類を事前に調査しておく必要があります。

<br>

## テストコードを書いてみる <a id="test_code"></a>

### API経由でSPARQL Queryを実行するコードを実装(主要部分のみ)

1. Get a list of items in a SPARQL query

```
def get_item_list(offset, limit=100):

    query = f"""
    SELECT?item WHERE {{
    ?item wdt:P279/wdt:P279* wd:Q81163.  # polymer
    }}
    """
    url = 'https://query.wikidata.org/sparql'
    headers = {
        'User-Agent': 'your_pjt/1.0 (xxxxx@xxxxx.co.jp)' # Note that if you do not enter your e-mail real name, a timeout will occur!
        }
    params = {
        'query': query,
        'format': 'json'
    }
```

引数`limit=100`で、一度に取得するアイテム数に制限をかけています。wikidata側のサーバー負荷低減効果やクライアント側での処理効率等を考え設定すべきパラメータだと思いますが、私はいくつか試した結果、今回は100にしました。

`User-Agent`の部分は、ご自身のプロジェクト名やメールアドレスを入力してください。メールアドレスがマニュアルに書かれているダミーアドレスのままだと、短時間でタイムアウトが起こるようなので、お気を付けください。

2. Extract detailed data for each item id with Wikidata API


```
def get_item_data(item_ids):
    url = 'https://www.wikidata.org/w/api.php'
    params = {
        'action': 'wbgetentities',
        'ids': '|'.join(item_ids),  # Specify multiple IDs separated by |
        'languages': 'ja|en',
        'props': 'labels|aliases|claims',
        'format': 'json'
    }
```

`'languages': 'ja|en'`とすることで、日本語と英語の両方で取得できます。
`'props': 'labels|aliases|claims'`で取得したい詳細項目を設定します。

3. Output extracted data to file

```
# extracted data item
'http://www.wikidata.org/entity/' + item_id,
data['labels'].get('ja', {}).get('value'),
data['labels'].get('en', {}).get('value'),
altLabel_ja = [alias['value'] for alias in data['aliases']['ja']]
altLabel_en = [alias['value'] for alias in data['aliases']['en']]
claims_p31 = data.get('claims', {}).get('P31')

# Composition of csv files
df = pd.DataFrame(all_data, columns=[
                        "item", "label_ja", "label_en", "altLabel_ja", "altLabel_en", "instance of"
                    ])
```

pandasのDataFrame形式に出力します。

全体を通して、さほど難しいところはなかったのではないかと思います。

### コードの全体像

先程の例では、基本的な処理だけを記載したので、エラー処理、ログ出力などが入っていませんでした。また、分割処理もできません。そのような機能を盛り込んだコード全体を３つのパートに分けて示します。

```
import requests
import pandas as pd
from time import sleep, time
import logging
import argparse
import os

# セッションの作成
session = requests.Session()

# ログ設定
logging.basicConfig(filename='wikidata_download_polymer_restrict.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# SPARQL クエリでアイテムのリストを取得
def get_item_list(offset, limit=100, retries=3):

    query = f"""
    SELECT?item WHERE {{
    ?item wdt:P279/wdt:P279* wd:Q81163.  # 高分子
    }}
    ORDER BY?item
    LIMIT {limit}
    OFFSET {offset}
    """
    url = 'https://query.wikidata.org/sparql'
    headers = {
        'User-Agent': 'your_pjt/1.0 (xxxxx@xxxxx.co.jp)'
    }
    params = {
        'query': query,
        'format': 'json'
    }
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            item_ids = [item['item']['value'].split('/')[-1] for item in　data['results']['bindings']]
            return item_ids
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}, Retrying... ({attempt + 1}/{retries})")
            sleep(2 ** attempt)
    return None
```
SPARQLクエリ中の`ORDER BY?item`, `LIMIT {limit}`, `OFFSET {offset}`部分を入れることで、分割処理などを行いやすくしています。

また、接続エラーが起こった際の再接続の処理が後半部分に盛り込まれています。引数`retries=3`で、再接続のトライアル回数を規定しています。なお、接続エラーが起こった際は、`sleep(2 ** attempt)`の処理により、エラー回数に応じて再接続するまでの時間が徐々に長くなるようになっています。


```
# Wikidata API でアイテムの詳細情報を取得
def get_item_data(item_ids, retries=3):
    url = 'https://www.wikidata.org/w/api.php'
    params = {
        'action': 'wbgetentities',
        'ids': '|'.join(item_ids),  # 複数のIDを|で区切って指定
        'languages': 'ja|en',
        'props': 'labels|aliases|claims',
        'format': 'json'
    }
    for attempt in range(retries):
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            result = {} # 結果を格納する辞書
            for item_id in item_ids: # item_idsの各要素に対して処理
                if item_id in data['entities']: # item_idが存在するか確認
                    result[item_id] = data['entities'][item_id]
            return result # 辞書を返す
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}, Retrying... ({attempt + 1}/{retries})")
            sleep(2 ** attempt)
    return None
```

ここでも、先程と同様に接続エラーが起きた際の処理を加えています。

```
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Wikidataから高分子データをダウンロードし、CSVファイルに保存する')
    parser.add_argument('start_index', type=int, help='開始位置')
    parser.add_argument('end_index', type=int, help='終了位置')
    args = parser.parse_args()

    start_index = args.start_index  # 開始位置
    end_index = args.end_index  # 終了位置
    step = 20000  # 1回の処理で取得するアイテム数
    limit = 100 # SPARQLクエリのLIMIT
    offset = start_index - 1  # オフセットを開始位置から計算
    file_count = start_index // step + 1  # ファイル番号を開始位置から計算

    # ディレクトリが存在しない場合は作成
    output_dir = 'wikidata_restrict'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    while offset <= end_index:  # end_index を上限として繰り返す
        all_data = []
        start_time = time()

        # 指定された範囲のアイテムIDを取得
        item_ids = get_item_list(offset, limit)

        while item_ids:
            for i in range(0, len(item_ids), 50):
                batch_ids = item_ids[i:i + 50]
                item_data = get_item_data(batch_ids)
                if item_data:
                    for item_id, data in item_data.items():
                        # 必要な情報を抽出
                        if 'ja' in data.get('aliases', {}):
                            altLabel_ja = [alias['value'] for alias in data['aliases']['ja']]
                        else:
                            altLabel_ja = []
                        if 'en' in data.get('aliases', {}):
                            altLabel_en = [alias['value'] for alias in data['aliases']['en']]
                        else:
                            altLabel_en = []

                        instance_of_list = []
                        claims_p31 = data.get('claims', {}).get('P31')
                        if claims_p31:
                            for claim in claims_p31:
                                instance_of_list.append(claim.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id'))

                        all_data.append([
                            'http://www.wikidata.org/entity/' + item_id,
                            data['labels'].get('ja', {}).get('value'),
                            data['labels'].get('en', {}).get('value'),
                            altLabel_ja,
                            altLabel_en,
                            instance_of_list
                        ])

                        # step件ごとにCSVファイル出力
                        if len(all_data) >= step:
                            df = pd.DataFrame(all_data, columns=[
                                "item", "label_ja", "label_en", "altLabel_ja", "altLabel_en", "instance of"
                            ])
                            csv_filename = f"chemical_data_api_Q81163_高分子_{file_count * step - step + 1}-{file_count * step}.csv"
                            df.to_csv(csv_filename, index=False, encoding="utf-8-sig")
                            all_data = [] # all_dataをリセット
                            file_count += 1  # ファイル番号をインクリメント

            elapsed_time = time() - start_time
            logging.info(f"処理済みアイテム数: {len(all_data)}, 経過時間: {elapsed_time:.2f}秒")
            sleep(0.15) # Wikidataのアクセス制限1秒間に10回以下厳守

            # 次のアイテムIDを取得
            offset += limit
            if offset >= end_index:
                break
            item_ids = get_item_list(offset, limit)

        # 残りのデータをCSVファイル出力
        if all_data:
            df = pd.DataFrame(all_data, columns=[
                "item", "label_ja", "label_en", "altLabel_ja", "altLabel_en", "instance of"  # 追加した情報のカラム名
            ])
            csv_filename = f"wikidata_restrict/chemical_data_api_Q81163_高分子_{file_count * step - step + 1}-{file_count * step}.csv"
            df.to_csv(csv_filename, index=False, encoding="utf-8-sig")
            all_data =[] # all_dataをリセット
            file_count += 1  # ファイル番号をインクリメント
        if offset >= end_index:
            break
```

メインの処理部では、ログ出力の設定、分割処理する際の設定部分、エラー処理などが加えられています。

`sleep(0.15)`の部分は、リクエスト間の時間間隔を設定する項目になります。wikidataは1秒間に10回以下のリクエスト回数となるよう求められているとのことなので、その規定より少しだけ緩めの0.15秒の時間間隔としました。ただし、wikidataのサーバー負荷を考えると、もう少し長めに設定した方がよかったのかもしれません。お時間に余裕がある方は、ぜひ長め(1秒くらい)に設定してください。

上記pythonコードの実行文は以下です。
```
poetry run python main_restrict.py {start_index} {stop_index}
poetry run python main_restrict.py 1 40001
```

先程のメイン処理部で`step = 20000`と設定しているので、20000アイテムずつ処理（CSVファイルが出力）されます。従って、実行文中の`{start_index}`と`{stop_index}`の数字を`20000`の倍数にしておくと、より分かりやすく分割処理が実施できます。

ちなみに、私の環境で20000アイテムを処理すると、2～3時間かかりました。ちなみに、`高分子(Q178593)`は約88万アイテムあるので、全てのデータを処理しようとすると、88時間～132時間（3日～5.5日）かかる計算になります。

従って、上記と同等以上の大きなデータをダウンロードしようとする場合、クラウド環境からの実行が現実的です。また、数日間連続で通信していると、接続エラーがそれなりの頻度で発生するので、接続エラー対策も必須となります。適切なエラーハンドリングを行うためには、私が書いているよりも詳しいログ出力があった方がよいかもしれません。

python初心者がこれらの処理を行うのは、少し難しいかもしれません。難しと感じた時には、その道のプロに手伝ってもらいましょう。もちろん、お時間に余裕があるようであれば、ご自身でトライアルしてください。十分に、攻略可能な範疇だと思います。

今回は、かなり長くなってしまったので、ここまでです。お付き合い、ありがとうございました。

## 次回予告

化学分野のKnowledge Graph作ってみた3

- 作ったKGの中身を検証してみる

お楽しみに！