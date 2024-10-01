const { src, dest, watch, parallel, series } = require("gulp");

// Styles and scripts
const scss = require("gulp-sass")(require("sass")); // css
const autoprefixer = require("gulp-autoprefixer"); // for older browser versions
const uglify = require("gulp-uglify-es").default; // js
const concat = require("gulp-concat"); // concatination

// Images and sprites
const avif = require("gulp-avif");
const webp = require("gulp-webp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer"); // don't repeat tasks
const svgSprite = require("gulp-svg-sprite");

// Fonts
const fonter = require("gulp-fonter-unx");
const ttf2woff2 = require("gulp-ttf2woff2");

// Watch and build
const browserSync = require("browser-sync").create();
const clean = require("gulp-clean");

//
// Included functions: styles, scripts, images, sprite, fonts, watching,
// cleanBuild, fillBuild
//

function styles() {
  return src("src/scss/style.scss")
    .pipe(autoprefixer({ overrideBrowserlist: ["last 10 version"] }))
    .pipe(concat("style.min.css"))
    .pipe(scss({ outputStyle: "compressed" }))
    .pipe(dest("src/css"))
    .pipe(browserSync.stream());
}

function scripts() {
  return src("src/js/main.js")
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("src/js"))
    .pipe(browserSync.stream());
}

function images() {
  return src(["src/images/src/*.*", "!src/images/src/*.svg"])
    .pipe(newer("src/images"))
    .pipe(avif({ quality: 50 })) // convert to avif
    .pipe(src("src/images/src/*.*"))
    .pipe(newer("src/images"))
    .pipe(webp()) // convert to webp
    .pipe(src("src/images/src/*.*"))
    .pipe(newer("src/images"))
    .pipe(imagemin()) // just minify
    .pipe(dest("src/images"));
}

function sprite() {
  return src("src/images/src/*.svg")
    .pipe(
      svgSprite({ mode: { stack: { sprite: "../sprite.svg", example: true } } })
    ) // unify all the SVGs in one sprite file
    .pipe(dest("src/images"));
}

function fonts() {
  return src("src/fonts/src/*.*")
    .pipe(fonter({ formats: ["woff", "ttf"] }))
    .pipe(src("src/fonts/*.ttf"))
    .pipe(ttf2woff2())
    .pipe(dest("src/fonts"));
}

function watching() {
  browserSync.init({ server: { baseDir: "src/" } });
  watch(["src/scss/style.scss"], styles);
  watch(["src/js/main.js"], scripts);
  watch(["src/images/src"], images, sprite);
  watch(["src/fonts/src"], fonts);
  watch(["src/**/*.html"]).on("change", browserSync.reload);
}

function cleanBuild() {
  return src("build").pipe(clean());
}

function fillBuild() {
  return src(
    [
      "src/css/style.min.css",
      "src/js/main.min.js",
      "src/*.html",
      "src/images/*.*",
      "!src/images/*.svg",
      "src/images/sprite.svg",
      "src/fonts/*.*",
    ],
    {
      base: "src",
    }
  ).pipe(dest("build"));
}

//
// Main commands: `gulp`, `gulp build`
//

exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.sprite = sprite;
exports.fonts = fonts;
exports.watching = watching;

exports.default = parallel(styles, scripts, watching);
exports.build = series(cleanBuild, fillBuild);
