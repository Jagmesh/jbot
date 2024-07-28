export class LogService {
    private scopes: string[] = [];
    constructor(...scopes: string[]) {
        this.scopes = [...scopes];
        return this;
    }

    write(...args: any[]) {
        console.log(`[${this.getLocalDate()}]: \x1b[32m[LOG]\x1b[0m\x1b[35m[${this.scopes.join('][')}]\x1b[0m`, ...args);
    }

    error(...args: any[]) {
        console.log(`[${this.getLocalDate()}]: \x1b[31m[ERROR]\x1b[0m\x1b[35m[${this.scopes.join('][')}]\x1b[0m`, ...args);
    }

    private getLocalDate() {
        const date = new Date();
        date.setHours(date.getHours() + 3);
        return date.toJSON().slice(0, -5).replace(/T/, ' ');
    }
}