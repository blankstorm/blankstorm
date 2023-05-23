export const API_URL = 'https://api.drvortex.dev';

export async function login(email: string, password: string) {
	const res = await fetch(`${API_URL}/user`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action: 'login', email, password }),
	});
	return await res.json();
}

export async function requestUserInfo(key: string, value: string) {
	const res = await fetch(`${API_URL}/user?${key}=${value}`);
	return await res.json();
}
