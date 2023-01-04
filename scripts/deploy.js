const
fs = require('fs'),
path = require('path'),
mime = require('mime-types'),
opts = { recursive: true, force: true },
inputDirPath = 'src',
outputDirPath = 'dist/web';

if(fs.existsSync(outputDirPath)){
	fs.rmSync(outputDirPath, opts);
}

console.log('Copying...');
fs.cpSync(inputDirPath, outputDirPath, opts);

console.log('Installing dependencies...');
const outputLibPath = path.join(outputDirPath, 'libraries');
if(!fs.existsSync(outputLibPath)){
	fs.mkdirSync(outputLibPath)
}
const _updateDir = (inputDir, outputDir) => {
	for(let fName of fs.readdirSync(inputDir)){
		const
		input = path.join(inputDir, fName),
		output = path.join(outputDir, fName);
		const stats = fs.statSync(input);
		if(stats.isFile()){
			const type = mime.lookup(input);
			console.log(`Processing ${input} `);
			if(['text/html', 'application/html', 'text/javascript', 'application/javascript'].includes(type)){
				const content = fs.readFileSync(input, { encoding: 'utf8' });
				const newContent = content.replaceAll(/[.\/]+node_modules\/([@._\w-]+)\/([/._\w-]+)/gi, (match, depName) => {
					const depFName = path.basename(match), wd = process.cwd();
					process.chdir(path.dirname(input));
					const oldPath = path.resolve(match);
					process.chdir(wd);
					fs.cpSync(oldPath, `${outputLibPath}/${depName}/${depFName}`);
					const newPath = `${outputLibPath}/${depName}/${depFName}`;
					console.log(`Found dependency: ${depName}: ${depFName} (in ${input})`);
					return newPath;
				});
				fs.writeFileSync(output, newContent);
			}
		}else if(stats.isDirectory()){
			_updateDir(input, output);
		}
		
	}	
}
_updateDir(inputDirPath, outputDirPath);

console.log('Cleaning up...');

console.log('Done!');