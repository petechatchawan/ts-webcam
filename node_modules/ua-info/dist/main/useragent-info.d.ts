interface PropertyValue {
    value: BrowserName | Function | RegExp;
    transform?: Function;
}
interface PropertyDefinition {
    name?: BrowserName | OSName | PropertyValue;
    version?: string | PropertyValue;
    type?: string | PropertyValue;
    vendor?: string | PropertyValue;
    model?: string | PropertyValue;
}
interface MappingEntry {
    regex: RegExp[];
    properties: PropertyDefinition;
}
interface UserAgentResult {
    [key: string]: any;
}
export type BrowserName = 'Chrome' | 'Chrome Mobile' | 'Safari' | 'Safari Mobile' | 'Firefox' | 'Opera' | 'IE' | 'Edge' | 'Samsung Internet' | 'Facebook' | 'Line' | 'Instagram' | 'Twitter' | 'Tiktok' | 'Headless Chrome' | 'Chrome Webview' | 'Android Browser' | 'Xiaomi Browser' | 'Huawei Browser' | 'Other';
export type OSName = 'Windows' | 'Android' | 'iOS' | 'MacOS' | 'HarmonyOS' | 'Linux' | 'Other' | 'Chrome OS';
export interface UserAgentInfo {
    userAgentString: string;
    browser: BrowserInfo;
    os: OSInfo;
    device: DeviceInfo;
}
export interface BrowserInfo {
    name: BrowserName;
    version: string;
    type?: string;
    toString(): string;
}
export interface OSInfo {
    name: OSName;
    version: string;
    toString(): string;
}
export interface DeviceInfo {
    type: string;
    vendor: string;
    model: string;
    toString(): string;
}
declare class UAInfo {
    private userAgent;
    private uaInfo;
    constructor();
    setUserAgent(userAgent: string): this;
    getParsedUserAgent(): UserAgentInfo;
    parseUserAgent(): UserAgentInfo;
    mapper(mappings: MappingEntry[]): UserAgentResult;
    private processProperties;
    private applyProperty;
    getBrowser(): BrowserInfo;
    getOS(): OSInfo;
    getCpuCoreCount(): number;
    getMemory(): number;
    getDevice(): DeviceInfo;
    isIPad(): boolean;
    isBrowser(names: BrowserName | BrowserName[]): boolean;
    isInAppBrowser(): boolean;
    isOS(names: OSName | OSName[]): boolean;
    isDevice(types: string | string[]): boolean;
    isMobile(): boolean;
    isDesktop(): boolean;
    isTablet(): boolean;
    isBrowserVersionAtLeast(version: string): boolean;
    isOSVersionAtLeast(version: string): boolean;
    private compareVersions;
}
export { UAInfo, type MappingEntry, type PropertyDefinition, type PropertyValue, type UserAgentResult };
