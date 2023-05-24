const gulp = require('gulp')
const rmLines = require('gulp-rm-lines')
const rename = require("gulp-rename")

const env = process.argv.find((val) => val === "--dev")
  ? "dev"
  : "prod"

exports.copy = copy

async function copy() {
  copyList([
    ["app",
      "public/index.*"],
    ["",
      "chrome/background.js",
      "chrome/icon128.png",
      "chrome/manifest.json"]
  ])
  return copyLibs()
}

// Copy files synchronously.
// spec:
// [[destination1, source1a, source1b, ...],
//  [destination2, source2a, source2b, ...],
// ...
// ]
async function copyList(spec) {
  for (const i of spec)
    await new Promise(resolve => {
      gulp.src(i.slice(1))
        .pipe(gulp.dest(env + "/" + i[0]))
        .on('end', resolve)
    })
}

function copyLibs() {
  const cfgReact = env === "dev" ? "development" : "production.min"
  const cfgMin = env === "dev" ? "" : ".min"

  libs = [
    `node_modules/bootstrap/dist/css/bootstrap${cfgMin}.css`,
    `node_modules/react-bootstrap/dist/react-bootstrap.min.js.LICENSE.txt`,
    `node_modules/react-bootstrap/dist/react-bootstrap.min.js`,
    `node_modules/react-dom/umd/react-dom.${cfgReact}.js`,
    `node_modules/react/umd/react.${cfgReact}.js`,
    `node_modules/systemjs/dist/extras/amd${cfgMin}.js`,
    `node_modules/systemjs/dist/s${cfgMin}.js`,
  ]

  // Unify file names, so source can stay the same.
  renLibs = path => {
    path.basename = path.basename.replace(/\.(development|production|min)/g, "")
  }

  return gulp.src(libs)
    .pipe(rmLines({ 'filters': [/# sourceMappingURL=/] }))
    .pipe(rename(renLibs))
    .pipe(gulp.dest(env + "/lib"))
}
