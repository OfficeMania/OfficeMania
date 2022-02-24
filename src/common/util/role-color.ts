class RoleColor {
    private readonly _roleId: number;
    private readonly _nameColor: string;
    private readonly _nameColorChat: string;

    constructor(roleId: number, nameColor: string, nameColorChat?: string) {
        this._roleId = roleId;
        this._nameColor = nameColor;
        this._nameColorChat = nameColorChat ?? nameColor;
    }

    get roleId(): number {
        return this._roleId;
    }

    get nameColor(): string {
        return this._nameColor;
    }

    get nameColorChat(): string {
        return this._nameColorChat;
    }
}

export const ROLE_COLORS = {
    USER: new RoleColor(0, "#FFFFFFFF", "#000000FF"),
    ADMIN: new RoleColor(1, "#E00000FF"),
    MOD: new RoleColor(2, "#00E000FF", "#00A000FF"),
    VIP: new RoleColor(3, "#55FFFFFF"),
};

export function getRoleColor(roleId?: number): RoleColor {
    if (!roleId) {
        return ROLE_COLORS.USER;
    }
    return Object.values(ROLE_COLORS).filter(roleColor => roleColor.roleId === roleId)?.[0] ?? ROLE_COLORS.USER;
}
