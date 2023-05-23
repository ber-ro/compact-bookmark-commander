/* eslint-disable no-undef, no-restricted-properties*/
"use strict;"

System.addImportMap({
  "imports": {
    "react": "../lib/react.js"
    , "react-dom/client": "../lib/react-dom.js"
    , "react-dom": "../lib/react-dom.js"
    , "react-bootstrap/Table": "../lib/react-bootstrap.js"
    , "react-bootstrap": "../lib/react-bootstrap.js"
  }
})
System.import('./App.js');

addCss("index.css");
addCss("../lib/bootstrap.css");

function addCss(fileName) {
  var link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = fileName;

  document.head.appendChild(link);
}
