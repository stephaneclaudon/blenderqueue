import type { CapacitorElectronConfig } from '@capacitor-community/electron';
import { getCapacitorElectronConfig, setupElectronDeepLinking } from '@capacitor-community/electron';
import type { MenuItemConstructorOptions } from 'electron';
import { app, MenuItem, ipcMain } from 'electron';
import { exec, execFile, fork, spawn } from "child_process";

import electronIsDev from 'electron-is-dev';
import unhandled from 'electron-unhandled';
import { autoUpdater } from 'electron-updater';
import { join } from 'path';

import { ElectronCapacitorApp, setupContentSecurityPolicy, setupReloadWatcher } from './setup';

// Graceful handling of unhandled errors.
unhandled();

// Define our menu templates (these are optional)
const trayMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [new MenuItem({ label: 'Quit App', role: 'quit' })];
const appMenuBarMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [
  { role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu' },
  { role: 'viewMenu' },
];

// Get Config options from capacitor.config
const capacitorFileConfig: CapacitorElectronConfig = getCapacitorElectronConfig();

// Initialize our app. You can pass menu templates into the app here.
// const myCapacitorApp = new ElectronCapacitorApp(capacitorFileConfig);
const myCapacitorApp = new ElectronCapacitorApp(capacitorFileConfig, trayMenuTemplate, appMenuBarMenuTemplate);

// If deeplinking is enabled then we will set it up here.
if (capacitorFileConfig.electron?.deepLinkingEnabled) {
  setupElectronDeepLinking(myCapacitorApp, {
    customProtocol: capacitorFileConfig.electron.deepLinkingCustomProtocol ?? 'mycapacitorapp',
  });
}

// If we are in Dev mode, use the file watcher components.
if (electronIsDev) {
  setupReloadWatcher(myCapacitorApp);
}

// Run Application
(async () => {
  // Wait for electron app to be ready.
  await app.whenReady();
  // Security - Set Content-Security-Policy based on whether or not we are in dev mode.
  setupContentSecurityPolicy(myCapacitorApp.getCustomURLScheme());
  // Initialize our app, build windows, and load content.
  await myCapacitorApp.init();
  // Check for updates if we are in a packaged app.
  autoUpdater.checkForUpdatesAndNotify();
})();

// Handle when all of our windows are close (platforms have their own expectations).
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// When the dock icon is clicked.
app.on('activate', async function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (myCapacitorApp.getMainWindow().isDestroyed()) {
    await myCapacitorApp.init();
  }
});

// Place all ipc or other electron api calls and custom functionality under this line


const blenderScriptsPath = join(app.getAppPath(), 'app', 'blender');
const blenderExtractScriptsPath = join(app.getAppPath(), 'app', 'blender', 'BlenderExtract', 'BlenderExtract.py');


ipcMain.handle('BlenderExtract', async (event, arg: Object) => {
  return new Promise(function (resolve, reject) {


    let command = "blender -b '" + arg['blendFile'] + "' --python '" + blenderExtractScriptsPath + "'";

    const execProcess = exec(command, { 'encoding': 'utf8' }, (error, stdout) => {
      if (error)
        reject("Error extracting data from blend file...");
      else {
        let output = stdout;
        console.log(output);

        const regexpContent = /---blenderextract---(?<jsonData>(.|\n)*)---blenderextract---/;
        const match = output.match(regexpContent);
        const data = JSON.parse(match.groups.jsonData);

        resolve(data);
      }
    });
  });
});

ipcMain.handle('Render', (event, arg: Object) => {
  let scriptOutput = "";

  console.log(arg['binary']);
  console.log(arg['args']);
  
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

  return child;
});



/*

console.log("---------------");

function execSample(args: string) {
  const execProcess = exec(args, { 'encoding': 'utf8' }, (error, stdout) => {
    if (error)
      console.log("ERROOOR");

    else {
      //console.log(`exec stdout: ${stdout} error: ${error}`);
      let output = stdout;
        console.log(output);

        const regexpContent = /---blenderextract---(?<jsonData>(.|\n)*)---blenderextract---/;
        const match = output.match(regexpContent);
        console.log(JSON.parse(match.groups.jsonData));
    }
  });
 console.log('exec spawn');
  console.log(execProcess.spawnfile);
  execProcess.on('spawn', () => {
    console.log('exec on spawn');
  });
  execProcess.on('error', (err) => {
    console.log(`exec on error:${err}`);
  });
  execProcess.on('exit', (code, signal) => {
    console.log(`exec on exit code: ${code} signal: ${signal}`);
  });
  execProcess.on('close', (code: number, args: any[]) => {
    console.log(`exec on close code: ${code} args: ${args}`);
  });
}
execSample("blender -b '/Volumes/DATA/RESSOURCES/_BLENDER SCRIPTS/BlednerExtract/BlenderExtract.blend'  --python '/Volumes/DATA/RESSOURCES/_BLENDER SCRIPTS/BlednerExtract/BlenderExtract.py'");
console.log("----------------------");
*/