import os
import bpy

dirname = os.path.dirname(__file__)
cwd = os.getcwd()
os.chdir(dirname)
for filename in os.listdir(dirname):
	if not filename.endswith('.blend'):
		continue
	filename = os.path.basename(filename)
	path = os.path.join(dirname, filename) + 'glb'
	print('Exporting: ' + filename)
	bpy.ops.wm.open_mainfile(filepath=path)
	bpy.ops.export_scene.gltf(filepath=path, export_copyright='Dr. Vortex', export_apply=True)
os.chdir(cwd)