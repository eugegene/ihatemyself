export enum Gender {
	Male = 0,
	Female = 1,
	Nonbinary = 2,
	Other = 3,
}

export enum UserRole {
	Admin = 0,
	Moderator = 1,
	User = 2,
}
export interface UserDto {
	email?: string;
	username?: string;
	role: UserRole;
	country?: string;
	gender: Gender;
	profilePicUrl?: string;

	// reviews?: any[];
	// following?: any[];
	// followers?: any[];
	// collections?: any[];
}

export interface LoginRequest {
	email: string;
	password?: string;
}

export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
	confirmPassword?: string;
}

export interface RenewTokenRequest {
	refreshToken: string;
}

export interface TokensResponse extends UserDto {
	accessToken?: string;
	refreshToken?: string;
}
