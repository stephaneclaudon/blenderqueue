import type { CapacitorElectronConfig } from '@capacitor-community/electron';
import { getCapacitorElectronConfig, setupElectronDeepLinking } from '@capacitor-community/electron';
import { dialog, MenuItemConstructorOptions, shell } from 'electron';
import { app, MenuItem, ipcMain } from 'electron';
import { exec, execFile, fork, spawn } from "child_process";
import fs from "fs";

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
let settingsError = "";
let dataManager = new DataManager();
dataManager.init().then((response: string) => {
  console.log(response);
  console.log("Data inited, lauching app...");

}).catch((message: string) => {
  settingsError = message;
  console.log(settingsError);
}).finally(() => {
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


    setTimeout(() => {
      if (settingsError != "") {
        console.log("blenderExecutablePathError...");
        myCapacitorApp.getMainWindow().webContents.send('blenderExecutablePathError', settingsError);
      }
    }, 2000);

  })();
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


let saveProgressInfosInterval;
let renderProcesses = [];
let renderOutput = "";
ipcMain.handle('Render', async (event, arg: Object) => {
  renderOutput = "";
  let blenderBinary = dataManager.data.settings.blenderBinaryPath;

  console.log(blenderBinary, arg['args']);

  const child = spawn(blenderBinary, arg['args']);
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  child.stdout.on('data', function (data) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderUpdate', data.toString());
    renderOutput += data.toString();
  });
  child.stderr.on('data', function (data) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderError', data.toString());
  });
  child.on('error', function (error) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderError', error.toString());
  });
  child.on('close', function (code) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderClose', code);
    stopSavingProgressInfos();
  });
  child.on('exit', function (code) {
    myCapacitorApp.getMainWindow().webContents.send('onRenderExit', code);
    stopSavingProgressInfos();
  });
  renderProcesses.push(child);

  startSavingProgressInfos();
});

ipcMain.handle('PauseRender', async (event, arg: Object) => {
  for (const child of renderProcesses) {
    child.kill('SIGSTOP');
  }
  stopSavingProgressInfos();
});

ipcMain.handle('ResumeRender', async (event, arg: Object) => {
  for (const child of renderProcesses) {
    child.kill('SIGCONT');
  }
  startSavingProgressInfos();
});

ipcMain.handle('StopRender', async (event, arg: Object) => {
  for (const child of renderProcesses) {
    child.kill();
  }
  stopSavingProgressInfos();
});




ipcMain.handle('ShowOpenDialog', async (event, filepath: string) => {
  return dialog.showOpenDialog(myCapacitorApp.getMainWindow(), { properties: ['openDirectory'] })
});

ipcMain.handle('ShowItemInFolder', async (event, filepath: string) => {
  return shell.showItemInFolder(filepath);
});

ipcMain.handle('GetData', async (event) => {
  return dataManager.GetData();
});

ipcMain.handle('SaveData', async (event, data: Object) => {
  console.log("Index::SaveData()", data);
  return dataManager.SaveData(data as BlenderQueueData)
});

let count = 0;
const startSavingProgressInfos = () => {
  if ((dataManager.data.settings.saveProgressInfosGUI || dataManager.data.settings.saveProgressInfosTxt) && dataManager.data.settings.saveProgressInfosPath != '') {
    saveProgressInfosInterval = setInterval(() => {
      if (dataManager.data.settings.saveProgressInfosGUI) {
        try {
          myCapacitorApp.getMainWindow().webContents.capturePage().then(image => {
            fs.writeFile(pathJoin(dataManager.data.settings.saveProgressInfosPath, '_Blender Queue -- Progress.png'), image.toPNG(), (err) => {
              if (err) throw err
            })
          });
        }
        catch (e) { console.error('Failed to capture screen'); console.log(e); }
      }


      if (dataManager.data.settings.saveProgressInfosTxt) {
        try { fs.writeFileSync(pathJoin(dataManager.data.settings.saveProgressInfosPath, '_Blender Queue -- log.txt'), renderOutput, 'utf-8'); }
        catch (e) { console.error('Failed to save log file !'); console.log(e); }
      }

    }, 60000); //Save progress each minutes
  }
};

const stopSavingProgressInfos = () => {
  clearInterval(saveProgressInfosInterval);
};

const onAppQuit = () => {
  for (const child of renderProcesses) {
    child.kill();
  }
  stopSavingProgressInfos();
};

app.on('will-quit', onAppQuit);
app.on('before-quit', onAppQuit);
