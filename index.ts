let _log: Function;
let _warn: Function;
let _error: Function;
let _info: Function;
let _deviceIdentifier: string;
let _serverUrl: string;
let _pending: Array<LogItem> | undefined = undefined;

interface LogItem {
    id: string;
    message: string;
    level: string;
}

/**
 * Initialize logging will override window.console and send to the serverUrl
 * @param  {string} serverUrl The servername and port number of the remote server (eg 192.168.1.1:9000)
 */
export function initLogger(serverUrl: string) {
    _log = window.console.log;
    _warn = window.console.error;
    _error = window.console.error;
    _info = window.console.info;
    _serverUrl = serverUrl;
    window.console.log = consoleLog;
    window.console.warn = consoleWarn;
    window.console.error = consoleError;
    window.console.info = consoleInfo;

    let lastUrl: string;
    post('/devices', {
        id: getDeviceIdentifier(),
        agent: window.navigator.userAgent,
        title: window.document.title,
    });

    // Report urls
    setInterval(() => {
        if (document.location.href != lastUrl) {
            lastUrl = document.location.href;
            _log(`Url changed to ${lastUrl}`);
        }
    }, 1000);
}

function getDeviceIdentifier(): string {
    if (_deviceIdentifier) {
        return _deviceIdentifier;
    }
    const tmp = localStorage.IonicLoggerDeviceId;
    let id: number = parseInt(tmp);
    if (tmp == null || isNaN(id)) {
        // Create a random device identifier
        id = Math.floor(Math.random() * 999999999);
        localStorage.IonicLoggerDeviceId = id;
    }
    _deviceIdentifier = id.toString();
    return _deviceIdentifier;
}

function write(message: any, _arguments: any, level: string) {
    const args = Array.prototype.slice.call(_arguments);
    let msg = message;
    args.forEach((element) => {
        if (msg != '') {
            msg += ' ';
        }
        if (typeof element == 'object') {
            msg += JSON.stringify(element);
        } else {
            msg += element;
        }
    });
    // Commenting out for now. Stack is hard as it may be in the source map
    //const stack = this.getStack();

    if (!_pending) {
        _pending = [];
        setTimeout(() => {
            // Push pending log entries. We wait around for 500ms to see how much accumulates
            post('/log', _pending);
            _pending = undefined;
        }, 500);        
    }
    _pending.push({ id: getDeviceIdentifier(), message: msg, level: level }); // this.getStack() });
}

function getStack(): string {
    const stack = new Error().stack;
    const lines = stack?.split('\n');
    lines?.splice(0, 4);
    if (!lines || lines.length == 0) {
        return '';
    }
    return lines[0].substr(7, lines[0].length - 7); // This returns just the top of the stack
}

function post(url: string, data: any) {
    if (!data) {
        return;
    }

    try {
        fetch(`http://${_serverUrl}${url}`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    } catch {
        // Logging should not cause failures
    }
}

function consoleLog(message: any, ...args: any) {
    _log(message, ...args);
    write(message, args, 'log');
}

function consoleWarn(message: any, ...args: any) {
    _warn(message, ...args);
    write(message, args, 'warn');
}

function consoleError(message: any, ...args: any) {
    _error(message, ...args);
    write(message, args, 'error');
}

function consoleInfo(message: any, ...args: any) {
    _info(message, ...args);
    write(message, args, 'info');
}