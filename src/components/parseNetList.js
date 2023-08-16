import { valueToKeycode } from "./keycodes";

const keyRefs = ["K", "MX"];
const colName = ["C"];
const rowName = ["R"];
// const row2col = true;

export function parseNet(file, setState, refs) {
  if (refs.rowPrefix) {
    rowName.push(refs.rowPrefix);
  }
  if (refs.colPrefix) {
    colName.push(refs.colPrefix);
  }
  if (refs.ref) {
    keyRefs.push(refs.ref);
  }
  const keys = getKeys(file);
  const [nets, matrix, rowNames, colNames] = getMatrix(file, keys);
  const MCU = getMCU(file, nets, rowNames);
  const [rowPins, colPins] = getMCUPins(nets, rowNames, colNames, MCU);
  console.log(rowPins);
  setState((state) => ({
    ...state,
    keys: keys,
    rowPins: rowPins,
    colPins: colPins,
    rowNames: rowNames,
    colNames: colNames,
    matrix: matrix,
    MCU: MCU,
  }));
  return true;
}

function getMCU(data, nets, rowNames) {
  const ref = nets.get(Array.from(rowNames.keys())[0]).node.find((net) => {
    return new RegExp(/U\d+/).test(net.ref);
  }).ref;
  const mcu = data.export.components.comp.find((component) => {
    return component.ref === ref;
  });
  return { ref: mcu.ref, value: mcu.value };
}

function getKeys(data) {
  const keyPattern = new RegExp(`(${keyRefs.join("|")})\\d.*`);
  const footPrintTest = new RegExp(/MX/);
  const keys = new Map();
  data.export.components.comp
    .filter((component) => {
      return (
        keyPattern.test(component.ref) ||
        footPrintTest.test(component.footprint)
      );
    })
    .forEach((component) => {
      const errors = [];
      let size = "0";
      try {
        const footprint = component.footprint.match(
          /(\d|\d.\d|\d.\d\d)(u|U)/
        )[0];
        size = footprint.substring(0, footprint.length - 1);
      } catch (e) {
        console.log("Unable to parse footprint for key: " + component.ref);
        errors.push("size");
        size = "0";
      }
      const enabled =
        keyPattern.test(component.ref) &&
        footPrintTest.test(component.footprint);
      let keycode = valueToKeycode[component.value.toUpperCase()];
      if (keycode === undefined) {
        errors.push("keycode");
        keycode = "ERROR";
      }
      keys.set(component.ref, {
        ref: component.ref,
        value: component.value,
        footprint: component.footprint,
        size: size,
        errors: errors,
        keycode: keycode,
        enabled: enabled,
      });
    });
  return keys;
}

function getMatrix(data, keys) {
  const rowMap = new Map();
  const colMap = new Map();
  const matrix = {};
  const nets = new Map();
  data.export.nets.net.forEach((net) => {
    nets.set(net.name, net);
    if (net.node.length > 1) {
      net.node.forEach((node) => {
        if (keys.has(node.ref)) {
          const key = keys.get(node.ref);
          key[`pin${node.pin}`] = net.name;
        }
      });
    }
  });
  keys.forEach((key) => {
    if (!key.pin1 || !key.pin2) {
      keys.delete(key.ref);
    } else {
      const switchNet = key.pin1.match(/Net-\(D\d+/) ? key.pin1 : key.pin2;
      const diodeMatch = switchNet.match(/D\d+/);
      if (!diodeMatch) {
        keys.delete(key.ref);
      } else {
        const diode = { ref: diodeMatch[0] };
        diode.pins = [];
        nets.forEach((net) => {
          if (net.node.length > 1) {
            net.node.forEach((node) => {
              if (node.ref === diode.ref) {
                diode.pins.push(net.name);
              }
            });
          }
        });
        key.diode = diode;
        const pins = [key.pin1, key.pin2, ...diode.pins];
        let row, col;
        pins.forEach((pin) => {
          const rowPattern = new RegExp(
            `(\\/)?(${rowName.join("|")})\\d.*`,
            "i"
          );
          const rowMatch = pin.match(rowPattern);
          if (rowMatch) {
            row = rowMatch[0];
            if (!rowMap.has(row)) {
              rowMap.set(row, 0);
            }
          } else {
            const colPattern = new RegExp(
              `(\\/)?(${colName.join("|")})\\d.*`,
              "i"
            );
            const colMatch = pin.match(colPattern);
            if (colMatch) {
              col = colMatch[0];
              if (!colMap.has(col)) {
                colMap.set(col, 0);
              }
            }
          }
        });

        if (row !== undefined) {
          key.row = row;
        } else {
          console.log("no row found for key: " + key.ref);
        }
        if (col !== undefined) {
          key.col = col;
        } else {
          console.log("no col found for key: " + key.ref);
        }
        if (row !== undefined && col !== undefined) {
          if (matrix[row]) {
            if (matrix[row][col] === undefined) {
              matrix[row][col] = key;
            } else if (matrix[row][col].size > key.size) {
              matrix[row][col].enabled = false;
              matrix[row][col] = key;
            } else {
              key.enabled = false;
            }
          } else {
            matrix[row] = [];
            matrix[row][col] = key;
          }
        }
      }
    }
  });
  const rowNames = Array.from(rowMap.keys()).sort((a, b) => {
    return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]);
  });
  const colNames = Array.from(colMap.keys()).sort((a, b) => {
    return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]);
  });
  rowMap.forEach((value, row, map) => {
    rowMap.set(row, rowNames.indexOf(row));
  });
  colMap.forEach((value, col) => {
    colMap.set(col, colNames.indexOf(col));
  });
  return [nets, matrix, rowMap, colMap];
}

function getMCUPins(nets, rowNames, colNames, MCU) {
  for (const [key, value] of rowNames) {
    const net = nets.get(key);
    if (net) {
      nets.get(key).node.forEach((node) => {
        if (new RegExp(/U\d+/).test(node.ref)) {
          const pin = parsePin(node.pinfunction, MCU);
          rowNames.set(key, { number: value, pin: pin });
        }
      });
    } else {
      console.log("no net found for row: " + key);
    }
  }
  for (const [key, value] of colNames) {
    const net = nets.get(key);
    if (net) {
      nets.get(key).node.forEach((node) => {
        if (new RegExp(/U\d+/).test(node.ref)) {
          const pin = parsePin(node.pinfunction, MCU);
          colNames.set(key, { number: value, pin: pin });
        }
      });
    } else {
      console.log("no net found for col: " + key);
    }
  }
  return [rowNames, colNames];
}

function parsePin(pin, MCU) {
  if (MCU.value === "RP2040") {
    return "GP" + pin.match(/GPIO\d+/)[0].substring(4);
  } else {
    return pin;
  }
}
