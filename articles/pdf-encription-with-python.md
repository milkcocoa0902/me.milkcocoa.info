---
title: "PythonでPDFにパスワードをかける"
description: 'PythonのPyPDF2ライブラリを使用して、PDFファイルにパスワード保護（暗号化）をかける機能を実装する方法を簡潔に紹介しています。'
date: '2022-11-11T00:00:00.000Z'
author:
  name: ここあ
  picture: '/assets/blog/authors/milkcocoa.png'
emoji: "🔐"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
  - Python
published: true
---

PDFを暗号化したかったんですけどAdobe Acrobatだとサブスクリプションに登録しないといけなくなったみたいで、PDFをパスワード保護するためだけにサブスク登録したくなかったので  

## 環境
- Python 3.9.6
- PyPDF2


## 実装
やることは単純で、 `PyPDF2`を使用してPDFを吸い出す、パスワードをつける、PDFを吐き出す、です。

```Python: PdfCrypt.py
import PyPDF2
import pathlib
import os
import shutil

class PdfCrypt():
  """
    @brief PDFにパスワードをかける

    @param src[str]: 保護対象のPDFのパス
    @param dst[str]: 出力するPDFのパス
    @param password[str]: パスワード

    @return None
  """
  def encrypt(self, src: str, dst: str, password: str):
    # 念の為絶対パスに変換して扱う
    src_abs = str(pathlib.Path(src).resolve())
    dst_abs = str(pathlib.Path(dst).resolve())

    writer = PyPDF2.PdfFileWrite()
    reader: PyPDF2.PdfFileReader = None

    with open(src_abs, 'rb') as s:
      reader = PyPDF2.PdfFileReader(s)

      # pdfを吸い出す
      for page in range(reader.numPages):
        writer.addPage(reader.getPage(page))
      
      # パスワードをかける
      writer.encrypt(password)

     # 書き出す
     # 一時ファイルとして書き出して、書き出し終わったらリネームする
      tmp = dst_abs + '.tmp'
      with open(tmp, 'wb') as d:
        writer.write(d)
      shutil.move(tmp, dst_path)
```