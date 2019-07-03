require("dotenv").config();
const fs = require("fs");
var path = require("path");
var http = require("http");
const readlines = require("n-readlines");
const iconv = require("iconv-lite");
const ObjectsToCsv = require("objects-to-csv");
const Mongo = require("../POP/pop/apps/api/src/mongo");

const FOLDER = "./files";

let objs = [];

let total = 0;

async function run() {
  let files = fs.readdirSync(FOLDER);
  files = files.filter(e => e.indexOf(".BIB") !== -1);
  for (let i = 0; i < files.length; i++) {
    await parseLines(FOLDER + "/" + files[i], files[i], onNewNotice);
    new ObjectsToCsv(objs).toDisk(`./miss/${files[i]}.csv`, { append: true });
    objs = [];
  }
  console.log("end");
}

function onNewNotice(obj) {
  return new Promise(async (resolve, reject) => {
    if (Object.keys(obj).length) {
      const b = await exist(obj);
      if (b) {
        objs.push(obj);
      }
    }
    resolve();
  });
}

const MEMOIRE = require("../POP/pop/apps/api/src/models/memoire");
const MERIMEE = require("../POP/pop/apps/api/src/models/merimee");
const Palissy = require("../POP/pop/apps/api/src/models/palissy");
const AUTHOR = require("../POP/pop/apps/api/src/models/autor");
const ENLUMINURE = require("../POP/pop/apps/api/src/models/enluminures");
const MNR = require("../POP/pop/apps/api/src/models/mnr");

let c = 0;

function exist({ REF, IDPROD }) {
  return new Promise((resolve, reject) => {
    if (IDPROD && !IDPROD.startsWith("SAP04")) {
      return resolve(false);
    }
    ++c;
    MEMOIRE.findOne({ REF }).then(e => {
      if (e && e.DMIS > "2018-12-31") {
        return resolve(true);
      }
      return resolve(false);
    });
  });
}

async function parseLines(file, filename, cb) {
  var liner = new readlines(file);
  var next;

  let obj = {};

  while ((next = liner.next())) {
    const line = iconv.decode(next, "windows-1252");

    const key = regexThis(line, /[0-9]+([A-Z]*)[ ]*!/gm);
    let value = regexThis(line, /[0-9]+[A-Z]*[ ]*!([^\n]*)/gm);
    if (key === "REF") {
      value = value.toLocaleUpperCase();
      await cb(obj);
      if (total % 100 === 0) {
        console.log(total, filename, objs.length, "p:", c);
      }
      obj = {};
      total++;
    }
    obj[key] = value;
  }
  await cb(obj);
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
