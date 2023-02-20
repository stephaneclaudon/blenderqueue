

let arg = {
  "blendPath": 'blender',
  "blendFile": '/Users/stephane/Documents/WORKSPACE/BlenderQueue/electron/assets/blender/BlenderExtract.blend',
  "script": '/Users/stephane/Documents/WORKSPACE/BlenderQueue/electron/assets/blender/BlenderExtract.py'
}


const BlenderExtract = async () => {
  return new Promise(function (resolve, reject) {
    let outputData = "";
    const spawn = require('child_process').spawn;
    const scriptExecution = spawn(arg['blendPath'], ['-b', arg['blendFile'], '--python', arg['script']]);
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

BlenderExtract().then((data) => {
  console.error(data);
}).catch((err) => {
  console.error(err);
});
