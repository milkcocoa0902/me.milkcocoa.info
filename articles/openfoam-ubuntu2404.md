---
title: "Ubuntu 24.04でOpenFOAMを利用する"
emoji: "🛫"
description: ''
date: '2024-11-09T19:18:00.000+09:00'
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
  - OpenFOAM
  - CFD
  
published: true
---


こんにちは、ここあです。  
今回、流体解析ソフトウェアであるOpenFOAMを導入したので、備忘録的にまとめていきます。  


## 環境
- OS: Ubuntu 24.04.1
- CPU: Core i7 8700K (6C/12T)
- RAM: 64GB 
- GPU: Nvidia GTX 1060

今回はGPUは関係ありませんが、後にAmgXやPyFRを用いて、GPGPUを利用した流体解析の計算支援をする目論見があるので記述しています。


## OpenFOAMの導入
基本的には公式に書かれている手順に従って導入します。  

https://openfoam.org/download/12-ubuntu/

```
sudo sh -c "wget -O - https://dl.openfoam.org/gpg.key > /etc/apt/trusted.gpg.d/openfoam.asc"
sudo add-apt-repository http://dl.openfoam.org/ubuntu
sudo apt update
sudo apt -y install openfoam12
```

続いて、OpenFOAMのパスをシステムに登録させます。  
`bash`を使っている人は `~/.bashrc` に、 `zsh` を使っている人は `~/.zshrc` に、それ以外の人も適宜読み替えて登録してください。  

```: ~/.zshrc
source /opt/openfoam12/etc/bashrc
```

最後に、下記のコマンドで設定を読み込みます。 

```
source ~/.zshrc
```

## 試運転
OpenFOAMをインストールすると、チュートリアルも一緒についてきます。  

``` bash
cp -r $FOAM_TUTORIALS/incompressibleFluid/pitzDailySteady .
cd motorBike
```

### メッシュの作成
このチュートリアルでは、すでにメッシュ情報や解析条件が設定されています。  
そのため、そのままメッシュ切りを行なってしまいましょう。

``` bash
blockMesh
```

どの程度のセル数になったのかを確認しておきます。  

```
checkMesh 
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : checkMesh
Date   : Nov 10 2024
Time   : 17:13:14
Host   : 
PID    : 3828920
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/pitzDailySteady
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           25012
    internal points:  0
    faces:            49180
    internal faces:   24170
    cells:            12225
    faces per cell:   6
    boundary patches: 5
    point zones:      0
    face zones:       0
    cell zones:       0
```

およそ12,000セルのようです。

### 解析の実行

続いて、解析を実行します。

```
foamRun
```

これにより、与えた条件に対する解析が実行されます。


:::: details 実行の様子
```
foamRun
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : foamRun
Date   : Nov 10 2024
Time   : 17:14:55
Host   : 
PID    : 3830702
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/pitzDailySteady
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create mesh for time = 0

Selecting solver incompressibleFluid
Selecting viscosity model constant
Selecting turbulence model type RAS
Selecting RAS turbulence model kEpsilon
Selecting generalised Newtonian model Newtonian
RAS
{
    model           kEpsilon;
    turbulence      on;
    printCoeffs     on;
    viscosityModel  Newtonian;
    Cmu             0.09;
    C1              1.44;
    C2              1.92;
    C3              0;
    sigmak          1;
    sigmaEps        1.3;
}

No MRF models present


SIMPLE: Convergence criteria found
        p: tolerance 0.01
        U: tolerance 0.001
        "(k|epsilon|omega|f|v2)": tolerance 0.001


SIMPLE: Operating solver in steady-state mode with 1 outer corrector
SIMPLE: Operating solver in SIMPLE mode



Starting time loop

streamlines streamlines:
    automatic track length specified through number of sub cycles : 5

streamlines streamlines write:
    Seeded 10 particles
    Sampled 114 locations
Time = 1s

smoothSolver:  Solving for Ux, Initial residual = 1, Final residual = 0.0538101, No Iterations 1
smoothSolver:  Solving for Uy, Initial residual = 1, Final residual = 0.030925, No Iterations 2
GAMG:  Solving for p, Initial residual = 1, Final residual = 0.068427, No Iterations 17
time step continuity errors : sum local = 1.19733, global = 0.179883, cumulative = 0.179883
smoothSolver:  Solving for epsilon, Initial residual = 0.232889, Final residual = 0.0114607, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 1, Final residual = 0.045463, No Iterations 3
ExecutionTime = 0.214097 s  ClockTime = 0 s

Time = 2s

smoothSolver:  Solving for Ux, Initial residual = 0.442439, Final residual = 0.0304776, No Iterations 5
smoothSolver:  Solving for Uy, Initial residual = 0.293363, Final residual = 0.0257277, No Iterations 4
GAMG:  Solving for p, Initial residual = 0.0522866, Final residual = 0.0043522, No Iterations 15
time step continuity errors : sum local = 3.97243, global = 0.123316, cumulative = 0.303199
smoothSolver:  Solving for epsilon, Initial residual = 0.177004, Final residual = 0.0103032, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.446455, Final residual = 0.0395205, No Iterations 3
ExecutionTime = 0.236757 s  ClockTime = 0 s

......
......
......

Time = 285s

smoothSolver:  Solving for Ux, Initial residual = 0.000125234, Final residual = 1.23148e-05, No Iterations 5
smoothSolver:  Solving for Uy, Initial residual = 0.00100489, Final residual = 6.87913e-05, No Iterations 6
GAMG:  Solving for p, Initial residual = 0.00115928, Final residual = 8.12033e-05, No Iterations 5
time step continuity errors : sum local = 0.00342968, global = -0.000264336, cumulative = 0.714391
smoothSolver:  Solving for epsilon, Initial residual = 0.000136441, Final residual = 8.76233e-06, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.000223256, Final residual = 1.36736e-05, No Iterations 4
ExecutionTime = 5.07921 s  ClockTime = 5 s

Time = 286s

smoothSolver:  Solving for Ux, Initial residual = 0.000121621, Final residual = 1.19474e-05, No Iterations 5
smoothSolver:  Solving for Uy, Initial residual = 0.000988614, Final residual = 6.70939e-05, No Iterations 6
GAMG:  Solving for p, Initial residual = 0.00134638, Final residual = 0.00010499, No Iterations 4
time step continuity errors : sum local = 0.0044293, global = 0.000501573, cumulative = 0.714893
smoothSolver:  Solving for epsilon, Initial residual = 0.000134768, Final residual = 8.78789e-06, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.000218617, Final residual = 1.34194e-05, No Iterations 4
ExecutionTime = 5.09558 s  ClockTime = 5 s


SIMPLE solution converged in 286 iterations

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12040 locations
End
```
::::

わたしの環境では5秒ほどで解析が終了しました。

解析結果を見るには、下記コマンドを実行します。  

```
paraFoam
```
以下のような結果が得られるはずです。  
![](/images/openfoam-ubuntu2404/001.gif)


これだけではちょっとわからないので、もう少し細かく解析してみます。  
この設定は下記ファイルで行います。

```diff : system/controlDict
- writeInterval   100; 
+ writeInterval   1; 
```

もともとは100ステップごとに出力されていたものを、1ステップごとに出力するようにしてみました。  
これで、結果はより細かく見れそうです。  


:::: details 解析の様子
```
foamRun
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : foamRun
Date   : Nov 10 2024
Time   : 17:49:02
Host   : 
PID    : 3867978
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/pitzDailySteady
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create mesh for time = 0

Selecting solver incompressibleFluid
Selecting viscosity model constant
Selecting turbulence model type RAS
Selecting RAS turbulence model kEpsilon
Selecting generalised Newtonian model Newtonian
RAS
{
    model           kEpsilon;
    turbulence      on;
    printCoeffs     on;
    viscosityModel  Newtonian;
    Cmu             0.09;
    C1              1.44;
    C2              1.92;
    C3              0;
    sigmak          1;
    sigmaEps        1.3;
}

No MRF models present


SIMPLE: Convergence criteria found
        p: tolerance 0.01
        U: tolerance 0.001
        "(k|epsilon|omega|f|v2)": tolerance 0.001


SIMPLE: Operating solver in steady-state mode with 1 outer corrector
SIMPLE: Operating solver in SIMPLE mode



Starting time loop

streamlines streamlines:
    automatic track length specified through number of sub cycles : 5

streamlines streamlines write:
    Seeded 10 particles
    Sampled 114 locations
Time = 1s

smoothSolver:  Solving for Ux, Initial residual = 1, Final residual = 0.0538101, No Iterations 1
smoothSolver:  Solving for Uy, Initial residual = 1, Final residual = 0.030925, No Iterations 2
GAMG:  Solving for p, Initial residual = 1, Final residual = 0.068427, No Iterations 17
time step continuity errors : sum local = 1.19733, global = 0.179883, cumulative = 0.179883
smoothSolver:  Solving for epsilon, Initial residual = 0.232889, Final residual = 0.0114607, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 1, Final residual = 0.045463, No Iterations 3
ExecutionTime = 0.237507 s  ClockTime = 0 s

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12615 locations
Time = 2s

smoothSolver:  Solving for Ux, Initial residual = 0.442439, Final residual = 0.0304776, No Iterations 5
smoothSolver:  Solving for Uy, Initial residual = 0.293363, Final residual = 0.0257277, No Iterations 4
GAMG:  Solving for p, Initial residual = 0.0522866, Final residual = 0.0043522, No Iterations 15
time step continuity errors : sum local = 3.97243, global = 0.123316, cumulative = 0.303199
smoothSolver:  Solving for epsilon, Initial residual = 0.177004, Final residual = 0.0103032, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.446455, Final residual = 0.0395205, No Iterations 3
ExecutionTime = 0.359535 s  ClockTime = 0 s

......
......
......

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12040 locations
Time = 285s

smoothSolver:  Solving for Ux, Initial residual = 0.000125234, Final residual = 1.23148e-05, No Iterations 5
smoothSolver:  Solving for Uy, Initial residual = 0.00100489, Final residual = 6.87913e-05, No Iterations 6
GAMG:  Solving for p, Initial residual = 0.00115928, Final residual = 8.12033e-05, No Iterations 5
time step continuity errors : sum local = 0.00342968, global = -0.000264336, cumulative = 0.714391
smoothSolver:  Solving for epsilon, Initial residual = 0.000136441, Final residual = 8.76233e-06, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.000223256, Final residual = 1.36736e-05, No Iterations 4
ExecutionTime = 31.1398 s  ClockTime = 31 s

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12040 locations
Time = 286s

smoothSolver:  Solving for Ux, Initial residual = 0.000121621, Final residual = 1.19474e-05, No Iterations 5
smoothSolver:  Solving for Uy, Initial residual = 0.000988614, Final residual = 6.70939e-05, No Iterations 6
GAMG:  Solving for p, Initial residual = 0.00134638, Final residual = 0.00010499, No Iterations 4
time step continuity errors : sum local = 0.0044293, global = 0.000501573, cumulative = 0.714893
smoothSolver:  Solving for epsilon, Initial residual = 0.000134768, Final residual = 8.78789e-06, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.000218617, Final residual = 1.34194e-05, No Iterations 4
ExecutionTime = 31.2442 s  ClockTime = 31 s


SIMPLE solution converged in 286 iterations

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12040 locations
End
```
::::

今回は解析に31秒ほどかかりました。  
同じように結果を見てみましょう。

![](/images/openfoam-ubuntu2404/002.gif)
先程よりもはっきりと広がっていく様子が伺えます。


## 並列演算
さて、今回のようなごく小規模の解析では気になりませんが、それなりの規模になってくると解析に時間がかかってきます。  
そこで、今回は並列に演算処理をすることで解析にかかる時間の短縮を狙ってみます。  

OpenFOAMは、どうやらOpenMPIを用いた並列演算をサポートしているようです。  
そのため、特別になにかをインストールすることなく、標準で並列演算をすることができます。

https://qiita.com/parapi_fluid/items/af2cdb4dcebfc940d874

### 分割設定
まずは、メッシュをコアに割り振るための設定を行います。  
今回は以下のように設定しました。

```: system/decomposeParDict
/*--------------------------------*- C++ -*----------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/

FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    note        "mesh decomposition control dictionary";
    object      decomposeParDict;
}

// 分割数
numberOfSubdomains  4;

// 分割方式
method          simple;

// 分割
simpleCoeffs
{
    n           (2 2 1);  // 各方向での分割数 (例: 2x2x1) = 4                                                                                                                                                                     
    delta       0.001;
};
```

`simple` での分割は、指定したブロックにメッシュを分割します。
この他にも、例えば　`scotch` では自動で均等な負荷になるように分割してくれるようです。

また、`numberOfSubdomains` はどうやらCPUの物理コア数を上限に決めると良さそうです。  
ただし、単に上限にするのではなく、メッシュを切った後のセル数と相談し、配分後のセル数が小さくなりすぎないように調整すると良さそうです。  
今回は小規模なので適当に4分割にしました。


### セルの割り当て

続いて、`decomposeParDict` に従い、セルを配分します。。  
これには、下記コマンドを実行します。

```
decomposePar
```

今回は4分割をしたので、プロジェクトディレクトリには **processor0** ~ **processor3** までのディレクトリが生成されていると思います。　

:::: details 分割後の様子

```
tree -L 2
.
├── 0
│     ├── include
│     ├── k
│     ├── nut
│     ├── nuTilda
│     ├── p
│     └── U
├── Allclean
├── Allrun
├── constant
│     ├── geometry
│     ├── momentumTransport
│     ├── physicalProperties
│     └── polyMesh
├── processor0
│     ├── 0
│     └── constant
├── processor1
│     ├── 0
│     └── constant
├── processor2
│     ├── 0
│     └── constant
├── processor3
│     ├── 0
│     └── constant
└── system
    ├── blockMeshDict
    ├── controlDict
    ├── decomposeParDict
    ├── functions
    ├── fvSchemes
    ├── fvSolution
```
::::



では、どのように配分されたのかを確認してみましょう。  
確認するには、各ディレクトリで `checkMesh`を実行します。  

:::: details Processor0の配分
```
checkMesh 
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : checkMesh
Date   : Nov 10 2024
Time   : 20:58:50
Host   : 
PID    : 4061619
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/pitzDailySteady/processor0
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           6368
    internal points:  0
    faces:            12291
    internal faces:   5925
    cells:            3036
    faces per cell:   6
    boundary patches: 7
    point zones:      0
    face zones:       0
    cell zones:       0

```
::::
:::: details Processor1の配分
```
checkMesh 
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : checkMesh
Date   : Nov 10 2024
Time   : 21:01:24
Host   : 
PID    : 4064378
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/pitzDailySteady/processor1
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           6432
    internal points:  0
    faces:            12446
    internal faces:   6016
    cells:            3077
    faces per cell:   6
    boundary patches: 7
    point zones:      0
    face zones:       0
    cell zones:       0

Overall number of cells of each type:
    hexahedra:     3077
    prisms:        0
    wedges:        0
    pyramids:      0
    tet wedges:    0
    tetrahedra:    0
    polyhedra:     0

```
::::
:::: details Processor2の配分
```
checkMesh 
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : checkMesh
Date   : Nov 10 2024
Time   : 21:02:11
Host   : 
PID    : 4065201
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/pitzDailySteady/processor2
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           6444
    internal points:  0
    faces:            12452
    internal faces:   6010
    cells:            3077
    faces per cell:   6
    boundary patches: 7
    point zones:      0
    face zones:       0
    cell zones:       0

Overall number of cells of each type:
    hexahedra:     3077
    prisms:        0
    wedges:        0
    pyramids:      0
    tet wedges:    0
    tetrahedra:    0
    polyhedra:     0
```
::::
:::: details Processor3の配分
```
checkMesh 
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : checkMesh
Date   : Nov 10 2024
Time   : 21:03:09
Host   : 
PID    : 4066277
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/pitzDailySteady/processor3
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           6344
    internal points:  0
    faces:            12276
    internal faces:   5934
    cells:            3035
    faces per cell:   6
    boundary patches: 7
    point zones:      0
    face zones:       0
    cell zones:       0
```
::::

デタラメに分割したにしては、あまり偏りのない配分ができました。


### 解析の実行
続いて、解析を実行します。

```
mpirun -np 4 foamRun -solver incompressibleFluid -parallel
```

というように実行します。

:::: details 実行の様子
```
mpirun -np 4 foamRun -solver incompressibleFluid -parallel
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : foamRun -solver incompressibleFluid -parallel
Date   : Nov 10 2024
Time   : 18:07:53
Host   : 
PID    : 3885262
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/pitzDailySteady
nProcs : 4
Slaves : 
3
(
"......3885263"
"......3885264"
"......3885265"
)

Pstream initialised with:
    floatTransfer      : false
    nProcsSimpleSum    : 0
    commsType          : nonBlocking
    polling iterations : 0
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create mesh for time = 0

Selecting solver incompressibleFluid
Selecting viscosity model constant
Selecting turbulence model type RAS
Selecting RAS turbulence model kEpsilon
Selecting generalised Newtonian model Newtonian
RAS
{
    model           kEpsilon;
    turbulence      on;
    printCoeffs     on;
    viscosityModel  Newtonian;
    Cmu             0.09;
    C1              1.44;
    C2              1.92;
    C3              0;
    sigmak          1;
    sigmaEps        1.3;
}

No MRF models present


SIMPLE: Convergence criteria found
        p: tolerance 0.01
        U: tolerance 0.001
        "(k|epsilon|omega|f|v2)": tolerance 0.001


SIMPLE: Operating solver in steady-state mode with 1 outer corrector
SIMPLE: Operating solver in SIMPLE mode



Starting time loop

streamlines streamlines:
    automatic track length specified through number of sub cycles : 5

streamlines streamlines write:
    Seeded 10 particles
    Sampled 114 locations
Time = 1s

smoothSolver:  Solving for Ux, Initial residual = 1, Final residual = 0.0624406, No Iterations 1
smoothSolver:  Solving for Uy, Initial residual = 1, Final residual = 0.0345977, No Iterations 2
GAMG:  Solving for p, Initial residual = 1, Final residual = 0.0953916, No Iterations 15
time step continuity errors : sum local = 1.66915, global = 0.431908, cumulative = 0.431908
smoothSolver:  Solving for epsilon, Initial residual = 0.232906, Final residual = 0.011808, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 1, Final residual = 0.0495972, No Iterations 3
ExecutionTime = 0.140031 s  ClockTime = 0 s

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12625 locations
Time = 2s

smoothSolver:  Solving for Ux, Initial residual = 0.443042, Final residual = 0.0334304, No Iterations 5
smoothSolver:  Solving for Uy, Initial residual = 0.293832, Final residual = 0.0272332, No Iterations 4
GAMG:  Solving for p, Initial residual = 0.052832, Final residual = 0.00428864, No Iterations 12
time step continuity errors : sum local = 3.93007, global = 0.286175, cumulative = 0.718082
smoothSolver:  Solving for epsilon, Initial residual = 0.176983, Final residual = 0.0105368, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.44847, Final residual = 0.0415, No Iterations 3
ExecutionTime = 0.223599 s  ClockTime = 0 s

......
......
......

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12040 locations
Time = 292s

smoothSolver:  Solving for Ux, Initial residual = 0.000125207, Final residual = 9.03251e-06, No Iterations 6
smoothSolver:  Solving for Uy, Initial residual = 0.00104813, Final residual = 7.97763e-05, No Iterations 6
GAMG:  Solving for p, Initial residual = 0.00141904, Final residual = 9.7231e-05, No Iterations 3
time step continuity errors : sum local = 0.00409169, global = -0.00045717, cumulative = 2.10686
smoothSolver:  Solving for epsilon, Initial residual = 0.000141523, Final residual = 1.02631e-05, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.000231421, Final residual = 1.56851e-05, No Iterations 4
ExecutionTime = 23.4195 s  ClockTime = 23 s

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12040 locations
Time = 293s

smoothSolver:  Solving for Ux, Initial residual = 0.000123505, Final residual = 9.09438e-06, No Iterations 6
smoothSolver:  Solving for Uy, Initial residual = 0.00100191, Final residual = 7.68092e-05, No Iterations 6
GAMG:  Solving for p, Initial residual = 0.00186172, Final residual = 0.00011423, No Iterations 3
time step continuity errors : sum local = 0.00481771, global = -0.000671154, cumulative = 2.10619
smoothSolver:  Solving for epsilon, Initial residual = 0.000139385, Final residual = 1.00406e-05, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.000227397, Final residual = 1.534e-05, No Iterations 4
ExecutionTime = 23.497 s  ClockTime = 23 s

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12040 locations
Time = 294s

smoothSolver:  Solving for Ux, Initial residual = 0.00012079, Final residual = 8.94887e-06, No Iterations 6
smoothSolver:  Solving for Uy, Initial residual = 0.000980767, Final residual = 7.38358e-05, No Iterations 6
GAMG:  Solving for p, Initial residual = 0.00104762, Final residual = 8.95664e-05, No Iterations 3
time step continuity errors : sum local = 0.00377283, global = -0.000373386, cumulative = 2.10582
smoothSolver:  Solving for epsilon, Initial residual = 0.000135936, Final residual = 9.93353e-06, No Iterations 3
smoothSolver:  Solving for k, Initial residual = 0.000219675, Final residual = 1.50131e-05, No Iterations 4
ExecutionTime = 23.5731 s  ClockTime = 23 s


SIMPLE solution converged in 294 iterations

streamlines streamlines write:
    Seeded 10 particles
    Sampled 12040 locations
End

Finalising parallel run
```
::::

31秒かかっていた解析が、23秒で終了しました。  
プロジェクトが小規模なため時間短縮の効果は少ないですが、明らかに時間が短くなっていると言っても良いでしょう。  


### 結果の確認
分割して解析した場合、解析結果を見る前に結合するのを忘れないようにしましょう

```
reconstructPar
paraFoam
```

![](/images/openfoam-ubuntu2404/002.gif)

:::: message
ステップ数を見ると気がつくかと思いますが、ステップ数が僅かに増えています。  
これは、割り振られたプロセスごとに収束条件を満たす必要があるからだと思われます。  
また、再構築する際の境界面で、分割しなかった場合と微妙に異なる挙動が見られる可能性はあります。（極力発生しない方向に解決されるかとは思います。）
::::

:::: message
今回は実行しませんでしたが、`refineMesh`や`snappyHexMesh`を用いてメッシュを細分化する際、並列で実行する場合には`decomposePar`でそれぞれに割り振られたものに対して細分化されることになります。  
つまり、`blockMesh`で粗分解し、`decomposePar`で配分して、それぞれで`snappyHexMesh`を実行するということです。  
これは、`blockMesh`で粗分解し、`snappyHexMesh`で細分化して`decomposePar`をするのと結果が微妙に変わることに注意が必要そうです。  
とはいえ、基本的には誤差が少なくなるように動くはずなので、特に精度を気にする場合でなければ、許容できそうです。
::::





## さいごに
今回は導入して適当に遊んで終わりましたが、次はNvidiaが出しているAmgXと連携して、GPGPUを用いた解析をしてみたいと思います。
https://developer.nvidia.com/amgx

また別件で`PyFR`というツールも触ってみたので、こちらについても導入をいつかまとめます。  
https://pyfr.readthedocs.io/en/latest/