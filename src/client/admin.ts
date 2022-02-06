export {};

function $<T extends HTMLElement>(a: string) {
    return <T>document.getElementById(a);
}

const divSettings: HTMLDivElement = $<HTMLDivElement>("settings");
const formSettings: HTMLFormElement = $<HTMLFormElement>("settings-form");
const templateSetting: HTMLTemplateElement = $<HTMLTemplateElement>("template-setting");

const apiEndpoint = "/api";
const configEndpoint = apiEndpoint + "/config";

class Setting {
    private readonly _div: HTMLDivElement;
    private readonly _label: HTMLLabelElement;
    private readonly _input: HTMLInputElement;

    private _name: string;
    private _description?: string;
    private _type: SettingType;
    private _key: string;
    private _value?: string;
    private _oldValue?: string;

    constructor(
        div: HTMLDivElement,
        label: HTMLLabelElement,
        input: HTMLInputElement,
        name: string,
        key: string,
        type: SettingType = "text",
        value?: string,
        description?: string
    ) {
        this._div = div;
        this._label = label;
        this._input = input;
        this._name = name;
        this._description = description;
        this._type = type;
        this._key = key;
        this._value = value;
        this._oldValue = value;
        this.setup();
        input.addEventListener("input", () => this.onInput());
    }

    get div(): HTMLDivElement {
        return this._div;
    }

    get label(): HTMLLabelElement {
        return this._label;
    }

    get input(): HTMLInputElement {
        return this._input;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    get type(): SettingType {
        return this._type;
    }

    set type(value: SettingType) {
        this._type = value;
    }

    get key(): string {
        return this._key;
    }

    set key(value: string) {
        this._key = value;
    }

    get value(): string {
        return this._value;
    }

    set value(value: string) {
        this._value = value;
    }

    get oldValue(): string {
        return this._oldValue;
    }

    set oldValue(value: string) {
        this._oldValue = value;
    }

    setup(): void {
        //TODO Set description as a tooltip or something like that
        this.div.id = `setting-${this.key}`;
        this.input.id = `setting-${this.key}-input`;
        this.input.name = this.key;
        this.input.type = this.type;
        this.reload();
        this.label.id = `setting-${this.key}-label`;
        this.label.htmlFor = this.input.id;
        this.label.textContent = this.name;
    }

    reload(): void {
        switch (this.type) {
            case "checkbox":
                this.input.checked = String(this.value) === "true";
                break;
            default:
                this.input.value = this.value ?? null;
                break;
        }
    }

    reset(): void {
        this.value = this.oldValue;
        this.reload();
    }

    onInput(): void {
        switch (this.type) {
            case "checkbox":
                this.value = String(this.input.checked);
                break;
            default:
                this.value = this.input.value;
                break;
        }
        console.debug("this.value:", this.value);
        const url = `${configEndpoint}?key=${this.key}&value=${this.value}`;
        console.debug("url:", url);
        fetch(url, { method: "PATCH" })
            .then(response => {
                console.debug("response:", response);
                if (response.ok) {
                    this.oldValue = this.value;
                } else {
                    this.reset();
                }
            })
            .catch(reason => {
                console.error("reason:", reason);
                this.reset();
            });
    }
}

type SettingType = "text" | "range" | "checkbox" | "date";

function createSetting(
    name: string,
    key: string,
    type: SettingType = "text",
    value?: string,
    description?: string
): Setting {
    const documentFragment: DocumentFragment = document.importNode(templateSetting.content, true);
    const div: HTMLDivElement = <HTMLDivElement>documentFragment.querySelector("#template-setting-div");
    const input: HTMLInputElement = <HTMLInputElement>documentFragment.querySelector("#template-setting-input");
    const label: HTMLLabelElement = <HTMLLabelElement>documentFragment.querySelector("#template-setting-label");
    return new Setting(div, label, input, name, key, type, value, description);
}

const settings: Setting[] = [];

function appendSettings(settings: Setting[]): void {
    settings.forEach(setting => formSettings.appendChild(setting.div));
}

function processConfigEntriesResponse(configEntries: any[]): ConfigEntry<any>[] {
    return configEntries.map(entry => {
        const type: number = entry.type;
        const value: string | undefined = entry.value;
        let settingType: SettingType;
        let valueProcessed: any;
        switch (type) {
            case 0:
                settingType = "text";
                valueProcessed = value;
                break;
            case 1:
                settingType = "text";
                valueProcessed = value ? parseInt(value, 10) : undefined;
                break;
            case 2:
                settingType = "checkbox";
                valueProcessed = value ? value === "true" : undefined;
                break;
            case 3:
                settingType = "date";
                valueProcessed = value ? new Date(value) : undefined;
                break;
            default:
                throw new Error(`Unknown Type: ${type}`);
        }
        return {
            key: entry.key,
            settingType,
            value: valueProcessed,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
        };
    });
}

function test(): void {
    console.debug("Hello World Admin");
    fetch(configEndpoint)
        .then(response => response.json())
        .then(configEntries => processConfigEntriesResponse(configEntries))
        .then((configEntries: ConfigEntry<any>[]) => {
            console.debug(configEntries);
            configEntries.forEach(configEntry =>
                settings.push(createSetting(configEntry.key, configEntry.key, "checkbox", configEntry.value))
            );
            appendSettings(settings);
        });
}

test();

interface ConfigEntry<T> {
    //TODO Move the database entities into common
    key: string;
    settingType: SettingType,
    value?: T;
    createdAt: Date;
    updatedAt: Date;
}
