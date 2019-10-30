const amqplib = require('amqplib')

const uri = ({user, password, host, port}) =>
    `amqp://${user}:${password}@${host}:${port||5672}`

const publish = (queue, channel, queueName) =>  (payload) => {
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)))
    return queue
}

const requeue = (channel, queueName, content) => (ms, newContent) => {
    const timeout = ms ? ms : 1000
    const requeueContent = newContent
            ? JSON.stringify(newContent)
            : content
    setTimeout(
        () => channel.sendToQueue(queueName, Buffer.from(requeueContent)), 
        timeout)
}

const toObject = (content) => {
    try {
        return JSON.parse(content)
    } catch(e) {
        return {
            text: content
        }
    }
}

const process = (channel, msg, requeueFn, handler) => {
    const content = msg.content.toString()
    const payload = toObject(content)
    const r = handler(payload, requeueFn)

    return new Promise(resolve => {
        if (r && r.then) r.then(() => resolve())
        else resolve()
    })
}

const subscribe = (queue, channel, queueName) => (handler, onError) => {
        
    channel.consume(queueName, msg => {
        if (!msg) return
        const content = msg.content.toString()
        const requeueFn = requeue(channel, queueName, content)

        process(channel, msg, requeueFn, handler)
        .then(() => channel.ack(msg))
        .catch(err => {
            if (onError) onError(err, requeueFn)
        })
    })

    return queue
}

/** Get the queue functions.
 * @async
 * @param {queueName} queueName The name of the queue.
 * @return {any} Functions to publish and to subscribe to the queue.
 */
const queue = (connection) => async (queueName) => {
    const channel = await connection.createChannel()
    channel.assertQueue(queueName)
    const q = {}
    q.publish =  publish(q, channel, queueName)
    q.subscribe = subscribe(q, channel, queueName)
    return q
}

/**
 * Create a connection to the amqp server.
 * @async
 * @param {string} user The username to connect to the amqp server.
 * @param {string} password The password to connect to the amqp server.
 * @param {host} password The host (or ip address) of the amqp server.
 * @param {string} port The port to connect to the amqp server, default is 5672.
 * @return {Promise<Object>} A connection object that allows access to the queues.
 */
const connect = async ({user, password, host, port}) => {
    const connection = await amqplib.connect(uri({user, password, host, port}))
    return {
        queue: queue(connection)
    }
}

module.exports = {
    connect
}