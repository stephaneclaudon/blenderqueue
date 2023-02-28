
var spawn = require("child_process").spawn;
var path = require("path");
var fs = require("fs");


let arg = {
  "blendPath": '/Applications/Blender.app/Contents/MacOS/Blender',
  "blendFile": '/Users/stephane/Documents/WORKSPACE/BlenderQueue/electron/assets/blender/BlenderExtract.blend',
  "script": '/Users/stephane/Documents/WORKSPACE/BlenderQueue/electron/assets/blender/BlenderExtract.py'
}

const BlenderExtract = async () => {
  return new Promise(function (resolve, reject) {
    let outputData = "";
    const spawn = require('child_process').spawn;
    //const scriptExecution = spawn(arg['blendPath'], ['-b', arg['blendFile'], '--python', arg['script']]);
    const scriptExecution = spawn(arg['blendPath'], ['-b', arg['blendFile'], '-a']);
    scriptExecution.stdout.setEncoding('utf8');
    scriptExecution.stderr.setEncoding('utf8');

    scriptExecution.stdout.on('data', (stdout) => {
      console.log("received data", stdout);
      outputData = outputData + stdout.toString();
    });

    scriptExecution.stderr.on('data', (stderr) => {
      reject(stderr.toString());
    });
    scriptExecution.on('error', function (error) {
      reject(error.toString());
    });

    scriptExecution.on('exit', (code) => {
      try {
        const regexpContent = /---blenderextract---(?<jsonData>(.|\n)*)---blenderextract---/;

        console.log("All data", outputData);
        const match = outputData.match(regexpContent);
        console.log("Matches", match);
        const data = JSON.parse(match.groups.jsonData);

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
};
let renderOutput = "";
const Render = async () => {
  return new Promise(function (resolve, reject) {
    const child = spawn(arg['blendPath'], 
    [
      '-b',
      '/Users/stephane/Dropbox/Kinetic_movie/Blender/dirigeable.blend',
      '-a'
    ],
    {
      shell: true
    });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', function (data) {
      renderOutput += data.toString();
      //console.log(data.toString());
    });
    child.stderr.on('data', function (data) {
      console.error(data);
    });
    child.on('error', function (error) {
      console.error(data);
    });
    child.on('close', function (code) {
      console.log("All data", renderOutput);
    });
    child.on('exit', function (code) {
      console.log("All data", renderOutput);
    });

    console.log(child);
  });
};


const CheckOutputFolder = (filepath) => {
  filepath = path.normalize(filepath);
  let isAFolder = (filepath.charAt(filepath.length - 1) === path.sep);

  console.log("Checking", filepath.charAt(filepath.length - 1), path.sep);
  if (!isAFolder)
    filepath = path.dirname(filepath);

  console.log(filepath);
  return fs.existsSync(filepath);
};



console.log(CheckOutputFolder('/Users/stephane/Dropbox/Kinetic_movie/Blender/2_Output/Film-1/mama/'));
/*
Render().then((data) => {
  console.error(data);
}).catch((err) => {
  console.error(err);
});

BlenderExtract().then((data) => {
  console.error(data);
}).catch((err) => {
  console.error(err);
});
*/