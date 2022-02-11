export interface User {
    id: string;
    username: string;
    role: number;
}

export function getUserById(userId: string): Promise<User> {
    if (!userId || userId === "undefined") {
        return;
    }
    return fetch(`/api/users/${userId}`).then(response => response.json());
}
