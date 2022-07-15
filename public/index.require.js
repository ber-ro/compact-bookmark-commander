/* eslint-disable no-undef */
"use strict;"

define("index.css");
define("bootstrap/dist/css/bootstrap.min.css");
requirejs.config({
  map: {
    "*": {
      "react": "../lib/react"
      , "react-dom/client": "../lib/react-dom"
      , "react-dom": "../lib/react-dom"
      , "react-bootstrap/Table": "../lib/react-bootstrap.min"
      , "react-bootstrap": "../lib/react-bootstrap.min"
    }
  },
});
requirejs(["index"]);

addCss("index.css");
addCss("../lib/bootstrap.css");

function addCss(fileName) {
  var link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = fileName;

  document.head.appendChild(link);
}
