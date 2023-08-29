import os
import bpy

dirname = os.path.dirname(__file__)
cwd = os.getcwd()
os.chdir(dirname)
for filename in os.listdir(dirname):
	try:
		if not filename.endswith('.blend'):
			continue
		filename = os.path.splitext(filename)[0]
		path = os.path.join(dirname, filename)
		print('Exporting: ' + filename)
		bpy.ops.wm.open_mainfile(filepath=path + '.blend')
		with bpy.context.copy():
			bpy.context.active_object = None
			bpy.ops.export_scene.gltf(filepath=path + '.glb', export_copyright='Dr. Vortex', export_apply=True)
	except Exception as e:
		print(e)
		continue
os.chdir(cwd)
bpy.ops.wm.quit_blender()