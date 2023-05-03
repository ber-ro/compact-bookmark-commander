import cpy from 'cpy';
import process from 'process';

let cfgJs = process.argv[2] === "--dev" ? "development" : "production.min"
let cfg = process.argv[2] === "--dev" ? "dev" : "prod"

let paths = [
  {
    "from": [
      "node_modules/bootstrap/dist/css/bootstrap.css",
      "node_modules/react-bootstrap/dist/react-bootstrap.min.js",
      "node_modules/react-bootstrap/dist/react-bootstrap.min.js.LICENSE.txt",
      `node_modules/react-dom/umd/react-dom.${cfgJs}.js`,
      `node_modules/react/umd/react.${cfgJs}.js`,
      "node_modules/requirejs/require.js"
    ],
    "to": "lib"
  },
  {
    "from": [
      "public/index.*"
    ],
    "to": "app"
  },
  {
    "from": [
      "chrome/background.js",
      "chrome/icon128.png",
      "chrome/manifest.json"
    ],
    "to": ""
  }
];
copyFiles(paths);

async function copyFiles(paths) {
  for (const p of paths) {
    await cpy(p.from, cfg + "/" + p.to, {
      flat: true,
      overwrite: true,
      rename: name => name.replace(/\.(development|production\.min)/, "")
    })
  }
  console.log(process.argv[1] + ": files copied")
}
