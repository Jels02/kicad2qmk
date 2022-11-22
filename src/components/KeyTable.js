import { keycodes } from "./keycodes";
import Combobox from "react-widgets/Combobox";

export function KeyTable({ state, setState }) {
  if (state === null) {
    return <div></div>;
  }
  const keys = state.keys;

  const updateSize = (e) => {
    const key = keys.get(e.target.id);
    key.size = e.target.value;
    setState((state) => ({
      ...state,
      keys: keys,
    }));
  };

  const updateKeycode = (e, ref) => {
    const key = keys.get(ref);
    key.keycode = e;
    setState((state) => ({
      ...state,
      keys: keys,
    }));
  };

  const updateRow = (e) => {
    const rows = state.rowPins;
    rows[e.target.id] = e.target.value;
    setState((state) => ({
      ...state,
      rowPins: rows,
    }));
  };

  const updateCol = (e) => {
    const col = state.colPins.get(e.target.id);
    col.pin = e.target.value;
  };

  const updateEnable = (e) => {
    const key = keys.get(e.target.id);
    key.enabled = e.target.checked;
    setState((state) => ({
      ...state,
      keys: keys,
    }));
  };

  const enableAll = (e) => {
    keys.forEach((key) => {
      key.enabled = e.target.checked;
    });
    setState((state) => ({
      ...state,
      keys: keys,
    }));
  };

  if (keys && keys.size > 0) {
    return (
      <div>
        <label style={{ display: "flex" }}>
          <input
            type="checkbox"
            id="enableAll"
            onChange={enableAll}
            name="enableAll"
          />
          Enable All
        </label>

        <table>
          <thead>
            <tr>
              <th>Enabled</th>
              <th>Ref</th>
              <th>Value</th>
              <th>Footprint</th>
              <th>Matrix Position</th>
              <th>Size</th>
              <th>Keycode</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(keys).map(([key, value]) => (
              <tr key={key}>
                <td>
                  <div>
                    <input
                      type="checkbox"
                      id={key}
                      checked={value.enabled}
                      onChange={updateEnable}
                    />
                  </div>
                </td>
                <td>{value.ref}</td>
                <td>{value.value}</td>
                <td>{value.footprint.split(":")[1]}</td>
                <td>{`${value.row}, ${value.col}`}</td>
                <td>
                  <div>
                    <input
                      id={value.ref}
                      type="number"
                      step="0.25"
                      value={value.size}
                      onChange={updateSize}
                    />
                  </div>
                </td>
                <td>
                  <Combobox
                    hideEmptyPopup
                    hideCaret
                    focusFirstItem
                    data={Object.keys(keycodes)}
                    filter="contains"
                    placeholder="Enter a keycode"
                    defaultValue={value.keycode}
                    onChange={(e) => updateKeycode(e, value.ref)}
                    containerClassName={
                      value.keycode === "ERROR" || value.keycode === ""
                        ? "error"
                        : keycodes[value.keycode]
                        ? "valid"
                        : "unknown"
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>Row / Col Ref </th>
              <th> Row / Col Name</th>
              <th>Pin</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(state.rowPins)
              .sort((a, b) => {
                return a[1].number - b[1].number;
              })
              .map(([key, { number, pin }]) => (
                <tr key={key}>
                  <td>Row {key}</td>
                  <td>{number}</td>
                  <td>
                    <input id={key} value={pin} onChange={updateRow} />
                  </td>
                </tr>
              ))}
            {Array.from(state.colPins)
              .sort((a, b) => {
                return a[1].number - b[1].number;
              })

              .map(([key, { number, pin }]) => (
                <tr key={key}>
                  <td>Col {key}</td>
                  <td>{number}</td>
                  <td>
                    <input id={key} value={pin} onChange={updateCol} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>MCU Ref</th>
              <th>MCU Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{state.MCU.ref}</td>
              <td>{state.MCU.value}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  } else {
    return <div></div>;
  }
}

export function KeyGrid({ state, pos }) {
  if (state === null || pos === null) {
    return <h1> No State </h1>;
  }
  const keys = state.keys;
  let height = 0;
  let width = 0;
  keys.forEach((key) => {
    if (key.x > width) {
      width = key.x;
    }
    if (key.y > height) {
      height = key.y;
    }
  });
  const keyWidth = 900 / width;
  const keyHeight = 225 / height;

  return (
    <div
      style={{
        position: "relative",
        width: 800 + keyWidth,
        minHeight: 250 + keyHeight,
      }}
    >
      {Array.from(keys).map(([key, value]) => {
        if (value.enabled) {
          return (
            <div
              key={key}
              style={{
                position: "absolute",
                left: (value.x - (value.size - 1) / 2) * keyWidth,
                top: value.y * keyHeight,
                width: value.size * keyWidth - 2,
                height: keyHeight - 2,
                border: "1px solid black",
                backgroundColor: "#383838",
              }}
            >
              {value.ref}
            </div>
          );
        } else {
          return "";
        }
      })}
    </div>
  );
}
