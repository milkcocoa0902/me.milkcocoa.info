---
title: "OpenFOAMで並列演算を試してみる"
description: ''
date: '2024-11-13T01:11:30.000+09:00'
emoji: "😸"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
  - CFD
  - OpenFOAM
published: true
---

前回に引き続き、OpenFOAMで遊んでみました。  
今回は、motorBikeチュートリアルに対して、並列化したりしなかったりと試して比較してみました。

::: message
本記事は筆者の技術的興味に基づいてまとめている記事であり、学術的な意味を持って執筆しているわけではないことにご注意ください。
:::



## 環境
今回想定している環境は以下のとおりです。  

- OS: Ubuntu 24.04.1
- CPU: Core i7 8700K (6C/12T)
- RAM: 64GB
- GPU: Nvidia GeForce GTX 1060
- OpenFOAM v12



## 解析 ~ 並列化なし ~
まずは、並列化せずに単純に解析を行います。　　
つまり、以下のステップで解析を進めていきます。

1. blockMesh
2. snappyHexMesh
3. renumberMesh
4. foamRun


### メッシュの粗分解
まずは`blockMesh`を使用して粗分解します。

:::: details メッシュ切りの様子
```bash
blockMesh                                                                                                                            
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : blockMesh
Date   : Nov 11 2024
Time   : 12:12:57
Host   : 
PID    : 825777
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Reading "blockMeshDict"

Creating block mesh from
    "system/blockMeshDict"
No non-linear block edges defined
No non-planar block faces defined
Creating topology blocks
Creating topology patches

Creating block mesh topology

Check topology

	Basic statistics
		Number of internal faces : 0
		Number of boundary faces : 6
		Number of defined boundary faces : 6
		Number of undefined boundary faces : 0
	Checking patch -> block consistency

Creating block offsets
Creating merge list .

Creating polyMesh from blockMesh
Creating patches
Creating cells
Creating points with scale 1
    Block 0 cell size :
        i : 1
        j : 1
        k : 1

No patch pairs to merge

Writing polyMesh
----------------
Mesh Information
----------------
  boundingBox: (-5 -4 0) (15 4 8)
  nPoints: 1701
  nCells: 1280
  nFaces: 4224
  nInternalFaces: 3456
----------------
Patches
----------------
  patch 0 (start: 3456 size: 160) name: front
  patch 1 (start: 3616 size: 160) name: back
  patch 2 (start: 3776 size: 64) name: inlet
  patch 3 (start: 3840 size: 64) name: outlet
  patch 4 (start: 3904 size: 160) name: lowerWall
  patch 5 (start: 4064 size: 160) name: upperWall

End
```
::::

どうやら1280セルに分解されたようです。  

### メッシュの細分化
今回のチュートリアルにはSTLファイルが用意されているので、それを用いてメッシュを更に細かく切っていきます。

:::: details メッシュ細分化の様子
```bash
snappyHexMesh -overwrite
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : snappyHexMesh -overwrite
Date   : Nov 11 2024
Time   : 13:27:39
Host   : 
PID    : 900555
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create mesh for time = 0

Read mesh in = 0.001303 s
Reading "snappyHexMeshDict"


Overall mesh bounding box  : (-5 -4 0) (15 4 8)
Relative tolerance         : 1e-06
Absolute matching distance : 2.29783e-05

Reading refinement surfaces...
Read refinement surfaces in = 0.686569 s

Reading refinement regions...
Refinement level 5 for all cells inside refinementBox
Read refinement regions in = 3.9e-05 s

Reading features...
Read features in = 1.5e-05 s


Determining initial surface intersections
-----------------------------------------

Edge intersection testing:
    Number of edges             : 4224
    Number of edges to retest   : 4224
    Number of intersected edges : 2
Calculated surface intersections in = 0.791028 s

Initial mesh : cells:1280  faces:4224  points:1701
Cells per refinement level:
    0	1280
    
......
......
......

Edge intersection testing:
    Number of edges             : 10208666
    Number of edges to retest   : 1179
    Number of intersected edges : 505529
Snapped mesh : cells:3213298  faces:10208666  points:3843899
Cells per refinement level:
    0	930
    1	1644
    2	4588
    3	15528
    4	47296
    5	978875
    6	115511
    7	437349
    8	1611577
Writing mesh to time constant
Wrote mesh in = 67.3108 s.
Mesh snapped in = 283.292 s.
Checking final mesh ...
Checking faces in error :
    non-orthogonality > 65  degrees                        : 0
    faces with face-decomposition tet quality < 1e-30      : 0
    faces with concavity > 80  degrees                     : 0
    faces with skewness > 4   (internal) or 20  (boundary) : 0
    faces with interpolation weights (0..1)  < 0.02        : 0
    faces with volume ratio of neighbour cells < 0.01      : 0
    faces with face twist < 0.02                           : 0
    faces on cells with determinant < 0.001                : 0
Finished meshing without any errors
Finished meshing in = 830.056 s.
End
```
::::

14分ほどで細分化が完了しました。  
どうやら最終的に300万セル強になったようです。

### メッシュの整理
どうやら、チュートリアルでは`renumberMesh`というものを実行しています。
これを実行することでメッシュが整理され、解析時に効率が良くなるようです。

:::: details メッシュ整理の様子
```bash
renumberMesh -overwrite
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : renumberMesh -overwrite
Date   : Nov 11 2024
Time   : 13:44:23
Host   : 
PID    : 919436
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create mesh for time = 0

Mesh size: 3213298
Before renumbering :
    band           : 3208447
    profile        : 1.76813e+12

Using default renumberMethod.

Selecting renumberMethod CuthillMcKee

Reading geometric fields

Reading volScalarField p
Reading volScalarField nut
Reading volScalarField k
Reading volScalarField nuTilda
Reading volVectorField U

After renumbering :
    band           : 86318
    profile        : 1.93559e+11

Writing mesh to "constant"

End
```
::::

### ポテンシャルフロー推定
ここまで来たら解析に入りたいところですが、チュートリアルでは更に`potentialFoam`を実行しています。  
これを利用して初期状態のポテンシャルフローを予め解いておくことで、初期振動を抑えて解析を安定させることができるようです。(筆者はCR回路に置き換えて理解しました。)  

:::: details ポテンシャルフロー推定の様子
```bash
potentialFoam -initialiseUBCs
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : potentialFoam -initialiseUBCs
Date   : Nov 11 2024
Time   : 13:46:06
Host   : 
PID    : 921293
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create mesh for time = 0

Reading velocity field U

Constructing pressure field p

Constructing velocity potential field Phi

No MRF models present


Calculating potential flow
GAMG:  Solving for Phi, Initial residual = 1, Final residual = 0.0783248, No Iterations 6
GAMG:  Solving for Phi, Initial residual = 0.0501382, Final residual = 0.00186009, No Iterations 1
GAMG:  Solving for Phi, Initial residual = 0.002332, Final residual = 0.000195441, No Iterations 4
GAMG:  Solving for Phi, Initial residual = 0.00152582, Final residual = 0.000142288, No Iterations 1
GAMG:  Solving for Phi, Initial residual = 0.000206148, Final residual = 1.99113e-05, No Iterations 4
GAMG:  Solving for Phi, Initial residual = 9.93037e-05, Final residual = 9.27531e-06, No Iterations 2
GAMG:  Solving for Phi, Initial residual = 1.92883e-05, Final residual = 1.80216e-06, No Iterations 4
GAMG:  Solving for Phi, Initial residual = 8.62352e-06, Final residual = 8.62009e-07, No Iterations 2
GAMG:  Solving for Phi, Initial residual = 2.04852e-06, Final residual = 1.73885e-07, No Iterations 4
GAMG:  Solving for Phi, Initial residual = 9.81579e-07, Final residual = 8.9142e-08, No Iterations 2
GAMG:  Solving for Phi, Initial residual = 2.90109e-07, Final residual = 6.3979e-08, No Iterations 1
Continuity error = 3.92484e-06
Interpolated velocity error = 0.000227104
ExecutionTime = 22.3249 s  ClockTime = 22 s

End
```
::::

### 解析の実行
ここまででようやく解析の準備が整ったため、解析を実行します。

:::: details 解析の様子
```bash
foamRun -solver incompressibleFluid
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : foamRun -solver incompressibleFluid
Date   : Nov 11 2024
Time   : 14:00:46
Host   : 
PID    : 937299
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike
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
Selecting RAS turbulence model SpalartAllmaras
RAS
{
    model           SpalartAllmaras;
    turbulence      on;
    printCoeffs     on;
    sigmaNut        0.66666;
    kappa           0.41;
    Cb1             0.1355;
    Cb2             0.622;
    Cw2             0.3;
    Cw3             2;
    Cv1             7.1;
    Cs              0.3;
}

No MRF models present


SIMPLE: No convergence criteria found


SIMPLE: Operating solver in steady-state mode with 1 outer corrector
SIMPLE: Operating solver in SIMPLE mode



Starting time loop

Reading surface description:
    yNormal

streamlines streamlines:
    automatic track length specified through number of sub cycles : 5

forcesBase forces:
    Not including porosity effects
forces forces:
    Not including porosity effects
forceCoeffs forces:
    Not including porosity effects
streamlines streamlines write:
    Seeded 20 particles
    Sampled 19200 locations
forceCoeffs forces write:
    Cm    = 0.0197167
    Cd    = 0.0556846
    Cl    = 0.00160562
    Cl(f) = 0.0205195
    Cl(r) = -0.0189139

Time = 1s

smoothSolver:  Solving for Ux, Initial residual = 0.00824966, Final residual = 0.000615952, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.0595003, Final residual = 0.00381786, No Iterations 2
smoothSolver:  Solving for Uz, Initial residual = 0.0424374, Final residual = 0.00255219, No Iterations 2
GAMG:  Solving for p, Initial residual = 1, Final residual = 0.0451921, No Iterations 2
time step continuity errors : sum local = 0.00178328, global = -0.000208027, cumulative = -0.000208027
Selecting patchDistMethod meshWave
smoothSolver:  Solving for nuTilda, Initial residual = 1, Final residual = 0.0919574, No Iterations 1
ExecutionTime = 44.1579 s  ClockTime = 44 s

forceCoeffs forces write:
    Cm    = 0.532108
    Cd    = 1.52572
    Cl    = 0.0278238
    Cl(f) = 0.54602
    Cl(r) = -0.518196
    
Time = 2s

smoothSolver:  Solving for Ux, Initial residual = 0.00468078, Final residual = 0.000368701, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.0313273, Final residual = 0.0023848, No Iterations 2
smoothSolver:  Solving for Uz, Initial residual = 0.0212014, Final residual = 0.00154308, No Iterations 2
GAMG:  Solving for p, Initial residual = 0.248997, Final residual = 0.0206329, No Iterations 2
time step continuity errors : sum local = 0.00200232, global = -0.000102712, cumulative = -0.000310739
smoothSolver:  Solving for nuTilda, Initial residual = 0.121965, Final residual = 0.00399277, No Iterations 2
ExecutionTime = 51.8985 s  ClockTime = 52 s

forceCoeffs forces write:
    Cm    = 1.00691
    Cd    = 2.82911
    Cl    = 0.0436356
    Cl(f) = 1.02872
    Cl(r) = -0.985088

Time = 3s

smoothSolver:  Solving for Ux, Initial residual = 0.00312031, Final residual = 0.000252286, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.019256, Final residual = 0.00155595, No Iterations 2
smoothSolver:  Solving for Uz, Initial residual = 0.0127122, Final residual = 0.00102756, No Iterations 2
GAMG:  Solving for p, Initial residual = 0.112434, Final residual = 0.00935007, No Iterations 2
time step continuity errors : sum local = 0.00154358, global = 2.00054e-06, cumulative = -0.000308739
smoothSolver:  Solving for nuTilda, Initial residual = 0.0419516, Final residual = 0.00203417, No Iterations 2
ExecutionTime = 59.5198 s  ClockTime = 60 s

forceCoeffs forces write:
    Cm    = 1.23357
    Cd    = 3.40004
    Cl    = 0.0586579
    Cl(f) = 1.2629
    Cl(r) = -1.20424
    
......
......
......

Time = 498s

smoothSolver:  Solving for Ux, Initial residual = 0.000169857, Final residual = 1.67169e-05, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.00368235, Final residual = 0.000116421, No Iterations 3
smoothSolver:  Solving for Uz, Initial residual = 0.00338041, Final residual = 0.000103238, No Iterations 3
GAMG:  Solving for p, Initial residual = 0.00770073, Final residual = 0.000303908, No Iterations 2
time step continuity errors : sum local = 3.56446e-05, global = -4.94621e-07, cumulative = 0.000453538
smoothSolver:  Solving for nuTilda, Initial residual = 0.000256736, Final residual = 7.70194e-06, No Iterations 3
ExecutionTime = 3903.18 s  ClockTime = 3904 s

forceCoeffs forces write:
    Cm    = 0.188321
    Cd    = 0.462303
    Cl    = 0.0746888
    Cl(f) = 0.225665
    Cl(r) = -0.150976

Time = 499s

smoothSolver:  Solving for Ux, Initial residual = 0.0001698, Final residual = 1.66975e-05, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.00367523, Final residual = 0.000116316, No Iterations 3
smoothSolver:  Solving for Uz, Initial residual = 0.00337526, Final residual = 0.000103007, No Iterations 3
GAMG:  Solving for p, Initial residual = 0.00769996, Final residual = 0.000302366, No Iterations 2
time step continuity errors : sum local = 3.54482e-05, global = -2.6581e-07, cumulative = 0.000453272
smoothSolver:  Solving for nuTilda, Initial residual = 0.000257129, Final residual = 7.69622e-06, No Iterations 3
ExecutionTime = 3911.15 s  ClockTime = 3912 s

forceCoeffs forces write:
    Cm    = 0.188434
    Cd    = 0.462353
    Cl    = 0.0748038
    Cl(f) = 0.225836
    Cl(r) = -0.151032

Time = 500s

smoothSolver:  Solving for Ux, Initial residual = 0.00016975, Final residual = 1.66743e-05, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.00366861, Final residual = 0.000116218, No Iterations 3
smoothSolver:  Solving for Uz, Initial residual = 0.00336965, Final residual = 0.000102767, No Iterations 3
GAMG:  Solving for p, Initial residual = 0.00769715, Final residual = 0.000300666, No Iterations 2
time step continuity errors : sum local = 3.52378e-05, global = -4.3151e-08, cumulative = 0.000453229
smoothSolver:  Solving for nuTilda, Initial residual = 0.000257658, Final residual = 7.69289e-06, No Iterations 3
ExecutionTime = 3919.12 s  ClockTime = 3920 s

streamlines streamlines write:
    Seeded 20 particles
    Sampled 20815 locations
forceCoeffs forces write:
    Cm    = 0.188545
    Cd    = 0.46239
    Cl    = 0.0748815
    Cl(f) = 0.225986
    Cl(r) = -0.151105

End
```
:::: 

65分で解析が終わったようです。合計で80分程ですね。  
この時間をベースに比較していくことにします。



## 解析 ~ 並列化あり1 ~
このパターンでは、以下の順に処理を行なっていきます。

1. blockMesh
2. snappyHexMesh
3. decomposePar
4. renumberMesh
5. potentialFoam
6. foamRun
7. reconstructPar

上記の流れで実行することで、メッシュの細分化まではシングルプロセスで行い、それ以降を並列に解析をするので、精度を確保しつつ高速化を狙えそうです。  

### メッシュの粗分解

まずは同じように`blockMesh`でメッシュを切ります。

:::: details メッシュ切りの様子
```bash
blockMesh 
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : blockMesh
Date   : Nov 11 2024
Time   : 14:45:27
Host   : 
PID    : 981391
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike2
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Reading "blockMeshDict"

Creating block mesh from
    "system/blockMeshDict"
No non-linear block edges defined
No non-planar block faces defined
Creating topology blocks
Creating topology patches

Creating block mesh topology

Check topology

	Basic statistics
		Number of internal faces : 0
		Number of boundary faces : 6
		Number of defined boundary faces : 6
		Number of undefined boundary faces : 0
	Checking patch -> block consistency

Creating block offsets
Creating merge list .

Creating polyMesh from blockMesh
Creating patches
Creating cells
Creating points with scale 1
    Block 0 cell size :
        i : 1
        j : 1
        k : 1

No patch pairs to merge

Writing polyMesh
----------------
Mesh Information
----------------
  boundingBox: (-5 -4 0) (15 4 8)
  nPoints: 1701
  nCells: 1280
  nFaces: 4224
  nInternalFaces: 3456
----------------
Patches
----------------
  patch 0 (start: 3456 size: 160) name: front
  patch 1 (start: 3616 size: 160) name: back
  patch 2 (start: 3776 size: 64) name: inlet
  patch 3 (start: 3840 size: 64) name: outlet
  patch 4 (start: 3904 size: 160) name: lowerWall
  patch 5 (start: 4064 size: 160) name: upperWall

End
```
::::

### メッシュの細分化

続いて、`snappyHexMesh`を用いて細分化します。ここまでは先程と全く同じです。

:::: details 細分化の様子
```bash
snappyHexMesh -overwrite
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : snappyHexMesh -overwrite
Date   : Nov 11 2024
Time   : 14:47:54
Host   : 
PID    : 982648
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike2
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create mesh for time = 0

Read mesh in = 0.001291 s
Reading "snappyHexMeshDict"


Overall mesh bounding box  : (-5 -4 0) (15 4 8)
Relative tolerance         : 1e-06
Absolute matching distance : 2.29783e-05

Reading refinement surfaces...
Read refinement surfaces in = 0.700907 s

Reading refinement regions...
Refinement level 5 for all cells inside refinementBox
Read refinement regions in = 3.3e-05 s

Reading features...
Read features in = 1e-05 s


Determining initial surface intersections
-----------------------------------------

Edge intersection testing:
    Number of edges             : 4224
    Number of edges to retest   : 4224
    Number of intersected edges : 2
Calculated surface intersections in = 0.810434 s

Initial mesh : cells:1280  faces:4224  points:1701
Cells per refinement level:
    0	1280

......
......
......

Edge intersection testing:
    Number of edges             : 10208666
    Number of edges to retest   : 1179
    Number of intersected edges : 505529
Snapped mesh : cells:3213298  faces:10208666  points:3843899
Cells per refinement level:
    0	930
    1	1644
    2	4588
    3	15528
    4	47296
    5	978875
    6	115511
    7	437349
    8	1611577
Writing mesh to time constant
Wrote mesh in = 66.931 s.
Mesh snapped in = 283.471 s.
Checking final mesh ...
Checking faces in error :
    non-orthogonality > 65  degrees                        : 0
    faces with face-decomposition tet quality < 1e-30      : 0
    faces with concavity > 80  degrees                     : 0
    faces with skewness > 4   (internal) or 20  (boundary) : 0
    faces with interpolation weights (0..1)  < 0.02        : 0
    faces with volume ratio of neighbour cells < 0.01      : 0
    faces with face twist < 0.02                           : 0
    faces on cells with determinant < 0.001                : 0
Finished meshing without any errors
Finished meshing in = 831.742 s.
End
```
::::

もちろん所要時間もおなじく14分程度でした。

### セルの分配
続いて、生成されたセルを配分し、並列で処理できるようにします。  
メッシュ形状を知らないので、`scotch`にまかせて配分しようと思います。  

:::: details セルの配分の様子
```bash
decomposePar -copyZero
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : decomposePar -copyZero
Date   : Nov 11 2024
Time   : 20:10:17
Host   : 
PID    : 1317933
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike2
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Calculating distribution of cells

Selecting decomposer scotch

Finished decomposition in 10.4824 s

Calculating original mesh data

Distributing cells to processors

Distributing faces to processors

Distributing points to processors

Constructing processor meshes

Processor 0
    Number of cells = 542416
    Number of faces shared with processor 2 = 8612
    Number of faces shared with processor 3 = 9093
    Number of faces shared with processor 4 = 7612
    Number of faces shared with processor 5 = 17881
    Number of processor patches = 4
    Number of processor faces = 43198
    Number of boundary faces = 119593

Processor 1
    Number of cells = 530391
    Number of faces shared with processor 2 = 4806
    Number of processor patches = 1
    Number of processor faces = 4806
    Number of boundary faces = 7598

Processor 2
    Number of cells = 536945
    Number of faces shared with processor 0 = 8612
    Number of faces shared with processor 1 = 4806
    Number of faces shared with processor 3 = 2250
    Number of faces shared with processor 4 = 4136
    Number of faces shared with processor 5 = 3046
    Number of processor patches = 5
    Number of processor faces = 22850
    Number of boundary faces = 18128

Processor 3
    Number of cells = 538329
    Number of faces shared with processor 0 = 9093
    Number of faces shared with processor 2 = 2250
    Number of faces shared with processor 4 = 15257
    Number of faces shared with processor 5 = 9181
    Number of processor patches = 4
    Number of processor faces = 35781
    Number of boundary faces = 129760

Processor 4
    Number of cells = 534565
    Number of faces shared with processor 0 = 7612
    Number of faces shared with processor 2 = 4136
    Number of faces shared with processor 3 = 15257
    Number of faces shared with processor 5 = 5642
    Number of processor patches = 4
    Number of processor faces = 32647
    Number of boundary faces = 123985

Processor 5
    Number of cells = 530652
    Number of faces shared with processor 0 = 17881
    Number of faces shared with processor 2 = 3046
    Number of faces shared with processor 3 = 9181
    Number of faces shared with processor 4 = 5642
    Number of processor patches = 4
    Number of processor faces = 35750
    Number of boundary faces = 133472

Number of processor faces = 87516
Max number of cells = 542416 (1.28211% above average 535550)
Max number of processor patches = 5 (36.3636% above average 3.66667)
Max number of faces between processors = 43198 (48.0804% above average 29172)

Time = 0s

Decomposing FV fields

    Decomposing volScalarFields

        p
        nut
        k
        nuTilda

    Decomposing volVectorFields

        U

Decomposing point fields

    (no point fields)

End
```
::::

これで各プロセッサに配分し、解析の準備ができました。  

### メッシュの整理
続いてメッシュを整理し、最適化します。  
これ以降の処理は並列で処理します。

:::: details 最適化の様子
```bash
mpirun renumberMesh -overwrite -parallel
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : renumberMesh -overwrite -parallel
Date   : Nov 11 2024
Time   : 20:13:00
Host   : 
PID    : 1321238
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike2
nProcs : 6
Slaves : 
5
(
"......1321240"
"......1321241"
"......1321242"
"......1321243"
"......1321244"
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

Mesh size: 3213298
Before renumbering :
    band           : 542091
    profile        : 4.67453e+11

Using default renumberMethod.

Selecting renumberMethod CuthillMcKee

Reading geometric fields

Reading volScalarField p
Reading volScalarField nut
Reading volScalarField k
Reading volScalarField nuTilda
Reading volVectorField U

Renumbering processor cell decomposition map cellProcAddressing
Renumbering processor face decomposition map faceProcAddressing
Renumbering processor point decomposition map pointProcAddressing
After renumbering :
    band           : 26257
    profile        : 3.48866e+10

Writing mesh to "constant"

End

Finalising parallel run
```
::::

### ポテンシャルフロー推定
さらに、初期状態でのポテンシャルフローも解いておきましょう。  
この処理も同じく並列で実行します。  
つまり、各プロセッサに割り振られたメッシュごとに推定された初期状態が存在することになります。

:::: details ポテンシャルフロー推定の様子
```bash
mpirun potentialFoam -initialiseUBCs -parallel
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : potentialFoam -initialiseUBCs -parallel
Date   : Nov 11 2024
Time   : 20:15:07
Host   : 
PID    : 1323582
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike2
nProcs : 6
Slaves : 
5
(
"......1323583"
"......1323584"
"......1323585"
"......1323586"
"......1323587"
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

Reading velocity field U

Constructing pressure field p

Constructing velocity potential field Phi

No MRF models present


Calculating potential flow
GAMG:  Solving for Phi, Initial residual = 1, Final residual = 0.0901392, No Iterations 5
GAMG:  Solving for Phi, Initial residual = 0.0504203, Final residual = 0.00186142, No Iterations 1
GAMG:  Solving for Phi, Initial residual = 0.00216871, Final residual = 0.000138297, No Iterations 5
GAMG:  Solving for Phi, Initial residual = 0.00146356, Final residual = 0.000109956, No Iterations 1
GAMG:  Solving for Phi, Initial residual = 0.000138047, Final residual = 1.07845e-05, No Iterations 5
GAMG:  Solving for Phi, Initial residual = 9.2075e-05, Final residual = 8.83165e-06, No Iterations 1
GAMG:  Solving for Phi, Initial residual = 1.34295e-05, Final residual = 1.11894e-06, No Iterations 5
GAMG:  Solving for Phi, Initial residual = 8.15308e-06, Final residual = 6.17737e-07, No Iterations 2
GAMG:  Solving for Phi, Initial residual = 1.53336e-06, Final residual = 1.29507e-07, No Iterations 4
GAMG:  Solving for Phi, Initial residual = 7.58002e-07, Final residual = 7.58926e-08, No Iterations 2
GAMG:  Solving for Phi, Initial residual = 2.73424e-07, Final residual = 4.70055e-08, No Iterations 1
Continuity error = 2.88359e-06
Interpolated velocity error = 0.000228019
ExecutionTime = 11.0498 s  ClockTime = 12 s

End

Finalising parallel run
```
::::


### 解析の実行
ここまでで準備は整ったので、解析を開始します。

:::: details 解析の様子
```bash
mpirun -np 6 foamRun -solver incompressibleFluid -parallel
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : foamRun -solver incompressibleFluid -parallel
Date   : Nov 11 2024
Time   : 20:20:40
Host   : 
PID    : 1329531
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike2
nProcs : 6
Slaves : 
5
(
"......1329532"
"......1329533"
"......1329534"
"......1329535"
"......1329536"
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
Selecting RAS turbulence model SpalartAllmaras
RAS
{
    model           SpalartAllmaras;
    turbulence      on;
    printCoeffs     on;
    sigmaNut        0.66666;
    kappa           0.41;
    Cb1             0.1355;
    Cb2             0.622;
    Cw2             0.3;
    Cw3             2;
    Cv1             7.1;
    Cs              0.3;
}

No MRF models present


SIMPLE: No convergence criteria found


SIMPLE: Operating solver in steady-state mode with 1 outer corrector
SIMPLE: Operating solver in SIMPLE mode



Starting time loop

Reading surface description:
    yNormal

streamlines streamlines:
    automatic track length specified through number of sub cycles : 5

forcesBase forces:
    Not including porosity effects
forces forces:
    Not including porosity effects
forceCoeffs forces:
    Not including porosity effects
streamlines streamlines write:
    Seeded 20 particles
    Sampled 19210 locations
forceCoeffs forces write:
    Cm    = 0.0197167
    Cd    = 0.0556846
    Cl    = 0.00160547
    Cl(f) = 0.0205194
    Cl(r) = -0.018914

Time = 1s

smoothSolver:  Solving for Ux, Initial residual = 0.00824968, Final residual = 0.000649381, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.0595001, Final residual = 0.00407305, No Iterations 2
smoothSolver:  Solving for Uz, Initial residual = 0.042439, Final residual = 0.002677, No Iterations 2
GAMG:  Solving for p, Initial residual = 1, Final residual = 0.0463139, No Iterations 2
time step continuity errors : sum local = 0.00182732, global = -0.000193554, cumulative = -0.000193554
Selecting patchDistMethod meshWave
smoothSolver:  Solving for nuTilda, Initial residual = 1, Final residual = 0.0937346, No Iterations 1
ExecutionTime = 15.2913 s  ClockTime = 16 s

forceCoeffs forces write:
    Cm    = 0.533596
    Cd    = 1.5282
    Cl    = 0.0265199
    Cl(f) = 0.546856
    Cl(r) = -0.520336

Time = 2s

smoothSolver:  Solving for Ux, Initial residual = 0.00469384, Final residual = 0.000391441, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.0313012, Final residual = 0.00252958, No Iterations 2
smoothSolver:  Solving for Uz, Initial residual = 0.0212205, Final residual = 0.00161501, No Iterations 2
GAMG:  Solving for p, Initial residual = 0.236959, Final residual = 0.0201941, No Iterations 2
time step continuity errors : sum local = 0.00206355, global = -0.000102085, cumulative = -0.000295639
smoothSolver:  Solving for nuTilda, Initial residual = 0.121876, Final residual = 0.00421857, No Iterations 2
ExecutionTime = 19.6678 s  ClockTime = 20 s

forceCoeffs forces write:
    Cm    = 1.01208
    Cd    = 2.83823
    Cl    = 0.038573
    Cl(f) = 1.03137
    Cl(r) = -0.992797

......
......
......

Time = 498s

smoothSolver:  Solving for Ux, Initial residual = 0.000169612, Final residual = 1.60898e-05, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.00375043, Final residual = 0.000361134, No Iterations 2
smoothSolver:  Solving for Uz, Initial residual = 0.00335851, Final residual = 0.000325513, No Iterations 2
GAMG:  Solving for p, Initial residual = 0.00760175, Final residual = 0.00030269, No Iterations 2
time step continuity errors : sum local = 3.58329e-05, global = -6.00389e-07, cumulative = 0.000248652
smoothSolver:  Solving for nuTilda, Initial residual = 0.00025605, Final residual = 2.52161e-05, No Iterations 2
ExecutionTime = 2236.65 s  ClockTime = 2239 s

forceCoeffs forces write:
    Cm    = 0.188946
    Cd    = 0.461999
    Cl    = 0.0715206
    Cl(f) = 0.224707
    Cl(r) = -0.153186

Time = 499s

smoothSolver:  Solving for Ux, Initial residual = 0.000169455, Final residual = 1.60643e-05, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.00374578, Final residual = 0.00036119, No Iterations 2
smoothSolver:  Solving for Uz, Initial residual = 0.00335286, Final residual = 0.000324857, No Iterations 2
GAMG:  Solving for p, Initial residual = 0.00761876, Final residual = 0.000301772, No Iterations 2
time step continuity errors : sum local = 3.56892e-05, global = -4.79029e-07, cumulative = 0.000248173
smoothSolver:  Solving for nuTilda, Initial residual = 0.000256394, Final residual = 2.52348e-05, No Iterations 2
ExecutionTime = 2241.12 s  ClockTime = 2244 s

forceCoeffs forces write:
    Cm    = 0.189081
    Cd    = 0.462139
    Cl    = 0.0716158
    Cl(f) = 0.224889
    Cl(r) = -0.153274

Time = 500s

smoothSolver:  Solving for Ux, Initial residual = 0.000169316, Final residual = 1.60339e-05, No Iterations 2
smoothSolver:  Solving for Uy, Initial residual = 0.00374114, Final residual = 0.000361211, No Iterations 2
smoothSolver:  Solving for Uz, Initial residual = 0.00334657, Final residual = 0.0003241, No Iterations 2
GAMG:  Solving for p, Initial residual = 0.0076441, Final residual = 0.000301166, No Iterations 2
time step continuity errors : sum local = 3.55831e-05, global = -3.48819e-07, cumulative = 0.000247824
smoothSolver:  Solving for nuTilda, Initial residual = 0.00025692, Final residual = 2.52534e-05, No Iterations 2
ExecutionTime = 2245.61 s  ClockTime = 2248 s

streamlines streamlines write:
    Seeded 20 particles
    Sampled 21890 locations
forceCoeffs forces write:
    Cm    = 0.189213
    Cd    = 0.462273
    Cl    = 0.0717155
    Cl(f) = 0.225071
    Cl(r) = -0.153355

End

Finalising parallel run
```
::::

先程よりも早く、だいたい37分で解析が終了しました。  
合計で50分程ですね。  

### メッシュの再構築
プロセッサごとに分解して解析を行なったので、忘れずに再構築をしておきましょう。

:::: details 再構築の様子
```bash
reconstructPar
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : reconstructPar
Date   : Nov 11 2024
Time   : 20:58:58
Host   : 
PID    : 1366799
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike2
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Reconstructing meshes

    Merging mesh 0 with 1
    Merging mesh 2 with 3
    Merging mesh 4 with 5
    Merging mesh 0 with 2
    Merging mesh 0 with 4

Time = 500s

Reconstructing FV fields

    Reconstructing volScalarFields

        p
        nut
        nuTilda

    Reconstructing volVectorFields

        U

    Reconstructing surfaceScalarFields

        phi

Reconstructing point fields

    (no point fields)

Collecting uniform files

End
```
::::


## 解析 ~ 並列化あり2 ~
最後のパターンは、粗分解のみをシングルプロセスで実行し、それ以降は並列で解析を行うパターンです。  
つまり、以下の手順です。  

1. blockMesh
2. decomposePar
3. snappyHexMesh
4. renumberMesh
5. potentialFoam
6. foamRun
7. reconstructPar

メッシュの細分化はプロセッサごとに割り振られたものに対してそれぞれ行うので、それにかかる時間を短縮することができます。  
一方で、先程のパターンに比べて、個別に細分化するということは境界面での精度が少し心配になりますが、プロセッサごとにコミュニケーションを取りながら処理をするので、心配する必要はないかもしれません。  

ちなみに、このチュートリアル本来では、このパターンの処理を行なっています。

### メッシュの粗分解
では早速やっていきます。

:::: details メッシュ切りの様子
```bash
blockMesh
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : blockMesh
Date   : Nov 11 2024
Time   : 22:38:07
Host   : 
PID    : 1473532
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Reading "blockMeshDict"

Creating block mesh from
    "system/blockMeshDict"
No non-linear block edges defined
No non-planar block faces defined
Creating topology blocks
Creating topology patches

Creating block mesh topology

Check topology

	Basic statistics
		Number of internal faces : 0
		Number of boundary faces : 6
		Number of defined boundary faces : 6
		Number of undefined boundary faces : 0
	Checking patch -> block consistency

Creating block offsets
Creating merge list .

Creating polyMesh from blockMesh
Creating patches
Creating cells
Creating points with scale 1
    Block 0 cell size :
        i : 1
        j : 1
        k : 1

No patch pairs to merge

Writing polyMesh
----------------
Mesh Information
----------------
  boundingBox: (-5 -4 0) (15 4 8)
  nPoints: 1701
  nCells: 1280
  nFaces: 4224
  nInternalFaces: 3456
----------------
Patches
----------------
  patch 0 (start: 3456 size: 160) name: front
  patch 1 (start: 3616 size: 160) name: back
  patch 2 (start: 3776 size: 64) name: inlet
  patch 3 (start: 3840 size: 64) name: outlet
  patch 4 (start: 3904 size: 160) name: lowerWall
  patch 5 (start: 4064 size: 160) name: upperWall

End
```
::::

### セルの分配
今回はこのタイミングで割り振っていきます。  

:::: details 分配の様子
```bash
decomposePar -copyZero
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : decomposePar -copyZero
Date   : Nov 11 2024
Time   : 22:45:09
Host   : 
PID    : 1481305
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Calculating distribution of cells

Selecting decomposer scotch

Finished decomposition in 0.002892 s

Calculating original mesh data

Distributing cells to processors

Distributing faces to processors

Distributing points to processors

Constructing processor meshes

Processor 0
    Number of cells = 213
    Number of faces shared with processor 1 = 36
    Number of faces shared with processor 2 = 37
    Number of processor patches = 2
    Number of processor faces = 73
    Number of boundary faces = 173

Processor 1
    Number of cells = 212
    Number of faces shared with processor 0 = 36
    Number of faces shared with processor 2 = 53
    Number of faces shared with processor 3 = 32
    Number of processor patches = 3
    Number of processor faces = 121
    Number of boundary faces = 105

Processor 2
    Number of cells = 215
    Number of faces shared with processor 0 = 37
    Number of faces shared with processor 1 = 53
    Number of faces shared with processor 3 = 32
    Number of processor patches = 3
    Number of processor faces = 122
    Number of boundary faces = 106

Processor 3
    Number of cells = 213
    Number of faces shared with processor 1 = 32
    Number of faces shared with processor 2 = 32
    Number of faces shared with processor 4 = 36
    Number of faces shared with processor 5 = 37
    Number of processor patches = 4
    Number of processor faces = 137
    Number of boundary faces = 109

Processor 4
    Number of cells = 212
    Number of faces shared with processor 3 = 36
    Number of faces shared with processor 5 = 53
    Number of processor patches = 2
    Number of processor faces = 89
    Number of boundary faces = 137

Processor 5
    Number of cells = 215
    Number of faces shared with processor 3 = 37
    Number of faces shared with processor 4 = 53
    Number of processor patches = 2
    Number of processor faces = 90
    Number of boundary faces = 138

Number of processor faces = 316
Max number of cells = 215 (0.78125% above average 213.333)
Max number of processor patches = 4 (50% above average 2.66667)
Max number of faces between processors = 137 (30.0633% above average 105.333)

Time = 0s

```
::::

さて、元が少ないので、コアあたり200セル程度になりました。  

### メッシュの細分化
今回はチュートリアルに倣い、この段階でメッシュの細分化をします。  

:::: details メッシュ細分化の様子
```bash
mpirun -np 6 snappyHexMesh -overwrite -parallel
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : snappyHexMesh -overwrite -parallel
Date   : Nov 11 2024
Time   : 22:45:40
Host   : 
PID    : 1481871
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3
nProcs : 6
Slaves : 
5
(
"......1481872"
"......1481873"
"......1481874"
"......1481875"
"......1481876"
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

Read mesh in = 0.002801 s
Reading "snappyHexMeshDict"


Overall mesh bounding box  : (-5 -4 0) (15 4 8)
Relative tolerance         : 1e-06
Absolute matching distance : 2.29783e-05

Reading refinement surfaces...
Read refinement surfaces in = 1.19111 s

Reading refinement regions...
Refinement level 5 for all cells inside refinementBox
Read refinement regions in = 3.3e-05 s

Reading features...
Read features in = 1.2e-05 s


Determining initial surface intersections
-----------------------------------------

Edge intersection testing:
    Number of edges             : 4224
    Number of edges to retest   : 4224
    Number of intersected edges : 2
Calculated surface intersections in = 1.00754 s

Initial mesh : cells:1280  faces:4224  points:1701
Cells per refinement level:
    0	1280

......
......
......
Edge intersection testing:
    Number of edges             : 10221052
    Number of edges to retest   : 928
    Number of intersected edges : 505724
Snapped mesh : cells:3217449  faces:10221052  points:3848002
Cells per refinement level:
    0	928
    1	1660
    2	4588
    3	15528
    4	47296
    5	978824
    6	115757
    7	438238
    8	1614630
Writing mesh to time constant
Wrote mesh in = 21.3582 s.
Mesh snapped in = 77.0681 s.
Checking final mesh ...
Checking faces in error :
    non-orthogonality > 65  degrees                        : 0
    faces with face-decomposition tet quality < 1e-30      : 0
    faces with concavity > 80  degrees                     : 0
    faces with skewness > 4   (internal) or 20  (boundary) : 0
    faces with interpolation weights (0..1)  < 0.02        : 0
    faces with volume ratio of neighbour cells < 0.01      : 0
    faces with face twist < 0.02                           : 0
    faces on cells with determinant < 0.001                : 0
Finished meshing without any errors
Finished meshing in = 421.428 s.
End

Finalising parallel run
```
::::
細分化は7分程度で完了しました。  

### 細分化の確認
今までのパターンでは、具体的に3,213,298セルだったのが、今回は3,217,449セルと出ていそうです。いいのか悪いのか、少しセルが増えてしまいましたね。  
また、配分後に細分化をしたので、バランスが気になるところです。

:::: details Processor0の様子
```bash 
cd processor0
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
Date   : Nov 11 2024
Time   : 23:23:45
Host   : 
PID    : 1516070
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3/processor0
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           705077
    faces:            1772761
    internal faces:   1614690
    cells:            541787
    faces per cell:   6.25237
    boundary patches: 77
    point zones:      0
    face zones:       0
    cell zones:       0


```
::::

:::: details Processor1の様子
```bash 
cd processor1
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
Date   : Nov 11 2024
Time   : 23:25:19
Host   : 
PID    : 1517959
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3/processor1
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           564620
    faces:            1645195
    internal faces:   1632977
    cells:            540451
    faces per cell:   6.06562
    boundary patches: 74
    point zones:      0
    face zones:       0
    cell zones:       0
```
::::


:::: details Processor2の様子
```bash 
cd processor2
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
Date   : Nov 11 2024
Time   : 23:26:10
Host   : 
PID    : 1518873
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3/processor2
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           580886
    faces:            1640800
    internal faces:   1598091
    cells:            531207
    faces per cell:   6.09723
    boundary patches: 78
    point zones:      0
    face zones:       0
    cell zones:       0
```
::::




:::: details Processor3の様子
```bash 
cd processor3
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
Date   : Nov 11 2024
Time   : 23:39:17
Host   : 
PID    : 1533019
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3/processor3
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           679511
    faces:            1719198
    internal faces:   1569846
    cells:            527764
    faces per cell:   6.23204
    boundary patches: 77
    point zones:      0
    face zones:       0
    cell zones:       0
```
::::


:::: details Processor4の様子
```bash 
cd processor4
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
Date   : Nov 11 2024
Time   : 23:40:29
Host   : 
PID    : 1534296
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3/processor4
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           695586
    faces:            1744669
    internal faces:   1598246
    cells:            535403
    faces per cell:   6.24374
    boundary patches: 77
    point zones:      0
    face zones:       0
    cell zones:       0
```
::::


:::: details Processor5の様子
```bash 
cd processor4
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
Date   : Nov 12 2024
Time   : 00:00:14
Host   : 
PID    : 1555754
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3/processor5
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Create polyMesh for time = 0

Time = 0s

Mesh stats
    points:           690101
    faces:            1756243
    internal faces:   1616855
    cells:            540837
    faces per cell:   6.23681
    boundary patches: 77
    point zones:      0
    face zones:       0
    cell zones:       0
```
::::

分配後にメッシュの細分化をしましたが、それなりに均一になっている気がします
続いて、メッシュの整理をして、効率的な解析を実行できるようにします。

:::: details メッシュ整理の様子
```bash
mpirun -np 6 renumberMesh -overwrite -parallel
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : renumberMesh -overwrite -parallel
Date   : Nov 12 2024
Time   : 00:01:20
Host   : 
PID    : 1557005
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3
nProcs : 6
Slaves : 
5
(
".......1557006"
".......1557007"
".......1557008"
".......1557009"
".......1557010"
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

Mesh size: 3217449
Before renumbering :
    band           : 540994
    profile        : 1.35954e+11

Using default renumberMethod.

Selecting renumberMethod CuthillMcKee

Reading geometric fields

Reading volScalarField p
Reading volScalarField nut
Reading volScalarField k
Reading volScalarField nuTilda
Reading volVectorField U

After renumbering :
    band           : 26412
    profile        : 3.58402e+10

Writing mesh to "constant"

End

Finalising parallel run
```
::::

各プロセッサのセル数を比較してみると、大きな偏りはないように見えます。  


### ポテンシャルフロー推定
これ以降は先程のパターンと同様です。  
解析に映る前に初期状態のポテンシャルフローをそれぞれ推定しておきましょう。

:::: details ポテンシャルフローの推測の様子
```bash
mpirun potentialFoam -initialiseUBCs -parallel
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : potentialFoam -initialiseUBCs -parallel
Date   : Nov 12 2024
Time   : 00:04:10
Host   : 
PID    : 1560074
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3
nProcs : 6
Slaves : 
5
(
"......1560075"
"......1560076"
"......1560077"
"......1560078"
"......1560079"
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

Reading velocity field U

Constructing pressure field p

Constructing velocity potential field Phi

No MRF models present


Calculating potential flow
GAMG:  Solving for Phi, Initial residual = 1, Final residual = 0.0889988, No Iterations 5
GAMG:  Solving for Phi, Initial residual = 0.0503063, Final residual = 0.0019252, No Iterations 1
GAMG:  Solving for Phi, Initial residual = 0.00225416, Final residual = 0.000192375, No Iterations 4
GAMG:  Solving for Phi, Initial residual = 0.00152114, Final residual = 0.000144219, No Iterations 1
GAMG:  Solving for Phi, Initial residual = 0.000204128, Final residual = 1.78488e-05, No Iterations 4
GAMG:  Solving for Phi, Initial residual = 9.83227e-05, Final residual = 8.74533e-06, No Iterations 2
GAMG:  Solving for Phi, Initial residual = 1.68679e-05, Final residual = 1.12831e-06, No Iterations 5
GAMG:  Solving for Phi, Initial residual = 7.36141e-06, Final residual = 5.7996e-07, No Iterations 2
GAMG:  Solving for Phi, Initial residual = 1.41529e-06, Final residual = 1.31338e-07, No Iterations 4
GAMG:  Solving for Phi, Initial residual = 7.40748e-07, Final residual = 7.86051e-08, No Iterations 2
GAMG:  Solving for Phi, Initial residual = 2.62277e-07, Final residual = 4.97665e-08, No Iterations 1
Continuity error = 3.05254e-06
Interpolated velocity error = 0.00022495
ExecutionTime = 11.7081 s  ClockTime = 12 s

End

Finalising parallel run

```
::::

### 解析の実行
ここまで準備したら解析を実行します。  

:::: details 解析の様子
```bash
mpirun -np 6 foamRun -solver incompressibleFluid -parallel
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : foamRun -solver incompressibleFluid -parallel
Date   : Nov 12 2024
Time   : 00:05:20
Host   : 
PID    : 1561329
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3
nProcs : 6
Slaves : 
5
(
"......1561331"
"......1561332"
"......1561333"
"......1561334"
"......1561335"
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
Selecting RAS turbulence model SpalartAllmaras
RAS
{
    model           SpalartAllmaras;
    turbulence      on;
    printCoeffs     on;
    sigmaNut        0.66666;
    kappa           0.41;
    Cb1             0.1355;
    Cb2             0.622;
    Cw2             0.3;
    Cw3             2;
    Cv1             7.1;
    Cs              0.3;
}

No MRF models present


SIMPLE: No convergence criteria found


SIMPLE: Operating solver in steady-state mode with 1 outer corrector
SIMPLE: Operating solver in SIMPLE mode



Starting time loop

Reading surface description:
    yNormal

streamlines streamlines:
    automatic track length specified through number of sub cycles : 5

forcesBase forces:
    Not including porosity effects
forces forces:
    Not including porosity effects
forceCoeffs forces:
    Not including porosity effects
streamlines streamlines write:
    Seeded 20 particles
    Sampled 19085 locations
forceCoeffs forces write:
    Cm    = 0.0194449
    Cd    = 0.0547643
    Cl    = 0.00134618
    Cl(f) = 0.020118
    Cl(r) = -0.0187718

Time = 1s

smoothSolver:  Solving for Ux, Initial residual = 0.00812127, Final residual = 0.000326918, No Iterations 3
smoothSolver:  Solving for Uy, Initial residual = 0.0588728, Final residual = 0.0023054, No Iterations 3
smoothSolver:  Solving for Uz, Initial residual = 0.0419685, Final residual = 0.00156958, No Iterations 3
GAMG:  Solving for p, Initial residual = 1, Final residual = 0.0492157, No Iterations 2
time step continuity errors : sum local = 0.00193912, global = -0.000215946, cumulative = -0.000215946
Selecting patchDistMethod meshWave
smoothSolver:  Solving for nuTilda, Initial residual = 1, Final residual = 0.0221817, No Iterations 2
ExecutionTime = 15.4832 s  ClockTime = 16 s

forceCoeffs forces write:
    Cm    = 0.547857
    Cd    = 1.56511
    Cl    = 0.0165295
    Cl(f) = 0.556122
    Cl(r) = -0.539593

Time = 2s

smoothSolver:  Solving for Ux, Initial residual = 0.00459716, Final residual = 0.000211363, No Iterations 3
smoothSolver:  Solving for Uy, Initial residual = 0.0310866, Final residual = 0.00131971, No Iterations 3
smoothSolver:  Solving for Uz, Initial residual = 0.0209923, Final residual = 0.000876475, No Iterations 3
GAMG:  Solving for p, Initial residual = 0.23295, Final residual = 0.0207442, No Iterations 2
time step continuity errors : sum local = 0.00214151, global = -0.000121665, cumulative = -0.000337611
smoothSolver:  Solving for nuTilda, Initial residual = 0.104471, Final residual = 0.00438615, No Iterations 2
ExecutionTime = 20.2192 s  ClockTime = 20 s

forceCoeffs forces write:
    Cm    = 1.02025
    Cd    = 2.85864
    Cl    = 0.0282634
    Cl(f) = 1.03438
    Cl(r) = -1.00611

......
......
......

Time = 498s

smoothSolver:  Solving for Ux, Initial residual = 0.000163647, Final residual = 5.95048e-06, No Iterations 3
smoothSolver:  Solving for Uy, Initial residual = 0.00356201, Final residual = 0.000134799, No Iterations 3
smoothSolver:  Solving for Uz, Initial residual = 0.00323511, Final residual = 0.000120858, No Iterations 3
GAMG:  Solving for p, Initial residual = 0.00720266, Final residual = 0.000308436, No Iterations 2
time step continuity errors : sum local = 3.62138e-05, global = 1.16633e-06, cumulative = 0.000387367
smoothSolver:  Solving for nuTilda, Initial residual = 0.000257308, Final residual = 8.94975e-06, No Iterations 3
ExecutionTime = 2257.05 s  ClockTime = 2259 s

forceCoeffs forces write:
    Cm    = 0.191597
    Cd    = 0.464249
    Cl    = 0.0721124
    Cl(f) = 0.227653
    Cl(r) = -0.15554

Time = 499s

smoothSolver:  Solving for Ux, Initial residual = 0.000163577, Final residual = 5.94206e-06, No Iterations 3
smoothSolver:  Solving for Uy, Initial residual = 0.00356306, Final residual = 0.000134919, No Iterations 3
smoothSolver:  Solving for Uz, Initial residual = 0.00323437, Final residual = 0.000121096, No Iterations 3
GAMG:  Solving for p, Initial residual = 0.00718259, Final residual = 0.000307437, No Iterations 2
time step continuity errors : sum local = 3.61085e-05, global = 1.32385e-06, cumulative = 0.000388691
smoothSolver:  Solving for nuTilda, Initial residual = 0.00025713, Final residual = 8.94989e-06, No Iterations 3
ExecutionTime = 2261.56 s  ClockTime = 2263 s

forceCoeffs forces write:
    Cm    = 0.19159
    Cd    = 0.464255
    Cl    = 0.07198
    Cl(f) = 0.22758
    Cl(r) = -0.1556

Time = 500s

smoothSolver:  Solving for Ux, Initial residual = 0.000163524, Final residual = 5.93468e-06, No Iterations 3
smoothSolver:  Solving for Uy, Initial residual = 0.00356491, Final residual = 0.000135073, No Iterations 3
smoothSolver:  Solving for Uz, Initial residual = 0.00323448, Final residual = 0.000121415, No Iterations 3
GAMG:  Solving for p, Initial residual = 0.0071632, Final residual = 0.000306684, No Iterations 2
time step continuity errors : sum local = 3.60353e-05, global = 1.45605e-06, cumulative = 0.000390147
smoothSolver:  Solving for nuTilda, Initial residual = 0.000256953, Final residual = 8.94937e-06, No Iterations 3
ExecutionTime = 2266.06 s  ClockTime = 2268 s

streamlines streamlines write:
    Seeded 20 particles
    Sampled 20670 locations
forceCoeffs forces write:
    Cm    = 0.191577
    Cd    = 0.464255
    Cl    = 0.0718195
    Cl(f) = 0.227487
    Cl(r) = -0.155668

End

Finalising parallel run
```
::::

先程より微妙に時間が伸びていますが、誤差レベルと言って問題ない気がします。  
あるいは、合計セル数が微妙に増えた影響でしょうか


### メッシュの再構築
分解して解析したので、最後に結合しておきます。

:::: details 結合の様子
```bash
reconstructPar
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     | Website:  https://openfoam.org
    \\  /    A nd           | Version:  12
     \\/     M anipulation  |
\*---------------------------------------------------------------------------*/
Build  : 12-6aa359dae696
Exec   : reconstructPar
Date   : Nov 12 2024
Time   : 01:30:03
Host   : 
PID    : 1651119
I/O    : uncollated
Case   : /....../OpenFOAM_Foundation/motorBike3
nProcs : 1
sigFpe : Enabling floating point exception trapping (FOAM_SIGFPE).
fileModificationChecking : Monitoring run-time modified files using timeStampMaster (fileModificationSkew 10)
allowSystemOperations : Allowing user-supplied system call operations

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
Create time

Reconstructing meshes

    Merging mesh 0 with 1
    Merging mesh 2 with 3
    Merging mesh 4 with 5
    Merging mesh 0 with 2
    Merging mesh 0 with 4

Time = 500s

Reconstructing FV fields

    Reconstructing volScalarFields

        p
        nut
        nuTilda

    Reconstructing volVectorFields

        U

    Reconstructing surfaceScalarFields

        phi

Reconstructing point fields

    (no point fields)

Collecting uniform files

End
```
::::


## まとめ
雑にグラフにすると以下のようになりました。
![](/images/openfoam-perfoamance-bench/001.png)

ここで、粗分解やメッシュ整理などは0としています。  
すべてシングルプロセスで行うのが最も精度が出るでしょうが、大規模な解析ではやはり並列化して効率を上げたいかと思います。  

今回はCPU演算の範囲内で高速化するのを試しましたが、次回はGPUを用いた検証をしてみようと思っています。  


本当はこの記事の4パターン目でGPUと比較するつもりだったのですが、何をどう頑張ってもFoundation版でGPUが使えなかったので、次回はOpenFOAM2406を用います。