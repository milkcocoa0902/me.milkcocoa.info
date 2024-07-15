---
title: "Kotlinでファイルを圧縮/展開する"
description: ''
date: '2022-11-11T00:00:00.000Z'
author:
  name: ここあ
  picture: '/assets/blog/authors/milkcocoa.png'
emoji: "🐙"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
  - Kotlin
  - Android
published: true
---

KotlinでファイルをZip圧縮/展開するコードを実装したので。  
ちなみにディスク容量のセーフティとかはかけていません。  
:::message alert
展開する際は信頼できるファイルのみを対象にするか、読み込みサイズを元にセーフティをかけるようにしてください。
ZIP爆弾には注意！！！！！
:::


### ファイルを圧縮する
ファイルをZIPに圧縮するには `ZipOutputStream`を使用します。
```kotlin
    // 指定したファイル/ディレクトリをZip圧縮する
    // ファイルはZipのルートに、ディレクトリは構造を維持して格納される
    fun archive(sources: List<File>, target: File): Unit {
        ZipOutputStream(target.outputStream()).use { zos ->
            sources.forEach { source->
                if(source.isDirectory.not()){
                    // ファイルならばそのままルートにデータを流し込む
                    zos.putNextEntry(ZipEntry(source.name))
                    source.inputStream().copyTo(zos, 256)
                }else{
                    // ディレクトリなら走査する
                    source.walk()
                        .filterNot { it.isHidden } // 隠しファイルは除外
                        .forEach {file->
                            if (file.isDirectory) {
                                // ディレクトリだった場合、Zipの中にディレクトリを切る
                                zos.putNextEntry(ZipEntry("${file.relativeTo(source)}/"))
                                zos.closeEntry()
                            } else {
                                // ファイルだった場合、データを流し込む
                                zos.putNextEntry(ZipEntry(file.relativeTo(source).toString()))
                                file.inputStream().copyTo(zos, 256)
                            }
                        }
                }
            }
        }
    }

```

### ファイルを展開する
Zipファイルを展開するには`ZipInputStream`を使用します。
```kotlin
    // ファイル展開する際に次のEntryを見ながらループを回すのに代入ループ(伝われ)が出来ないので拡張
    fun ZipInputStream.forEach(R: (ZipEntry)->Unit){
        var entry = nextEntry
        while (entry != null){
            R(entry)
            entry = nextEntry
        }
    }

    // 指定したZipファイルを任意の場所に展開する
    fun extract(source: Path, target: Path){
        ZipInputStream(Files.newInputStream(source)).use { zis->
            zis.forEach {entry->
                val dst = File(target.toFile(), entry.name)
                if(entry.isDirectory){
                    // エントリーがディレクトリならディレクトリ作成する
                    dst.mkdirs()
                }else{
                    // エントリーがファイルなら念の為にフォルダを切った後にデータを吸い出す
                    dst.parentFile?.mkdirs()
                    zis.copyTo(BufferedOutputStream(FileOutputStream(dst)))
                }
            }
        }
    }
```
