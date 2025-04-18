---
layout: post
title: "化学分野のKnowledge Graph作ってみた１"
date: 2025-04-01
---

<div align="center">
<img src="/assets/img/20250214_KG/KnowledgeGraph_pagetop.gif" width="80%" alt="MS_SSO">
</div>

しばらく前に、**Knowledge Graph**の概要や作り方の方法論の話をしました。今回から数回に分けて、化学分野のKnowledge Graph作成の実践方法に関して、サンプルコードなども示しながら、紹介したいと思います。

実践するためには、Pythonの基礎知識が必要なのと、エラーが発生時に生成AI等を使ってエラー対処ができることが望まれます。実施内容は、すごく単純なので、Python初心者でも何とか実践できるのではないかと思っています。心と時間にゆとりがある時に、チャレンジしてみてください。

初回は、実施内容の全体像について、お話しします。

## 目次
1. [生成AIとブレストしながら全体像を固める](#whole_plan?)
2. [python環境の準備](#python_preparation)

<br>

## 生成AIとブレストしながら全体像を固める <a id="whole_plan"></a>

### 初手、生成AI
将棋の藤井竜王・名人の「初手、お茶」は、将棋界で最も有名なプロトコールの一つですが、私たちも何か新しいことを始めようとしたときに、「初手、生成AI」が王道になりつつあります。

ということで、生成AIとブレストしながら、全体像を固めていきました。今回、私はGeminiを利用しましたが、特別な理由があったわけではないので、皆さんが使い慣れた生成AIツールを使ってください。

例えば、次のように問いかけます。


`Wikidataのようなオープンデータを利用して、化学分野のKnowlege Graphを作ろうと思っています。一緒に、考えてもらえますか？`

すると、相手も質問を返してくるので、

`類義語や略語の検索精度が上がるようなものをつくりたいです。`

`Pythonが使えるので、APIでデータをダウンロードしたいと思っています。`

といった感じで、質問に答えていきます。時には、こちらから質問を投げてみるのも有効です。

詳細は割愛しますが、生成ＡＩとの会話の結果、次のような方針を固めました。

```
辞書のスコープ：高分子化学に特化する（のちに有機化学、無機化学などに拡張）
Wikidataから抽出するデータ：
  - 化学物質の名称（日本語、英語の両方）
  - 化学物質の同義語、類義語（慣用句とIUPAC名も類義語とみなす）
  - 上位と下位概念
出力する辞書の形式：CSV形式
データ抽出・加工ツール：Python
```

今回、「～もKGに加えますか？」と質問してくれたので、「それを加えると、どんなことに使えますか？」と逆質問することで、それを加えるかどうかの判断がスムーズにできたので、やってよかったなと思いました。

このように生成AIを使ってブレストすることで、ぼんやりしていたものをしっかり整理することができたり、自分が想定していなかったことまで考慮することが出来たりしたので、`初手、生成AI`はとても有効だと感じました。

<br>

### Wikidataのサイトで、実際のデータを確認する

方針はGeminiとの会話で固まりましたが、実際のコーディング作業に移る前に、Wikidataのサイトを訪れて、具体的にどんなデータが格納されているのかを確かめました。

自分が欲しいデータが格納されていないようだと、Wikidataを情報源として使用することに意味はありませんので、大事な作業です。

`ポリエチレン`のページをサンプルとして示します。類義語や略号、カテゴリの名称、親カテゴリの情報、部分構造の情報など、様々な情報が格納されていることが分かります。

   <div align="center">
   <img src="/assets/img/20250401‗KG_making\wikidata_polyethylene.gif" width="80%" alt="MS_SSO">
   <p><em>Wikidataでポリエチレンを検索した画面</em></p>
   </div>

<br>

例えば、化学物質の名称、説明(定義)、および類義語は、それぞれ、`Label`、`Description`、`Also known as`に掲載されていることが分かります。

上位概念は`instance of`や`subclass of`が該当しそうです。その他にも、化学構造式やCAS Resistry Numberなども記載されていることが確認できました。

これで安心してwikidataを情報源として用いることができます。

<br>

## python環境の準備 <a id="python_preparation"></a>

参考までに私のWindows PCでの実行環境を簡単に記載します。今回は仮想環境を構築し、その中で実行しました。

ご自身で実施する際、仮想環境を作成しなかったり、Pythonやパッケージのバージョンが記載と異なったりしていても、おそらく動作可能です。ただし、思わぬところでエラーが発生する時もあるため、仮想環境を作り、バージョンを合わせておくのが安心です。

やり方に不安を感じる方は、生成AIに質問してみてください。馬鹿なことを聞いても、何度同じ質問をしても、生成AIは、怒ったりすねたりしないので、納得いくまで尋ねてみてください。

pyenvをインストール後、python-3.7.4をインストールする。

```
pyenv install 3.7.4
```

今回の`Knowledge Graph`作成作業専用の仮想環境を作成する。

```
python3.7 -m venv venv
```

仮想環境を有効化する。
```
venv\Scripts\activate # windows
source venv/bin/activate # Mac, Linux
```

実行に必要なパッケージをインストールする。

```
pip install pandas==1.3.5 requests==2.31.0
```

パッケージのインストールは、必ず、仮想環境を有効化した状態で行ってください。こうすることで、仮想環境内では、指定したパージョンのパッケージを利用することが可能になります。

これで、下準備は完了です。

次回は、本格的なコーディング作業に関する内容を投稿したいと思います。

## 次回予告

化学分野のKnowledge Graph作ってみた２

- SPARQL queryに慣れる
- テストコードを書いてみる
