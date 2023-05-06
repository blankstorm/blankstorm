import $ from 'jquery';

export const web = url => `https://blankstorm.drvortex.dev/` + url,
	upload = (type, multiple = false) =>
		new Promise(res =>
			$(`<input type=file ${type ? `accept='${type}'` : ''} ${multiple ? 'multiple' : ''}>`)
				.change(e => res([...e.target.files]))[0]
				.click()
		),
	download = (data, name) => $(`<a href=${URL.createObjectURL(new Blob([data]))} download="${name ?? 'download'}"></a>`)[0].click();

export const minimize = Intl.NumberFormat('en', { notation: 'compact' }).format;

/* eslint-disable no-redeclare */
export const alert = message =>
	new Promise(resolve => {
		$('#alert .message').text(message);
		$('#alert .ok').on('click', () => {
			$('#alert')[0].close();
			resolve(true);
		});
		$('#alert')[0].showModal();
	});
export const confirm = message =>
	new Promise(resolve => {
		$('#confirm .message').text(message);
		$('#confirm .ok').on('click', () => {
			$('#confirm')[0].close();
			resolve(true);
		});
		$('#confirm .cancel').on('click', () => {
			$('#confirm')[0].close();
			resolve(false);
		});
		$('#confirm')[0].showModal();
	});

export function getByString(object, path, seperator = /[.[\]'"]/) {
	return path
		.split(seperator)
		.filter(p => p)
		.reduce((o, p) => (o ? o[p] : null), this);
}
export function setByString(object, path, value, seperator = /[.[\]'"]/) {
	return path
		.split(seperator)
		.filter(p => p)
		.reduce((o, p, i) => (o[p] = path.split(seperator).filter(p => p).length === ++i ? value : o[p] || {}), this);
}
