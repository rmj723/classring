# Blender Python Script

```python
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

with open('/home/flaaudwls/Documents/data.txt', "w") as f:
    json.dump(result, f)

with open('/home/flaaudwls/Documents/data.txt', 'r+') as f:
        content = f.read()
        f.seek(0, 0)
        f.write('export const data=' + content)
```

# Blender Create Characters

1. Duplicate characters of the left to the right side.

- select characters in the left side
- `Shift + D` for duplicating them
- `Local -> Global`, `Individual Origins -> 3D Cursor`
- `Ctrl + M` for mirror
- `X` for selecting mirror axis
- `Global -> Local` `3D Cursor -> Individual Origins`
- `S` for scale, `X` for axis, `-1` for scale value

# Ring34-35

- Top: 3D Text
- Left: CanvasText, Image Graph
- Right: CanvasText, Image Graph
- Inside Text: CanvasText

# Ring36

- Top: 3D Text
- Left: CanvasText Downward, No Graph
- Right: CanvasText Downward, No Graph
- Inside Text: CanvasText

* added DracoLoader & threejs 124 version bump

# Ring37

- Left: CanvasText Downward, No Graph
- Right: CanvasText Downward, No Graph
- Inside Text: CanvasText

# From Ring 60 61

Using Blender Modifier
Array: 42 Points: Check Constant Offset
Curve: PathCurve.
