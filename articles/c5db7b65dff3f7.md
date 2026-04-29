---
title: "DataBiningの解放漏れからの脱却"
description: 'Android開発におけるDataBindingの解放漏れを防ぐためのボイラープレートコードを削減し、`databinding-ktx`ライブラリを活用して簡潔に記述する方法を紹介しています。'
emoji: "🤖"
type: "tech"
topics:
- Kotlin
- Android 
published: false
---


こんにちは、あるいはこんばんは、ここあです。今回は、備忘録程度に、いつにも増して雑記事です。

突然ですが皆さん、 `DataBinding` してますか？？
していないですか、そうですか....
している方は、だいたい以下のようなコードになっていると思います

``` 
  ~~~~
  private var _binding: HogeBinding? = null
  private val binding get() = _binding!!

  ~~~

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
```


さて、これを毎回書いていくの、地味に面倒じゃないですか？

ということで、 `databinding-ktx` の紹介です。