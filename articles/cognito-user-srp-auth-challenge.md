---
title: "CognitoのUSER_SRP_AUTHを突破したい"
description: ''
date: '2022-11-11T00:00:00.000Z'
emoji: "🔐"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
  - AWS
  - Cognito
  - Python
published: true
---

※途中の説明をだいぶ端折っています。細かいところは追って追記するのでひとまずは「これでCognitoにログインできるんだな」って感じで思っといてもらえれば  

AWSが提供しているサービスにCognitoという認証基板があって、それと接続するためのboto3というPython製のバックエンド向けSDKがあるのですが、SRPという方式を採用しているにもかかわらず署名計算は自分で行わないといけなかったので備忘録的に  
ちなみにフロント向けライブラリ(Amplify)には対応しているみたいなので、あくまでも「自前の認証基板とCognitoを接続したいよ」と言った人向けの内容となります。  
  
ざっくり、SRPってのはSecure Remote Passwordの略で、パスワードを通信路に流さずに認証してしまおうって感じのやつです。  

## 認証フロー
SRPの認証フローはこんな感じ
![](https://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/images/cognito-user-pool-auth-flow-srp.png)
認証リクエストを投げて、そのレスポンスを使って認証チャレンジに応答するだけ。
ちなみにRFCでは各計算にSHA1が使用されているのですが、CognitoではSHA256を使用しているみたいです。


## 認証リクエストを投げる
まずは認証を要求しなければ話になりません。  
。。。ですがここで投げる `SRP_A`という値がまだわかっていないのでそれを計算してあげる必要があります。  
### SRP_Aを計算する。
RFCでは以下のように定義されています。  
```
A = g^a % N
```
これをそのままコードに落とし込むだけです。  
ちなみに
- g = 2
- a = 128byteのランダム文字列を数値化 % N
- N = [RFC3526で定める3072bitのとても大きな値](https://www.ipa.go.jp/security/rfc/RFC3526EN.html#4)

```
def calculate_A(self):
  A = pow(self.g, self.a, self.N)
  if A % self.N == 0:
    raise ValueError('Illegal parameter. A mod N cannot be 0.')
  return A

def generate_small_a(self):
  random_hex = binascii.hexlify(os.urondom(128))
  return hex_to_long(random_hex) % self.N # このNは10進
```

さて、これで `SRP_A`の値が計算できたのでさっきのリクエストに突っ込んで投げてください。  
```[Python]
srp = SRP('your-user-pool-id')
srp_a = srp.calculate_A()

response = client.initiate_auth(
  AuthFlow = 'USER_SRP_AUTH',
  AuthParameters = {
    'USERNAME': 'cognito-user-name',
    'SRP_A': long_to_hex(srp_a) # 実際には16進文字列にして流し込まないといけない
  }
  ClientId = 'your-client-id',
)
```
投げると以下の感じのレスポンスが得られます。

```
{
  'ChallengeName': 'PASSWORD_VERIFIER',
  'ChallengeParameters': {
    'SALT': '3b9cadfa7530456cc432931b15bf9951',
    'SECRET_BLOCK': 'xxxxx',
    'SRP_B': 'xxxxx',
    'USERNAME': 'cognito-user-name',
    'USER_ID_FOR_SRP': 'cognito-user-name'
  }
}
```

## Challengeへの応答
### uの算出
```
def calculate_u(self, srp_a, srp_b):
  return hex_to_long(hex_hash(pad_hex(srp_a) + pad_hex(srp_b)))
```

### xの算出
```
def calculate_x(self, userPoolId, username, password, salt):
  full_password = f'{self.userPoolId.split("_")[1]}{username}:{password}'
  full_password_hash = hash_sha256(full_password.encode('utf-8'))
  return hex_to_long(hex_hash(pad_hex(salt) + full_password_hash))
```

### sの算出
u, xが計算できたのでsecretを計算できるようになりました。
```
  def calculate_s(srp_b, u, x)
    return pow(srp_b - (self.k * pow(self.g, x, self.N)), (self.a + u * x), self.N)
```

### hkdfの算出
ここまでこればhkdfが計算できます。  
つまり署名する際に使用する鍵の完成です。
```
def compute_hkdf(self, salt, ikm):
  info_bits = bytearray('Caldera Derived Key', 'utf-8')
  prk = hmac.new(salt, ikm, hashlib.sha256).digest()
  info_bits_update = info_bits + bytearray(chr(1), 'utf-8')
  hmac_hash = hmac.new(prk, info_bits_update, hashlib.sha256).digest()

  return hmac_hash[:16]
```

### 署名鍵の生成
先程まで計算してきたものを組み合わせて署名鍵を作成します。  
```
def get_authenticate_key(self, user_id_for_srp, password, srp_a, srp_b, salt):
  u = self.calculate_u(srp_A, srp_b)
  x = self.calculate_x(self.userPoolId, user_id_for_srp, password, salt)
  s = self.calculate_s(srp_b, u, x)
  return self.compute_hkdf(
    bytearray.fromhex(pad_hex(u)),
    bytearray.fromhex(pad_hex(s))
  )
```


### PASSWORD_CLAIM_SIGNATUREの算出
ここまで来たら最後の一歩です。  
鍵を入手したので署名します。それはそう  
```
def sign(self, hkdf, user_id_for_srp, secret_block):
  dt = datetime.datetime.utcnow().strftime("%a %b %d %H:%M:%S UTC %Y")
  timestamp = re.sub(r" 0(\d) ", r" \1 ", dt)
  secret_block_decoded = base64.standard_b64decode(secret_block)
  msg = bytearray(self.userPoolId.split('_')[1], 'utf-8') + bytearray(user_id_for_srp, 'utf-8') + bytearray(secret_block_decoded) + bytearray(timestamp, 'utf-8')
  hmac_obj = hmac.new(hldf, msg, hashlib.sha256).digest()
  return timestamp, base64.standard_b64encode(hmac_obj).decode('utf-8')
```

### 応答する
```
~~~~~~~~~~~~
challenge_parameters = response["ChallengeParameters"]
user_id_for_srp = challenge_parameters["USER_ID_FOR_SRP"]
srp_b = challenge_parameters["SRP_B"]
secret_block = challenge_parameters["SECRET_BLOCK"]
salt = challenge_parameters["SALT"]

hkdf = srp.get_authenticate_key(user_id_for_srp, password, srp_a, srp_b, salt)
signature = srp.sign(hkdf, user_id_for_srp, secret_block)

timestamp, signature = srp.sign(hkdf, user_id_for_srp, secret_block)



client.respond_to_auth_challenge(
  ClientId = 'your-client-id',
  ChallengeName = 'PASSWORD_VERIFIER',
  ChallengeResponses = {
    'TIMESTAMP': timestamp,
    'USERNAME': user_id_for_srp,
    'PASSWORD_CLAIM_SECRET_BLOCK': secret_block,
    'PASSWORD_CLAIM_SIGNATURE': signature
  }
)

```

MFAを有効にしているとかじゃなければこれでアクセストークンを取得することが出来ます。  
煮るなり焼くなり好きにしてくれ。  








## 実装の全貌
てことで全体像。python初心者なので細かいとこは許してクレメンス
```
import binascii
import os
import hashlib
import hmac
import six
import datetime
import re
import base64

class SRP():
  a: int
  Nstr: str
  N: int
  g: int
  k: str
  userPoolId: str

  def __init__(self, userPoolId):
    self.g = 2
    self.Nstr =\
      ("FFFFFFFF FFFFFFFF C90FDAA2 2168C234 C4C6628B 80DC1CD1" +\
      "29024E08 8A67CC74 020BBEA6 3B139B22 514A0879 8E3404DD" +\
      "EF9519B3 CD3A431B 302B0A6D F25F1437 4FE1356D 6D51C245" +\
      "E485B576 625E7EC6 F44C42E9 A637ED6B 0BFF5CB6 F406B7ED" +\
      "EE386BFB 5A899FA5 AE9F2411 7C4B1FE6 49286651 ECE45B3D" +\
      "C2007CB8 A163BF05 98DA4836 1C55D39A 69163FA8 FD24CF5F" +\
      "83655D23 DCA3AD96 1C62F356 208552BB 9ED52907 7096966D" +\
      "670C354E 4ABC9804 F1746C08 CA18217C 32905E46 2E36CE3B" +\
      "E39E772C 180E8603 9B2783A2 EC07A28F B5C55DF0 6F4C52C9" +\
      "DE2BCBF6 95581718 3995497C EA956AE5 15D22618 98FA0510" +\
      "15728E5A 8AAAC42D AD33170D 04507A33 A85521AB DF1CBA64" +\
      "ECFB8504 58DBEF0A 8AEA7157 5D060C7D B3970F85 A6E1E4C7" +\
      "ABF5AE8C DB0933D7 1E8C94E0 4A25619D CEE3D226 1AD2EE6B" +\
      "F12FFA06 D98A0864 D8760273 3EC86A64 521F2B18 177B200C" +\
      "BBE11757 7A615D6C 770988C0 BAD946E2 08E24FA0 74E5AB31" +\
      "43DB5BFC E0FD108E 4B82D120 A93AD2CA FFFFFFFF FFFFFFFF").replace(" ", "")
    self.N = hex_to_long(self.Nstr)
    self.k = hex_to_long(hex_hash(f'00{self.Nstr}0{self.g}'))
    self.a = self.generate_small_a()
    self.userPoolId = userPoolId
  
  def generate_small_a(self):
    random_hex = binascii.hexlify(os.urandom(128))
    return hex_to_long(random_hex) % self.N # このNは10進

  def calculate_A(self):
    A = pow(self.g, self.a, self.N)
    if A % self.N == 0:
      raise ValueError('Illegal parameter. A mod N cannot be 0.')
    return A

  def calculate_u(self, srp_a, srp_b):
    return hex_to_long(hex_hash(pad_hex(srp_a) + pad_hex(srp_b)))

  def calculate_x(self, userPoolId, username, password, salt):
    full_password = f'{self.userPoolId.split("_")[1]}{username}:{password}'
    full_password_hash = hash_sha256(full_password.encode('utf-8'))
    return hex_to_long(hex_hash(pad_hex(salt) + full_password_hash))

  def calculate_s(self, srp_b, u, x):
    return pow(hex_to_long(srp_b) - (self.k * pow(self.g, x, self.N)), (self.a + u * x), self.N)

  def compute_hkdf(self, salt, ikm):
    info_bits = bytearray('Caldera Derived Key', 'utf-8')
    prk = hmac.new(salt, ikm, hashlib.sha256).digest()
    info_bits_update = info_bits + bytearray(chr(1), 'utf-8')
    hmac_hash = hmac.new(prk, info_bits_update, hashlib.sha256).digest()

    return hmac_hash[:16]

  def get_authenticate_key(self, user_id_for_srp, password, srp_a, srp_b, salt):
    u = self.calculate_u(srp_a, srp_b)
    x = self.calculate_x(self.userPoolId, user_id_for_srp, password, salt)
    s = self.calculate_s(srp_b, u, x)
    return self.compute_hkdf(
      bytearray.fromhex(pad_hex(u)),
      bytearray.fromhex(pad_hex(s))
    )

  def sign(self, hkdf, user_id_for_srp, secret_block):
    dt = datetime.datetime.utcnow().strftime("%a %b %d %H:%M:%S UTC %Y")
    timestamp = re.sub(r" 0(\d) ", r" \1 ", dt)
    secret_block_decoded = base64.standard_b64decode(secret_block)
    msg = bytearray(self.userPoolId.split('_')[1], 'utf-8') + bytearray(user_id_for_srp, 'utf-8') + bytearray(secret_block_decoded) + bytearray(timestamp, 'utf-8')
    hmac_obj = hmac.new(hkdf, msg, hashlib.sha256).digest()
    return timestamp, base64.standard_b64encode(hmac_obj).decode('utf-8')

```


## 付録
### ユーティリティ
度々出てくる補助系の関数をここにまとめておきます。
```
def hex_to_long(hex_string):
  return int(hex_string, 16)

def long_to_hex(long_num):
  return '%x' % long_num

def hash_sha256(buf):
  hash = hashlib.sha256(buf).hexdigest()
  return (64 - len(buf)) * '0' + hash

def hex_hash(hex_string):
  return hash_sha256(bytearray.fromhex(hex_string))

def pad_hex(long_int):
  if not isinstance(long_int, six.string_types):
    hash_str = long_to_hex(long_int)
  else:
    hash_str = long_int

  if len(hash_str) % 2 == 1:
    hash_str = f'0{hash_str}'
  elif hash_str[0] in '89ABCDEFabcdef':
    hash_str = f'00{hash_str}'

  return hash_str

```
### 出典
- [ユーザプール認証フロー](https://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
- [Amplifyのソースコード](https://github.com/aws-amplify/amplify-js/tree/main/packages/amazon-cognito-identity-js/src)
- [boto3#initiate_auth](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cognito-idp.html#CognitoIdentityProvider.Client.initiate_auth)
- [boto3#respond_to_auth_challenge](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cognito-idp.html#CognitoIdentityProvider.Client.respond_to_auth_challenge)
- [RFC2945](https://datatracker.ietf.org/doc/html/rfc2945)
- [RFC3526](https://www.ipa.go.jp/security/rfc/RFC3526EN.html#4)
