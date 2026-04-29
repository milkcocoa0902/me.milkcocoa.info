---
title: "Kotlin Serializationで値をマスクする"
description: '`kotlinx-serialization`を使用してデータをJSONシリアライズする際に、特定の機密フィールド（パスワードなど）をカスタムシリアライザを用いてマスク（アスタリスク置換）する方法を紹介しています。'
cover: '/assets/cover/cover.jpg'
date: '2024-01-08T21:43:00.000+09:00'
author:
  name: ここあ
  picture: '/assets/blog/authors/milkcocoa.png'
emoji: "🔐"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - kotlin
published: true
---

みなさん、`kotlin-serialization`使っていますか？

https://kotlinlang.org/docs/serialization.html

Kotlinが公式に提供しているシリアライズ機能です。

この記事では、`kotlinx-serialization`でデータをシリアライズする際に、特定のフィールドをマスクする方法を備忘録的に残しておきます。

ちなみに、今回はJsonを対象とします。

## JsonTranformSerializerを定義する

下記のように、 `JsonTransformerSerializer`を継承したやつを作ります。

```kotlin
@Serializable
class Credential(
    val username: String,
    val password: String,
    val raw_password: String
)


val s = object: JsonTransformingSerializer<T>(Credential.serializer()){
    override fun transformSerialize(element: JsonElement): JsonElement =
    JsonObject(element.jsonObject.mapValues {
        if(lowerMask.contains(it.key.lowercase())){
            return@mapValues JsonPrimitive("*".repeat(it.value.toString().length.coerceAtMost(32)))
        }
        return@mapValues when (it.value) {
            is JsonArray -> JsonArray(it.value.jsonArray.map { transformSerialize(it) })
            is JsonObject -> transformSerialize(it.value)
            else -> it.value
        }
    })
}
```

ちなみに、`lowerMask`は、マスクしたいフィールド名をlowercaseにしたリストで、今回は`listOf("password")`だと思ってください。


## つかう
使います。説明が雑

```kotlin
val credential = Credential(
     username = "user_name",
     password = "this field is masked",
     raw_passeord = "this field is not masked"
)

Json.encodeToJsonElement(s, credential)

// {"username":"user_name","password":"**********************","raw_password":"this field is not masked"}
```

