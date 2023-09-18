import sys
import os
import argparse
import bpy

dirname = os.path.dirname(__file__)
parser = argparse.ArgumentParser()
parser.add_argument('-i', '--input', help='input directory', default=dirname)
parser.add_argument('-o', '--output', help='output directory', default=dirname)
parser.add_argument('-v', '--verbose', help='verbose logs', action='store_true')
args = None
try:
	index = sys.argv.index('--')
	_args = sys.argv[index+1:] # the list after '--'
	args = parser.parse_args(_args)
except ValueError as e: # '--' not in the list:
	print('Incorrect parameters')
	exit()

cwd = os.getcwd()
os.chdir(args.input)
if args.verbose:
	print('Exporting from: ' + args.input)
for filename in os.listdir(args.input):
	if args.verbose:
		print('Checking: ' + filename)
	try:
		if not filename.endswith('.blend'):
			continue
		filename = os.path.splitext(filename)[0]
		if not os.path.exists(args.output):
			os.makedirs(args.output)
		print('Exporting: ' + filename)
		bpy.ops.wm.read_factory_settings(use_empty=True)
		bpy.ops.wm.open_mainfile(filepath=os.path.join(args.input, filename) + '.blend')
		for window in bpy.context.window_manager.windows:
			with bpy.context.temp_override(window=window):
				for scene in bpy.data.scenes:
					bpy.context.window.scene = scene
					bpy.ops.export_scene.gltf(filepath=args.output + '/' + scene.name + '.glb', export_copyright='Dr. Vortex', export_apply=True)
	except Exception as e:
		print('Failed to export: ' + str(e))
		continue
os.chdir(cwd)
bpy.ops.wm.quit_blender()