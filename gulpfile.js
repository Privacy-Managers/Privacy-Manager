var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('scss', function() {
    gulp.src('./scss/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./css/'));
});