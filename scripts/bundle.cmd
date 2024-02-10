@echo off
browserify public/js/index.js | uglifyjs --source-map "root='/js/bundle.js'" --output public/js/bundle.js
browserify public/js/login.js | uglifyjs --source-map "root='/js/bundle-login.js'" --output public/js/bundle-login.js
EXIT /b