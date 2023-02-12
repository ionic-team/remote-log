# Remote Logging

Call `initLogger` to override `console.log`, `console.warn`, `console.error` and `console.info` functions which will be routed to the given remote server.

```shell
npm install @ionic/remote-log
```

```typescript
import { initLogger } from '@ionic/remote-log';

initLogger('192.168.1.130:9000');
```

