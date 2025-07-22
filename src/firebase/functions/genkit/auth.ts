export function isAdmin(context: any): boolean {
	return context?.auth?.token?.firebase?.sign_in_provider === "password";
}

export function assertAdmin(context: any) {
	if (!isAdmin(context)) {
		throw new Error("Permission denied – admin privileges required.");
	}
}
