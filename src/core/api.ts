export const API_URL = 'https://api.drvortex.dev';

export interface ApiResponse<R> {
	status: number;
	statusText: string;
	error: boolean;
	result: R;
}

export interface ApiReducedUserResult {
	id: string;
	username: string;
	oplvl: number;
	lastchange: string;
	created: string;
	disabled: boolean;
}

export interface ApiFullUserResult extends ApiReducedUserResult {
	password: string;
	token: string;
	session: string;
}

export interface User {
	id: string;
	username: string;
	oplvl: number;
	lastchange: Date;
	created: Date;
	disabled: boolean;
}

export function parseUser(user: ApiReducedUserResult): User {
	return {
		id: user?.id,
		username: user?.username,
		oplvl: user?.oplvl,
		lastchange: new Date(user?.lastchange),
		created: new Date(user?.created),
		disabled: user?.disabled,
	};
}

export async function login(email: string, password: string): Promise<ApiFullUserResult> {
	const res = await fetch(`${API_URL}/user`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action: 'login', email, password }),
	});
	const response: ApiResponse<ApiFullUserResult> = await res.json();
	if (response.error) {
		throw response.result;
	}

	return response.result;
}

export async function requestUserInfo(key: string, value: string): Promise<ApiReducedUserResult> {
	const res = await fetch(`${API_URL}/user?${key}=${value}`);
	const response: ApiResponse<ApiReducedUserResult> = await res.json();
	if (response.error) {
		throw response.result;
	}

	return response.result;
}
