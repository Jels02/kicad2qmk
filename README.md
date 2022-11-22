# KiCAD2QMK

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

KiCAD 2(to) QMK is a tool designed to make the process of writing firmware for custom keyboard PCBs a little bit easier. It is designed to be used with the [QMK Firmware](https://qmk.fm/) and [KiCAD](https://www.kicad.org/).

## Usage

There is an early version available at https://jels02.github.io/kicad2qmk/. Please be aware that this is still in development and may not work as expected. If it doesn't work, feel free to open an issue or contact me on Discord (Jels#0139).
Use a netlist export from KiCAD (default settings) and a "pos" file (CSV type) to get started.
Currently there is only explicit support for the RP2040 (The conversion between pin names on the RP2040 symbol (GPIOxx) and the pin names in the QMK firmware (GPxx) is explicit), so other microcontrollers might not have correct pin names. If so, open an Issue and this can be added.

## Development

This project is written in JS and uses react. To get started, clone the repo and run `npm install` to install the dependencies. Then run `npm start` to start the development server.

This project is still in development, so there may (definitely will) be bugs. Please bare with me as I work on this project, and feel free to open an issue/PR if you find a bug or have a feature request.

## License

MIT License

Copyright (c) 2022 Joah Nelson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
