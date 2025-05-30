---
layout: post
title: "化学分野のKnowledge Graph作ってみた2"
date: 2025-04-11
---

<div align="center">
<img src="/assets/img/20250214_KG/KnowledgeGraph_pagetop.gif" width="80%" alt="Knowledge Graphのイメージ">
</div>

前回は、実際にKnowledge Graph作成のための準備作業について説明しました。

今回は、テストコードを作成し、確認作業を行う過程をご紹介します。

## 目次

1. [SPARQL queryに慣れる](#SPARQL)
2. [テストコードを書いてみる](#test_code)

<br>

## SPARQL queryに慣れる <a id="SPARQL"></a>

### SPARQLとは？

Wikidataから欲しい情報を抽出するには、SPARQLというクエリ言語を使用します。APARQLに馴染みのない方も多いと思うので、少し丁寧に説明します。

まず、GeminiによるAPARQLの説明を見てみましょう。

---

**SPARQL（スパークル）** は、RDF（Resource Description Framework） というデータモデルで記述された`データを検索・操作するためのクエリ言語`です。

簡単に言うと、

  - RDFデータ：`主語、述語、目的語の3つの要素（トリプル）`で関係性を表現するデータ形式。例：「渋谷」は「位置する」「東京都」。
  - SPARQL：このRDFデータに対して、「渋谷はどこに位置する？」といった質問（クエリ）をするための言語。

**SPARQLの主な特徴**

  - トリプルパターン: 検索したいデータの関係性をトリプルのパターンで記述。
  - グラフ構造: RDFデータがグラフ構造で表現されるため、SPARQLはグラフ構造のデータを効率的に検索可能。
  - 多様なクエリ形式: `データの選択 (SELECT)`、`構造化 (CONSTRUCT)`、`記述 (DESCRIBE)`、`存在確認 (ASK)` などが可能。
  - 複数のデータソース: 複数のRDFデータソース（SPARQLエンドポイント）に対して同時にクエリを実行できる機能がある。

**SQLとの違い**

従来のデータベースで使われるSQLは、テーブル構造でデータを管理しますが、SPARQLはグラフ構造のRDFデータを扱います。SQLはスキーマ（テーブル定義）に依存しますが、SPARQLはデータの意味的な関係性に基づいて柔軟な検索が可能です。

**SPARQLの用途**

  - Linked Open Data (LOD) の検索・活用
  - セマンティックWeb技術の基盤
  - 知識グラフの構築・検索
  - 異種データ間の統合・連携

SPARQLは、データ間の関係性を重視するアプリケーションや、分散したデータを統合的に扱いたい場合に非常に強力なツールとなります。

---

Wikidataは、Knowledge Graphで使われるトリプルの関係性を持っています。SPARQLの基本的な考え方は、このトリプルの関係を辿って必要な情報にアクセスすることです。

例えば、`ポリエチレン`をトリプルパターンで考えると、`ポリエチレン`は`サブクラス`、 `ポリマー`という関係になります。

ポリマーに分類されるアイテムを全て選択したい時には、`アイテム`は`サブクラス`、 `ポリマー`というトリプルに、選択クエリである`SELECT`などを組み合わせて使用します。

<br>

### Wikidata Query Serviceを試す

実際にSPARQLクエリを記述して、動作を確認してみましょう。

Wikidataには、SPARQLクエリを実行できる`Wikidata Query Service`というページが用意されています。このページでクエリテストしてから、Pythonコードに組み込むことができます。

[Wikidata Query Service]( https://query.wikidata.org/)にアクセスし、次のクエリを実行してみてください。

```sparql
SELECT (COUNT(?item) AS ?count) WHERE {
    ?item wdt:P31 wd:Q178593 .
}
```

このクエリは、`アイテム: ?item`が`分類: wdt:P31`、`高分子: wd:Q178593`というトリプルを持つアイテムの数をカウントします。

私の実行結果は`2`でした。つまり、高分子に分類されるアイテムは**2つ**しかないことになります。

次に、高分子に分類される２つのアイテムが何であるかを確認してみましょう。次のクエリを実行します。

```sparql
SELECT ?item WHERE {
    ?item wdt:P31 wd:Q178593 .
}
```

実行結果は、`wd Q7553318`と`wd Q47521607`でした。

`Q7553318`は`sodium ferric gluconate complex`という化学物質、`Q47521607`は`Ferrlecit`という医薬品であることが分かりました。

高分子に分類される物質は多数存在しますが、最初のクエリでは2つしか抽出できませんでした。これは、個々の物質が、`高分子: wd:Q178593`という上位の概念だけでなく、より下位の概念にも分類されているためです。

別の例として、高分子の下位概念であるビニルポリマー（Q1812439）を検索してみましょう。次のクエリを実行します。

```sparql
SELECT ?item WHERE {
    ?item wdt:P31 wd:Q1812439 .
}
```

実行結果は、`ポリエチレン(Q143429)`、`ポリプロピレン(Q146174)`、`ポリスチレン(Q146243)`、`ポリビニルピロリドン(Q413433)`、`ポリビニリデン N-オキシド(Q73646921)`の5件でした。これらの物質は全てビニルポリマーに分類されますが、他にも多くのビニルポリマーが存在するはずです。

<br>

### Knowledge Graph作成に必要なSPARQLクエリの検討

`ビニルポリマー（Q1812439）`の検索結果が5件しかなかったのは、Wikidataの分類が網羅的ではないことが原因と考えらえられます。Wikidataは個人によって登録作業が行われるため、登録者がどの分類で登録したか、複数の分類が可能な場合にすべての分類ラベルが付与されているか、などにばらつきがあります。

具体例として、ビニルポリマー（Q1812439）の検索結果に含まれる5つのポリマーの分類ラベルを以下の表にまとめました。

| ポリマー名 | 分類1 | 分類2 | 分類3 | 分類4 | 分類5 |
| -------- | -------- | -------- | -------- | -------- | -------- |
| ポリエチレン | polymer | resin | Vinyl polymer | polyolefin | saturated compound |
| ポリプロピレン | polymer | polyolefin | Vinyl polymer |  |  |
| ポリスチレン | type of polymer | Vinyl polymer |  |  |  |
| ポリビニルピロリドン | excipient | polymer | amides | nitrogen heterocycle | Vinyl polymer |
| ポリビニリデン N-オキシド | chemical compound | pyridine | Vinyl polymer |  |  |  |

この表から、５つのポリマーに共通する分類ラベルは`Vinyl polymer`のみであることが分かります。また、類似した構造を持つポリエチレンとポリプロピレンでも、登録されているタグの数が異なります。

このように、wikidataの分類は必ずしも網羅的ではないため、データを抽出する際に工夫が必要です。また、抽出結果が期待する範囲を網羅するとは限らないことに注意が必要です。

今回は、目的の化学領域において、できるだけ上位の階層に存在する分類を選択し、その下位概念を再帰的に検索する方法を採用します。例として、`重合体(Q81163)`を使用します。

まず、`重合体(Q81163)`に分類されるアイテム数を調べます。

```sparql
SELECT (COUNT(?item) AS ?count) WHERE {
?item wdt:P279/wdt:P279* wd:Q81163.  # polymer
}
```

私の実行結果は`128`件でした。

次に、再帰的な検索を試します。

```sparql
SELECT (COUNT(?item) AS ?count) WHERE {
?item wdt:P279/wdt:P279* wd:Q81163.  # 高分子
}
```

このクエリは、`重合体(Q81163)`の`サブクラス(P279)`、またはその再帰的サブクラス（P279*、サブクラスのサブクラスなど）であるアイテムの数をカウントします。

私の実行結果は`877147件`でした。単純に`重合体(Q81163)`を検索した場合と比較して、3桁増加しています。この方法を使用すれば、より多くのポリマー関連のデータを抽出できそうです。

ただし、この方法が全ての分類で使用できるわけではないことに注意が必要です。例えば、`高分子(Q178593)`で再帰的サブクラス検索を実施すると、タイムアウトエラーが発生することがあります。これは、上位階層の分類には多数の下位階層が存在し、検索経路が複雑になりすぎるためと考えられます。

従って、今回紹介した方法を使用する前に、目的の分野において、上位階層かつタイムアウトエラーが発生しない分類を事前に調査しておく必要があります。

<br>

## テストコードを書いてみる <a id="test_code"></a>

### SPARQLクエリをAPI経由で実行するコードの実装(主要部分のみ)

1. SPARQLクエリでアイテムのリストを取得する関数

```python
def get_item_list(offset, limit=100):

    query = f"""
    SELECT?item WHERE {
    ?item wdt:P279/wdt:P279* wd:Q81163.  # polymer
    }
    url = 'https://query.wikidata.org/sparql'
    headers = {
        'User-Agent': 'your_pjt/1.0 (xxxxx@xxxxx.co.jp)' # メールアドレスの入力がないとタイムアウトが発生します
        }
    params = {
        'query': query,
        'format': 'json'
    }
```

引数`limit=100`は、一度に取得するアイテム数を制限するためのものです。これは、Wikidataサーバーの負荷を低減したり、クライアント側の処理効率を向上させたりするために設定します。今回は、幾つかの値を試した結果、100に設定しました。

`User-Agent`には、ご自身のプロジェクト名とメールアドレスを入力してください。マニュアルに記載されているダミーアドレスを使用すると、短時間でタイムアウトが発生する可能性があるため、注意が必要です。

2. Wikidata APIを使用して、アイテムIDの詳細データを抽出する関数

```python
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

`'languages': 'ja|en'`と指定することで、日本語と英語の両方の両方のデータを取得できます。
`'props': 'labels|aliases|claims'`は、取得したい詳細項目を設定します。

3. 抽出したデータをファイルに出力する処理

```python
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

抽出したデータは、pandasのDataFrame形式に出力します。

ここまでの説明で、コードの基本的な処理の流れはご理解いただけたかと思います。

### コード全体の構成

上記の例では、基本的な処理のみを説明しました。実際には、エラー処理やログ出力、分割処理などの機能も必要になります。以下に、それらの機能を含むコード全体の構成を示します。

```python
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
    SELECT?item WHERE {
    ?item wdt:P279/wdt:P279* wd:Q81163.  # 高分子
    }
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
この関数では、`ORDER BY?item`, `LIMIT {limit}`, `OFFSET {offset}`を追加することで、分割処理を容易にしています。

また、接続エラーが起こった場合の再接続処理も実装しています。引数`retries=3`で、再接続の試行回数を指定します。再接続時には、`sleep(2 ** attempt)`の処理により、エラー回数に応じて再接続までの待機時間が長くなります。


```python
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

この関数でも、接続エラーが発生した場合の再接続処理を実装しています。

```python
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

`sleep(0.15)`の部分は、リクエスト間の時間間隔を設定する項目になります。Wikidataは1秒間に10回以下のリクエスト回数となるよう求められているとのことなので、その規定より少しだけ緩めの0.15秒の時間間隔としました。ただし、wikidataのサーバー負荷を考えると、もう少し長めに設定した方がよかったのかもしれません。お時間に余裕がある方は、ぜひ長め(1秒くらい)に設定してください。

上記pythonコードの実行文は以下です。
```python
poetry run python main_restrict.py {start_index} {stop_index}
poetry run python main_restrict.py 1 20001
```

先程のメイン処理部で`step = 20000`と設定しているので、20000アイテムずつ処理（CSVファイルが出力）されます。従って、実行文中の`{start_index}`と`{stop_index}`には、処理するアイテムの範囲を指定します。例えば、`1` `20001`と指定すると、1番目から20001番目までのアイテムが処理されます。

ちなみに、私の環境で20000アイテムを処理すると、2～3時間かかりました。`高分子(Q178593)`は約88万アイテムあるため、すべてのデータを処理するには、88時間～132時間（3日～5.5日）かかる計算になります。

従って、上記と同等以上の大きなデータをダウンロードしようとする場合、クラウド環境での実行が現実的です。また、長時間連続で通信を行うと、接続エラーが頻繁に発生する可能性があるため、エラー処理も重要になります。より詳細なログ出力を実装することも検討してください。

Python初心者にとって、これらの処理をすべて実装するのは難しいかもしれません。難しと感じた場合は、専門家のサポートを求めることを検討してください。もちろん、時間に余裕があれば、ご自身で挑戦してみるのも良い経験になると思います。

今回は、記事が長くなりましたので、ここで区切りたいと思います。お付き合いいただき、ありがとうございました。

## 次回予告

化学分野のKnowledge Graph作ってみた3

- 作ったKGの中身を検証してみる

お楽しみに！