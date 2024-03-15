# idlefy

### Defer non-critical tasks to run when the main thread is idle

The `idlefy` library is a collection of JavaScript tools designed to help you improve website performance by strategically scheduling tasks to run during the browser's idle periods. This adheres to the [*idle-until-urgent*](https://philipwalton.com/articles/idle-until-urgent/)  pattern.

 Inspired by the [idilize](https://github.com/https://github.com/GoogleChromeLabs/idlize/) library, idlefy not only retains all the original features but also introduces enhanced TypeScript support, a reduced bundle size, and a more adaptable API. Moreover, it seamlessly serves as a **drop-in replacement** for idilize, passing all the tests from the original library.

- **TypeScript Precision:** Enjoy the benefits of type safety, better code structure, and improved developer productivity.
- **SSR Compatibility:** Our library seamlessly integrates with server-side rendering.
- **Light on Disk:** An optimized bundle ensures minimal overhead and maximum impact and you can leverage tree shaking to remove unused code by using module level imports.

## Installation

```sh
npm install idlefy
```

## Usage

```js
// imports all helpers methods and classes from idlefy library
import { idleQueue, idleValue } from 'idlefy'
// import only methods and classes you need
import { IdleQueue } from 'idlefy/IdleQueue'
// import methods from minified build
import { IdleQueue } from 'idlefy/min'
```

## `IdleQueue`

[`idlefy/IdleQueue`](/src/idleQueue.ts)

### Overview

 It's useful for apps that want to split up their logic into a sequence of functions and schedule them to run idly.

This class offers a few benefits over the regular usage of [`requestIdleCallback()`](https://developers.google.com/web/updates/2015/08/using-requestidlecallback):

- The queue can be configured so all queued functions are guaranteed to run before the page is unloaded.
- Queued tasks can be run immediately at any time.
- Queued tasks can pass a minimum time budget, below which they won't attempt to run (this minimum time budget can also be configured per queue).
- Queued tasks store the time/visibilityState when they were added to the queue, and are invoked with this data when run.

### Exports

- [`IdleQueue`](#idlequeue)

### Usage

```js
import { IdleQueue } from 'idlefy/idleQueue'

const queue = new IdleQueue()

queue.pushTask(() => {
  // Some expensive function that can run idly...
})

queue.pushTask(() => {
  // Some other task that depends on the above
  // expensive function having already run...
})
```

### Methods

<table>
  <tr valign="top">
    <th align="left">Name</th>
    <th align="left">Description</th>
  </tr>
  <tr valign="top" id="param-constructor">
    <td><code>constructor(options)</code></td>
    <td>
      <p><strong>Parameters:</strong></p>
      <ul>
        <li>
          <code>options.ensureTasksRun</code> <emn>(boolean)</em>
          Adds Page Lifecycle callbacks to ensure the queue is run before the user leaves the page <em>(default: <code>false</code>)</em>.
        </li>
        <li>
          <code>options.defaultMinTaskTime</code>: <em>(number)</em>
          The default amount of idle time remaining in order for a task to be run <em>(default: <code>0</code>)</em>.
        </li>
      </ul>
    </td>
  </tr>
  <tr valign="top" id="param-pushtask">
    <td><code>pushTask(task, options)</code></td>
    <td>
      <p><strong>Parameters:</strong></p>
      <ul>
        <li><code>task</code>: <em>(function(Object))</em>
          The task to add to the end of the queue.
        </li>
        <li><code>options.minTaskTime</code>: <em>(number)</em>
          The minimum amount of idle time remaining in order for a task to be run. If no value is passed, the queue default is used.
        </li>
      </ul>
      <p>Adds a task to the end of the queue and schedules the queue to be run when next idle (if not already scheduled).</p>
      <p>When the task is run, it's invoked with an object containing the following properties:</p>
      <ul>
        <li><code>time</code>: <em>(number)</em>
          The time (epoch time in milliseconds) when the task was added to the queue.
        </li>
        <li><code>visibilityState</code>: <em>(string)</em>
          The visibility state of the document when the task was added to the queue.
        </li>
      </ul>
    </td>
  </tr>
  <tr valign="top" id="param-unshifttask">
    <td><code>unshiftTask(task, options)</code></td>
    <td>
      <p><strong>Parameters:</strong></p>
      <ul>
        <li><code>task</code>: <em>(function(Object<{{time: number, visibilityState: string}}>))</em>
          The task to add to the beginning of the queue.
        </li>
        <li><code>options.minTaskTime</code>: <em>(number)</em>
          The minimum amount of idle time remaining in order for a task to be run. If no value is passed, the queue default is used.
        </li>
      </ul>
      <p>Adds a task to the beginning of the queue and schedules the queue to be run when next idle (if not already scheduled).</p>
      <p>When the task is run, it's invoked with an object containing the following properties:</p>
      <ul>
        <li><code>time</code>: <em>(number)</em>
          The time (epoch time in milliseconds) when the task was added to the queue.
        </li>
        <li><code>visibilityState</code>: <em>(string)</em>
          The visibility state of the document when the task was added to the queue.
        </li>
      </ul>
    </td>
  </tr>
  <tr valign="top" id="param-runtasksimmediately">
    <td><code>runTasksImmediately()</code></td>
    <td>
      <p>Runs all queued tasks immediately (synchronously).</p>
    </td>
  </tr>
  <tr valign="top" id="param-haspendingtasks">
    <td><code>hasPendingTasks()</code></td>
    <td>
      <p><strong>Returns:</strong> <em>(boolean)</em></p>
      <p>True if the queue has any tasks not yet run.</p>
    </td>
  </tr>
  <tr valign="top" id="param-clearpendingtasks">
    <td><code>clearPendingTasks()</code></td>
    <td>
      <p>Unschedules all pending tasks in the queue.</p>
    </td>
  </tr>
  <tr valign="top" id="param-getstate">
    <td><code>getState()</code></td>
    <td>
      <p><strong>Returns:</strong> <em>(Object)</em></p>
      <ul>
        <li><code>{time}</code>: <em>(number)</em>
          The time (milliseconds, in epoch time) the task was added to the queue.
        </li>
        <li><code>{visibilityState}</code>: <em>(string)</em>
          The document's visibility state when the task was added to the queue.
        </li>
      </ul>
    </td>
  </tr>
</table>

## `IdleValue`

[`idlefy/idleValue`](/src/idleValue.ts)

### Overview

It's useful when you want to initialize a value during an idle period but ensure it can be initialized immediately as soon as it's needed.

### Exports

- [`IdleValue`](#idlevalue)

### Usage

```js
import { IdleValue } from 'idlefy/idleValue'

class MyClass {
  constructor() {
    // Create an IdleValue instance for `this.data`. It's value is
    // initialized in an idle callback (or immediately as soon as
    // `this.data.getValue()` is called).
    this.data = new IdleValue(() => {
      // Run expensive code and return the result...
    })
  }
}
```

### Methods

<table>
  <tr valign="top">
    <th align="left">Name</th>
    <th align="left">Description</th>
  </tr>
  <tr valign="top" id="param-constructor">
    <td><code>constructor(init)</code></td>
    <td>
      <p><strong>Parameters:</strong></p>
      <ul>
        <li>
          <code>init</code> <emn>(Function)</em>
          An initialization function (typically something expensive to compute) that returns a value.
        </li>
      </ul>
      <p>The initialization function is scheduled to run in an idle callback as soon as the instance is created.</p>
    </td>
  </tr>
  <tr valign="top" id="param-getValue">
    <td><code>getValue()</code></td>
    <td>
      <p><strong>Returns:</strong> <em>(*)</em></p>
      <p>Returns the value returned by the initialization function passed to the constructor. If the initialization function has already been run, the value is returned immediately. If the initialization function is still scheduled for an idle callback, that callback is cancelled, the initialization function is run synchronously, and the result is returned.</p>
    </td>
  </tr>
  <tr valign="top" id="param-setValue">
    <td><code>setValue(newValue)</code></td>
    <td>
      <p><strong>Parameters:</strong></p>
      <ul>
        <li>
          <code>newValue</code> <em>(*)</em>
        </li>
      </ul>
      <p>Assigns a new value. If the initialization function passed to the constructor has not yet run, it is cancelled.</p>
    </td>
  </tr>
</table>

## `idle-callback-with-polyfills`

[`idlefy/idleCbWithPolyfill`](/src/idleCbWithPolyfill.ts)

### Overview

Small polyfills that allow developers to use [`requestIdleCallback`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) and [`cancelIdleCallback()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelIdleCallback) in all browsers.

These are not full polyfills (since the native APIs cannot be fully polyfilled), but they offer the basic benefits of idle tasks via `setTimeout()` and `clearTimeout()`.

### Exports

- [`rIC`](#ric)
- [`cIC`](#cic)

### Usage

```js
import { cIC, rIC } from 'idlefy/idleCbWithPolyfill'

// To run a task when idle.
const handle = rIC(() => {
  // Do something here...
})

// To cancel the idle callback.
cIC(handle)
```

### `rIC`

Uses the native `requestIdleCallback()` function in browsers that support it, or a small polyfill (based on `setTimeout()`) in browsers that don't.

See the [`requestIdleCallback()` docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) for details.

### `cIC`

Uses the native `cancelIdleCallback()` function in browsers that support it, or a small polyfill (based on `clearTimeout()`) in browsers that don't.

See the [`cancelIdleCallback()` docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelIdleCallback) for details.

## `defineIdleProperty`

[`idlefy/defineIdleProperty`](/src/defineIdleProperty.ts)

### Overview

 It's useful when you want to initialize a property value during an idle period but ensure it can be initialized immediately as soon as it's referenced.

### Exports

- [`defineIdleProperty`](#defineidleproperty)

### Usage

```js
import { defineIdleProperty } from 'idlefy/defineIdleProperty'

class MyClass {
  constructor() {
    // Define a getter for `this.data` whose value is initialized
    // in an idle callback (or immediately if referenced).
    defineIdleProperty(this, 'data', () => {
      // Run expensive code and return the result...
    })
  }
}
```

### Syntax

```js
defineIdleProperty(obj, prop, init)
```

### Parameters

<table>
  <tr valign="top">
    <th align="left">Name</th>
    <th align="left">Type</th>
    <th align="left">Description</th>
  </tr>
  <tr valign="top" id="param-obj">
    <td><code>obj</code></td>
    <td><em>Object</em></td>
    <td>
      The object on which to define the property.
    </td>
  </tr>
  <tr valign="top" id="param-prop">
    <td><code>prop</code></td>
    <td><em>string</em></td>
    <td>
      The name of the property.
    </td>
  </tr>
  <tr valign="top" id="param-init">
    <td><code>init</code></td>
    <td><em>Function</em></td>
    <td>
      An function (typically something expensive to compute) that returns a value. The function is scheduled to run in an idle callback as soon as the property is defined. If the property is referenced before the function can be run in an idle callback, the idle callback is canceled, the function is run immediately, and the return value of the function is set as the value of the property.
    </td>
  </tr>
</table>

## `defineIdleProperties`

[`idlefy/defineIdleProperties`](/defineIdleProperties)

### Overview

 It's useful when you want to initialize one or more property values during an idle period but ensure they can be initialized immediately as soon as they're referenced.

### Exports

- [`defineIdleProperties`](#defineidleproperties)

### Usage

```js
import { defineIdleProperties } from 'idlefy/defineIdleProperties'

class MyClass {
  constructor() {
    // Define a getter for `this.data` whose value is initialized
    // in an idle callback (or immediately if referenced).
    defineIdleProperties(this, {
      data: () => {
        // Run expensive code and return the result...
      },
    })
  }
}
```

### Syntax

```js
defineIdleProperties(obj, props)
```

### Parameters

<table>
  <tr valign="top">
    <th align="left">Name</th>
    <th align="left">Type</th>
    <th align="left">Description</th>
  </tr>
  <tr valign="top" id="param-obj">
    <td><code>obj</code></td>
    <td><em>Object</em></td>
    <td>
      The object on which to define the property.
    </td>
  </tr>
  <tr valign="top" id="param-props">
    <td><code>props</code></td>
    <td><em>Object</em></td>
    <td>
      A dictionary of property names and initialization functions. See the <code>defineIdleProperty</code> documentation for <a href="/docs/defineIdleProperty.md#param-prop"><code>prop</code></a> and <a href="/docs/defineIdleProperty.md#param-prop"><code>init</code></a>.
    </td>
  </tr>
</table>
