@echo off
browserify public/js/index.js | uglifyjs --source-map --output public/js/bundle.js -c > public/js/bundle.js
browserify public/js/login.js | uglifyjs --source-map --output public/js/bundle-login.js -c > public/js/bundle-login.js
EXIT /b