export function alert(text: string): Promise<boolean> {
	return new Promise<boolean>(resolve => {
		$('#alert .message').html(text.replaceAll('\n', '<br>'));
		$('#alert .ok').on('click', () => {
			$<HTMLDialogElement>('#alert')[0].close();
			resolve(true);
		});
		$<HTMLDialogElement>('#alert')[0].showModal();
	});
}

export function confirm(text: string): Promise<boolean> {
	return new Promise<boolean>(resolve => {
		$('#confirm .message').html(text.replaceAll('\n', '<br>'));
		$('#confirm .ok').on('click', () => {
			$<HTMLDialogElement>('#confirm')[0].close();
			resolve(true);
		});
		$('#confirm .cancel').on('click', () => {
			$<HTMLDialogElement>('#confirm')[0].close();
			resolve(false);
		});
		$<HTMLDialogElement>('#confirm')[0].showModal();
	});
}
