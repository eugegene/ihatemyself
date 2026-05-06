
export interface UserState {
	username: string;
	email: string;
	role: string;
	profilePicUrl?: string;
}

let user = $state<UserState | null>(null);

export const userStore = {
	get value() {
		return user;
	},
	set(newUser: UserState | null) {
		user = newUser;
	},
	init(data: UserState | null) {
		user = data;
	},
};
