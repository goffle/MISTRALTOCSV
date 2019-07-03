require("dotenv").config();
const fs = require("fs");
const path = require("path");
const http = require("http");
const ObjectsToCsv = require("objects-to-csv");

const csvtojson = require("csvtojson");
const FOLDER = "./miss";

async function run() {
  let files = fs.readdirSync(FOLDER);
  files = files.filter(e => e.indexOf(".csv") !== -1);
  for (let i = 0; i < files.length; i++) {
    aa(files[i]);
  }
}

function aa(file) {
  csvtojson()
    .fromFile(FOLDER + "/" + file)
    .then(async objs => {
      const directory = file.replace(".csv", "");
      for (let i = 0; i < objs.length; i++) {
        let url = regexThis(objs[i].IMG, /(www.[A-Za-z0-9.\/_]*)/gm);
        url = url.replace("www.", "http://www2.");
        const filename = GetFilename(url);
        objs[i].NOMSN = "";
        if (filename) {
          try {
            await download(url, "./" + directory + "/" + filename);
            objs[i].NOMSN = filename;
          } catch (e) {
            console.log("REJECT", e);
          }
        }
      }
      new ObjectsToCsv(objs).toDisk("./" + directory + "/" + file);
    });
}

run();

function regexThis(str, reg) {
  if (!str) {
    return "";
  }
  var regex = new RegExp(reg);
  let m;
  while ((m = regex.exec(str)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    if (m[1]) {
      return m[1].trim();
    }
  }
  return "";
}

function GetFilename(url) {
  if (url) {
    return url.split("/").pop();
  }
  return "";
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    var dirname = path.dirname(dest);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname);
    }

    if (fs.existsSync(dest)) {
      resolve();
      return;
    }

    var file = fs.createWriteStream(dest);
    http
      .get(url, function(response) {
        if (response.statusCode !== 200) {
          reject();
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve); // close() is async, call cb after close completes.
        });
      })
      .on("error", err => {
        // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        console.log("Erreur with file", url, dest);
        reject();
      });
  });
}
