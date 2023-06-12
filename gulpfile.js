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
  return src("work/scss/style.scss")
    .pipe(autoprefixer({ overrideBrowserlist: ["last 10 version"] }))
    .pipe(concat("style.min.css"))
    .pipe(scss({ outputStyle: "compressed" }))
    .pipe(dest("work/css"))
    .pipe(browserSync.stream());
}

function scripts() {
  return src("work/js/main.js")
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("work/js"))
    .pipe(browserSync.stream());
}

function images() {
  return src(["work/images/src/*.*", "!work/images/src/*.svg"])
    .pipe(newer("work/images"))
    .pipe(avif({ quality: 50 })) // convert to avif
    .pipe(src("work/images/src/*.*"))
    .pipe(newer("work/images"))
    .pipe(webp()) // convert to webp
    .pipe(src("work/images/src/*.*"))
    .pipe(newer("work/images"))
    .pipe(imagemin()) // just minify
    .pipe(dest("work/images"));
}

function sprite() {
  return src("work/images/src/*.svg")
    .pipe(
      svgSprite({ mode: { stack: { sprite: "../sprite.svg", example: true } } })
    ) // unify all the SVGs in one sprite file
    .pipe(dest("work/images"));
}

function fonts() {
  return src("work/fonts/src/*.*")
    .pipe(fonter({ formats: ["woff", "ttf"] }))
    .pipe(src("work/fonts/*.ttf"))
    .pipe(ttf2woff2())
    .pipe(dest("work/fonts"));
}

function watching() {
  browserSync.init({ server: { baseDir: "work/" } });
  watch(["work/scss/style.scss"], styles);
  watch(["work/js/main.js"], scripts);
  watch(["work/images/src"], images, sprite);
  watch(["work/fonts/src"], fonts);
  watch(["work/**/*.html"]).on("change", browserSync.reload);
}

function cleanBuild() {
  return src("build").pipe(clean());
}

function fillBuild() {
  return src(
    [
      "work/css/style.min.css",
      "work/js/main.min.js",
      "work/*.html",
      "work/images/*.*",
      "!work/images/*.svg",
      "work/images/sprite.svg",
      "work/fonts/*.*",
    ],
    {
      base: "work",
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
