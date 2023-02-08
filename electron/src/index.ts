import type { CapacitorElectronConfig } from '@capacitor-community/electron';
import { getCapacitorElectronConfig, setupElectronDeepLinking } from '@capacitor-community/electron';
import { MenuItemConstructorOptions, shell } from 'electron';
import { app, MenuItem, ipcMain } from 'electron';
import { exec, execFile, fork, spawn } from "child_process";

import electronIsDev from 'electron-is-dev';
import unhandled from 'electron-unhandled';
import { autoUpdater } from 'electron-updater';
import { join as pathJoin } from 'path';

import { ElectronCapacitorApp, setupContentSecurityPolicy, setupReloadWatcher } from './setup';
import { copyFile } from 'fs/promises';


import { BlenderQueueData, DataManager } from './data';

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
  //setupReloadWatcher(myCapacitorApp);
}
/*
// Run Application
(async () => {
  // Wait for electron app to be ready.
  await app.whenReady();
  // Security - Set Content-Security-Policy based on whether or not we are in dev mode.
  setupContentSecurityPolicy(myCapacitorApp.getCustomURLScheme());
  // Initialize our app, build windows, and load content.
  console.log("INITING APP--------------------");
  
  await myCapacitorApp.init();
  // Check for updates if we are in a packaged app.
  autoUpdater.checkForUpdatesAndNotify();
})();
*/

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

let dataManager = new DataManager();
dataManager.init().then((response:string) => {
  console.log(response);
  console.log("Data inited, lauching app...");
  // Run Application
  (async () => {
    // Wait for electron app to be ready.
    await app.whenReady();
    // Security - Set Content-Security-Policy based on whether or not we are in dev mode.
    setupContentSecurityPolicy(myCapacitorApp.getCustomURLScheme());
    // Initialize our app, build windows, and load content.
    console.log("INITING APP--------------------");

    await myCapacitorApp.init();
    // Check for updates if we are in a packaged app.
    autoUpdater.checkForUpdatesAndNotify();
  })();
}).catch(() => {
  console.log("Error initing data...");
});


const tmpFolderPath = pathJoin(app.getAppPath(), 'app', 'tmp');
const blenderExtractScriptsPath = pathJoin(app.getAppPath(), 'assets', 'blender', 'BlenderExtract.py');


ipcMain.handle('BlenderExtract', async (event, arg: Object) => {
  return new Promise(function (resolve, reject) {
    let outputData: string = "";
    const spawn = require('child_process').spawn;
    const scriptExecution = spawn("blender", ['-b', arg['blendFile'], '--python', blenderExtractScriptsPath]);
    scriptExecution.stdout.setEncoding('utf8');
    scriptExecution.stderr.setEncoding('utf8');

    scriptExecution.stdout.on('data', (stdout: any) => {
      outputData = outputData + stdout.toString();
    });

    scriptExecution.stderr.on('data', (stderr: any) => {
      reject(stderr.toString());
    });
    scriptExecution.on('error', function (error) {
      reject(error.toString());
    });

    scriptExecution.on('exit', (code: any) => {
      try {
        const regexpContent = /---blenderextract---(?<jsonData>(.|\n)*)---blenderextract---/;
        const match = outputData.match(regexpContent);
        const data = JSON.parse(match.groups.jsonData);

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
});

ipcMain.handle('SavePreview', async (event, arg: Object) => {
  return new Promise(function (resolve, reject) {
    let previewAbsolutePath = pathJoin(tmpFolderPath, 'renderPreview.png');
    let previewWebPath = pathJoin('tmp', 'renderPreview.png');
    try {
      copyFile(arg['filePath'], previewAbsolutePath).then(() => {
        resolve(previewWebPath);
      }).catch((error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
});

let renderProcesses = [];
ipcMain.handle('Render', async (event, arg: Object) => {
  let blenderBinary = dataManager.GetData().settings.blenderBinaryPath;

  console.log(blenderBinary, arg['args']);

  const child = spawn(blenderBinary, arg['args']);
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  child.stdout.on('data', function (data) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderUpdate', data.toString());
  });
  child.stderr.on('data', function (data) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderError', data.toString());
  });
  child.on('error', function (error) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderError', error);
  });
  child.on('close', function (code) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderClose', code);
  });
  child.on('exit', function (code) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderExit', code);
  });
  renderProcesses.push(child);
});

ipcMain.handle('PauseRender', async (event, arg: Object) => {
  for (const child of renderProcesses) {
    child.kill('SIGSTOP');
  }
});

ipcMain.handle('ResumeRender', async (event, arg: Object) => {
  for (const child of renderProcesses) {
    child.kill('SIGCONT');
  }
});

ipcMain.handle('StopRender', async (event, arg: Object) => {
  for (const child of renderProcesses) {
    child.kill();
  }
});




ipcMain.handle('ShowItemInFolder', async (event, filepath:string) => {
  console.log("Opening folder", filepath);
  
  return shell.showItemInFolder(filepath);
});

ipcMain.handle('GetData', async (event) => {
  return dataManager.GetData();
});

ipcMain.handle('SaveData', async (event, data: Object) => {
  return dataManager.SaveData(data as BlenderQueueData)
});


const onAppQuit = () => {
  for (const child of renderProcesses) {
    child.kill();
  }
};

app.on('will-quit', onAppQuit);
app.on('before-quit', onAppQuit);
