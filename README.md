# Worker Threads Promise
Worker Threads implementation with promises to support request-response communication between master and child thread.

If you are using Node version 12- be sure to use the argument `--experimental-workers`.

Promise implementation adds very low latency that can be considered as unimportant.

## Install
```bash
npm i worker-threads-promise
```

## Usage


*./main.js*
```js
const Worker = require('worker-threads-promise');
const path = require('path');

const worker = new Worker(path.join(__dirname, './worker.js'));

(async () => {
  const res = await worker.postMessageAsync(1000);
  console.log(res);

})();
```

*./worker.js*
```js
const {parentPort} = require('worker_threads');
const Worker = require('worker-threads-promise');
Worker.connect(parentPort);

parentPort.on('message', data => { //you can use await too
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, data);
  });
});
```


## Options

### Timeout
It will throw timeout exceed error after given amount of milliseconds

Default: No Timeout

*./main.js*
```js
const Worker = require('worker-threads-promise');
const path = require('path');

const worker = new Worker(path.join(__dirname, './worker.js'));

(async () => {
  const res = await worker.postMessageAsync(5000, {
    timeout: 1000
  }).catch(e => {
    console.log(e);
  });
})();
```

*./worker.js*
```js
const {parentPort} = require('worker_threads');
const Worker = require('worker-threads-promise');
Worker.connect(parentPort);

parentPort.on('message', data => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, data);
  });
});
```

### Unref
It will prevent event loop to remain active when waiting for response.

Default: `false`

*./main.js*
```js
const Worker = require('worker-threads-promise');
const path = require('path');

const worker = new Worker(path.join(__dirname, './worker.js'));

(async () => {
  const res = await worker.postMessageAsync(5000, {
    timeout: 1000,
    unref: true
  }).catch(e => {
    console.log(e);
  });
})();
```

*./worker.js*
```js
const {parentPort} = require('worker_threads');
const Worker = require('worker-threads-promise');
Worker.connect(parentPort);

parentPort.on('message', data => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, data);
  });
});
```

