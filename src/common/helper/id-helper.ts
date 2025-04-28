export class IdHelper {
    public static readonly ATTENDEE_PREFIX = 'a';
    public static readonly ORDER_PREFIX = 'o';
    public static readonly EVENT_PREFIX = 'e';
    public static readonly ACCOUNT_PREFIX = 'acc';

    public static readonly CHECK_IN_LIST_PREFIX = 'cil';
    public static readonly CHECK_IN_PREFIX = 'ci';

    public static shortId(prefix: string, length: number = 13): string {
        return `${prefix}_${this.generateRandomString(length)}`;
    }

    public static publicId(prefix: string = '', suffix: string = '', length: number = 7): string {
        return `${prefix}-${this.generateRandomString(length)}${suffix}`.toUpperCase();
    }

    private static generateRandomString(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
