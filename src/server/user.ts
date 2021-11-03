export default interface User {
    id: string;
    username: string;
}

const users: User[] = [];

export function findUserById(id: string): User {
    return users.find(user => user.id === id);
}

export function createUser(id: string, username: string): User {
    const user: User = {id, username};
    users.push(user);
    return user;
}
