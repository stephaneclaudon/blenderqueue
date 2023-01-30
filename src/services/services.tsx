import { BlenderExtractData } from "../data/BlenderExtractData";

export const GetBlenderFileInfo = async (blendFilePath: string) => {
    return new Promise<BlenderExtractData | any>(function (resolve, reject) {
        //If electron not started, return fake data
        try {
            //@ts-ignore
            window.api.invoke('BlenderExtract', { 'blendFile': blendFilePath })
                .then(function (res: BlenderExtractData) {
                    console.log(res);
                    resolve(res);
                })
                .catch(function (err: any) {
                    console.error(err);
                    reject(err);
                });
        } catch (error) {
            setTimeout(() => {
                let json: any = JSON.parse('{"scenes":[{"name": "Scene", "start": ' + Math.floor(Math.random() * 100) + ', "end": 250, "resolution_x": 1920, "resolution_y": 1080, "filepath": "/Volumes/DATA/RESSOURCES/_BLENDER SCRIPTS/BlednerExtract/", "file_format": "PNG", "color": "RGBA", "film_transparent": true}, {"name": "Scene.001", "start": 40, "end": 250, "resolution_x": 1920, "resolution_y": 1080, "filepath": "/tmp/", "file_format": "PNG", "color": "RGBA", "film_transparent": false}]}');
                let data: BlenderExtractData = Object.assign(new BlenderExtractData(), json);;
                resolve(data);
            }, 750);
        }
    });

}