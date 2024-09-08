const fs = require('fs');

const writeFile = (filePath, data, writeType='append') => {
  if(writeType == 'append'){
    fs.appendFileSync(filePath, data)
  }
  else if (writeType == 'overwrite'){
    fs.writeFileSync(filePath, data,)
  }
  else {
    throw new Error("Valid writeType values are: append, overwrite");
  }
}

const readFile = (filePath, asJSON=false) => {
  return fs.readFileSync(filePath, 'utf8', (error, data) => {
    if(error){
      console.log(error);
      return;
    }
    else{      
      if(asJSON == true){
        return JSON.parse(data);
      }
      else {
        return data;
      }
    }

  })
}

module.exports = { readFile, writeFile }