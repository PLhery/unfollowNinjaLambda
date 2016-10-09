var gulp = require('gulp');
var ts = require('gulp-typescript');
var lambda = require('gulp-awslambda');
var install = require('gulp-install');
var zip = require('gulp-zip');
var Promise = require('es6-promise').Promise;

var tsProject = ts.createProject('tsconfig.json');

gulp.task('default',['compile'], function () {
    return gulp.watch('src/*.ts', ['compile']);
});

gulp.task('getConfig', function() {
    return gulp.src('./UNconfig.json')
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('src'));
});
gulp.task('compile', ['getConfig'], function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist'));
});

gulp.task('install_dependencies',function(){
    return gulp.src('./package.json')
        .pipe(gulp.dest('./dist'))
        .pipe(install({production : true, ignoreScripts: true}))
});

gulp.task('zip',['compile', 'install_dependencies'], function(){
    return gulp.src(['dist/**/*'], {nodir: true}) // nodir => see https://github.com/sindresorhus/gulp-zip/issues/64
        .pipe(zip('lambda.zip'))
        .pipe(gulp.dest('.'));
});

gulp.task('deploy.CheckUnfollow',['zip'], function(){
    return gulp.src(['lambda.zip'])
        .pipe(lambda('CheckUnfollows', {region: 'eu-west-1' }))
});

gulp.task('deploy.CheckAll',['zip'], function(){
    return gulp.src(['lambda.zip'])
        .pipe(lambda('CheckAll', {region: 'eu-west-1' }))
});

gulp.task('deploy',['deploy.CheckUnfollow', 'deploy.CheckAll']);

gulp.task('checkUnfollow', function(callback){
    const checkUnfollow = require('./dist/index').checkUnfollow;
    checkUnfollow({params: {path: {id: '290981389'}}}, {}, function(err, data) {
        console.log(JSON.stringify(data, null, 2));
        callback(err);
    })
});

gulp.task('checkAll', function(callback){
    const checkAll = require('./dist/index').checkAll;
    checkAll({}, {}, function(err, data) {
        console.log(JSON.stringify(data, null, 2));
        callback(err);
    })
});