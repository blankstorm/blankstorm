import 'jquery'; /* global $ */

export const web = url => `https://blankstorm.drvortex.dev/` + url,
	upload = (type, multiple = false) =>
		new Promise(res =>
			$(`<input type=file ${type ? `accept='${type}'` : ''} ${multiple ? 'multiple' : ''}>`)
				.change(e => res([...e.target.files]))[0]
				.click()
		),
	download = (data, name) => $(`<a href=${URL.createObjectURL(new Blob([data]))} download="${name ?? 'download'}"></a>`)[0].click(),
	minimize = Intl.NumberFormat('en', { notation: 'compact' }).format;

/*eslint no-redeclare: "off"*/
export const modal = (input = 'Are you sure?', options = { Cancel: false, Ok: true }) =>
		new Promise(res => {
			$('#modal input').remove();
			if (input instanceof Array) {
				$('#modal').attr('plot', `0,0,350px,${6 + 2 * input.length}em`);
				$('#modal p.info').attr('plot', `c,c-${2 * input.length}em,300px,1em,a`);
				input.forEach(data => {
					$('<input><br>').attr(data).appendTo('#modal');
				});
			} else {
				$('#modal').attr('plot', '0,0,350px,8em');
				$('#modal p.info').attr('plot', 'c,c-2em,300px,1em,a').text(input);
			}

			$('#modal')[0].showModal();
			Object.entries(options).forEach(([displayText, result], i, a) => {
				$(`<button></button>`)
					.attr('plot', a.length == 2 ? `c${i ? `+` : `-`}50px,b2em,100px,2em,a` : `c,b2em,100px,2em,a`)
					.attr('value', result)
					.text(displayText)
					.appendTo('#modal form');
			});
			$('#modal').on('close', () => {
				res(
					input instanceof Array
						? { ...Object.fromEntries([...$('#modal input')].map(el => [el.name, el.value])), result: $('#modal')[0].returnValue }
						: $('#modal')[0].returnValue
				);
				$('#modal button').remove();
			});
			//ui.update(); Should trigger a UI update without importing UI
		}),
	alert = data => modal(data, { Ok: true }),
	confirm = async data => {
		let res = await modal(data);
		if (JSON.parse(res)) {
			return true;
		} else {
			throw false;
		}
	},
	prompt = async (text, value) => {
		let data = await modal([{ name: 'data', placeholder: text, value }]);
		if (JSON.parse(data.result)) {
			return data.data;
		} else {
			throw false;
		}
	};