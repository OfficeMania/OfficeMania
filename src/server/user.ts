export default interface User {
    id: string;
    username: string;
    password: string;
}

const users: User[] = [];

export function findUserById(id: string): User {
    return users.find(user => user.id === id);
}

export function createUser(id: string, username: string, password: string = undefined): User {
    const user: User = {id, username, password};
    users.push(user);
    return user;
}

export function isValidPassword(user: User, password: string): boolean {
    if (!user) {
        return false;
    }
    return user.password === password;
}