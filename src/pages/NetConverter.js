import { useEffect, useState } from "react";
import kicadNetlistToJson from "kicad-netlist-to-json";
import { parse } from "papaparse";
import { parseNet } from "../components/parseNetList";
import { FileButton } from "../components/FileButton";
import { parsePos } from "../components/parsePos";
import {
  writeInfoJson,
  writeKeymap,
  writeConfig,
} from "../components/fileWriter";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { KeyGrid, KeyTable } from "../components/KeyTable";

export default function NetConverter() {
  const [state, setState] = useState(null);
  const [pos, setPos] = useState(null);
  const [validFile, setValidFile] = useState({ net: false, pos: false });
  const [errors, setErrors] = useState([]);
  const [outFiles, setOutFiles] = useState({
    info: null,
    keymap: null,
    config: null,
    rules: null,
  });
  const [refs, setRefs] = useState({
    ref: "",
    rowPrefix: "",
    colPrefix: "",
  });
  const [params, setParams] = useState({
    vendorID: "0xFEED",
    productID: "0xFFFF",
    deviceVer: "0.0.1",
    keyboardName: "Keyboard",
    url: "Link to website",
    maintainer: "Maintainer Name",
    manufacturer: "Manufacurer Name",
  });

  const handleNetRead = (e) => {
    try {
      const converted = JSON.parse(
        JSON.stringify(kicadNetlistToJson(e.target.result))
      );
      const validNet = parseNet(converted, setState, refs);
      setValidFile({ ...validFile, net: validNet });
    } catch (e) {
      console.error(
        "Error parsing netlist. Please check your netlist and try again."
      );
      console.warn(e);
      return;
    }
    if (pos) {
      setValidFile({ ...validFile, pos: parsePos(pos, state) });
    }
  };

  useEffect(() => {
    if (pos && state) {
      setValidFile((v) => ({ ...v, pos: parsePos(pos, state) }));
    }
  }, [pos, state]);

  const handlePosRead = (e) => {
    const content = e.target.result;
    const parsed = parse(content, { header: true });
    setPos(parsed.data);
    if (state) {
      parsePos(parsed.data, state);
    } else {
      console.log("No state");
    }
  };

  const handleChange = (e) => {
    switch (e.target.id) {
      case "refDes":
        setRefs({ ...refs, ref: e.target.value });
        break;
      case "rowPrefix":
        setRefs({ ...refs, rowPrefix: e.target.value });
        break;
      case "colPrefix":
        setRefs({ ...refs, colPrefix: e.target.value });
        break;
      default:
        break;
    }
  };

  const handleInputChange = (e) => {
    switch (e.target.id) {
      case "vendorID":
        setParams({ ...params, vendorID: e.target.value });
        break;
      case "productID":
        setParams({ ...params, productID: e.target.value });
        break;
      case "versionID":
        setParams({ ...params, deviceVer: e.target.value });
        break;
      case "keyboardName":
        setParams({ ...params, keyboardName: e.target.value });
        break;
      case "url":
        setParams({ ...params, url: e.target.value });
        break;
      case "maintainer":
        setParams({ ...params, maintainer: e.target.value });
        break;
      case "manufacturer":
        setParams({ ...params, manufacturer: e.target.value });
        break;
      default:
        break;
    }
  };

  const generate = () => {
    const errors = validState();
    if (errors.length === 0) {
      setErrors([]);
      const infoJson = writeInfoJson(state, params);
      const keymap = writeKeymap(state, params.maintainer);
      const config = writeConfig(state, params);
      setOutFiles({ info: infoJson, keymap: keymap, config: config });
    } else {
      setErrors(errors);
    }
  };

  function validState() {
    const errors = [];
    if (!state) {
      errors.push("No netlist");
    }
    if (!pos) {
      errors.push("No position file");
    }
    if (errors.length > 0) {
      return errors;
    }
    Array.from(state.keys).forEach(([key, value]) => {
      if (
        value.enabled &&
        (value.keycode === "ERROR" || value.keycode === "")
      ) {
        errors.push(`Key ${key} has no valid keycode`);
      }
    });
    if (params.keyboardName === "") {
      errors.push("Invalid Keyboard Name");
    }
    if (params.maintainer === "") {
      errors.push("Invalid Maintainer Name");
    }
    if (params.manufacturer === "") {
      errors.push("Invalid Manufacturer Name");
    }
    if (params.vendorID.match(/0x[0-9A-Fa-f]{4}/) === null) {
      errors.push("Invalid Vendor ID");
    }
    if (params.productID.match(/0x[0-9A-Fa-f]{4}/) === null) {
      errors.push("Invalid Product ID");
    }
    if (params.deviceVer.match(/[0-9]\.[0-9]\.[0-9]*/) === null) {
      errors.push("Invalid Device Version");
    }
    return errors;
  }

  const saveFile = () => {
    const zip = new JSZip();
    zip.file("info.json", outFiles.info);
    zip.file("rules.mk", "# This file is intentionally left blank");
    zip.file("readme.md", "# Edit this yourself");
    zip.file("config.h", outFiles.config);
    const keymapFolder = zip.folder("keymaps");
    const defaultKeymap = keymapFolder.folder("default");
    defaultKeymap.file("keymap.c", outFiles.keymap);
    const viaKeymap = keymapFolder.folder("via");
    viaKeymap.file("keymap.c", outFiles.keymap);
    viaKeymap.file("rules.mk", "VIA_ENABLE = yes");
    zip.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(content, `${params.keyboardName}.zip`);
    });
  };

  function copyToClip(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard");
    });
  }

  return (
    <div className="App">
      <div className="intro">
        <h1>KiCAD to QMK Converter</h1>
        <p>
          This tool was designed to make the process of making writing QMK
          firmware a little easier. It takes a KiCAD netlist and a KiCAD
          position file and generates a QMK Keyboard folder.{" "}
          <strong>
            To generate the netlist, use the default KiCAD netlist format, and
            the POS file needs to include at least the switches, in a CSV format{" "}
          </strong>
          . There's still a necessity to input all the usual parameters in the
          text boxes. Please not that this may not work for your particular
          files - It matches the switches based off the reference designator, so
          if your switches are not using one of the default K?, SW? or MX?, and
          the footprint does not have "MX" in the name, it will not be picked
          up. In the case that the switch does not match both the reference and
          footprint naming requirements (but rather only one), it will be picked
          up, but will need to be enabled manually.
        </p>
        <br />
        <p>
          The keycodes are matched based off the switch's value in the schematic
          - with the "KC_" prepended afterwards, so if you want the script to
          automatically pick up the keycodes, make sure you name your switches
          as "A", "B", "LCTL" etc. If the script fails to match a switch, it
          will list the keycode as "ERROR" and highlight the field red. You can
          then manually enter / update the keycode in the text box.
        </p>
        <br />
        <p>You can also update most of the other values.</p>
      </div>
      <div className="user-input">
        <form className="netlist-form">
          <label> Switch Prefix </label>
          <input id="refDes" type="text" onChange={handleChange} />
          <label> Row prefix </label>
          <input id="rowPrefix" type="text" onChange={handleChange} />
          <label> Column prefix </label>
          <input id="colPrefix" type="text" onChange={handleChange} />
        </form>
        <FileButton
          style={validFile.net}
          handleFileRead={handleNetRead}
          text={"Select Netlist"}
        />
        <FileButton
          style={validFile.pos !== false}
          handleFileRead={handlePosRead}
          text={"Select Pos File"}
        />
        {validFile.pos !== false && validFile.pos.map((e) => <p>{e}</p>)}
        <form className={"param-inputs"}>
          <label>Keyboard Name</label>
          <input
            id="keyboardName"
            placeholder={params.keyboardName}
            onChange={handleInputChange}
          />
          <label>Manufacturer</label>
          <input
            id="manufacturer"
            placeholder={params.manufacturer}
            onChange={handleInputChange}
          />
          <label>Maintainer</label>
          <input
            id="maintainer"
            placeholder={params.maintainer}
            onChange={handleInputChange}
          />
          <label>Vendor ID</label>
          <input
            id="vendorID"
            placeholder={params.vendorID}
            onChange={handleInputChange}
          />
          <label>Product ID</label>
          <input
            id="productID"
            placeholder={params.productID}
            onChange={handleInputChange}
          />
          <label>Version ID</label>
          <input
            id="versionID"
            placeholder={params.deviceVer}
            onChange={handleInputChange}
          />
          <label>URL (Optional)</label>
          <input
            id="url"
            placeholder={params.url}
            onChange={handleInputChange}
          />
        </form>
        <button onClick={generate}>Generate Files</button>
        <div className="fileButtons">
          <ul className="fileOpts">
            <li>Info.json</li>
            <li>
              <button
                disabled={!outFiles.info}
                onClick={() => copyToClip(outFiles.info)}
              >
                Copy
              </button>
            </li>
            <li>
              <button
                disabled={!outFiles.info}
                onClick={() => saveFile(outFiles.info)}
              >
                Save As
              </button>
            </li>
          </ul>
          <ul className="fileOpts">
            <li>Keymap.c</li>
            <li>
              <button
                disabled={!outFiles.keymap}
                onClick={() => copyToClip(outFiles.keymap)}
              >
                Copy
              </button>
            </li>
            <li>
              <button
                disabled={!outFiles.keymap}
                onClick={() => saveFile(outFiles.keymap)}
              >
                Save As
              </button>
            </li>
          </ul>
          <ul className="fileOpts">
            <li>Config.h</li>
            <li>
              <button
                disabled={!outFiles.config}
                onClick={() => copyToClip(outFiles.config)}
              >
                Copy
              </button>
            </li>
            <li>
              <button
                disabled={!outFiles.config}
                onClick={() => saveFile(outFiles.config)}
              >
                Save As
              </button>
            </li>
          </ul>
        </div>
        <button
          disabled={!(outFiles.config && outFiles.info && outFiles.keymap)}
          onClick={saveFile}
        >
          Save Zip
        </button>

        <div>
          {errors.length !== 0 && errors.map((e) => <p key={e}>{e}</p>)}
        </div>
        <KeyGrid state={state} pos={pos} />
        <KeyTable state={state} setState={setState} />
      </div>
    </div>
  );
}
