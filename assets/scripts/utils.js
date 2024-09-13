import fs from "fs";

// Create custom write-to-file function
// with append and overwrite behavior
const writeFile = (filePath, data, writeType = "append") => {
  // Call fs.appendFileSync with data
  if (writeType == "append") {
    fs.appendFileSync(filePath, data);
  }
  // Call fs.writeFileSync with data
  else if (writeType == "overwrite") {
    fs.writeFileSync(filePath, data);
  }
  // Throw error if invalid write type passed
  else {
    throw new Error("Valid writeType values are: append, overwrite");
  }
};

// Create cstom read=file function with utf-8 encoding
const readFile = (filePath) => {
  return fs.readFileSync(filePath, "utf8", (error, data) => {
    if (error) {
      console.log(error);
      return;
    } else {
      return data;
    }
  });
};

export { readFile, writeFile };