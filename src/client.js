/* global $ BABYLON random  version versions db Level Items Tech minimize Ship PlayerData Planet isJSON runCommand io isHex CelestialBody generate Entity commands config*/
/*eslint no-redeclare: "off"*/
const web = url => `https://blankstorm.drvortex.dev/` + url,
	upload = (type, multiple = false) =>
		new Promise(res =>
			$(`<input type=file ${type ? `accept='${type}'` : ''} ${multiple ? 'multiple' : ''}>`)
				.change(e => res([...e.target.files]))[0]
				.click()
		),
	download = (data, name) => $(`<a href=${URL.createObjectURL(new Blob([data]))} download="${name ?? 'download'}"></a>`)[0].click(),
	minimize = Intl.NumberFormat('en', { notation: 'compact' }).format;
const modal = (input = 'Are you sure?', options = { Cancel: false, Ok: true }) =>
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
			ui.update();
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

Object.defineProperties(Object.prototype, {
	hide: {
		value: function (...p) {
			for (let i of p) {
				Object.defineProperty(this, i, { enumerable: false });
			}
		},
	},
	freezeProperty: {
		value: function (...p) {
			for (let i of p) {
				Object.defineProperty(this, i, { writable: false });
			}
		},
	},
	getByString: {
		value: function (path, seperator) {
			return path
				.split(seperator || /[.[\]'"]/)
				.filter(p => p)
				.reduce((o, p) => (o ? o[p] : null), this);
		},
	},
	setByString: {
		value: function (path, value, seperator) {
			return path
				.split(seperator || /[.[\]'"]/)
				.filter(p => p)
				.reduce((o, p, i) => (o[p] = path.split(seperator || /[.[\]'"]/).filter(p => p).length === ++i ? value : o[p] || {}), this);
		},
	},
	copyFrom: {
		value: function (source, props) {
			Object.assign(this, props ? Object.fromEntries(Object.entries(source).filter(([k]) => props.includes(k))) : source);
			return this;
		},
	},
});

Math._log = Math.log;
Math.log = (num, base = Math.E) => Math._log(num) / Math._log(base);

//JQuery plugins
$.ajaxSetup({ timeout: 3000 });
$.fn.formData = function (data) {
	if (data) {
		for (let i in data) {
			this.find(`[name=${i}]`).each((a, e) => {
				e.type == 'checkbox' || e.type == 'hidden' ? (e.checked = data[i]) : (e.value = data[i]);
			});
		}
		return this;
	} else {
		let formData = Object.fromEntries(new FormData(this[0]));
		for (let i in formData) {
			if (+formData[i] == formData[i]) {
				formData[i] = +formData[i];
			}
			if (formData[i] === 'true') {
				formData[i] = true;
			}
			if (formData[i] === 'false') {
				formData[i] = false;
			}
		}
		return formData;
	}
};
$.fn.cm = function (...content) {
	content ||= [$('<p></p>')];
	let menu = $('<div bg=light class=cm></div>');
	for (let c of content) {
		menu.append(c, $('<br>'));
	}
	menu.css({ position: 'fixed', width: 'fit-content', height: 'fit-content', 'max-width': '15%', padding: '1em', 'z-index': 9 });
	this.contextmenu(e => {
		e.preventDefault();
		menu.css({ left: settings.general.font_size + mouse.x, top: settings.general.font_size + mouse.y });
		this.parent().append(menu);
		menu.css({
			top:
				settings.general.font_size + mouse.y + parseFloat(getComputedStyle(menu[0]).height) < innerHeight
					? settings.general.font_size + mouse.y
					: settings.general.font_size + mouse.y - parseFloat(getComputedStyle(menu[0]).height),
		});
	});
	return this;
};

//add HTML for settings to work (the title and defaults for checkboxes)
$('#settings form').prepend('<h2 style=text-align:center>Settings - <span></span></h2>');
$('#settings form input[type=checkbox]').each((i, e) => {
	$(`<input type=hidden name=${e.name} value=${!(e.value == 'true')}>`).insertBefore(e);
});

const cookie = {},
	mouse = { x: 0, y: 0, pressed: false },
	playsound = (url, vol = 1) => {
		if (vol > 0) {
			let a = new Audio(url);
			a.volume = +vol;
			a.play();
		}
	};
onmousemove = e => {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
};
document.cookie.split('; ').forEach(e => {
	cookie[e.split('=')[0]] = e.split('=')[1];
});

const settingsProxyHandler = obj => ({
	get(ls, prop) {
		let _settings = JSON.parse(ls.getItem('settings'));
		if (typeof _settings.getByString(obj)[prop] === 'object' && _settings.getByString(obj)[prop] !== null) {
			return new Proxy(ls, settingsProxyHandler());
		} else {
			return _settings.getByString(obj)[prop];
		}
	},
	set(ls, prop, value) {
		let _settings = JSON.parse(ls.getItem('settings'));
		_settings.getByString(obj)[prop] = value;
		ls.setItem('settings', JSON.stringify(_settings));
	},
});
localStorage.settings ??= '{"general":{},"debug":{},"keybinds":{}}';
const settings = new Proxy(localStorage, {
	get(ls, prop) {
		let _settings = JSON.parse(ls.getItem('settings'));
		if (typeof _settings[prop] === 'object' && _settings[prop] !== null) {
			return new Proxy(ls, settingsProxyHandler(prop));
		} else {
			return _settings[prop];
		}
	},
	set(ls, prop, value) {
		let _settings = JSON.parse(ls.getItem('settings'));
		_settings[prop] = value;
		ls.setItem('settings', JSON.stringify(_settings));
	},
});
//load settings
(() => {
	let _general = Object.fromEntries(Object.entries($('#settings form.gen').formData()).map(([key, val]) => [key, settings.general[key] ?? val]));
	let _debug = Object.fromEntries(Object.entries($('#settings form.debug').formData()).map(([key, val]) => [key, settings.debug[key] ?? val]));
	$('#settings form.gen').formData((settings.general = _general));
	$('#settings form.debug').formData((settings.debug = _debug));
	config.settings = settings;
})();
let keybind = {};

const servers = new Map(),
	saves = new Map(),
	sound = {
		rift: 'music/rift.mp3',
		planets: 'music/planets.mp3',
		destroy_ship: 'sfx/destroy_ship.mp3',
		warp_start: 'sfx/warp_start.mp3',
		//warp_end: 'sfx/warp_end.mp3',
		laser_fire: 'sfx/laser_fire.mp3',
		laser_hit: 'sfx/laser_hit.mp3',
		ui: 'sfx/ui.mp3',
	};

const locales = Object.assign(new Map(), {
	async fetch(url) {
		let locale = isJSON(url) ? JSON.parse(url) : await $.ajax(url),
			err = msg => {
				throw new Error(`Failed to load locale from ${url}: ${msg}`);
			};
		locale.language ||= locale.lang;
		if (typeof locale != 'object') err('Not an object');
		if (!locale.language) err('Does not have a language');
		if (!(locale.version || locale.versions)) err('Does not have a version');
		if (!locale?.text) err('Missing data');
		if (locale.version != version && ![...locale.versions].some(v => version.match(v))) err('Wrong game version');

		this.set(locale.language, locale);
		$('<option></option>').attr('value', locale.language).text(locale.name).appendTo('#settings form.gen select[name=locale]');
		return locale;
	},
	load(id) {
		if (!this.has(id)) throw new Error(`Locale ${id} does not exist`);
		let lang = this.get(id);
		this.currentLang = id;
		$('#main button.sp').text(lang['menu.singleplayer'] ?? 'Singleplayer');
		$('#main button.mp').text(lang['menu.multiplayer'] ?? 'Multiplayer');
		$('#main button.options,#esc button.options').text(lang['menu.options'] ?? 'Options');
		$('#main button.exit').text(lang['menu.exit'] ?? 'Exit');
		$('#esc button.resume').text(lang['menu.resume'] ?? 'Resume Game');
		$('#esc button.save').text(lang['menu.save'] ?? 'Save Game');
		$('#esc button.quit').text(lang['menu.quit'] ?? 'Main Menu');
		$('#load button.upload span').text(lang['menu.upload'] ?? 'Upload');
		$(':where(#load,#save,#settings) button.back span').text(lang['menu.back'] ?? 'Back');
		$(':where(#load,#q) button.new span').text(lang['menu.new'] ?? 'New');
		$('#save button.new span').text(lang['menu.start'] ?? 'Start');
		$('#connect button.back span').text(lang['menu.cancel'] ?? 'Cancel');
		$('#settings :where(button.gen,form.gen h2) span').text(lang['menu.general'] ?? 'General');
		$('#settings :where(button.key,form.key h2) span').text(lang['menu.keybinds'] ?? 'Keybinds');
		$('#settings :where(button.debug,form.debug h2) span').text(lang['menu.debug'] ?? 'Debug');
		$('#q div.warp button.warp').text(lang['menu.warp'] ?? 'Jump');
		$('#q div.nav button.inv span').text(lang['menu.items'] ?? 'Inventory');
		$('#q div.nav button.map span').text(lang['menu.map'] ?? 'Waypoints');
		$('#q div.nav button.screenshots span').text(lang['menu.screenshots'] ?? 'Screenshots');
		$('#q div.nav button.warp span').text(lang['menu.hyperspace'] ?? 'Hyperspace');
		$('#e div.nav button.trade span').text(lang['menu.trade'] ?? 'Trade');
		$('#e div.nav button.yrd span').text(lang['menu.shipyard'] ?? 'Shipyard');
		$('#e div.nav button.lab span').text(lang['menu.lab'] ?? 'Laboratory');
	},
	text(key) {
		return this.get(this.has(settings.general.locale) ? settings.general.locale : 'en')?.text?.[key] || 'Unknown';
	},
	currentLang: '',
});

const Waypoint = class extends BABYLON.Node {
	#readonly = false;
	static dialog(wp) {
		modal(
			[
				{ name: 'name', placeholder: 'Name', value: wp instanceof Waypoint ? wp.name : null },
				{ name: 'color', type: 'color', value: wp instanceof Waypoint ? wp.color.toHexString() : null },
				{ name: 'x', placeholder: 'X', value: wp instanceof Waypoint ? wp.position.x : null },
				{ name: 'y', placeholder: 'Y', value: wp instanceof Waypoint ? wp.position.y : null },
				{ name: 'z', placeholder: 'Z', value: wp instanceof Waypoint ? wp.position.z : null },
			],
			{ Cancel: false, Save: true }
		).then(data => {
			if (data.result) {
				if (!isHex(data.color.slice(1))) {
					alert(locales.text`error.waypoint.color`);
				} else if (Math.abs(data.x) > 99999 || Math.abs(data.y) > 99999 || Math.abs(data.z) > 99999) {
					alert(locales.text`error.waypoint.range`);
				} else if (wp instanceof Waypoint) {
					Object.assign(wp, {
						name: data.name,
						color: BABYLON.Color3.FromHexString(data.color),
						position: new BABYLON.Vector3(data.x, data.y, data.z),
					});
					ui.update();
				} else {
					new Waypoint(
						{
							name: data.name,
							color: BABYLON.Color3.FromHexString(data.color),
							position: new BABYLON.Vector3(data.x, data.y, data.z),
						},
						saves.current
					);
					ui.update();
				}
			}
		});
	}
	get readonly() {
		return this.#readonly;
	}
	gui(row) {
		let ui = $(`
				<span style=text-align:center;grid-row:${row};grid-column:2;><svg><use href=images/icons.svg#pencil /></svg></span>
				<span style=text-align:center;grid-row:${row};grid-column:3;><svg><use href=images/icons.svg#trash /></svg></span>
				<span style=text-align:center;grid-row:${row};grid-column:4;><svg><use href=images/icons.svg#${this.icon} /></svg></span>
				<span style=text-align:left;grid-row:${row};grid-column:5;color:${this.color.toHexString()}>${this.name}</span>
			`).attr('bg', 'none');
		ui
			.filter('span')
			.eq(0)
			.attr('clickable', '')
			.click(() => {
				Waypoint.dialog(this);
			}),
			ui
				.filter('span')
				.eq(1)
				.attr('clickable', '')
				.click(() => {
					confirm().then(() => {
						this.marker.remove();
						this.getScene().waypoints.spliceOut(this);
					});
				});
		return this.readonly ? ui.filter('span:gt(1)') : ui;
	}
	get screenPos() {
		return BABYLON.Vector3.Project(this.position, BABYLON.Matrix.Identity(), saves.current.getTransformMatrix(), { x: 0, y: 0, width: innerWidth, height: innerHeight });
	}
	constructor(
		{
			id = random.hex(32),
			name = 'Waypoint',
			position = BABYLON.Vector3.Zero(),
			color = new BABYLON.Color3(Math.random(), Math.random(), Math.random()),
			icon = 'location-dot',
			readonly = false,
		},
		scene = saves.current
	) {
		super(id, scene);
		scene.waypoints.push(this);
		this.#readonly = readonly;
		Object.assign(this, { name, position, color, icon });
		this.marker = $(`<svg ingame><use href=images/icons.svg#${icon} /></svg><p ingame style=justify-self:center></p>`).addClass('marker').hide().appendTo('body');
		this.marker.filter('p').css('text-shadow', '1px 1px 1px #000');
	}
};

//Class definitions
const Save = class {
	static current = { location: BABYLON.Vector2.Zero() };
	static GUI = function (save) {
		const gui = $(`<li ofn bg bw style=align-items:center;height:3em;></li>`);
		gui.delete = $(`<p style=position:absolute;left:10%><svg><use href=images/icons.svg#trash /></svg></p>`).appendTo(gui);
		gui.download = $(`<p style=position:absolute;left:15%><svg><use href=images/icons.svg#download /></svg></p>`).appendTo(gui);
		gui.play = $(`<p style=position:absolute;left:20%><svg><use href=images/icons.svg#play /></svg></p>`).appendTo(gui);
		gui.edit = $(`<p style=position:absolute;left:25%><svg><use href=images/icons.svg#pencil /></svg></p>`).appendTo(gui);
		gui.name = $(`<p style=position:absolute;left:30%>${save.data.name}</p>`).appendTo(gui);
		gui.version = $(`<p style=position:absolute;left:55%>${versions.get(save.data.version) ? versions.get(save.data.version).text : save.data.version}</p>`).appendTo(gui);
		gui.date = $(`<p style=position:absolute;left:65%>${new Date(save.data.date).toLocaleString()}</p>`).appendTo(gui);
		$('<p> </p>').appendTo(gui);

		let loadAndPlay = async () => {
			$('#loading_cover').show();
			let live = save.load();
			await live.ready();
			saves.current = live;
			live.play(live.playerData.get(player.id));
			$('#loading_cover').hide();
		};

		gui.attr('clickable', '')
			.click(() => {
				$('.selected').removeClass('selected');
				saves.selected = save.data.id;
				gui.addClass('selected');
			})
			.dblclick(loadAndPlay);
		if (!game.mp) gui.prependTo('#load');
		gui.delete.click(e => {
			let remove = () => {
				gui.remove();
				db.tx('saves', 'readwrite').then(tx => {
					tx.objectStore('saves').delete(save.data.id);
					saves.delete(save.data.id);
				});
			};
			e.shiftKey ? remove() : confirm().then(remove);
		});
		gui.download.click(() => download(JSON.stringify(save.data), (save.data.name || 'save') + '.json'));
		gui.play.click(loadAndPlay);
		gui.edit.click(() => {
			modal([{ name: 'name', placeholder: 'New name', value: save.data.name }], { Cancel: false, Save: true }).then(result => {
				if (result.result) {
					save.data.name = result.name;
					ui.update();
				}
			});
		});
		return gui;
	};
	static Live = class extends Level {
		waypoints = [];
		constructor(name, doNotGenerate) {
			super(name, game.engine, doNotGenerate);
		}
		play(player) {
			if (this.version == version) {
				$('#load').hide();
				game.canvas.show().focus();
				$('#hud').show();
				game.engine.resize();
				saves.selected = this.id;
				game.isPaused = false;
				player ??= [...this.playerData][0];
				if (player instanceof PlayerData) {
					this.activeCamera = player.cam;
					player.cam.attachControl(game.canvas, true);
					player.cam.inputs.attached.pointers.buttons = [1];
					player.cam.target = player.position;
				}
			} else {
				alert('That save is in compatible with the current game version');
			}
		}
		static Load(saveData) {
			let save = new Save.Live(saveData.name, true);
			Level.Load(saveData, game.engine, save);
			return save;
		}
		static async CreateDefault(name, playerID, playerName) {
			let save = new Save.Live(name);

			await save.ready();

			for (let body of save.bodies.values()) {
				body.waypoint = new Waypoint(
					{
						name: body.name,
						position: body.position,
						color: BABYLON.Color3.FromHexString('#88ddff'),
						icon: Planet.biomes.has(body.biome) && body instanceof Planet ? Planet.biomes.get(body.biome).icon : 'planet-ringed',
						readonly: true,
					},
					save
				);
			}

			let playerData = new PlayerData({ id: playerID, name: playerName, position: new BABYLON.Vector3(0, 0, -1000).add(random.cords(50, true)) }, save);
			save.playerData.set(playerID, playerData);

			playerData._shipLaserColor = BABYLON.Color3.Teal();
			new Ship('mosquito', playerData, save);
			new Ship('cillus', playerData, save);
			playerData.addItems(generate.items(5000));

			save.addCamera(playerData.cam);
			save.activeCamera = playerData.cam;

			return save;
		}
	};
	constructor(data) {
		try {
			this.data = data;
			this.gui = new Save.GUI(this);
			saves.set(this.data.id, this);
		} catch (err) {
			console.error(err.stack);
		}
	}
	load() {
		let save = Save.Live.Load(this.data);
		for (let waypoint of save.waypoints) {
			new Waypoint({
				id: waypoint.id,
				name: waypoint.name,
				color: BABYLON.Color3.FromArray(waypoint.color),
				position: BABYLON.Vector3.FromArray(waypoint.position),
			});
		}
		return save;
	}
	async saveToDB() {
		let tx = await db.tx('saves', 'readwrite');
		tx.objectStore('saves').put(this.data, this.data.id);
		return tx.result;
	}
};
const Server = class {
	static async dialog(server) {
		const result = await modal(
			[
				{ name: 'name', placeholder: 'Display name', value: server instanceof Server ? server.name : null },
				{ name: 'url', placeholder: 'Server URL or IP Address', value: server instanceof Server ? server.url : null },
			],
			{ Cancel: false, Save: true }
		);
		if (result.result) {
			let tx = await db.tx('servers', 'readwrite');
			let serverStore = tx.objectStore('servers');
			if (server instanceof Server) {
				serverStore.put(result.name, result.url);
				server.name = result.name;
				if (server.url != result.url) {
					serverStore.delete(server.url);
					server.url = result.url;
				}
			} else {
				if (servers.has(result.url)) {
					alert('A server with that URL already exists.');
				} else {
					new Server(result.url, result.name);
				}
			}
			ui.update();
		}
	}
	constructor(url, name) {
		Object.assign(this, {
			url,
			name,
			kickMessage: null,
			socket: null,
			gui: $(`<li ofn bg style=align-items:center;height:3em></li>`),
		});
		db.tx('servers', 'readwrite').then(tx => tx.objectStore('servers').put(name, url));
		this.socket = io(this.url, { reconnection: false, autoConnect: false, auth: { token: cookie.token, session: cookie.session } });
		this.socket.on('connect', () => {
			$('#connect').hide();
			game.canvas.show().focus();
			$('#mp_message,#hud').show();
			game.engine.resize();
			player.data().cam.attachControl(game.canvas, true);
			player.data().cam.inputs.attached.pointers.buttons = [1];
			$('#tablist p.info').html(`${this.url}<br>${this.pingData.version.text}<br>${this.pingData.message}<br>`);
		});
		this.socket.on('connect_error', err => {
			$('#connect p').text((err.message.startsWith('Connection refused') ? '' : 'Connection Error: ') + err.message);
			$('#connect button').text('Back');
		});
		this.socket.on('connect_failed', err => {
			$('#connect p').text('Connection failed: ' + err.message);
			$('#connect button').text('Back');
		});
		this.socket.on('packet', packet => {
			$('#connect p').text('[Server] ' + (packet instanceof Array ? `Array (${packet.length})<br>` + packet.join('<br>') : packet));
		});
		this.socket.on('playerlist', list => {
			$('#tablist p.players').html(list.join('<br>'));
		});
		this.socket.on('kick', message => {
			this.kickMessage = 'Kicked from server: ' + message;
		});
		this.socket.on('chat', message => {
			game.chat(message);
		});
		this.socket.on('disconnect', reason => {
			let message =
				this.kickMessage ??
				(reason == 'io server disconnect'
					? 'Disconnected by server'
					: reason == 'io client disconnect'
					? 'Client disconnected'
					: reason == 'ping timeout' || reason == 'transport error'
					? 'Connection timed out'
					: reason == 'transport close'
					? 'Lost Connection'
					: reason);
			$('#connect p').text(message);
			this.kickMessage = null;
			$('#connect button').text('Back');
			$('[ingame]').hide();
			$(reason == 'io client disconnect' ? '#load' : '#connect').show();
		});
		this.gui.delete = $(`<p style=position:absolute;left:15%><svg><use href=images/icons.svg#trash /></svg></p>`).appendTo(this.gui);
		this.gui.play = $(`<p style=position:absolute;left:20%><svg><use href=images/icons.svg#play /></svg></p>`).appendTo(this.gui);
		this.gui.edit = $(`<p style=position:absolute;left:25%><svg><use href=images/icons.svg#pencil /></svg></p>`).appendTo(this.gui);
		this.gui.name = $(`<p style=position:absolute;left:30%>${this.name}</p>`).appendTo(this.gui);
		this.gui.info = $(`<p style=position:absolute;left:75%><tool-tip></tool-tip></p>`).appendTo(this.gui);
		$('<p> </p>').appendTo(this.gui);
		this.gui
			.attr('clickable', true)
			.click(() => {
				$('.selected').removeClass('selected');
				this.gui.addClass('selected');
				servers.sel = this.url;
			})
			.dblclick(() => this.connect())
			.prependTo('#load');
		this.gui.delete.click(() => {
			confirm().then(async () => {
				this.gui.remove();
				servers.delete(this.url);
				let tx = await db.tx('servers', 'readwrite');
				tx.objectStore('servers').delete(this.url);
			});
		});
		this.gui.play.click(() => this.connect());
		this.gui.edit.click(() => Server.dialog(this));
		servers.set(this.url, this);
	}
	connect() {
		if (this?.socket?.connected) {
			throw new ReferenceError(`Can't connect to server: already connected`);
		}
		$('#load').hide();
		$('#connect').show();
		$('#connect p').text('Connecting...');
		$('#connect button').text('Back');
		this.socket.connect();
	}
	disconnect() {
		if (this.socket.connected) {
			this.socket.disconnect(true);
		}
		servers.sel = null;
		servers.forEach(server => server.ping());
	}
	ping() {
		this.gui.info.html('<svg><use href=images/icons.svg#arrows-rotate /></svg>').css('animation', '2s linear infinite rotate');
		let beforeTime = performance.now();
		let url = /.+:(\d){1,5}/.test(this.url) ? this.url : this.url + ':1123';
		$.get(`${/http(s?):\/\//.test(url) ? url : 'https://' + url}/ping`)
			.done(data => {
				if (isJSON(data)) {
					this.pingData = JSON.parse(data);
					this.gui.info
						.text(`${((performance.now() - beforeTime) / 2).toFixed()}ms ${this.pingData.currentPlayers}/${this.pingData.maxPlayers}`)
						.find('tool-tip')
						.html(`${this.url}<br><br>${this.pingData.version.text}<br><br>${this.pingData.message}`);
				} else {
					this.gui.info.html('<svg><use href=images/icons.svg#xmark /></svg>').find('tool-tip').html('Invalid response');
				}
			})
			.fail(() => {
				this.gui.info.html('<svg><use href=images/icons.svg#xmark /></svg>').find('tool-tip').html(`Can't connect to server`);
			})
			.always(() => {
				this.gui.info.css('animation', 'unset');
			});
	}
};
//Some stuff done on initalization
document.title = 'Blankstorm ' + versions.get(version).text;
$('#main .version a')
	.text(versions.get(version).text)
	.attr('href', web('versions#' + version));
console.log(`%cBlankstorm ${versions.get(version).text}`, `color:#f55`);

//load mods (if any)
db.tx('mods').then(tx => {
	tx.objectStore('mods')
		.getAll()
		.async()
		.then(result => {
			console.log('Loaded mods: ' + (result.join('\n') || '(none)'));
		});
});

const game = {
	canvas: $('canvas.game'),
	engine: new BABYLON.Engine($('canvas.game')[0], true, { preserveDrawingBuffer: true, stencil: true }), //TODO: move engine to core
	screenshots: [],
	mods: new Map(),
	isPaused: true,
	mp: false,
	mpEnabled: true,
	hitboxes: false,
	strobeInterval: null,
	strobe: rate => {
		if (game.strobeInterval) {
			clearInterval(game.strobeInterval);
			$(':root').css('--hue', 200);
			game.strobeInterval = null;
		} else {
			game.strobeInterval = setInterval(() => {
				let hue = $(':root').css('--hue');
				if (hue > 360) hue -= 360;
				$(':root').css('--hue', ++hue);
			}, 1000 / rate);
		}
	},
	createKeybind: (name, val, label, onTrigger) => {
		keybind[name] = val;
		$('#settings form.key').append(
			$(`<label>${label}&nbsp;&nbsp;</label>`).attr('for', 'keybind.' + name),
			$(`<button !sub name=${name}></button><br><br>`)
				.text((keybind[name].ctrl ? 'Ctrl + ' : '') + (keybind[name].alt ? 'Alt + ' : '') + keybind[name].key)
				.click(function (e) {
					e.preventDefault();
					$(this).focus();
				})
				.on('keydown', function (e) {
					e.preventDefault();
					let bind = (keybind[this.name] = {
						key: e.key,
						ctrl: e.ctrlKey,
						alt: e.altKey,
					});
					$(this).text((bind.ctrl ? 'Ctrl + ' : '') + (bind.alt ? 'Alt + ' : '') + bind.key);
				})
		);
		$('canvas.game,[ingame-ui],#hud,#tablist').keydown(e => {
			if (e.key == keybind[name].key && (!keybind[name].alt || e.altKey) && (!keybind[name].ctrl || e.ctrlKey)) onTrigger(e);
		});
	},
	toggleChat: command => {
		$('#chat,#chat_history').toggle();
		if ($('#cli').toggle().is(':visible')) {
			player.data().cam.detachControl(game.canvas, true);
			$('#cli').focus();
			if (command) {
				$('#cli').val('/');
			}
		} else {
			game.canvas.focus();
			player.data().cam.attachControl(game.canvas, true);
			player.data().cam.inputs.attached.pointers.buttons = [1];
		}
	},
	cli: { line: 0, currentInput: '', i: $('#cli').val(), prev: [] },
	scene: () => {
		return saves.current;
	},
	runCommand: command => {
		if (game.mp) {
			servers.get(servers.sel).socket.emit('command', command);
		} else {
			return runCommand(command, saves.current);
		}
	},
	chat: (...msg) => {
		for (let m of msg) {
			$(`<li bg=none></li>`)
				.text(m)
				.appendTo('#chat')
				.fadeOut(1000 * settings.general.chat);
			$(`<li bg=none></li>`).text(m).appendTo('#chat_history');
		}
	},
	error: error => {
		console.error(error);
		game.chat('Error: ' + error);
	},
	changeUI: (selector, hideAll) => {
		if ($(selector).is(':visible')) {
			game.canvas.focus();
			player.data().cam.attachControl(game.canvas, true);
			player.data().cam.inputs.attached.pointers.buttons = [1];
			$(selector).hide();
		} else if ($('[game-ui]').not(selector).is(':visible') && hideAll) {
			game.canvas.focus();
			player.data().cam.attachControl(game.canvas, true);
			player.data().cam.inputs.attached.pointers.buttons = [1];
			$('[game-ui]').hide();
		} else if (!$('[game-ui]').is(':visible')) {
			player.data().cam.detachControl(game.canvas, true);
			$(selector).show().focus();
		}
	},
};

const player = {
	username: '',
	getAuthData() {
		$.ajax({
			url: web`api/user`,
			async: false,
			data: { token: cookie.token, session: true },
			success: req => {
				player.authData = req;
				if (isJSON(req)) {
					let res = JSON.parse(req);
					Object.assign(player, res);
					localStorage.auth = req;
					player.freezeProperty(...Object.keys(res));
				} else if (req == undefined) {
					game.chat('Failed to connect to account servers.');
				} else if (req == 'ERROR 404') {
					game.chat('Invalid token, please log in again and reload the game to play multiplayer.');
				}
			},
		});
	},
	updateFleet: () => {
		if (player.data().fleet.length <= 0) {
			game.chat(locales.text`player.death`);
			player.reset();
			player.wipe();
			new Ship('frigate', player.data());
			new Ship('transport_small', player.data());
		}
	},
	chat: (...msg) => {
		for (let m of msg) {
			game.chat(`${player.username}: ${m}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
		}
	},
	stop: (delay = 0) => {
		setTimeout(() => {
			player.data().velocity = BABYLON.Vector3.Zero();
		}, +delay || 0);
	},
	reset: noStop => {
		player.data().position = random.cords(random.int(0, 50), true).add(new BABYLON.Vector3(0, 0, -1000));
		player.data().rotation = BABYLON.Vector3.Zero();
		player.data().cam.alpha = -Math.PI / 2;
		player.data().cam.beta = Math.PI;
		player.data().cam.target = player.data().position;
		if (!noStop) player.stop();
	},
	wipe: () => {
		player.data().removeAllItems();
		for (let type of Tech.keys()) {
			player.data().tech[type] = 0;
		}
		for (let ship of player.data().fleet) {
			ship.remove();
		}
	},
	data: id => saves.current?.playerData?.get(id ?? player.id) ?? {},
	levelOf: xp => Math.sqrt(xp / 10),
	xpOf: level => 10 * level ** 2,
	get isInBattle() {
		return this.data().fleet.some(ship => !!ship.battle);
	},
};

game.freezeProperty('mpEnabled', 'scene', 'chat');
player.freezeProperty('updateFleet', 'move', 'stop', 'reset', 'hasItems', 'removeItems', 'giveItems', 'wipe', 'chat');
onresize = () => {
	game.engine.resize();
	console.warn('Do not paste any code someone gave you, as they may be trying to steal your information');
};
if (!game.mpEnabled) {
	$('#main .mp').hide();
	$('#main .options').attr('plot', 'c,360px,350px,50px');
	$('#main button.exit').attr('plot', 'c,460px,350px,50px');
}

game.createKeybind('forward', { key: 'w' }, 'Forward', () => {
	player.data().addVelocity(BABYLON.Vector3.Forward(), true);
});
game.createKeybind('left', { key: 'a' }, 'Strafe Left', () => {
	player.data().addVelocity(BABYLON.Vector3.Left(), true);
});
game.createKeybind('right', { key: 'd' }, 'Strafe Right', () => {
	player.data().addVelocity(BABYLON.Vector3.Right(), true);
});
game.createKeybind('back', { key: 's' }, 'Backward', () => {
	player.data().addVelocity(BABYLON.Vector3.Backward(), true);
});
game.createKeybind('chat', { key: 't' }, 'Toggle Chat', e => {
	e.preventDefault();
	game.toggleChat();
});
game.createKeybind('command', { key: '/' }, 'Toggle Command', e => {
	e.preventDefault();
	game.toggleChat(true);
});
game.createKeybind('nav', { key: 'Tab' }, 'Toggle Inventory', () => {
	game.changeUI('#q');
});
game.createKeybind('inv', { key: 'e' }, 'Toggle Shipyard/Lab', () => {
	game.changeUI('#e');
});
game.createKeybind('screenshot', { key: 'F2' }, 'Take Screenshot', () => {
	game.screenshots.push(game.canvas[0].toDataURL('image/png'));
	ui.update();
});
game.createKeybind('save', { key: 's', ctrl: true }, 'Save Game', () => {
	if (saves.current instanceof Save.Live) {
		$('#esc .save').text('Saving...');
		saves.get(saves.current.id).data = saves.current.serialize();
		saves
			.get(saves.current.id)
			.saveToDB()
			.then(() => game.chat('Game saved.'))
			.catch(err => game.chat('Failed to save game: ' + err))
			.finally(() => $('#esc .save').text('Save Game'));
	} else {
		throw 'Save Error: you must have a valid save selected.';
	}
});

if (cookie.token && navigator.onLine) {
	player.authData = player.getAuthData();
} else if (localStorage.auth) {
	if (isJSON(localStorage.auth) && JSON.parse(localStorage.auth)) {
		let data = (player.authData = JSON.parse(localStorage.auth));
		Object.assign(player, data);
		player.freezeProperty(...Object.keys(data));
	} else {
		game.chat('Error: Invalid auth data.');
	}
} else {
	game.mpEnabled = false;
	game.chat("You're not logged in, and will not be able to play multiplayer.");
}

//load saved settings and keybinds
$('form.gen').formData((settings.general ??= $('form.gen').formData()));
$('form.debug').formData((settings.debug ??= $('form.debug').formData()));
config.settings = settings;

for (let i in settings.keybinds) {
	let bind = settings.keybinds[i];
	if (typeof bind == 'string') {
		bind = {
			key: settings.keybinds[i],
			ctrl: false,
			alt: false,
		};
	}
	keybind[i] = bind ?? keybind[i];
}
$('form.key').formData(keybind);

const ui = {
	item: {},
	tech: {},
	ship: {},
	init() {
		for (let [id, item] of Items) {
			ui.item[id] = $(`<div>
						<span style=text-align:right;>${locales.text(`item.${id}.name`)}${item.rare ? ` (rare)` : ``}: </span>
						<span class=count style=text-align:left;></span>
					</div>`)
				.click(() => {
					if (item.recipe && player.data().hasItems(item.recipe)) {
						player.data().removeItems(item.recipe);
						player.data().items[id]++;
					}
				})
				.removeAttr('clickable')
				.attr('bg', 'none')
				.appendTo('div.inv');
		}
		for (let [id, t] of Tech) {
			ui.tech[id] = $(`<div>
						<span class="locked locked-icon"><svg style=font-size:1.5em><use href=images/icons.svg#lock /></svg></span>
						<span class=name style=text-align:center;>${locales.text(`tech.${id}.name`)}</span>
						<span class="upgrade add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-up /></svg></span>
					</div>`)
				.find('.upgrade')
				.click(() => {
					if (
						player.data().hasItems(Tech.priceOf(id, player.data().tech[id])) &&
						player.data().tech[id] < t.max &&
						!Tech.isLocked(id, player.data()) &&
						player.data().xpPoints >= 1
					) {
						player.data().removeItems(Tech.priceOf(id, player.data().tech[id]));
						player.data().tech[id]++;
						player.data().xpPoints--;
					}
					ui.update();
				})
				.parent()
				.attr('bg', 'none')
				.appendTo('div.lab');
		}
		for (let [id, ship] of Ship.generic) {
			ui.ship[id] = $(`<div>
						<span class="locked locked-icon"><svg style=font-size:1.5em><use href=images/icons.svg#lock /></svg></span>
						<span class=name style=text-align:center>${locales.text(`entity.${id}.name`)}</span>
						<span class="add add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-plus /></svg></span>
					</div>`)
				.find('.add')
				.click(() => {
					if (player.data().hasItems(ship.recipe)) {
						player.data().removeItems(ship.recipe);
						new Ship(id, player.data());
					}
					ui.update();
				})
				.parent()
				.attr('bg', 'none')
				.appendTo('div.yrd');
		}
	},
	update: (scene = saves.current) => {
		try {
			if (saves.current instanceof Save.Live && player.data() instanceof PlayerData) {
				$('div.screenshots').empty();
				$('div.map>:not(button)').remove();
				$('svg.item-bar rect').attr('width', (player.data().totalItems / player.data().maxItems) * 100 || 0);
				$('div.item-bar p.label').text(`${minimize(player.data().totalItems)} / ${minimize(player.data().maxItems)}`);

				for (let [id, amount] of Object.entries(player.data().items)) {
					ui.item[id].find('.count').text(minimize(amount));
				}

				//update tech info
				for (let [id, t] of Tech) {
					const materials = Object.entries(Tech.priceOf(id, player.data().tech[id])).reduce(
						(result, [id, amount]) => result + `<br>${locales.text(`item.${id}.name`)}: ${minimize(player.data().items[id])}/${minimize(amount)}`,
						''
					);
					const requires = Object.entries(t.requires).reduce(
						(result, [id, amount]) =>
							result + (amount > 0)
								? `<br>${locales.text(`tech.${id}.name`)}: ${player.data().tech[id]}/${amount}`
								: `<br>Incompatible with ${locales.text(`tech.${id}.name`)}`,
						''
					);
					ui.tech[id]
						.find('.upgrade tool-tip')
						.html(
							`<strong>${locales.text(`tech.${id}.name`)}</strong><br>${locales.text(`tech.${id}.description`)}<br>${
								player.data().tech[id] >= t.max
									? `<strong>Max Level</strong>`
									: `${player.data().tech[id]} <svg><use href=images/icons.svg#arrow-right /></svg> ${player.data().tech[id] + 1}`
							}<br><br><strong>Material Cost:</strong>${materials}<br>${Object.keys(t.requires).length ? `<br><strong>Requires:</strong>` : ``}${requires}${
								settings.debug.tooltips ? '<br>type: ' + id : ''
							}`
						);
					ui.tech[id].find('.locked')[Tech.isLocked(id, player.data()) ? 'show' : 'hide']();
				}

				//update ship info
				for (let [id, ship] of Ship.generic) {
					const materials = Object.entries(ship.recipe).reduce(
						(result, [id, amount]) => `${result}<br>${locales.text(`item.${id}.name`)}: ${minimize(player.data().items[id])}/${minimize(amount)}`,
						''
					);
					const requires = Object.entries(ship.requires).reduce(
						(result, [id, tech]) =>
							`${result}<br>${
								tech == 0 ? `Incompatible with ${locales.text(`tech.${id}.name`)}` : `${locales.text(`tech.${id}.name`)}: ${player.data().tech[id]}/${tech}`
							}`,
						''
					);
					ui.ship[id]
						.find('.add tool-tip')
						.html(
							`${locales.text(`entity.${id}.description`)}<br><br><strong>Material Cost</strong>${materials}<br>${
								Object.keys(ship.requires).length ? `<br><strong>Requires:</strong>` : ``
							}${requires}${settings.debug?.tooltips ? '<br>' + id : ''}`
						);

					let locked = false;
					for (let t in ship.requires) {
						if (Tech.isLocked(t, player.data())) locked = true;
					}
					ui.ship[id].find('.locked')[locked ? 'show' : 'hide']();
				}

				scene.waypoints.forEach((wp, i) => {
					wp.gui(i + 1).appendTo('div.map');
					wp.marker.show();
				});
				for (let [id, body] of scene.bodies) {
					if (body instanceof CelestialBody) {
						$('select.move').append((body.option = $(`<option value=${id}>${body.name}</option>`)));
					}
				}
			}
			$('.marker').hide();

			game.screenshots.forEach(s => {
				$(`<img src=${s} width=256></img>`)
					.appendTo('#q div.screenshots')
					.cm(
						$('<button><svg><use href=images/icons.svg#download /></svg> Download</button>').click(() => {
							$('<a download=screenshot.png></a>').attr('href', s)[0].click();
						}),
						$('<button><svg><use href=images/icons.svg#trash /></svg> Delete</button>').click(() => {
							confirm().then(() => {
								game.screenshots.spliceOut(s);
								ui.update();
							});
						})
					);
			});
			$('input[label][display]').each((i, e) => {
				let val = e.value;
				$(`label[for=${$(e).attr('ui-label')}]`).html(`${$(e).attr('label')} (${eval(`\`${$(e).attr('display')}\``)}) `);
			});
			$('#settings form.key button').each((i, e) => {
				let bind = keybind[e.name];
				$(e).text((bind.ctrl ? 'Ctrl + ' : '') + (bind.alt ? 'Alt + ' : '') + bind.key);
			});
			servers.forEach(server => {
				server.gui.name.text(server.name);
			});
			saves.forEach(save => {
				save.gui.name.text(save.data.name);
				save.gui.version.text(versions.get(save.data.version)?.text ?? save.data.version);
				save.gui.date.text(new Date(save.data.date).toLocaleString());
			});
			$(':root').css('--font-size', settings.general.font_size + 'px');
			if (game.mp) {
				$('#esc .quit').text('Disconnect');
				$('#esc .options').attr('plot', '12.5px,125px,225px,50px,a');
				$('#esc .quit').attr('plot', '12.5px,187.5px,225px,50px,a');
				$('#esc .save').hide();
			} else {
				$('#esc .quit').text('Exit Game');
				$('#esc .save').attr('plot', '12.5px,125px,225px,50px,a');
				$('#esc .options').attr('plot', '12.5px,187.5px,225px,50px,a');
				$('#esc .quit').attr('plot', '12.5px,250px,225px,50px,a');
				$('#esc .save').show();
			}

			$('[plot]').each((i, e) => {
				let scale =
					settings.general.gui_scale == 0
						? innerHeight <= 475
							? 0.5
							: innerHeight <= 650
							? 0.75
							: innerHeight <= 800
							? 1
							: 1.25
						: Object.assign([1, 0.75, 1, 1.25][settings.general.gui_scale], { is_from_array: true });

				let plot = $(e)
					.attr('plot')
					.replaceAll(/[\d.]+(px|em)/g, str => parseFloat(str) * scale + str.slice(-2))
					.split(',');
				plot[0][0] == 'c' && !plot[0].startsWith('calc')
					? $(e).css('left', `${plot[0].slice(1) ? 'calc(' : ''}calc(50% - calc(${plot[2]}/2))${plot[0].slice(1) ? ` + ${plot[0].slice(1)})` : ''}`)
					: plot[0][0] == 'r'
					? $(e).css('right', plot[0].slice(1))
					: plot[0][0] == 'l'
					? $(e).css('left', plot[0].slice(1))
					: $(e).css('left', plot[0]);
				plot[1][0] == 'c' && !plot[1].startsWith('calc')
					? $(e).css('top', `${plot[1].slice(1) ? 'calc(' : ''}calc(50% - calc(${plot[3]}/2))${plot[1].slice(1) ? ` + ${plot[1].slice(1)})` : ''}`)
					: plot[1][0] == 'b'
					? $(e).css('bottom', plot[1].slice(1))
					: plot[1][0] == 't'
					? $(e).css('top', plot[1].slice(1))
					: $(e).css('top', plot[1]);
				$(e).css({
					width: plot[2],
					height: plot[3],
					position: ['absolute', 'fixed', 'relative', 'sticky'].includes(plot[4])
						? plot[4]
						: /^(a|s|f|r)$/.test(plot[4])
						? { a: 'absolute', f: 'fixed', r: 'relative', s: 'sticky' }[plot[4]]
						: 'fixed',
				});
			});
		} catch (err) {
			console.error('Failed to update UI: ' + err.stack);
		}
	},
	lastScene: '#main',
};

oncontextmenu = () => {
	$('.cm').not(':last').remove();
};
onclick = () => {
	$('.cm').remove();
};

//load locales
locales.fetch('locales/en.json').then(() => {
	locales.load('en');
	ui.init();
});

//Load saves and servers into the game (from the IndexedDB)
db.tx('saves').then(tx => {
	tx.objectStore('saves')
		.getAll()
		.async()
		.then(result => {
			result.forEach(save => new Save(save));
		});
});
db.tx('servers').then(tx => {
	tx.objectStore('servers')
		.getAllKeys()
		.async()
		.then(result => {
			result.forEach(key =>
				db.tx('servers').then(tx =>
					tx
						.objectStore('servers')
						.get(key)
						.async()
						.then(result => new Server(key, result))
				)
			);
		});
});

commands.playsound = (level, name, volume = settings.general.sfx) => {
	if (sound[name]) {
		playsound(name, volume);
	} else {
		throw new ReferenceError(`sound "${name}" does not exist`);
	}
};
commands.reload = () => {
	//maybe also reload mods in the future
	game.engine.resize();
};
//Event Listeners (UI transitions, creating saves, etc.)
$('#main .sp').click(() => {
	game.mp = false;
	$('#load li').detach();
	saves.forEach(save => save.gui.prependTo('#load'));
	saves.forEach(save => save.gui.prependTo('#load'));
	$('#main').hide();
	$('#load button.upload use').attr('href', 'images/icons.svg#upload');
	$('#load button.upload span').text(locales.text`menu.upload`);
	$('#load').show();
});
$('#main .mp').click(() => {
	game.mp = true;
	$('#main').hide();
	$('#load button.refresh use').attr('href', 'images/icons.svg#arrows-rotate');
	$('#load button.refresh span').text(locales.text`menu.refresh`);
	$('#load').show();
	$('#load li').detach();
	servers.forEach(server => {
		server.gui.prependTo('#load');
		server.ping();
	});
});
$('#main .options').click(() => {
	ui.LastScene = '#main';
	$('#settings').show();
	ui.update();
});
$('#load .back').click(() => {
	$('#load').hide();
	$('#main').show();
});
$('#load .new').click(() => {
	game.mp ? Server.dialog() : $('#save')[0].showModal();
});
$('#load button.upload.refresh').click(() => {
	if (game.mp) {
		servers.forEach(server => server.ping());
	} else {
		upload('.json')
			.then(file => file[0].text())
			.then(text => {
				if (isJSON(text)) {
					new Save(JSON.parse(text));
				} else {
					alert(`Can't load save: not JSON.`);
				}
			});
	}
});
$('#connect button.back').click(() => {
	$('#load').show();
	$('#connect').hide();
});
$('#save button.back').click(() => {
	$('#save')[0].close();
});
$('#save .new').click(async () => {
	$('#save')[0].close();
	let live = await Save.Live.CreateDefault($('#save .name').val(), player.id, player.username);
	saves.current = live;
	live.play(live.playerData.get(player.id));
	let save = new Save(live.serialize());
	if (!settings.debug.disable_saves) save.saveToDB();
});
$('#esc .resume').click(() => {
	$('#esc').hide();
	player.data().cam.attachControl(game.canvas, true);
	player.data().cam.inputs.attached.pointers.buttons = [1];
	game.isPaused = false;
});
$('#esc .save').click(() => {
	if (saves.current instanceof Save.Live) {
		$('#esc .save').text('Saving...');
		let save = saves.get(saves.current.id);
		save.data = saves.current.serialize();
		save.saveToDB()
			.then(() => {
				game.chat('Game Saved.');
				$('#esc .save').text('Save Game');
			})
			.catch(err => {
				game.chat('Failed to save game: ' + err);
				$('#esc .save').text('Save Game');
			});
	} else {
		throw 'Save Error: you must have a valid save selected.';
	}
});
$('#esc .options').click(() => {
	ui.LastScene = '#esc';
	$('#esc').hide();
	$('#settings').show();
});
$('#esc .quit').click(() => {
	game.isPaused = true;
	$('[ingame]').hide();
	if (game.mp) {
		servers.get(servers.sel).disconnect();
	} else {
		saves.selected = null;
		$('#main').show();
	}
});
$('.nav button.inv').click(() => {
	$('#q>:not(.nav)').hide();
	$('div.item-bar').show();
	$('div.inv').css('display', 'grid');
});
$('.nav button.map').click(() => {
	$('#q>:not(.nav)').hide();
	$('.map').css('display', 'grid');
});
$('.nav button.screenshots').click(() => {
	$('#q>:not(.nav)').hide();
	$('div.screenshots').css('display', 'grid');
});
$('.nav button.warp').click(() => {
	$('#q>:not(.nav)').hide();
	$('div.warp').show();
});
$('.nav button.yrd').click(() => {
	$('#e>:not(.nav)').hide();
	$('div.yrd').css('display', 'grid');
});
$('.nav button.lab').click(() => {
	$('#e>:not(.nav)').hide();
	$('div.lab').css('display', 'grid');
});
$('.nav button.trade').click(() => {
	$('#e>:not(.nav)').hide();
	$('div.trade').css('display', 'grid');
});
$('button.map.new').click(() => {
	Waypoint.dialog();
});
$('#settings>button:not(.back)').click(e => {
	let target = $(e.target);
	$('#settings form')
		.hide()
		.filter('.' + (target.is('button') ? target : target.parent('button')).attr('class'))
		.show();
});
$('#settings button.mod').click(() => {
	$('#settings ul.mod')
		.show()
		.empty()
		.append(
			$('<h2 style=text-align:center>Mods</h2>'),
			$('<button plot=r15px,b15px,100px,35px,a><svg><use href=images/icons.svg#trash /></svg>&nbsp;Reset</button>').click(async () => {
				let tx = await db.tx('mods', 'readwrite');
				await tx.objectStore('mods').clear().async();
				alert('Requires reload');
			}),
			$(`<button plot=r130px,b15px,100px,35px,a><svg><use href=images/icons.svg#plus /></svg></i>&nbsp;${locales.text`menu.upload`}</button>`).click(() => {
				//upload('.js').then(files => [...files].forEach(file => file.text().then(mod => game.loadMod(mod))));
				alert('Mods are not supported.');
			})
		);
	ui.update();
});
$('#settings button.back').click(() => {
	$('#settings').hide();
	$(ui.LastScene).show();
	ui.update();
});
$('#q div.warp button.warp').click(() => {
	let destination = new BABYLON.Vector3(+$('input.warp.x').val(), 0, +$('input.warp.y').val());
	player.data().fleet.forEach(ship => {
		let offset = random.cords(player.data().power, true);
		ship.jump(destination.add(offset));
		console.log(ship.id + ' Jumped');
	});
	$('#q').toggle();
});
$('[label]').each((i, e) => {
	let val = e.value;
	$(e).attr('ui-label', random.hex(32));
	$(`<label>${$(e).attr('label')} ${$(e).attr('display') && e.localName == 'input' ? eval(`\`(${$(e).attr('display')})\``) : ''} </label>`)
		.attr('for', $(e).attr('ui-label'))
		.insertBefore($(e));
});
$('input[label][display]').mousemove(() => ui.update());
$('#settings,#settings ').on('click change', () => {
	settings.general = $('#settings form.gen').formData();
	settings.debug = $('#settings form.debug').formData();
});
$('#settings form.gen input').change(() => ui.update());
$('#settings form.gen select[name=locale]').change(e => {
	let lang = e.target.value;
	if (locales.has(lang)) {
		locales.load(lang);
	} else {
		alert('That locale is not loaded.');
		console.warn(`Failed to load locale ${lang}`);
	}
});
$('html')
	.keydown(e => {
		switch (e.key) {
			case 'F8':
				e.preventDefault();
				open(web`bugs/new`, 'target=_blank');
				break;
			case 'b':
				if (e.ctrlKey) game.strobe(100);
				break;
			case 't':
				if (e.altKey) {
					e.preventDefault();
					prompt('Password').then(passkey => {
						let token = $.ajax(web('api/dev_auth'), { data: { passkey }, async: false }).responseText;
						document.cookie = 'token=' + token;
						location.reload();
					});
				}
				break;
		}
	})
	.mousemove(e => {
		$('tool-tip').each((i, tooltip) => {
			let computedStyle = getComputedStyle(tooltip);
			let left = settings.general.font_size + e.clientX,
				top = settings.general.font_size + e.clientY;
			$(tooltip).css({
				left: left - (left + parseFloat(computedStyle.width) < innerWidth ? 0 : parseFloat(computedStyle.width)),
				top: top - (top + parseFloat(computedStyle.height) < innerHeight ? 0 : parseFloat(computedStyle.height)),
			});
		});
	});
$('#cli').keydown(e => {
	let c = game.cli;
	if (c.line == 0) c.currentInput = $('#cli').val();
	switch (e.key) {
		case 'Escape':
			game.toggleChat();
			break;
		case 'ArrowUp':
			if (c.line > -c.prev.length) $('#cli').val(c.prev.at(--c.line));
			if (c.line == -c.prev.length) if (++c.counter == 69) $('#cli').val('nice');
			break;
		case 'ArrowDown':
			c.counter = 0;
			if (c.line < 0) ++c.line == 0 ? $('#cli').val(c.currentInput) : $('#cli').val(c.prev.at(c.line));
			break;
		case 'Enter':
			c.counter = 0;
			if (/[^\s/]/.test($('#cli').val())) {
				if (c.prev.at(-1) != c.currentInput) c.prev.push($('#cli').val());
				if ($('#cli').val()[0] == '/') game.chat(game.runCommand($('#cli').val().slice(1)));
				else game.mp ? servers.get(servers.sel).socket.emit('chat', $('#cli').val()) : player.chat($('#cli').val());
				$('#cli').val('');
				c.line = 0;
			}
			break;
	}
});
game.canvas.click(e => {
	if (!game.isPaused) {
		player.data().cam.attachControl(game.canvas, true);
		player.data().cam.inputs.attached.pointers.buttons = [1];
	}

	if (saves.current instanceof Save.Live) {
		saves.current.handleCanvasClick(e, player.data());
	}
	ui.update();
});
game.canvas.contextmenu(e => {
	if (saves.current instanceof Save.Live) {
		saves.current.handleCanvasRightClick(e, player.data());
	}
});
game.canvas.keydown(e => {
	switch (e.key) {
		case 'F3':
			$('#debug').toggle();
		case 'F1':
			e.preventDefault();
			$('#hud,.marker').toggle();
			break;
		case 'F4':
			e.preventDefault();
			game.hitboxes = !game.hitboxes;
			break;
		case 'Tab':
			e.preventDefault();
			if (game.mp) $('#tablist').show();
			break;
	}
});
game.canvas.keyup(e => {
	switch (e.key) {
		case 'Tab':
			e.preventDefault();
			if (game.mp) $('#tablist').hide();
			break;
	}
});

$('#q').keydown(e => {
	if (e.key == keybind.nav || e.key == 'Escape') {
		game.changeUI('#q');
	}
});
$('#e')
	.keydown(e => {
		if (e.key == keybind.inv || e.key == 'Escape') {
			game.changeUI('#e');
		}
	})
	.click(() => ui.update());
$('canvas.game,#esc,#hud').keydown(e => {
	if (e.key == 'Escape') {
		game.changeUI('#esc', true);
		game.isPaused = !game.isPaused;
	}
	ui.update();
});
$('button').click(() => {
	playsound(sound.ui, settings.general.sfx);
});
setInterval(() => {
	if (saves.current instanceof Save.Live && !game.isPaused) {
		saves.current.tick();
	}
}, 1000 / Level.tickRate);
const loop = () => {
	if (saves.current instanceof Save.Live) {
		if (!game.isPaused) {
			try {
				if (player.data().cam.alpha > Math.PI) player.data().cam.alpha -= 2 * Math.PI;
				if (player.data().cam.alpha < -Math.PI) player.data().cam.alpha += 2 * Math.PI;
				player.data().cam.angularSensibilityX = player.data().cam.angularSensibilityY = 2000 / settings.general.sensitivity;
				player.updateFleet();
				saves.current.meshes.forEach(mesh => {
					if (mesh instanceof CelestialBody) mesh.showBoundingBox = game.hitboxes;
					if (mesh.parent instanceof Entity) mesh.getChildMeshes().forEach(child => (child.showBoundingBox = game.hitboxes));
					if (mesh != saves.current.skybox && isHex(mesh.id)) mesh.showBoundingBox = game.hitboxes;
				});
				for (let ship of saves.current.entities.values()) {
					if (player.data().fleet.length > 0) {
						if (ship.hp <= 0) {
							player.data().addItems(ship._generic.recipe);
							if (Math.floor(player.levelOf(player.data().xp + ship._generic.xp)) > Math.floor(player.levelOf(player.data().xp))) {
								/*level up*/
								player.data().xpPoints++;
							}
							player.data().xp += ship._generic.xp;
						}
					}
				}
				player.updateFleet();
				player.data().position.addInPlace(player.data().velocity.scale(saves.current.getAnimationRatio()));
				player.data().velocity.scaleInPlace(0.9);
				saves.current.waypoints.forEach(waypoint => {
					let pos = waypoint.screenPos;
					waypoint.marker
						.css({
							position: 'fixed',
							left: Math.min(Math.max(pos.x, 0), innerWidth - settings.general.font_size) + 'px',
							top: Math.min(Math.max(pos.y, 0), innerHeight - settings.general.font_size) + 'px',
							fill: waypoint.color.toHexString(),
						})
						.filter('p')
						.text(
							BABYLON.Vector2.Distance(pos, new BABYLON.Vector2(innerWidth / 2, innerHeight / 2)) < 60 ||
								waypoint.marker.eq(0).is(':hover') ||
								waypoint.marker.eq(1).is(':hover')
								? `${waypoint.name} - ${minimize(BABYLON.Vector3.Distance(player.data().position, waypoint.position))} km`
								: ''
						);
					waypoint.marker[pos.z > 1 && pos.z < 1.15 ? 'hide' : 'show']();
				});
				$('#hud p.level').text(Math.floor(player.levelOf(player.data().xp)));
				$('#hud svg.xp rect').attr('width', (player.levelOf(player.data().xp) % 1) * 100 + '%');
				$('#debug .left').html(`
						<span>${version} ${game.mods.length ? `[${game.mods.join(', ')}]` : `(vanilla)`}</span><br>
						<span>${game.engine.getFps().toFixed()} FPS | ${saves.current.tps.toFixed()} TPS</span><br>
						<span>${saves.selected} (${saves.current.date.toLocaleString()})</span><br><br>
						<span>
							P: (${player.data().position.x.toFixed(1)}, ${player.data().position.y.toFixed(1)}, ${player.data().position.z.toFixed(1)}) 
							V: (${player.data().velocity.x.toFixed(1)}, ${player.data().velocity.y.toFixed(1)}, ${player.data().velocity.z.toFixed(1)}) 
							R: (${player.data().cam.alpha.toFixed(2)}, ${player.data().cam.beta.toFixed(2)})
						</span><br>
						`);
				$('#debug .right').html(`
						<span>Babylon v${BABYLON.Engine.Version} | jQuery v${$.fn.jquery}</span><br>
						<span>${game.engine._glRenderer}</span><br>
						<span>${
							performance.memory
								? `${(performance.memory.usedJSHeapSize / 1000000).toFixed()}MB/${(performance.memory.jsHeapSizeLimit / 1000000).toFixed()}MB (${(
										performance.memory.totalJSHeapSize / 1000000
								  ).toFixed()}MB Allocated)`
								: 'Memory usage unknown'
						}</span><br>
						<span>${navigator.hardwareConcurrency ?? 0} CPU Threads</span><br><br>
					`);

				saves.current.render();
			} catch (err) {
				console.error(`loop() failed: ${err.stack ?? err}`);
			}
		}
	}
};
ui.update();
$('#loading_cover').fadeOut(1000);
console.log('Game loaded successful');
game.engine.runRenderLoop(loop);
