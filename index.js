const http = require('http')
const net = require('net')
const url = require('url')

const settings = require('./settings.json')
const version = require('./package.json').version

const port = process.env.PORT || 9191

const server = http.createServer({})
const listener = server.listen(port, (err) => {
    if (err) {
        return console.error(err)
    }
    const info = listener.address()
    console.log(`Server is listening on address ${info.address} port ${info.port}`)
})

server.on('connect', (req, clientSocket, head) => { // listen only for HTTP/1.1 CONNECT method
    console.log(clientSocket.remoteAddress, clientSocket.remotePort, req.method, req.url)

    function throwAuth() {
        clientSocket.write([
            'HTTP/1.1 407 Proxy Authentication Required',
            'Proxy-Authenticate: Basic realm="proxy"',
            'Proxy-Connection: close',
        ].join('\r\n'))
        clientSocket.end('\r\n\r\n')
    }

    if (["custom", "creds"].includes(settings.auth.type) && req.headers['proxy-authorization'] === undefined) {
        throwAuth()
        return
    }

    if (settings.auth.type === "custom") {
        if (req.headers['proxy-authorization'] !== settings.auth.data) {
            throwAuth()
            return
        }
    } else if (settings.auth.type === "creds") {
        if (req.headers['proxy-authorization'].slice(6) !== Buffer.from(`${settings.auth.username}:${settings.auth.password}`).toString("base64")) {
            throwAuth()
            return
        }
    }

    const { port, hostname } = url.parse(`//${req.url}`, false, true) // extract destination host and port from CONNECT request
    if (hostname && port) {
        const serverSocket = net.connect(port, hostname) // connect to destination host and port

        clientSocket.on('error', (err) => {
            console.error(err.message)
            if (serverSocket) {
                serverSocket.end()
            }
        })
        clientSocket.on('end', () => {
            if (serverSocket) {
                serverSocket.end()
            }
        })

        serverSocket.on('error', (err) => {
            console.error(err.message)
            if (clientSocket) {
                clientSocket.end(`HTTP/1.1 500 ${err.message}\r\n`)
            }
        })
        serverSocket.on('end', () => {
            if (clientSocket) {
                clientSocket.end(`HTTP/1.1 500 External Server End\r\n`)
            }
        })
        serverSocket.on('connect', () => {
            clientSocket.write([
                'HTTP/1.1 200 Connection Established',
                'Proxy-agent: Proxied v' + version,
            ].join('\r\n'))
            clientSocket.write('\r\n\r\n')
            serverSocket.pipe(clientSocket, { end: false })
            clientSocket.pipe(serverSocket, { end: false })
        })
    } else {
        clientSocket.end('HTTP/1.1 400 Bad Request\r\n')
        clientSocket.destroy()
    }
})