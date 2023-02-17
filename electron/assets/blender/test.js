const fs = require('fs');
fs.copyFileSync('/Users/stephane/Downloads/BlenderTest/0001.png', '/Users/stephane/Documents/WORKSPACE/BlenderQueue/electron/app/tmp/renderPreview.png');
fs.copyFileSync('/Users/stephane/Downloads/BlenderTest/0001.png', '/Users/stephane/Documents/WORKSPACE/BlenderQueue/electron/app/tmp/renderPreview.png');
fs.copyFileSync('/Users/stephane/Downloads/BlenderTest/0001.png', '/Users/stephane/Documents/WORKSPACE/BlenderQueue/electron/app/tmp/renderPreview.png');


/*
var spawn = require('child_process').spawn;
let command = "blender -b /Users/stephane/Documents/WORKSPACE/BlenderQueue/electron/app/blender/BlenderExtract/BlenderExtract.blend -a -S Scene -s 1 -e 250";

let scriptOutput = "";

  //console.log(arg['binary']);
  //console.log(arg['args']);
  let arg = {
    "binary": 'blender',
    "args": [
        '-b',
        '/Users/stephane/Documents/WORKSPACE/BlenderQueue/electron/app/blender/BlenderExtract/BlenderExtract.blend',
        '-a',
        '-S Scene',
        '-s 1',
        '-e 250'
      ]
  }
  let arguments = arg['args'].join(' ');
  
  const child = spawn(arg['binary'], arg['args']);
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', function (data) {
    console.log(data);
    data = data.toString();
    scriptOutput += data;
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', function (data) {
    //Here is where the error output goes
    //console.log('stderr: ' + data);
    data = data.toString();
    scriptOutput += data;
  });

  child.on('close', function (code) {
    //Here you can get the exit code of the script
    console.log('closing code: ' + code);
    console.log('Full output of script: ', scriptOutput);
  });

  return child;*/