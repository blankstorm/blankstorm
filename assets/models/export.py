import os
import bpy

dirname = os.path.dirname(__file__)
cwd = os.getcwd()
os.chdir(dirname)
for filename in os.listdir(dirname):
	if not filename.endswith('.blend'):
		continue
	filename = os.path.basename(filename)
	path = os.path.join(dirname, filename)
	for obj in bpy.data.objects:
        if bpy.data.objects[obj.name].type != 'MESH':
	print('Exporting: ' + filename + )
	bpy.ops.export_scene.gltf(filepath=path, export_copyright='Dr. Vortex')
os.chdir(cwd)