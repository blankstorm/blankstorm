const fs = require('fs'),
	path = require('path'),
	mime = require('mime-types'),
	opts = { recursive: true, force: true },
	inputDirPath = 'src',
	outputDirPath = 'dist/web'
	outputLibPath = path.join(outputDirPath, 'libraries');

if (fs.existsSync(outputDirPath)) {
	fs.rmSync(outputDirPath, opts);
}

console.log('Copying...');
fs.cpSync(inputDirPath, outputDirPath, opts);

console.log('Updating dependencies...');
if (!fs.existsSync(outputLibPath)) {
	fs.mkdirSync(outputLibPath);
}

const pathToPOSIX = (path) => path.replace(/[a-zA-Z]:/, '').replace(/\\/g, '/');

const updateFile = (rawInput, rawOutput) => {
	const
		input = pathToPOSIX(rawInput),
		output = pathToPOSIX(rawOutput),
		type = mime.lookup(input);
	if (['text/html', 'application/html'].includes(type)) {
		console.log(`Processing ${input}`);
		const content = fs.readFileSync(input, { encoding: 'utf8' })
		.replaceAll(/[.\/]+node_modules\/([@._\w-]+)\//gi, (match, depName) => {
			const
				oldPath = `${pathToPOSIX(path.resolve(path.dirname(rawInput), match))}/`,
				newPath = `${outputLibPath}/${depName}/`;
				console.log(`Found dependency: ${depName} (in ${input})`);
			fs.cpSync(oldPath, newPath, opts);
			return newPath;
		});
		fs.writeFileSync(output, content);
	}
};

const updateDir = (inputDir, outputDir) => {
	for (let fName of fs.readdirSync(inputDir)) {
		const input = path.join(inputDir, fName),
			output = path.join(outputDir, fName);
		const stats = fs.statSync(input);
		if (stats.isDirectory()) {
			updateDir(input, output);
		}else{
			updateFile(input, output);
		}
	}
};
updateDir(inputDirPath, outputDirPath);

console.log('Cleaning up...');

console.log('Done!');
