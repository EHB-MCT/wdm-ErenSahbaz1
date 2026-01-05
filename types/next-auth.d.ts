import "next-auth";

declare module "next-auth" {
	interface User {
		id: string;
		isAdmin: boolean;
	}

	interface Session {
		user: {
			id: string;
			email: string;
			name: string;
			isAdmin: boolean;
		};
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		isAdmin: boolean;
	}
}
