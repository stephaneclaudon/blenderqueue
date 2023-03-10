import type { CapacitorElectronConfig } from '@capacitor-community/electron';
import { getCapacitorElectronConfig, setupElectronDeepLinking } from '@capacitor-community/electron';
import { dialog, MenuItemConstructorOptions, shell } from 'electron';
import { app, MenuItem, ipcMain } from 'electron';
import { execSync, spawn } from "child_process";
import suspend from "psuspend";

import fs from "fs";
import os, { platform } from 'os';

import electronIsDev from 'electron-is-dev';
import unhandled from 'electron-unhandled';
import { autoUpdater, UpdateCheckResult, UpdateInfo } from 'electron-updater';
import path from 'path';

import { ElectronCapacitorApp, setupContentSecurityPolicy, setupReloadWatcher } from './setup';
import { copyFile } from 'fs/promises';


import { BlenderQueueData, DataManager } from './data';

export const isMac = os.platform() === "darwin";
export const isWindows = os.platform() === "win32";
export const isLinux = os.platform() === "linux";


// Graceful handling of unhandled errors.
unhandled();

// Define our menu templates (these are optional)
const trayMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [new MenuItem({ label: 'Quit App', role: 'quit' })];
const appMenuBarMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [
  { role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu' },
  { role: 'viewMenu' },
  {
    label: "Edit",
    submenu: [
      {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        role: "cut"
      },
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        role: "copy"
      },
      {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        role: "paste"
      }
    ]
  }
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

    // Since the app is unsigned, autoupdate won't work so we ask to update manually
    if (isMac) {
      autoUpdater.on('update-available', (infos: UpdateInfo) => {
        dialog.showMessageBox({
          type: 'info',
          buttons: ['Yes', 'No'],
          cancelId: 1,
          defaultId: 0,
          title: 'Update available !',
          message: 'A new version (' + infos.version + ') is available, would you like to get it ?'
        }).then(({ response }) => {
          if (!response)
            execSync('open https://github.com/stephaneclaudon/blenderqueue/releases/tag/v' + infos.version);
        });
      });
    }

    if (settingsError != "") {
      myCapacitorApp.getMainWindow().webContents.on('did-finish-load', () => {
        console.log("blenderExecutablePathError...");
        myCapacitorApp.getMainWindow().webContents.send('blenderExecutablePathError', settingsError);
      });
    }


    myCapacitorApp.getMainWindow().on('close', e => {
      e.preventDefault();
      if (rendering) {
        dialog.showMessageBox({
          type: 'info',
          buttons: ['Yes', 'No'],
          cancelId: 1,
          defaultId: 0,
          title: 'Warning',
          message: 'Still rendering, stop all jobs and quit ?'
        }).then(({ response, checkboxChecked }) => {
          if (!response)
            quitApp();

        });
      } else
        quitApp();
    });

    // Check for updates if we are in a packaged app.
    autoUpdater.checkForUpdatesAndNotify().catch(() => {
      console.error("ERROR : Check for update failed");
    });
  })();
});



const resourcePath = app.isPackaged
  ? process.resourcesPath
  : app.getAppPath();
const blenderExtractScriptsPath = path.join(resourcePath, 'assets', 'blender', 'BlenderExtract.py');

ipcMain.handle('BlenderExtract', async (event, arg: Object) => {
  let blenderBinary = dataManager.data.settings.blenderBinaryPath;
  return new Promise(function (resolve, reject) {
    let outputData: string = "";
    console.log("------ BlenderExtract -----");
    console.log(blenderBinary);
    console.log([
      '-b',
      arg['blendFile'],
      '--python',
      blenderExtractScriptsPath
    ]);

    const spawn = require('child_process').spawn;
    const scriptExecution = spawn(blenderBinary,
      [
        '-b',
        arg['blendFile'],
        '--python',
        blenderExtractScriptsPath
      ]
    );
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
        const regexpContent = /---blenderextract---(?<jsonData>(.|\n|\r)*)---blenderextract---/;
        console.log(outputData);

        const match = outputData.match(regexpContent);
        const data = JSON.parse(match.groups.jsonData);

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
});

ipcMain.handle('GetPreview', async (event, arg: Object) => {
  const buf = await fs.promises.readFile(arg['filePath']);
  const dataBase64 = Buffer.from(buf).toString('base64');
  return dataBase64;
});

let rendering = false;
let saveProgressInfosInterval;
let renderProcesses = [];
let renderOutput = "";
let renderArgs;
ipcMain.handle('Render', async (event, arg: Object) => {
  rendering = true;
  renderOutput = "";
  renderArgs = arg;
  let blenderBinary = dataManager.data.settings.blenderBinaryPath;

  console.log("------- START RENDER --------");
  console.log(blenderBinary, arg['args']);

  const child = spawn(
    blenderBinary,
    arg['args']
  );

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  child.stdout.on('data', function (data) {
    myCapacitorApp.getMainWindow()?.webContents.send('onRenderUpdate', data.toString());
    renderOutput += data.toString();
  });
  child.stderr.on('data', function (data) {
    myCapacitorApp.getMainWindow()?.webContents.send('onRenderError', data.toString());
  });
  child.on('error', function (error) {
    myCapacitorApp.getMainWindow()?.webContents.send('onRenderError', error.toString());
  });
  child.on('close', function (code) {
    myCapacitorApp.getMainWindow()?.webContents.send('onRenderClose', code);
    saveProgressInfos();
    stopSavingProgressInfos();
    rendering = false;
  });
  child.on('exit', function (code) {
    myCapacitorApp.getMainWindow()?.webContents.send('onRenderExit', code);
    saveProgressInfos();
    stopSavingProgressInfos();
    rendering = false;
  });

  renderProcesses.push(child);
  startSavingProgressInfos();
});

ipcMain.handle('PauseRender', async (event, arg: Object) => {
  for (const child of renderProcesses) {
    if (isWindows)
      suspend(child.pid);
    else
      child.kill('SIGSTOP');
  }
  stopSavingProgressInfos();
});

ipcMain.handle('ResumeRender', async (event, arg: Object) => {
  for (const child of renderProcesses) {
    if (isWindows)
      suspend(child.pid, false);
    else
      child.kill('SIGCONT');
  }
  startSavingProgressInfos();
});

ipcMain.handle('StopRender', async (event, arg: Object) => {
  for (const child of renderProcesses) {
    child.stdout.destroy();
    child.stderr.destroy();
    child.kill('SIGKILL');
  }
  stopSavingProgressInfos();
});

ipcMain.handle('SetProgress', async (event, progress: number) => {
  myCapacitorApp.getMainWindow().setProgressBar(progress);
});

ipcMain.handle('OpenExternal', async (event, url: string) => {
  return dialog.showOpenDialog(myCapacitorApp.getMainWindow(), { properties: ['openDirectory'] })
});

ipcMain.handle('ShowOpenDialog', async (event, filepath: string) => {
  return dialog.showOpenDialog(myCapacitorApp.getMainWindow(), { properties: ['openDirectory'] })
});

ipcMain.handle('ShowSaveDialog', async (event, filepath: string) => {
  return dialog.showSaveDialog(myCapacitorApp.getMainWindow(), { defaultPath: filepath, properties: ['createDirectory'] })
});

ipcMain.handle('CheckOutputFolder', async (event, filepath: string) => {
  filepath = path.normalize(filepath);
  let isAFolder = (filepath.charAt(filepath.length - 1) === path.sep);

  if (!isAFolder)
    filepath = path.dirname(filepath);

  return fs.existsSync(filepath);
});

ipcMain.handle('ShowItemInFolder', async (event, filepath: string) => {
  let folder = path.normalize(filepath);
  try {
    if (!fs.statSync(folder).isDirectory()) {
      folder = path.dirname(folder);
    } else {
      return null;
    }
  } catch (err) {
    folder = path.dirname(folder);
  }

  return shell.showItemInFolder(folder);
});

ipcMain.handle('GetData', async (event) => {
  return dataManager.GetData();
});

ipcMain.handle('SaveData', async (event, data: Object) => {
  console.log("Index::SaveData()");
  return dataManager.SaveData(data as BlenderQueueData);
});

ipcMain.handle('QuitApp', async (event) => {
  console.log("Index::QuitApp()");
  myCapacitorApp.getMainWindow().close();
});

const startSavingProgressInfos = () => {
  console.log("startSavingProgressInfos()", dataManager.data.settings);

  if ((dataManager.data.settings.saveProgressInfosGUI || dataManager.data.settings.saveProgressInfosTxt) && dataManager.data.settings.saveProgressInfosPath != '') {
    setTimeout(() => saveProgressInfos(), 2000);
    if (!saveProgressInfosInterval) {
      saveProgressInfosInterval = setInterval(() => saveProgressInfos(), 60000);
    }
  } else
    stopSavingProgressInfos();
};

const stopSavingProgressInfos = () => {
  clearInterval(saveProgressInfosInterval);
  saveProgressInfosInterval = undefined;
};

const saveProgressInfos = () => {
  if (dataManager.data.settings.saveProgressInfosGUI) {
    try {
      myCapacitorApp.getMainWindow().webContents.capturePage().then(image => {
        fs.writeFile(path.join(dataManager.data.settings.saveProgressInfosPath, '_Blender Progress.png'), image.toPNG(), (err) => {
          if (err) throw err
        })
      });
    }
    catch (e) { console.error('Failed to capture screen'); console.log(e); }
  }

  if (dataManager.data.settings.saveProgressInfosTxt) {
    try { fs.writeFileSync(path.join(dataManager.data.settings.saveProgressInfosPath, renderArgs['logFileName']), renderOutput, 'utf-8'); }
    catch (e) { console.error('Failed to save log file !'); console.log(e); }
  }
};

const quitApp = () => {
  for (const child of renderProcesses) {
    child.stdout.destroy();
    child.stderr.destroy();
    child.kill('SIGKILL');
  }
  stopSavingProgressInfos();
  myCapacitorApp.getMainWindow().destroy();
  app.quit();
};
