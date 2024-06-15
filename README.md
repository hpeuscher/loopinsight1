<p align="left">
  <a href="https://lt1.org/" target="_blank">
    <img alt="LoopInsighT1" src="./src/frontend/assets/images/LT1_logo.png" width="200">
  </a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![PR's welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://LT1.org/contribute)
<!-- ![test](https://github.com/hpeuscher/lt1-private/actions/workflows/test.yml/badge.svg) -->
![Test](test/badge.svg)

<hr/>

This software is intended for closed-loop simulation of automatic insulin delivery systems for type 1 diabetic persons.

# Demo and further information
For a live demo, visit the project website [https://LT1.org](https://lt1.org/simulator).

# Installation / Quick start
Follow these instructions to use the simulator locally and modify its source code.

* Install npm
* Clone repository and enter your local directory.
* Install project dependencies:

```shell
npm install
```
* Run webpack server:

```shell
npm run serve
```
* Open browser and visit [http://localhost:8080/](http://localhost:8080/).
* Now edit the source files, save your changes, and simply reload website.

If you want to build an independent bundle that can be integrated into an html document, run

```shell
npm run build
```

# License
See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
