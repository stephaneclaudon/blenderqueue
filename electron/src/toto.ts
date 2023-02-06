
import Store from 'electron-store';
import os from 'os';
import commandExists from 'command-exists-promise';
export const isMac = os.platform() === "darwin";
export const isWindows = os.platform() === "win32";
export const isLinux = os.platform() === "linux";



export const OSX_DEFAULT_BLENDER_PATH = "/Applications/Blender.app/Contents/MacOS/Blender";
export const WINDOWS_DEFAULT_BLENDER_PATH = "C:\Program Files\Blender Foundation\Blender\blender.exe";
export const LINUX_DEFAULT_BLENDER_PATH = "blender";



export class toto {
    constructor(){
        console.log("yoyo");
        
    }
}