@echo off
browserify public/js/index.js | uglifyjs -c > public/js/bundle.js
browserify public/js/login.js | uglifyjs -c > public/js/bundle-login.js
EXIT /b