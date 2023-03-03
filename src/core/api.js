export const URL = 'https://blankstorm.drvortex.dev/api/';

export async function requestUserInfo(key, value) {
	const res = await fetch(`${URL}user?${key}=${value}`);
	return await res.json();
}
