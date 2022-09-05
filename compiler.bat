@echo off
call google-closure-compiler C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\bibordle-unlimited.js --js_output_file C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\bibordle-unlimited.min.js
call google-closure-compiler C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\bibordle.js --js_output_file C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\bibordle.min.js
call csso C:\Users\rj\Documents\GitHub\bibordle\public\res\styles\main.css -o C:\Users\rj\Documents\GitHub\bibordle\public\res\styles\main.min.css