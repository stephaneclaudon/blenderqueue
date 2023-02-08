import bpy
import json

class Data(object):
    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=False, indent=4)

data = Data()
data.scenes = []

for scene in bpy.data.scenes:
    sceneData = {
        "name": scene.name,
        "start": bpy.data.scenes[scene.name].frame_start,
        "end": bpy.data.scenes[scene.name].frame_end,
        "resolution_x": bpy.data.scenes[scene.name].render.resolution_x,
        "resolution_y": bpy.data.scenes[scene.name].render.resolution_y,
        "filepath": bpy.data.scenes[scene.name].render.filepath,
        "file_format": bpy.data.scenes[scene.name].render.image_settings.file_format,
        "color": bpy.data.scenes[scene.name].render.image_settings.color_mode,
        "film_transparent": bpy.data.scenes[scene.name].render.film_transparent,
        "engine": bpy.data.scenes[scene.name].render.engine
        
    }
    data.scenes.append(sceneData)


print('---blenderextract---')
print(data.toJSON())
print('---blenderextract---')
