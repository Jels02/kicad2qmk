export function parsePos(file, state) {
  const keys = state.keys;
  let keyFound = false;
  const pos = new Map();
  let minX;
  let maxY;
  file
    .filter((component) => {
      if (component.Ref) {
        return keys.get(component.Ref) != null;
      } else {
        return false;
      }
    })
    .forEach((component) => {
      const key = keys.get(component.Ref);
      const x = parseFloat(component.PosX);
      const y = parseFloat(component.PosY);
      if (minX === undefined || x < minX) {
        minX = x;
      }
      if (maxY === undefined || y > maxY) {
        maxY = y;
      }
      pos.set(key, { ref: component.Ref, x: x, y: y });
    });

  const offsetX = minX;
  const offsetY = maxY;

  pos.forEach((value, id) => {
    const xVal =
      Math.round(((parseFloat(value.x) - offsetX) / 19.05) * 100) / 100;
    const yVal = Math.abs(
      Math.round(((parseFloat(value.y) - offsetY) / 19.05) * 100) / 100
    );
    const key = keys.get(value.ref);
    key.x = xVal;
    key.y = yVal;
    keyFound = true;
  });
  return keyFound ? [] : ["No keys found in file"];
}
