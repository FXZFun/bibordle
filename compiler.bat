@echo off
call google-closure-compiler C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\bibordle-practice.js --js_output_file C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\bibordle-practice.min.js
call google-closure-compiler C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\bibordle.js --js_output_file C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\bibordle.min.js
call google-closure-compiler C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\kjv.js --js_output_file C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\kjv.min.js
call google-closure-compiler C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\words.js --js_output_file C:\Users\rj\Documents\GitHub\bibordle\public\res\scripts\words.min.js
call csso C:\Users\rj\Documents\GitHub\bibordle\public\res\styles\main.css -o C:\Users\rj\Documents\GitHub\bibordle\public\res\styles\main.min.css