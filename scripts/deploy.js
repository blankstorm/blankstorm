const
fs = require('fs'),
path = require('path'),
mime = require('mime-types'),
opts = { recursive: true, force: true },
outputDirPath = 'dist/web';


if(fs.existsSync(outputDirPath)){
	fs.rmSync(outputDirPath, opts);
}

console.log('Copying...');
fs.cpSync('src', outputDirPath, opts);

console.log('Installing dependencies...');
const outputLibPath = path.join(outputDirPath, 'libraries');
if(!fs.existsSync(outputLibPath)){
	fs.mkdirSync(outputLibPath)
}
const _updateDir = dir => {
	for(let fName of fs.readdirSync(dir)){
		const fPath = path.join(dir, fName);
		const stats = fs.statSync(fPath);
		if(stats.isFile()){
			const type = mime.lookup(fPath);
			console.log(`Processing ${fPath} `);
			if(['text/html', 'application/html', 'text/javascript', 'application/javascript'].includes(type)){
				const content = fs.readFileSync(fPath, { encoding: 'utf8' });
				const newContent = content.replaceAll(/\.\.\/node_modules\/([._\w-]+)\/([/._\w-]+)/g, (match, depName) => {
					const depFName = path.basename(match);
					fs.cpSync(match.slice(1), `${outputLibPath}/${depName}/${depFName}`);
					const newPath = `libraries/${depName}/${depFName}`;
					console.log(`Found dependency: ${depName} (in ${fPath})`);
					return newPath;
				});
				fs.writeFileSync(fPath, newContent);
			}
		}else if(stats.isDirectory()){
			_updateDir(fPath);
		}
		
	}	
}
_updateDir(outputDirPath);

console.log('Cleaning up...');

console.log('Done!');