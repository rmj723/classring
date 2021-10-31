import bpy
import json
objects = bpy.context.selected_objects
result = {} 
for item in bpy.context.selected_objects:
    result[item.name]  ={
        "position": [ round(item.location.x,2),  round(item.location.z,2), -round(item.location.y,2)],
        "scale": [ round(item.scale.x,2), round(item.scale.z,2), round(item.scale.y,2) ],
        "rotation": [ round(item.rotation_euler.x,2), round(item.rotation_euler.z,2), round(item.rotation_euler.y,2) ]
    }
    
with open('D:\data.txt', "w") as f:
    json.dump(result, f)

with open('D:\data.txt', 'r+') as f:
        content = f.read()
        f.seek(0, 0)
        f.write('export const data=' + content)