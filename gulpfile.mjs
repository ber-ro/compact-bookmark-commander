import babel from "@babel/core"
import archiver from 'archiver'
import gulp from 'gulp'
import rename from "gulp-rename"
import rmLines from 'gulp-rm-lines'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

const env = process.argv.find((val) => val === "--dev")
  ? "dev"
  : "prod"

export const build = gulp.series(transpile, copy)

async function transpile(cb) {
  function writeFile(text, file) {
    const outdir = path.join(env, 'app')
    const filepath = path.join(outdir, file.slice(0, -3) + 'js')
    return fsp.mkdir(outdir)
      .catch(() => { })
      .then(() => fsp.writeFile(filepath, text))
  }

  let promises = []
  const dir = 'src'
  const ls = await fsp.readdir(dir)
  for (const f of ls) {
    if (f.slice(-4) !== '.tsx')
      continue
    promises.push(
      babel.transformFileAsync(path.join(dir, f))
        .then((result) => writeFile(result.code, f))
    )
  }
  Promise.all(promises).then(cb)
}

export async function copy() {
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

  const libs = [
    `node_modules/bootstrap/dist/css/bootstrap${cfgMin}.css`,
    `node_modules/react-bootstrap/dist/react-bootstrap.min.js.LICENSE.txt`,
    `node_modules/react-bootstrap/dist/react-bootstrap.min.js`,
    `node_modules/react-dom/umd/react-dom.${cfgReact}.js`,
    `node_modules/react/umd/react.${cfgReact}.js`,
    `node_modules/systemjs/dist/extras/amd${cfgMin}.js`,
    `node_modules/systemjs/dist/s${cfgMin}.js`,
  ]

  // Unify file names, so source can stay the same.
  const renLibs = path => {
    path.basename = path.basename.replace(/\.(development|production|min)/g, "")
  }

  return gulp.src(libs)
    .pipe(rmLines({ 'filters': [/# sourceMappingURL=/] }))
    .pipe(rename(renLibs))
    .pipe(gulp.dest(env + "/lib"))
}

export async function zip(cb) {
  await fsp.rm(env + '/chrome.zip').catch(() => { })
  const output = fs.createWriteStream(env + '/chrome.zip')
  const archive = archiver('zip', {
    zlib: { level: 6 } // Sets the compression level.
  })

  // listen for all archive data to be written
  // 'close' event is fired only when a file descriptor is involved
  output.on('close', function () {
    console.log(archive.pointer() + ' total bytes')
    console.log('archiver has been finalized and the output file descriptor has closed.')
    cb()
  })

  // This event is fired when the data source is drained no matter what was the data source.
  // It is not part of this library but rather from the NodeJS Stream API.
  // @see: https://nodejs.org/api/stream.html#stream_event_end
  output.on('end', function () {
    console.log('Data has been drained')
  })

  // good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      // log warning
    } else {
      // throw error
      throw err
    }
  })

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err
  })

  // pipe archive data to the file
  archive.pipe(output)

  // append files from a sub-directory and naming it `new-subdir` within the archive
  // archive.directory('subdir/', 'new-subdir')

  // append files from a sub-directory, putting its contents at the root of archive
  archive.directory('prod/', false)

  // append files from a glob pattern
  // archive.glob('file*.txt', {cwd:__dirname})

  // finalize the archive (ie we are done appending files but streams have to finish yet)
  // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
  archive.finalize()
}