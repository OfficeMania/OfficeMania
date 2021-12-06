export interface User {
    id: string;
    username: string;
    role: number;
}

export function getUserById(userId: string): Promise<User> {
    if (!userId) {
        return;
    }
    return fetch(`/api/user/${userId}`).then(response => response.json());
}
