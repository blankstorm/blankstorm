import $ from 'jquery';
import * as settings from './settings';
import { logger } from './utils';
import { runCommand, currentLevel } from './client';
import { chat } from './user';
import * as servers from './servers';
import { getCamera } from '../renderer';

/**
 * How many previous chat messages to cache
 */
const cacheSize = 1000;

/**
 * The index for which input is being shown
 */
let index: number = 0;

/**
 * The current, uncached input
 */
let currentInput: string = '';

/**
 * array of previous inputs
 */
const inputs: string[] = [];

/**
 * Easter egg
 */
let eggCounter: number = 0;

export function sendMessage(...msg: string[]): void {
	for (const m of msg) {
		logger.log('CHAT: ' + m);
		$(`<li bg=none></li>`)
			.text(m)
			.appendTo('#chat')
			.fadeOut(1000 * +settings.get('chat_timeout'));
		$(`<li bg=none></li>`).text(m).appendTo('#chat-history');
	}
}

export const inputElement = $('#chat-input');
export function handleInput(event: JQuery.KeyDownEvent): void {
	const inputValue = inputElement.val() as string;
	if (index == 0) {
		currentInput = inputValue;
	}
	switch (event.key) {
		case 'Escape':
			toggleUI();
			break;
		case 'ArrowUp':
			if (index < inputs.length) {
				inputElement.val(++eggCounter == 69 ? 'nice' : inputs[++index]);
			}
			break;
		case 'ArrowDown':
			eggCounter = 0;
			if (index > 0) {
				inputElement.val(--index == 0 ? currentInput : inputs[index]);
			}
			break;
		case 'Enter':
			if (/^\s*$/.test(inputValue)) {
				// Prevent empty or whitespace-only messages
				break;
			}
			eggCounter = 0;
			if (inputs[0] != currentInput) {
				inputs.unshift(inputValue);
				if (inputs.length > cacheSize) {
					inputs.pop();
				}
			}
			if (inputValue[0] == '/') {
				sendMessage(runCommand(inputValue.slice(1)) as string);
			} else if (currentLevel.isServer) {
				servers.get(servers.selected).socket.emit('chat', inputValue);
			} else {
				chat(inputValue);
			}
			inputElement.val('');
			toggleUI();
			index = 0;
			break;
	}
}

export function toggleUI(command?: boolean): void {
	$('#chat,#chat-history').toggle();
	if ($('#chat-input').toggle().is(':visible')) {
		getCamera().detachControl();
		$('#chat-input').trigger('focus');
		if (command) {
			$('#chat-input').val('/');
		}
	} else {
		$('canvas.game').trigger('focus');
	}
}

export function registerListeners(): void {
	inputElement.on('keydown', handleInput);
}
