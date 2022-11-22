import { useRef } from "react";

export function FileButton({ style, handleFileRead, text }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current.click();
  };

  const handleFileChange = (event) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }
    event.target.value = null;
    handleFileChosen(fileObj);
  };

  const handleFileChosen = (file) => {
    const fileReader = new FileReader();
    fileReader.onloadend = handleFileRead;
    fileReader.readAsText(file);
  };

  return (
    <>
      <input
        style={{ display: "none" }}
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
      />

      <button
        onClick={handleClick}
        className={style ? "validFile" : "invalidFile"}
      >
        {text}
      </button>
    </>
  );
}
