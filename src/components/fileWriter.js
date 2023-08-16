const bootloaderMap = {
  atmega32u4: "atmel-dfu",
  atmega32u2: "atmel-dfu",
  STM32F072: "stm32-dfu",
  RP2040: "rp2040",
};

function matrixToLayout(keys) {
  const layout = [];
  Array.from(keys).forEach(([keyRef, key]) => {
    if (key.enabled) {
      if (!key.matrix) {
        console.log("Key " + keyRef + " is not mapped to a matrix position");
      }
      layout.push({
        label: key.keycode === "ERROR" ? "" : key.keycode.slice(3),
        matrix: key.matrix,
        x: key.x,
        y: key.y,
      });
    }
  });

  layout.sort((a, b) => {
    console.log(a, b);
    return Math.floor(a.y) !== Math.floor(b.y) ? a.y - b.y : a.x - b.x;
  });
  console.log(layout);
  return layout;
}

const colRowMapToArray = (map) => {
  const array = Array.from(map, ([key, value]) => [key, value]);
  return array
    .sort((a, b) => {
      return a[0].length !== b[0].length
        ? a[0].length - b[0].length
        : a[0] > b[0]
        ? 1
        : a[0] < b[0]
        ? -1
        : 0;
    })
    .map(([_, value]) => value.pin);
};

export function addRowColNumbers(state) {
  state.rowNames.forEach(({ number, pin }, rowName) => {
    const rowNumber = number;
    state.colNames.forEach(({ number, pin }, colName) => {
      const matrixKey = state.matrix[rowName][colName];
      if (matrixKey) {
        const key = state.keys.get(matrixKey.ref);
        key.matrix = [rowNumber, number];
      }
    });
  });
}

export function writeInfoJson(state, params) {
  const mcu = state.MCU;
  const bootloader = bootloaderMap[mcu.value];
  if (!bootloader) {
    console.log("Unable to find bootloader for MCU: " + mcu.value);
  }
  const info = {
    keyboard_name: params.keyboardName,
    manufacturer: params.manufacturer,
    url: params.url,
    maintainer: params.maintainer,
    usb: {
      vid: params.vendorID,
      pid: params.productID,
      device_version: params.deviceVer,
    },
    processor: mcu.value,
    bootloader: bootloader,
    features: {
      bootmagic: true,
      command: false,
      console: false,
      extrakey: true,
      mousekey: true,
      nkro: true, //TODO: Make this a checkbox
    },
    diode_direction: "COL2ROW", // TODO make this computed
    matrix_pins: {
      cols: colRowMapToArray(state.colPins),
      rows: colRowMapToArray(state.rowPins),
    },
    layouts: {
      LAYOUT_all: {
        layout: matrixToLayout(state.keys),
      },
    },
  };
  const infoJson = JSON.stringify(info);
  return infoJson;
}

function getKeycodes(keys) {
  const keycodes = {};
  keys.forEach((key) => {
    if (keycodes[key.y]) {
      keycodes[key.y].push(key);
    } else {
      keycodes[key.y] = [key];
    }
  });
  const sortedKeycodes = Object.values(keycodes)
    .sort((a, b) => {
      return a[0].y - b[0].y;
    })
    .map((row) => {
      return row.sort((a, b) => {
        return a.x - b.x;
      });
    });
  return sortedKeycodes;
}

export function writeKeymap(state, maintainer) {
  const keycodes = getKeycodes(state.keys);

  const layout1 = keycodes.reduce((accumulator, row) => {
    const rowTxt = row.reduce((keyAccumulator, key) => {
      if (key.enabled) {
        return keyAccumulator + key.keycode + ", ";
      } else {
        return keyAccumulator;
      }
    }, "");
    return accumulator + rowTxt + "\n";
  }, "");

  const layout2 = keycodes.reduce((accumulator, row) => {
    const rowTxt = row.reduce((keyAccumulator, key) => {
      if (key.enabled) {
        return keyAccumulator + "_______, ";
      } else {
        return keyAccumulator;
      }
    }, "");
    return accumulator + rowTxt + "\n";
  }, "");
  const keymap = `/* Copyright 2022 ${maintainer}
  *
  * This program is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation,   either version 2 of the License, or
  * (at your option) any later version.
  *
  * This program is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with this program.  If not, see <http://www.gnu.org/licenses/>.
  */
 
 #include QMK_KEYBOARD_H
 
 const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
 
 //base layer
 [0] = LAYOUT_all(
  ${layout1.slice(0, -3)}
 ),
 [1] = LAYOUT_all(
  ${layout2.slice(0, -3)}
     ),
 };
 `;

  return keymap;
}

export const writeConfig = (maintainer) =>
  ` /* Copyright 2022 ${maintainer}
    *
    * This program is free software: you can redistribute it and/or modify
    * it under the terms of the GNU General Public License as published by
    * the Free Software Foundation,   either version 2 of the License, or
    * (at your option) any later version.
    *
    * This program is distributed in the hope that it will be useful,
    * but WITHOUT ANY WARRANTY; without even the implied warranty of
    * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    * GNU General Public License for more details.
    *
    * You should have received a copy of the GNU General Public License
    * along with this program.  If not, see <http://www.gnu.org/licenses/>.
    */
   
   #pragma once
   
   #include "config_common.h"`;
