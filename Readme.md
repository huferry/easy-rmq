# Easy RabbitMQ

Wanna let your software to series of jobs? You don't want to use extensive and complicated complex queueing system. **Easy RabbitMQ** provide simple and easy use of *RabbitMQ* for you.

Project site: [https://github.com/huferry/easy-rmq]

## Quick Start

First, install the package:
```
npm i -s easy-rmq
```

Connect to the queue as simple as:
```javascript
const conn = await required('easy-rmq').connect({
    user: 'guest',
    password: 'secret',
    host: '172.134.1.25'
})

const queue = await conn.queue('my-queue')
```
and publish your message just like this:
```javascript
queue.publish({
    from: 'Somebody',
    msg: 'Hello, World!'
})
```
or if you're from the consuming side:
```javascript
queue.subscribe(payload => {
    console.log(payload)
    // this will print:
    // { "from": "Somebody", "msg": "Hello, World!" }
})
```
But, if you're outside a non-async function:
```javascript
required('easy-rmq').connect({
    user: 'guest',
    password: 'secret',
    host: '172.134.1.25'
})
.then(conn => conn.queue('my-queue'))
.then(queue => {
    // publish message
    queue.publish({msg: 'Hello, World!'})

    // consume message
    queue.subscribe(payload => {
        console.log(payload)
    })
})
```

# Documentation

1. [Connecting to Server](#Connecting-to-Server)
2. [Access to The Queue](#Access-to-The-Queue)
3. [Publish A Message](#Publish-A-Message)
4. [Subscribing for Messages](#Subscribing-for-Messages)
    4.1. [Handler Function](#Handler-Function)
    4.2. [Error Handling](#Error-Handling)

## 1. Connecting to Server

The module is exporting a single async function `connect` that will take an object containing properties to connect to the amqp server.

```javascript
require('easy-rmq').connect({
    user: 'guest',      // mandatory
    password: 'guest',  // mandatory
    host: '127.0.0.1',  // mandatory
    port: '5672'        // optional, 5672 by default
})
```

Note that this function is asynchronous and will return a Promise object that returns one function [`queue`](#Access-to-The-Queue) to access the queue.

## 2. Access to The Queue

Accessing to the queue can be made by the the `queue(queueName)` function.

```javascript
require('easy-rmq')
.connect({ /* fill in with your connection properties */ })
.then(conn => conn.queue('my-queue'))
```

Note that you don't have to create the queue on the server. We are basically doing a *code-first* queueing process. In the example above, the queue **'my-queue'** will be created automatically on the server.

This `queue` function returns (a Promise to-) an object containing functions to [`publish`](#Publish-A-Mesage) a message and to [`subscribe`](#Subscribe-for-Messages) for messages from the queue.

## 3. Publish A Message

The `publish` function takes the `payload` of the queue message and this can be any JSON serializable object. The payload will be carried onto the queue message and delivered by the [subscribing function](#Subscribe-for-Messages).

```javascript
require('easy-rmq')
.connect({ /* fill in with your connection properties */ })
.then(conn => conn.queue('my-queue'))
.then(queue => {
    // payload can be any JSON serializable object
    const payload = {
        time: new Date(),
        text: 'please send the goods in 2 weeks',
        importance: 5
    }
    queue.publish(payload)
})

```

## 4. Subscribe for Messages
The last part of this module is to subscribe for the queue messages (and then do some processing). From the `queue` object, use the `subscribe` function. This will take in as arguments the `handler` function and the `onError` function.

```javascript
require('easy-rmq')
.connect({ /* fill in with your connection properties */ })
.then(conn => conn.queue('my-queue'))
.then(queue => {
    queue.subscribe(handler, onError)
})
```

### 4.1. The `handler` Function

The `handler` function is given the `payload` object as argument (see [example](#example)). 


<a id='example'>Example:</a>
```javascript
require('easy-rmq')
.connect({ /* fill in with your connection properties */ })
.then(conn => conn.queue('my-queue'))
.then(queue => {
    queue.subscribe(
        payload => handler(payload), // the handler function
        (error, requeue) => handleError(error, requeue)) // the onError function
})

function handler(payload) {
    // Do any processing needed here!
    // Any error thrown within this processing,
    // will be forwarded to the error handling function.
    console.log(payload)
}

function handleError(error, requeue) {
    // error is of the Javascript class Error.
    // Depending on the type/kind of error you can
    // decide to requeue the message.
    // for example:
    if (error.message === 'server is still starting') {
        const timeoutInMs = 5000
        // timeout is optional, it is 1000 milliseconds by default.
        requeue(timeoutInMs)
    }
}
```

### 4.2. Error Handling
Any error thrown in the processing will triggers the error handler (see example in previous section). The error handling function, which is provided by the user, will be given 2 arguments: the `error` and a `requeue` function. In case that the user decided that he wants to retry the processing then he can invoke the `requeue` function. The user can set a delay in milliseconds to this function. If no delay is provided it will default to 1 seconds.
