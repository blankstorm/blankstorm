const fs = require('fs'),
	path = require('path'),
	mime = require('mime-types'),
	{ parseArgs } = require('node:util'),
	fsOptions = { recursive: true, force: true };

const { values, positionals } = parseArgs({
	options: {
		verbose: { type: 'boolean', short: 'v', default: false },
		inDir: { type: 'string', short: 'i', default: 'src' },
		outDir: { type: 'string', short: 'o', default: 'dist/web' },
	},
});

const options = {
	verbose: false,
	inDir: 'src',
	outDir: 'dist/web',
	...values
}

const outputLib = 'libraries',
	outputLibPath = options.outDir + '/' + outputLib;

const verboseLog = (...data) => {
	if (options.verbose) {
		console.log(...data);
	}
};

if (fs.existsSync(options.outDir)) {
	verboseLog('Removing old deployment...');
	fs.rmSync(options.outDir, fsOptions);
}

console.log('Copying...');
fs.cpSync(options.inDir, options.outDir, fsOptions);

console.log('Updating dependencies...');
if (!fs.existsSync(outputLibPath)) {
	fs.mkdirSync(outputLibPath);
}

const pathToPOSIX = path => path.replace(/[a-zA-Z]:/, '').replace(/\\/g, '/');

const updateFile = (rawInput, rawOutput) => {
	const input = pathToPOSIX(rawInput),
		output = pathToPOSIX(rawOutput),
		type = mime.lookup(input);
	verboseLog(`Updating file: ${input} (output: ${output})`);
	if (['text/html', 'application/html'].includes(type)) {
		console.log(`Processing ${input}`);
		const content = fs.readFileSync(input, { encoding: 'utf8' }).replaceAll(/[.\/]+node_modules\/([@._\w-]+)/gi, (match, depName) => {
			const oldPath = path.posix.resolve(path.posix.dirname(input), match),
				newPath = path.posix.resolve(path.posix.join(outputLibPath), depName);
			let newRelativePath = path.posix.relative(path.posix.dirname(output), newPath);
			if (!newRelativePath.startsWith('.')) {
				newRelativePath = './' + newRelativePath;
			}
			console.log(`Found dependency: ${depName} (in ${input})`);
			fs.cpSync(oldPath, newPath, fsOptions);
			return newRelativePath;
		});
		fs.writeFileSync(output, content);
	}
};

const updateDir = (rawInputDir, rawOutputDir) => {
	const inputDir = pathToPOSIX(rawInputDir),
		outputDir = pathToPOSIX(rawOutputDir);
	verboseLog(`Updating directory: ${inputDir} (output: ${outputDir})`);
	for (let fName of fs.readdirSync(inputDir)) {
		const input = path.posix.join(inputDir, fName),
			output = path.posix.join(outputDir, fName);
		const stats = fs.statSync(input);
		if (stats.isDirectory()) {
			updateDir(input, output);
		} else {
			updateFile(input, output);
		}
	}
};
updateDir(options.inDir, options.outDir);

console.log('Cleaning up...');

console.log('Done!');
