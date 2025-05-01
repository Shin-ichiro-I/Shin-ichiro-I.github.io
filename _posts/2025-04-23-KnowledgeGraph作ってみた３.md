---
layout: post
title: "化学分野のKnowledge Graph作ってみた3"
date: 2025-04-23
---

<div align="center">
<img src="/assets/img/20250214_KG/KnowledgeGraph_pagetop.gif" width="80%" alt="Knowledge Graphのイメージ">
</div>

前回は、テストコードを作成し、確認作業を行う過程を説明しました。

今回は、作ったKnowledge Graphの検証作業の説明をします。

## 目次

1. [検証方法](#velification)
2. [検証結果](#results)

<br>

## 検証方法 <a id="velification"></a>

### 検証用リストの作成

今回は、検証用リストを作成し、ヒット率を計測する方法で検証を行います。そこで、先ずは検証用のリストを準備します。

検証用リストは、ユースケースに沿うよう作成しました。今回想定するユースケースは、用語リストが与えられた時に、リスト中に類義語が含まれているかどうかを判定する、というものです。

先ずは、見出し語として、日本語と英語が対になった化学用語を100語程度準備しました。その見出し語に対して、含まれていてほしい類義語を書き出します。いくつかの例を示します。

| 見出し語 | Head word | Synonym 1 | Synonym 2 | Synonym 3 | Synonym 4 | Synonym 5 |
| ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| メタノール | methanol | CH₃OH | メチルアルコール | methyl alcohol | MeOH |  |
| エタノール | ethanol | C₂H₅OH | エチルアルコール | ethyl alcohol | EtOH |  |
| ヒドロキシ基 | hydroxy | -OH | 水酸基 | アルコール基 |  |  |
| カルボキシ基 | corboxy | -COOH | カルボン酸基 |  |  |  |
| 蒸留 | distillation | distill. | distill |  |  |  |
| 抽出 | extraction | ext. |  |  |  |  |

作成したKnowledge Graphにリスト中の単語がどの程度含まれているかを調査します。

### 検証用コードの作成

検証用コードを作成し、自動的に検証が実施できるようにしました。大まかな手順は、「文字コードの修正」→「見出し語有無の確認」→「見出し語有りの時、類義語有無の確認」です。

**文字コードの修正**：　Unicodeの亜付き／上付き文字が存在すると、検索が意図した通りに実施できないことがあります。そこで、これらをNFKC正規化を行いました。サンプルコードは以下です。

```
def normalize_text(text):
    """文字列からUnicodeの亜付き文字と上付き文字を削除し、NFKC正規化を行う"""
    if isinstance(text, str):
        text = remove_unicode_sub_sup(text)
        return unicodedata.normalize('NFKC', text)
    else:
        return text
```

**見出し語有無の確認**：　検証用リストの見出し語／Head wordを位置ぎょうずづ抜き出し、Wikidataから抽出したCSVに含まれるかチェックします。以下にサンプルコードを示します。

```
# 3. CSVファイルの各行について処理
for index, row in df_test.iterrows():
    term_ja = normalize_text(row["見出し語"])  # 正規化
    term_en = normalize_text(row["Head word"])  # 正規化
    
    found_in_label_ja = False
    found_in_label_en = False
    variation_results = {}  # 各表記ゆれ語の結果を格納する辞書
    
    # 3-1. "label_ja"または"label_en"に存在するか確認
    target_aliases_ja = None
    target_aliases_en = None
    for entry in knowledge_graph:
        if term_ja == entry.get("label_ja"):
            found_in_label_ja = True
            target_aliases_ja = entry.get("aliases_ja")
            break
        
    for entry in knowledge_graph:
        if term_en == entry.get("label_en"):
            found_in_label_en = True
            target_aliases_en = entry.get("aliases_en")
            break
```

コード中の`knowledge_graph`は、抽出したWikidaを格納したJSONファイルを`knowledge_graph = json.load(f)`の形式で読み込んだものです。

**見出し語有りの時、類義語有無の確認**：　ここでも、検証用CSVのSynonymを一行ずつ読み込み、`knowledge_graph`に該当する単語が含まれているかチェックします。サンプルコードは以下の通りです。

```
    # 3-2. 存在する場合、"aliases_ja"または"aliases_en"に表記ゆれが含まれるか確認
    variation_terms = [
        "表記ゆれ1", "表記ゆれ2", "表記ゆれ3",
        "表記ゆれ4", "表記ゆれ5", "表記ゆれ6",
        "表記ゆれ7", "表記ゆれ8", "表記ゆれ9"
    ]
    
    for variation in variation_terms:
        variation_value = row[variation]
        if pd.isna(variation_value):  # NaN値の場合はスキップ
            continue
        
        variation_value = normalize_text(variation_value)  # 正規化
        variation_results[variation] = False  # 初期値をFalseに設定
        
        # aliases_ja のチェック
        if target_aliases_ja:
            if isinstance(target_aliases_ja, str):
                target_aliases_ja = target_aliases_ja.split(", ")
            if variation_value in target_aliases_ja:
                variation_results[variation] = True
        
        # aliases_en のチェック
        if target_aliases_en:
            if isinstance(target_aliases_en, str):
                target_aliases_en = target_aliases_en.split(", ")
            if variation_value in target_aliases_en:
                variation_results[variation] = True
    
    # 4. 判定結果の格納
    result = {
        "正式名称": f"{term_ja}: {found_in_label_ja}",
        "official name": f"{term_en}: {found_in_label_en}",
    }
    
    for variation in variation_results:
        result[variation] = f"{row[variation]}: {variation_results[variation]}"
    results.append(result)
```

`result`はリストであり、事前に空のリストを作成しておき、判定結果を随時追加するようにしました。

以上が、検証用コード作成に関する説明です。検証方法は、Knowledge Graphを作成する目的により異なってきます。ここで紹介した内容を参考に、ご自身の目的に合った検証方法、検証用コードを作成してください。

<br>

## 検証結果 <a id="result></a>

先ずは、原子、分子を調べた結果を示します。

| 正式名称 | official name | 表記ゆれ1 | 表記ゆれ2 | 表記ゆれ3 | 表記ゆれ4 |
| ------- | ------- | ------- | ------- | ------- | ------- |
| 水素: True | hydrogen: True | H: True | H2: False |  |  |  
| 酸素: True | oxygen: True | O: True | O2: False |  |  |
| 窒素: True | nitrogen: True | N: True | N2: False |  |  |
| 炭素: True | carbon: True | C: True |  |  |  |
| 水: True | water: True | H2O: True | 純水: False | 蒸留水: False | aq.: False |
| 二酸化炭素: True | carbon dioxide: True | CO2: True | 炭酸ガス: False |  |  |
| 一酸化炭素: True | carbon oxide: False | CO: False | carbon monoxide: False |  |  |
| アンモニア: True | ammonia: True | NH3: True | 無水アンモニア: False | アンモニアガス: False | 液化アンモニア: False |
| 塩化ナトリウム: True | sodium chloride: True | NaCl: True | 食塩: True | 食塩: True |  |
| 水酸化ナトリウム: True | sodium hydroxide: True | NaOH: False | 苛性ソーダ: True | 苛性ソーダ: True |  |

<br>

当然含まれているであろう類義語が含まれていないことが分かります。

例えば、水酸化ナトリウムの分子式である`NaOH`が含まれていません。Wikidataのページで確認すると、分子式`NaOH`は類義語のリストにあるが、`default for all languages`という言語分類に入っています。今回私が取得した言語は`日本語`と`英語`なので、分子式`NaOH`が洩れてしまいました。

この結果から、取得漏れを減らす工夫の余地がまだあることが分かりました。

<div align="center">
<img src="/assets/img/20250423_KG_making3/wikidata_NaOH.gif" width="80%" alt="Wikidataで「水酸化ナトリウム」を検索した結果">
</div>

<br>

別の例として、官能基の結果を示します。

| 正式名称 | official name | 表記ゆれ1 | 表記ゆれ2 | 表記ゆれ3 | 表記ゆれ4 |
| ------- | ------- | ------- | ------- | ------- | ------- |
| ヒドロキシ基: True | hydroxy: False | -OH: False | 水酸基: True | アルコール基: False |  |
| カルボキシ基: False | corboxy: False | -COOH: False | カルボン酸基: False |  |  |
| アミノ基: False | amino group: False | -NH₂: False |  |  |  |
| カルボニル基: True | carbonyl: True | -C=O: False |  |  |  |
| エーテル結合: False | ethers: True | -O-: False |  |  |  |
| エステル結合: False | ester: True | -COO-: False |  |  |  |
| アミド結合: True | amides: True | -CONH-: False |  |  |  |
| ニトロ基: True | nitro group: True | -NO₂: True |  |  |  |
| スルホン酸基: False | sulfonate: True | -SO₃H: False |  |  |  |

<br>

官能基は、そもそも、正式名称自体が含まれていないものが多いことが分かりました。また、化学式は、ほぼ全滅です。私が取得したクラス／サブクラスが悪い可能性があるので、Wikidataのページで調べました。例えば、`エーテル結合`という言葉は、Wikidataに登録されていませんでしたので、官能基に関する情報は、Wikidata以外の情報源から取得する必要がありそうです。幸い、官能基の種類は、物質名などと比較すると圧倒的に数が少ないので、仮に、手入力することになったとしても、何とかなるのではないかと思います。

<div align="center">
<img src="/assets/img/20250423_KG_making3/wikidata_ether.gif" width="80%" alt="Wikidataで「エーテル結合」を検索した結果">
</div>

<br>

最後に、ポリマーの例を示します。

| 正式名称 | official name | 表記ゆれ1 | 表記ゆれ2 | 表記ゆれ3 | 表記ゆれ4 |
| ------- | ------- | ------- | ------- | ------- | ------- |
| ポリエチレン: True | polyethylene: True | PE: True | LDPE: False | HDPE: False |  |
| ポリプロピレン: False | polypropylene: False | PP: False |  |  |  |
| ポリスチレン: True | polystyrene: True | PS: True |  |  |  |
| ポリ塩化ビニル: True | polyvinyl chloride: True | PVC: False |  |  |  |
| ナイロン: True | nylon: True | PA: False | ナイロン6: True | ナイロン66: True | Ny: False |
| ポリエステル: True | polyester: True | PET: False | PBT: False | PES: False |  |

ポリプロピレンが`False`になっています。Wikidataで検索すると、当然ヒットします。この原因は調査中ですが、今回の検証用コードに不備があるのか、Wikidataからデータ取得する際のエラーハンドリングなどに不備があり取得漏れが起こった可能性などが考えられます。

次に注目したのは、ポリエチレンです。ポリエチレンの高次構造違いのLDPEやHDPEが`False`になっています。この原因を調査した結果、別項目として含まれていることが分かりました。今回の検証用コードは、先ず「正式名称」がヒットするかどうか調査し、ヒットしたら、そこに含まれる類義語を調査する、という簡易的な手順を取っています。従って、LDPEやHDPEがポリエチレンと別項目になっているのであれば、ヒットしません。

今回取得した用語を使いこなすには、CSVになっているデータをKnowledgeGraphに作り直したり、ベクトルDBにしたりする必要があります。KnowledgeGraph作成は、`Neo4j`を使うと比較的簡単に作成できます。Neo4jの使い方を記したブログは多数あるので、ぜひチャレンジしてください。

## おわりに

3回にわたり、化学分野のKnowledgeGraphを作るためにWikidataからデータ抽出する方法について説明しました。Wikidataには膨大なデータが蓄積されています。これをベースに独自のKGを作らない手はないと思います。

Wikidataは個人がデータ登録を行っているため、データの格納方法に揺らぎがあります。従って、単一の方法（コード）でうまくいくわけではないことに注意が必要です。今回ご紹介したように、生成ＡＩの力も活用しながら、ご自身の目的に合った情報取得ができるよう、試行錯誤を繰り返してください。
