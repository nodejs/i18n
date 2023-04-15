# Worker Threads

<!--introduced_in=v10.5.0-->

> Vakaus: 1 - Kokeellinen

The `worker` module provides a way to create multiple environments running on independent threads, and to create message channels between them. It can be accessed using the `--experimental-worker` flag and:

```js
const worker = require('worker_threads');
```

Workers are useful for performing CPU-intensive JavaScript operations; do not use them for I/O, since Node.js’s built-in mechanisms for performing operations asynchronously already treat it more efficiently than Worker threads can.

Workers, unlike child processes or when using the `cluster` module, can also share memory efficiently by transferring `ArrayBuffer` instances or sharing `SharedArrayBuffer` instances between them.

```js
const {
  Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

if (isMainThread) {
  module.exports = async function parseJSAsync(script) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: script
      });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  };
} else {
  const { parse } = require('some-js-parsing-library');
  const script = workerData;
  parentPort.postMessage(parse(script));
}
```

Note that this example spawns a Worker thread for each `parse` call. In practice, it is strongly recommended to use a pool of Workers for these kinds of tasks, since the overhead of creating Workers would likely exceed the benefit of handing the work off to it.

## worker.isMainThread
<!-- YAML
added: v10.5.0
-->

* {boolean}

Is `true` if this code is not running inside of a [`Worker`][] thread.

## worker.parentPort
<!-- YAML
added: v10.5.0
-->

* {null|MessagePort}

If this thread was spawned as a [`Worker`][], this will be a [`MessagePort`][] allowing communication with the parent thread. Messages sent using `parentPort.postMessage()` will be available in the parent thread using `worker.on('message')`, and messages sent from the parent thread using `worker.postMessage()` will be available in this thread using `parentPort.on('message')`.

## worker.threadId
<!-- YAML
added: v10.5.0
-->

* {integer}

An integer identifier for the current thread. On the corresponding worker object (if there is any), it is available as [`worker.threadId`][].

## worker.workerData
<!-- YAML
added: v10.5.0
-->

An arbitrary JavaScript value that contains a clone of the data passed to this thread’s `Worker` constructor.

## Class: MessageChannel
<!-- YAML
added: v10.5.0
-->

Instances of the `worker.MessageChannel` class represent an asynchronous, two-way communications channel. The `MessageChannel` has no methods of its own. `new MessageChannel()` yields an object with `port1` and `port2` properties, which refer to linked [`MessagePort`][] instances.

```js
const { MessageChannel } = require('worker_threads');

const { port1, port2 } = new MessageChannel();
port1.on('message', (message) => console.log('received', message));
port2.postMessage({ foo: 'bar' });
// prints: received { foo: 'bar' } from the `port1.on('message')` listener
```

## Class: MessagePort
<!-- YAML
added: v10.5.0
-->

* Extends: {EventEmitter}

Instances of the `worker.MessagePort` class represent one end of an asynchronous, two-way communications channel. It can be used to transfer structured data, memory regions and other `MessagePort`s between different [`Worker`][]s.

With the exception of `MessagePort`s being [`EventEmitter`][]s rather than [`EventTarget`][]s, this implementation matches [browser `MessagePort`][]s.

### Event: 'close'
<!-- YAML
added: v10.5.0
-->

The `'close'` event is emitted once either side of the channel has been disconnected.

### Event: 'message'
<!-- YAML
added: v10.5.0
-->

* `value` {any} The transmitted value

The `'message'` event is emitted for any incoming message, containing the cloned input of [`port.postMessage()`][].

Listeners on this event will receive a clone of the `value` parameter as passed to `postMessage()` and no further arguments.

### port.close()
<!-- YAML
added: v10.5.0
-->

Disables further sending of messages on either side of the connection. This method can be called when no further communication will happen over this `MessagePort`.

### port.postMessage(value[, transferList])
<!-- YAML
added: v10.5.0
-->

* `value` {any}
* `transferList` {Object[]}

Sends a JavaScript value to the receiving side of this channel. `value` will be transferred in a way which is compatible with the [HTML structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm). In particular, it may contain circular references and objects like typed arrays that the `JSON` API is not able to stringify.

`transferList` may be a list of `ArrayBuffer` and `MessagePort` objects. After transferring, they will not be usable on the sending side of the channel anymore (even if they are not contained in `value`). Unlike with [child processes](child_process.html), transferring handles such as network sockets is currently not supported.

If `value` contains [`SharedArrayBuffer`][] instances, those will be accessible from either thread. They cannot be listed in `transferList`.

`value` may still contain `ArrayBuffer` instances that are not in `transferList`; in that case, the underlying memory is copied rather than moved.

Because the object cloning uses the structured clone algorithm, non-enumerable properties, property accessors, and object prototypes are not preserved. In particular, [`Buffer`][] objects will be read as plain [`Uint8Array`][]s on the receiving side.

The message object will be cloned immediately, and can be modified after posting without having side effects.

For more information on the serialization and deserialization mechanisms behind this API, see the [serialization API of the `v8` module](v8.html#v8_serialization_api).

### port.ref()
<!-- YAML
added: v10.5.0
-->

Opposite of `unref()`. Calling `ref()` on a previously `unref()`ed port will *not* let the program exit if it's the only active handle left (the default behavior). If the port is `ref()`ed, calling `ref()` again will have no effect.

If listeners are attached or removed using `.on('message')`, the port will be `ref()`ed and `unref()`ed automatically depending on whether listeners for the event exist.

### port.start()
<!-- YAML
added: v10.5.0
-->

Starts receiving messages on this `MessagePort`. When using this port as an event emitter, this will be called automatically once `'message'` listeners are attached.

### port.unref()
<!-- YAML
added: v10.5.0
-->

Calling `unref()` on a port will allow the thread to exit if this is the only active handle in the event system. If the port is already `unref()`ed calling `unref()` again will have no effect.

If listeners are attached or removed using `.on('message')`, the port will be `ref()`ed and `unref()`ed automatically depending on whether listeners for the event exist.

## Class: Worker
<!-- YAML
added: v10.5.0
-->

* Extends: {EventEmitter}

The `Worker` class represents an independent JavaScript execution thread. Most Node.js APIs are available inside of it.

Notable differences inside a Worker environment are:

- The [`process.stdin`][], [`process.stdout`][] and [`process.stderr`][] may be redirected by the parent thread.
- The [`require('worker_threads').isMainThread`][] property is set to `false`.
- The [`require('worker_threads').parentPort`][] message port is available.
- [`process.exit()`][] does not stop the whole program, just the single thread, and [`process.abort()`][] is not available.
- [`process.chdir()`][] and `process` methods that set group or user ids are not available.
- [`process.env`][] is a read-only reference to the environment variables.
- [`process.title`][] cannot be modified.
- Signals will not be delivered through [`process.on('...')`](process.html#process_signal_events).
- Execution may stop at any point as a result of [`worker.terminate()`][] being invoked.
- IPC channels from parent processes are not accessible.

Currently, the following differences also exist until they are addressed:

- The [`inspector`][] module is not available yet.
- Native addons are not supported yet.

Creating `Worker` instances inside of other `Worker`s is possible.

Like [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) and the [`cluster` module][], two-way communication can be achieved through inter-thread message passing. Internally, a `Worker` has a built-in pair of [`MessagePort`][]s that are already associated with each other when the `Worker` is created. While the `MessagePort` object on the parent side is not directly exposed, its functionalities are exposed through [`worker.postMessage()`][] and the [`worker.on('message')`][] event on the `Worker` object for the parent thread.

To create custom messaging channels (which is encouraged over using the default global channel because it facilitates separation of concerns), users can create a `MessageChannel` object on either thread and pass one of the `MessagePort`s on that `MessageChannel` to the other thread through a pre-existing channel, such as the global one.

See [`port.postMessage()`][] for more information on how messages are passed, and what kind of JavaScript values can be successfully transported through the thread barrier.

```js
const assert = require('assert');
const {
  Worker, MessageChannel, MessagePort, isMainThread, parentPort
} = require('worker_threads');
if (isMainThread) {
  const worker = new Worker(__filename);
  const subChannel = new MessageChannel();
  worker.postMessage({ hereIsYourPort: subChannel.port1 }, [subChannel.port1]);
  subChannel.port2.on('message', (value) => {
    console.log('received:', value);
  });
} else {
  parentPort.once('message', (value) => {
    assert(value.hereIsYourPort instanceof MessagePort);
    value.hereIsYourPort.postMessage('the worker is sending this');
    value.hereIsYourPort.close();
  });
}
```

### new Worker(filename[, options])

* `filename` {string} The path to the Worker’s main script. Must be either an absolute path or a relative path (i.e. relative to the current working directory) starting with `./` or `../`. If `options.eval` is `true`, this is a string containing JavaScript code rather than a path.
* `options` {Object}
  * `eval` {boolean} If `true`, interpret the first argument to the constructor as a script that is executed once the worker is online.
  * `workerData` {any} Any JavaScript value that will be cloned and made available as [`require('worker_threads').workerData`][]. The cloning will occur as described in the [HTML structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), and an error will be thrown if the object cannot be cloned (e.g. because it contains `function`s).
  * stdin {boolean} If this is set to `true`, then `worker.stdin` will provide a writable stream whose contents will appear as `process.stdin` inside the Worker. By default, no data is provided.
  * stdout {boolean} If this is set to `true`, then `worker.stdout` will not automatically be piped through to `process.stdout` in the parent.
  * stderr {boolean} If this is set to `true`, then `worker.stderr` will not automatically be piped through to `process.stderr` in the parent.

### Event: 'error'
<!-- YAML
added: v10.5.0
-->

* `err` {Error}

The `'error'` event is emitted if the worker thread throws an uncaught exception. In that case, the worker will be terminated.

### Event: 'exit'
<!-- YAML
added: v10.5.0
-->

* `exitCode` {integer}

The `'exit'` event is emitted once the worker has stopped. If the worker exited by calling [`process.exit()`][], the `exitCode` parameter will be the passed exit code. If the worker was terminated, the `exitCode` parameter will be `1`.

### Event: 'message'
<!-- YAML
added: v10.5.0
-->

* `value` {any} The transmitted value

The `'message'` event is emitted when the worker thread has invoked [`require('worker_threads').parentPort.postMessage()`][]. See the [`port.on('message')`][] event for more details.

### Event: 'online'
<!-- YAML
added: v10.5.0
-->

The `'online'` event is emitted when the worker thread has started executing JavaScript code.

### worker.postMessage(value[, transferList])
<!-- YAML
added: v10.5.0
-->

* `value` {any}
* `transferList` {Object[]}

Send a message to the worker that will be received via [`require('worker_threads').parentPort.on('message')`][]. See [`port.postMessage()`][] for more details.

### worker.ref()
<!-- YAML
added: v10.5.0
-->

Opposite of `unref()`, calling `ref()` on a previously `unref()`ed worker will *not* let the program exit if it's the only active handle left (the default behavior). If the worker is `ref()`ed, calling `ref()` again will have no effect.

### worker.stderr
<!-- YAML
added: v10.5.0
-->

* {stream.Readable}

This is a readable stream which contains data written to [`process.stderr`][] inside the worker thread. If `stderr: true` was not passed to the [`Worker`][] constructor, then data will be piped to the parent thread's [`process.stderr`][] stream.

### worker.stdin
<!-- YAML
added: v10.5.0
-->

* {null|stream.Writable}

If `stdin: true` was passed to the [`Worker`][] constructor, this is a writable stream. The data written to this stream will be made available in the worker thread as [`process.stdin`][].

### worker.stdout
<!-- YAML
added: v10.5.0
-->

* {stream.Readable}

This is a readable stream which contains data written to [`process.stdout`][] inside the worker thread. If `stdout: true` was not passed to the [`Worker`][] constructor, then data will be piped to the parent thread's [`process.stdout`][] stream.

### worker.terminate([callback])
<!-- YAML
added: v10.5.0
-->

* `callback` {Function}
  * `err` {Error}
  * `exitCode` {integer}

Stop all JavaScript execution in the worker thread as soon as possible. `callback` is an optional function that is invoked once this operation is known to have completed.

**Warning**: Currently, not all code in the internals of Node.js is prepared to expect termination at arbitrary points in time and may crash if it encounters that condition. Consequently, only call `.terminate()` if it is known that the Worker thread is not accessing Node.js core modules other than what is exposed in the `worker` module.

### worker.threadId
<!-- YAML
added: v10.5.0
-->

* {integer}

An integer identifier for the referenced thread. Inside the worker thread, it is available as [`require('worker_threads').threadId`][].

### worker.unref()
<!-- YAML
added: v10.5.0
-->

Calling `unref()` on a worker will allow the thread to exit if this is the only active handle in the event system. If the worker is already `unref()`ed calling `unref()` again will have no effect.
