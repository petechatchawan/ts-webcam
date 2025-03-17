const WindowsVersionMappings = {
    '11': /nt 11/i,
    '10': /nt 10/i,
    '8.1': /nt 6.3/i,
    '8': /nt 6.2/i,
    '7': /nt 6.1/i,
    Vista: /nt 6.0/i,
    XP: /nt 5.1/i,
    '2000': /nt 5.0/i,
    ME: /9x 4.90/i,
    '98': /98/i,
    '95': /95/i,
    'NT 4.0': /nt 4.0/i,
    'NT 3.51': /nt 3.51/i,
    'NT 3.11': /nt 3.11/i,
    CE: /ce/i,
    RT: /rt/i,
};
const ModelMappings = {
    Apple: {
        'iPhone SE': /iphone\sse/i,
        'iPhone 12': /iphone13,3/i,
        'iPhone 12 Mini': /iphone13,1/i,
        'iPhone 12 Pro Max': /iphone13,4/i,
        'iPhone 12 Pro': /iphone13,2/i,
        'iPhone SE (2nd generation)': /iphone12,8/i,
        'iPhone SE (1st generation)': /iphone8,4/i,
        'iPhone 11': /iphone12,1/i,
        iPhone: /iphone/i,
        iPad: /ipad/i,
        MacBook: /mac os x/i,
    },
    Samsung: {
        'Galaxy S24 FE': /sm-s721[a-z]|sm-s721[a-z](\/[z-z]{2,3})?$/i,
        'Galaxy S24 Ultra': /sm-s928[b-z]|sm-s928[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy S24+': /sm-s926[b-z]|sm-s926[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy S24': /sm-s921[b-z]|sm-s921[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy S23 Ultra': /sm-s918[b-z]|sm-s918[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy S23+': /sm-s916[b-z]|sm-s916[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy S23': /sm-s911[b-z]|sm-s911[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy S23 FE': /sm-s711[b-z]|sm-s711[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy S22 Ultra': /sm-s908[b-z]|sm-s908[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy S22+': /sm-s906[b-z]|sm-s906[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy S22': /sm-s901[b-z]|sm-s901[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Z Fold5': /sm-f946[b-z]|sm-f946[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Z Flip5': /sm-f731[b-z]|sm-f731[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Z Fold4': /sm-f936[b-z]|sm-f936[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Z Flip4': /sm-f721[b-z]|sm-f721[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy A54': /sm-a546[0beuv](\/ds)?(?!\S)/i,
        'Galaxy A53 5G': /sm-a536[b-z]|sm-a536[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy A34': /sm-a346[b-z]|sm-a346[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy A33 5G': /sm-a336[b-z]|sm-a336[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy A24': /sm-a245[b-z]|sm-a245[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy A23 5G': /sm-a236[b-z]|sm-a236[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy A14 5G': /sm-a146[b-z]|sm-a146[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy A14': /sm-a145[b-z]|sm-a145[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy A04s': /sm-a047[b-z]|sm-a047[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy M54 5G': /sm-m546[b-z]|sm-m546[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy M53 5G': /sm-m536[b-z]|sm-m536[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy M33 5G': /sm-m336[b-z]|sm-m336[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy M23 5G': /sm-m236[b-z]|sm-m236[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy F54 5G': /sm-e546[b-z]|sm-e546[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy F23 5G': /sm-e236[b-z]|sm-e236[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Xcover6 Pro': /sm-g736[b-z]|sm-g736[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Tab S9 Ultra': /sm-x915[b-z]|sm-x915[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Tab S9+': /sm-x815[b-z]|sm-x815[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Tab S9': /sm-x715[b-z]|sm-x715[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Tab S8 Ultra': /sm-x906[b-z]|sm-x906[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Tab S8+': /sm-x806[b-z]|sm-x806[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Tab S8': /sm-x706[b-z]|sm-x706[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Tab A8': /sm-x205[b-z]|sm-x205[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Tab A7 Lite': /sm-t225[b-z]|sm-t225[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Watch6 Classic': /sm-r960[b-z]|sm-r960[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy Watch6': /sm-r950[b-z]|sm-r950[b-z](\/[a-z]{2,3})?$/i,
        'Galaxy A55': /sm-a556[a-z]|sm-a556[a-z](\/[z-z]{2,3})?$/i,
        'Galaxy A15': /sm-a155[a-z]|sm-a155[a-z](\/[z-z]{2,3})?$/i,
        'Galaxy M35': /sm-m35[0-9][a-z]|sm-m35[0-9][a-z](\/[a-z]{2,3})?$/i,
        'Galaxy A05': /sm-a055[a-z]|sm-a055[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy A25': /sm-a256[a-z]|sm-a256[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy A06': /sm-a065[a-z]|sm-a065[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy A15 5G': /sm-a156[a-z]|sm-a156[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy A05s': /sm-a057[a-z]|sm-a057[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy Z Fold6': /sm-f946[a-z]|sm-f946[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy M55': /sm-m556[a-z]|sm-m556[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy M15': /sm-m156[a-z]|sm-m156[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy Z Flip6': /sm-f736[a-z]|sm-f736[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy F55': /sm-e556[a-z]|sm-e556[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy A24 4G': /sm-a245[a-z]|sm-a245[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy M14': /sm-m146[a-z]|sm-m146[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy M34 5G': /sm-m346[a-z]|sm-m346[a-z](\/[a-z]{2,3})?$/i,
        'Galaxy S21': /sm-g99[1-3]/i,
        'Galaxy S20': /sm-g98[0-6]/i,
        'Galaxy S10': /sm-g97[0-3]/i,
        'Galaxy Note20': /sm-n98[0-6]/i,
        'Galaxy A51': /sm-a515[a-z]/i,
        'Galaxy A52': /sm-a525/i,
        'Galaxy Tab S7': /sm-t87[0-5]/i,
        'Galaxy Tab S6': /sm-t86[0-5]/i,
        'Galaxy Tab S6 Lite': /sm-610n/i,
        'Galaxy Tab A7': /sm-t227[a-zA-Z]/i,
        'Galaxy Tab A': /sm-t550/i,
    },
    Vivo: {
        'X60 Pro': /V2046/i,
        V20: /V2034/i,
        Y20: /V2027/i,
        'NEX 3': /V1924A/i,
    },
    Oppo: {
        'Find X3 Pro': /CPH2173/i,
        'Reno5 Pro': /CPH2201|CPH2159/i,
        A74: /CPH2219/i,
        'F19 Pro': /CPH2285/i,
    },
    Huawei: {
        'P40 Pro': /ELS-NX9/i,
        'P30 Pro': /VOG-L29/i,
        'Mate 40 Pro': /NOH-NX9/i,
        'Nova 7': /JEF-AN00/i,
    },
    Realme: {
        '8 Pro': /RMX3081/i,
        '7 5G': /RMX2111/i,
        'X7 Pro': /RMX2121/i,
        'GT Neo 5': /rmx3706/i,
        'GT 3': /rmx3709/i,
        C15: /RMX2180/i,
    },
    Xiaomi: {
        'Mi 11': /M2011K2G/i,
        'Redmi Note 10 Pro': /M2101K6G/i,
        'Poco X3 NFC': /M2007J20CG/i,
        'Mi 10T Pro': /M2007J3SG/i,
    },
    Google: {
        'Pixel 8 Pro': /pixel 8 pro|gp3l(?!\S)/i,
        'Pixel 8': /pixel 8|gkws(?!\S)/i,
        'Pixel 7 Pro': /pixel 7 pro|gp4bc(?!\S)/i,
        'Pixel 7': /pixel 7|panther(?!\S)/i,
        'Pixel 7a': /pixel 7a|lynx(?!\S)/i,
        'Pixel 6 Pro': /pixel 6 pro|raven(?!\S)/i,
        'Pixel 6a': /pixel 6a|bluejay(?!\S)/i,
        'Pixel 6': /pixel 6|oriole(?!\S)/i,
        'Pixel 5': /pixel 5|redfin(?!\S)/i,
        'Pixel 5a': /pixel 5a|barbet(?!\S)/i,
        'Pixel 4 XL': /pixel 4 xl|coral(?!\S)/i,
        'Pixel 4': /pixel 4|flame(?!\S)/i,
        'Pixel 4a': /pixel 4a|sunfish(?!\S)/i,
        'Pixel 4a 5G': /pixel 4a 5g|bramble(?!\S)/i,
        'Pixel 3 XL': /pixel 3 xl|crosshatch(?!\S)/i,
        'Pixel 3': /pixel 3|blueline(?!\S)/i,
        'Pixel 3a XL': /pixel 3a xl|bonito(?!\S)/i,
        'Pixel 3a': /pixel 3a|sargo(?!\S)/i,
        'Pixel 2 XL': /pixel 2 xl|taimen(?!\S)/i,
        'Pixel 2': /pixel 2|walleye(?!\S)/i,
        'Pixel XL': /pixel xl|marlin(?!\S)/i,
        Pixel: /pixel(?!\s)|sailfish(?!\S)/i,
        'Pixel C': /pixel c(?!\S)/i,
        'Pixel Tablet': /pixel tablet|tangorpro(?!\S)/i,
        'Pixel Fold': /pixel fold|felix(?!\S)/i,
        'Nexus 6P': /nexus 6p|angler(?!\S)/i,
        'Nexus 5X': /nexus 5x|bullhead(?!\S)/i,
        'Nexus 6': /nexus 6|shamu(?!\S)/i,
        'Nexus 5': /nexus 5|hammerhead(?!\S)/i,
        'Nexus 4': /nexus 4|mako(?!\S)/i,
        'Nexus 7 (2013)': /nexus 7.*2013|razor(?!\S)/i,
        'Nexus 7': /nexus 7|grouper(?!\S)/i,
        'Nexus 10': /nexus 10|mantaray(?!\S)/i,
        'Pixelbook Go': /pixelbook go(?!\S)/i,
        Pixelbook: /pixelbook(?!\S)/i,
        'Pixel Slate': /pixel slate(?!\S)/i,
        Chromecast: /chromecast(?!\S)/i,
        'Google Home': /google home(?!\S)/i,
        'Nest Hub': /nest hub(?!\S)/i,
        'Nest Audio': /nest audio(?!\S)/i,
        'Nest Mini': /nest mini(?!\S)/i,
    },
    Asus: {
        'ROG Phone 5': /ASUS_I005D/i,
        'ZenFone 7 Pro': /ASUS_I002D/i,
        'ROG Phone 3': /ASUS_I003D/i,
        'ZenFone 6': /ASUS_I01WD/i,
    },
    OnePlus: {
        '9 Pro': /LE2120/i,
        Nord: /AC2003/i,
        '8T': /KB2000/i,
        '7T Pro': /HD1910/i,
    },
    Windows: {
        'Windows 11': /windows nt 11/i,
        'Windows 10': /windows nt 10/i,
        'Windows 8.1': /windows nt 6.3/i,
        'Windows 8': /windows nt 6.2/i,
        'Windows 7': /windows nt 6.1/i,
        'Windows Vista': /windows nt 6.0/i,
        'Windows XP': /windows nt 5.1/i,
        'Windows 2000': /windows nt 5.0/i,
        'Windows ME': /windows 9x 4.90/i,
        'Windows 98': /windows nt 4.0/i,
        'Windows 95': /windows nt 4.0/i,
        'Windows NT 4.0': /windows nt 4.0/i,
        'Windows NT 3.51': /windows nt 3.51/i,
        'Windows NT 3.11': /windows nt 3.11/i,
        'Windows CE': /windows ce/i,
        'Windows RT': /arm/i,
    },
};
//#region Browser Mappings
const BrowserMappings = [
    {
        regex: [/\b(?:crmo|crios)\/([\w\.]+)/i],
        properties: {
            version: { value: (match) => match },
            name: 'Chrome Mobile',
        },
    },
    {
        regex: [/edg(?:e|ios|a)?\/([\w\.]+)/i],
        properties: {
            version: { value: (match) => match },
            name: 'Edge',
        },
    },
    {
        regex: [/samsungbrowser\/([\w\.]+)/i],
        properties: {
            version: { value: (match) => match },
            name: 'Samsung Internet',
        },
    },
    {
        regex: [/HuaweiBrowser\/([\d\.]+)/i],
        properties: {
            version: { value: (match) => match },
            name: 'Huawei Browser',
        },
    },
    {
        regex: [/XiaoMi\/MiuiBrowser\/([\d\.]+)/i],
        properties: {
            version: { value: (match) => match },
            name: 'Xiaomi Browser',
        },
    },
    {
        regex: [/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i],
        properties: {
            name: 'Facebook',
            version: { value: (match) => match },
            type: 'inapp',
        },
    },
    {
        regex: [/safari (line)\/([\w\.]+)/i, /\b(line)\/([\w\.]+)\/iab/i],
        properties: {
            name: 'Line',
            version: { value: (match) => match },
            type: 'inapp',
        },
    },
    {
        regex: [/(twitter)(?:and| f.+e\/([\w\.]+))/i],
        properties: {
            name: 'Twitter',
            version: { value: (match) => match },
        },
    },
    {
        regex: [/instagram[\/ ]([-\w\.]+)/i],
        properties: {
            name: 'Instagram',
            version: { value: (match) => match },
            type: 'inapp',
        },
    },
    {
        regex: [/musical_ly(?:.+app_?version\/|_)([\w\.]+)/i],
        properties: {
            name: 'Tiktok',
            version: { value: (match) => match },
        },
    },
    {
        regex: [/headlesschrome(?:\/([\w\.]+)| )/i],
        properties: {
            version: { value: (match) => match },
            name: 'Headless Chrome',
        },
    },
    {
        regex: [/chrome\/([\w\.]+) mobile/i],
        properties: {
            version: { value: (match) => match },
            name: 'Chrome Mobile',
        },
    },
    {
        regex: [/ wv\).+(chrome)\/([\w\.]+)/i],
        properties: {
            version: { value: (match) => match },
            name: 'Chrome Webview',
        },
    },
    {
        regex: [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i],
        properties: {
            version: { value: (match) => match },
            name: 'Android Browser',
        },
    },
    {
        regex: [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i],
        properties: {
            name: 'Chrome',
            version: { value: (match) => match },
        },
    },
    {
        regex: [/firefox\/(\d+(?:\.\d+)?)/],
        properties: {
            name: 'Firefox',
            version: { value: (match) => match },
        },
    },
    {
        regex: [/version\/([\w\.\,]+) .*mobile(?:\/\w+ | ?)safari/i, /iphone .*mobile(?:\/\w+ | ?)safari/i],
        properties: {
            version: { value: (match) => match },
            name: 'Safari Mobile',
        },
    },
    {
        regex: [/version\/([\w\.\,]+) .*(safari)/i, /webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i],
        properties: {
            version: { value: (match) => match },
            name: 'Safari',
        },
    },
];
//#endregion
//#region OS Mappings
const OSMappings = [
    {
        regex: [
            /windows nt 6\.2; (arm)/i,
            /windows (?:phone(?: os)?|mobile)[\/ ]?([\d\.]+)/i,
            /windows[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i,
            /win(?=3|9|n|1|2000|xp|vista|7|8|10|11)|win 9x/i,
            /windows me/i, // Windows ME
        ],
        properties: {
            version: {
                value: (match) => match,
                transform: (value) => mapWindows(value),
            },
            name: 'Windows',
        },
    },
    {
        regex: [
            /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i,
            /(?:ios;fbsv\/|iphone.+ios[\/ ])([\d\.]+)/i,
            /cfnetwork\/.+darwin/i,
        ],
        properties: {
            version: {
                value: (match) => match,
                transform: (value) => formatVersion(value),
            },
            name: 'iOS',
        },
    },
    {
        regex: [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i],
        properties: {
            name: 'MacOS',
            version: {
                value: (match) => match,
                transform: (value) => formatVersion(value),
            },
        },
    },
    {
        regex: [/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i],
        properties: {
            version: { value: (match) => match },
            name: 'HarmonyOS',
        },
    },
    {
        regex: [
            /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
            /(blackberry)\w*\/([\w\.]*)/i,
            /(tizen|kaios)[\/ ]([\w\.]+)/i,
            /\((series40);/i, // Series 40
        ],
        properties: {
            name: 'Android',
            version: { value: (match) => match },
        },
    },
    {
        regex: [/(cros) [\w]+(?:\)| ([\w\.]+)\b)/i],
        properties: {
            name: 'Chrome OS',
            version: { value: (match) => match },
        },
    },
    {
        regex: [/(linux) ?([\w\.]*)/i],
        properties: {
            name: 'Linux',
            version: { value: (match) => match },
        },
    },
];
//#endregion
const DeviceMappings = [
    /**
     *
     *  Apple
     *
     */
    {
        regex: [
            /\biphone(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i,
            /\biphone(?:[^\w]*)([\w,]+)(?:\/|;)/i,
            /\biphone(?:; CPU iPhone OS (\d+_\d+_\d+) like Mac OS X)?/i,
        ],
        properties: {
            type: 'mobile',
            vendor: 'Apple',
            model: 'iPhone',
        },
    },
    {
        regex: [
            /\((ipad);[-\w\),; ]+apple/i,
            /applecoremedia\/[\w\.]+ \((ipad)/i,
            /\b(ipad)\d\d?,\d\d?[;\]].+ios/i,
            /ipad(?:; CPU OS (\d+_\d+_\d+) like Mac OS X)?/i,
        ],
        properties: {
            type: 'tablet',
            vendor: 'Apple',
            model: 'iPad',
        },
    },
    {
        regex: [/(macintosh);/i],
        properties: {
            type: 'desktop',
            vendor: 'Apple',
            model: 'Mac',
        },
    },
    /**
     *
     *  Samsung
     *
     */
    {
        regex: [
            /\b(sch-i[89]0\d|shw-m380s|sm-t860|sm-610n|sm-x91[06]?[b-z]|sm-x915[b-z]|sm-t\d{3}|sm-[pt]\d{3,4}[u]|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)\b/i,
        ],
        properties: {
            model: {
                value: (match) => match,
            },
            type: 'tablet',
            vendor: 'Samsung',
        },
    },
    {
        regex: [
            /\b((?:s[cgp]h|gt|sm)-(?![pt])\w+|sc[g-]?[\d]+a?|galaxy (?:nexus|[szfam]\d{0,2}))\b/i,
            /samsung[- ]((?!sm-[pt])[-\w]+)/i,
            /sec-(sgh\w+)/i,
        ],
        properties: {
            model: {
                value: (match) => match,
                transform: (value) => mapDeviceModel(value),
            },
            type: 'mobile',
            vendor: 'Samsung',
        },
    },
    /**
     *
     *  Huawei
     *
     */
    {
        regex: [
            /\b((?:ag[rs][2356]?k?|bah[234]?|bg[2o]|bt[kv]|cmr|cpn|db[ry]2?|jdn2|got|kob2?k?|mon|pce|scm|sht?|[tw]gr|vrd)-[ad]?[lw][0125][09]b?|605hw|bg2-u03|(?:gem|fdr|m2|ple|t1)-[7a]0[1-4][lu]|t1-a2[13][lw]|mediapad[\w\. ]*(?= bui|\)))\b(?!.+d\/s)/i,
        ],
        properties: {
            type: 'tablet',
            vendor: 'Huawei',
            model: {
                value: (match) => match,
            },
        },
    },
    {
        regex: [
            /(?:huawei)([-\w ]+)[;\)]/i,
            /(?:HMSCore|GMSCore|;\s*MRD-|;\s*MNA-|;\s*KSA-|P60\s*Pro)/i,
            /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i,
        ],
        properties: {
            type: 'mobile',
            vendor: 'Huawei',
            model: {
                value: (match) => match,
            },
        },
    },
    /**
     *
     *  Xiaomi
     *
     */
    {
        regex: [/\b(?:mi|Mi|redmi|poco|m210[12]|mi pad)\b/i],
        properties: {
            type: 'mobile',
            vendor: 'Xiaomi',
            model: '',
        },
    },
    /**
     *
     *  Oppo
     *
     */
    {
        regex: [/\b(?:oppo|cp\d{4}|CPH\d{4}|x90)\b/i],
        properties: {
            type: 'mobile',
            vendor: 'Oppo',
            model: '',
        },
    },
    /**
     *
     *  Realme
     *
     */
    {
        regex: [/\b(?:realme|rmx\d{4}|RMX\d{4})\b/i],
        properties: {
            type: 'mobile',
            vendor: 'Realme',
            model: '',
        },
    },
    /**
     *
     *  Vivo
     *
     */
    {
        regex: [/\b(?:vivo|v\d{4})\b/i, /\bv19\d{2}a\b/i],
        properties: {
            type: 'mobile',
            vendor: 'vivo',
            model: '',
        },
    },
    /**
     *
     *  Google
     *
     */
    {
        regex: [/\b(?:pixel tablet)\b/i],
        properties: {
            type: 'tablet',
            vendor: 'Google',
            model: '',
        },
    },
    {
        regex: [/\b(?:pixel|GP3L)\b/i],
        properties: {
            type: 'mobile',
            vendor: 'Google',
            model: '',
        },
    },
    /**
     *
     *  Asus
     *
     */
    {
        regex: [/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i],
        properties: {
            type: 'tablet',
            vendor: 'Asus',
            model: '',
        },
    },
    {
        regex: [/(z[bes]6[0-9][0-9][km][ls]|zenfone \d\w?)\b/i],
        properties: {
            type: 'tablet',
            vendor: 'Asus',
            model: '',
        },
    },
    /**
     *
     *  OnePlus
     *
     */
    {
        regex: [/\b(?:oneplus|a\d{4})\b/i],
        properties: {
            type: 'mobile',
            vendor: 'OnePlus',
            model: '',
        },
    },
    /**
     *
     *  Nokia
     *
     */
    {
        regex: [/nokia[\s\-]?(\d+(\.\d+)?( plus)?|[a-z0-9]+)\b/i],
        properties: {
            type: 'mobile',
            vendor: 'Nokia',
            model: '',
        },
    },
    /**
     *
     *  Lenovo
     *
     */
    {
        regex: [/(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i],
        properties: {
            type: 'tablet',
            vendor: 'Lenovo',
            model: '',
        },
    },
    /**
     *
     *  Sony
     *
     */
    {
        regex: [/droid.+ (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12]|xq-bc\d{2,3})/i],
        properties: {
            type: 'mobile',
            vendor: 'Sony',
            model: '',
        },
    },
    {
        regex: [/\b(?:sony)?sgp\w+(?: bui|\))/i, /sony tablet [ps]/i],
        properties: {
            type: 'tablet',
            vendor: 'Sony',
            model: '',
        },
    },
    /**
     *
     *  Microsoft
     *
     */
    {
        regex: [/\b(windows phone|surface)\b/i, /(surface duo)/i],
        properties: {
            type: 'mobile',
            vendor: 'Microsoft',
            model: '',
        },
    },
    /**
     *
     *  Windows
     *
     */
    {
        regex: [
            /windows nt 6\.2; (arm)/i,
            /windows[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i,
            /(?:win(?=3|9|n)|win 9x )([nt\d\.]+)/i,
        ],
        properties: {
            type: 'desktop',
            vendor: 'Microsoft',
            model: '',
        },
    },
    /**
     *
     *  Generic Mobile type
     *
     */
    {
        regex: [
            /\bandroid ([\d.]+)/i,
            /android.*chrome\/[.0-9]* (?!mobile)/i,
            /\b(android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini)/i,
            /(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i,
            /android.*mobile|mobile.*android/i,
        ],
        properties: {
            type: 'mobile',
            vendor: 'Generic',
            model: '',
        },
    },
    /**
     *
     *  Generic Tablet type
     *
     */
    {
        regex: [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i],
        properties: {
            type: 'tablet',
            vendor: 'Generic',
            model: '',
        },
    },
];
class UAInfo {
    constructor() {
        this.userAgent = '';
    }
    setUserAgent(userAgent) {
        this.userAgent = userAgent;
        this.uaInfo = this.parseUserAgent();
        return this;
    }
    getParsedUserAgent() {
        return this.uaInfo;
    }
    parseUserAgent() {
        const browser = this.mapper(BrowserMappings);
        const os = this.mapper(OSMappings);
        const device = this.mapper(DeviceMappings);
        return {
            userAgentString: this.userAgent,
            browser: Object.assign(Object.assign({ name: browser['name'], version: browser['version'] }, (browser['type'] ? { type: browser['type'] } : {})), { toString: () => `${browser['name']} ${browser['version']}`.trim() }),
            os: {
                name: os['name'],
                version: os['version'],
                toString: () => `${os['name']} ${formatVersion(os['version'])}`.trim(),
            },
            device: {
                type: device['type'],
                vendor: device['vendor'],
                model: device['model'],
                toString: () => `${device['vendor']} ${device['model']}`.trim(),
            },
        };
    }
    mapper(mappings) {
        const result = {};
        for (let i = 0; i < mappings.length; i++) {
            const entry = mappings[i];
            for (let j = 0; j < entry.regex.length; j++) {
                const regex = entry.regex[j];
                const matches = regex.exec(this.userAgent.toLowerCase());
                if (matches) {
                    this.processProperties(matches, entry.properties, result);
                    break;
                }
            }
            if (Object.keys(result).length > 0) {
                break;
            }
        }
        return result;
    }
    processProperties(matches, properties, result) {
        const keys = Object.keys(properties);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const prop = properties[key];
            const match = matches[i + 1];
            if (typeof prop === 'string') {
                result[key] = prop;
            }
            else if (prop) {
                this.applyProperty(key, prop, match, result);
            }
        }
    }
    applyProperty(key, prop, match, result) {
        let value;
        if (typeof prop.value === 'function') {
            value = prop.value.call(this, match);
        }
        else {
            value = prop.value;
        }
        if (prop.transform) {
            result[key] = prop.transform.call(this, match, value);
        }
        else {
            result[key] = value;
        }
    }
    getBrowser() {
        return this.uaInfo.browser;
    }
    getOS() {
        return this.uaInfo.os;
    }
    getCpuCoreCount() {
        var _a;
        return (_a = navigator.hardwareConcurrency) !== null && _a !== void 0 ? _a : null;
    }
    getMemory() {
        var _a;
        return (_a = navigator.deviceMemory) !== null && _a !== void 0 ? _a : null;
    }
    getDevice() {
        return this.uaInfo.device;
    }
    isIPad() {
        const isStandalone = 'standalone' in window.navigator && !!window.navigator['standalone'];
        return this.uaInfo.os.name === 'MacOS' && isStandalone && navigator.maxTouchPoints > 0;
    }
    isBrowser(names) {
        const browserNames = Array.isArray(names) ? names : [names];
        return browserNames.includes(this.uaInfo.browser.name);
    }
    isInAppBrowser() {
        return this.uaInfo.browser.type === 'inapp';
    }
    isOS(names) {
        const browserNames = Array.isArray(names) ? names : [names];
        return browserNames.includes(this.uaInfo.os.name);
    }
    isDevice(types) {
        const deviceTypes = Array.isArray(types) ? types : [types];
        return deviceTypes.includes(this.uaInfo.device.type);
    }
    isMobile() {
        return this.uaInfo.device.type === 'mobile';
    }
    isDesktop() {
        return this.uaInfo.device.type === 'desktop';
    }
    isTablet() {
        return this.uaInfo.device.type === 'tablet';
    }
    isBrowserVersionAtLeast(version) {
        return this.compareVersions(this.uaInfo.browser.version, version) >= 0;
    }
    isOSVersionAtLeast(version) {
        return this.compareVersions(this.uaInfo.os.version, version) >= 0;
    }
    compareVersions(current, target) {
        const currentParts = current.split('.').map(Number);
        const targetParts = target.split('.').map(Number);
        const maxLength = Math.max(currentParts.length, targetParts.length);
        for (let i = 0; i < maxLength; i++) {
            const currentPart = currentParts[i] || 0;
            const targetPart = targetParts[i] || 0;
            const diff = currentPart - targetPart;
            if (diff !== 0) {
                return Math.sign(diff);
            }
        }
        return 0;
    }
}
function formatVersion(version) {
    return version && /_/g.test(version) ? version.replace(/_/g, '.') : version !== null && version !== void 0 ? version : '';
}
function mapWindows(str) {
    for (const [key, value] of Object.entries(WindowsVersionMappings)) {
        if (value.test(str)) {
            return key;
        }
    }
    return str;
}
function mapDeviceModel(userAgent) {
    const brands = Object.keys(ModelMappings);
    for (let i = 0; i < brands.length; i++) {
        const brand = brands[i];
        const models = ModelMappings[brand];
        const modelNames = Object.keys(models);
        for (let j = 0; j < modelNames.length; j++) {
            const modelName = modelNames[j];
            const regex = models[modelName];
            if (regex.test(userAgent)) {
                return `${brand} ${modelName}`;
            }
        }
    }
    return undefined;
}
export { UAInfo };
