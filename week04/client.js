const net = require("net");

class Request {
    constructor(options) {
        this.method = options.method || 'GET';
        this.host = options.host;
        this.port = options.port || '80';
        this.path = options.path || '/';
        this.headers = options.headers || {};
        this.body = options.body;

        // 处理headers
        if (!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        if (this.headers["Content-Type"] === "application/json") {
            this.bodyText = JSON.stringify(body);
        } else if (this.headers["Content-Type"] === "application/x-www-form-urlencoded") {
            this.bodyText = '';
            for(let key in this.body) {
                this.bodyText += `${key}=${encodeURIComponent(this.body[key])}&`;
            }
            if (this.bodyText) {
                this.bodyText = this.bodyText.slice(0, -1);
            }
        }
        this.headers['Content-Length'] = this.bodyText.length;
    }

    // 发送requset的内容
    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r
${this.bodyText}`
    }

    send(connection) {
        return new Promise((resolve, reject) => {
            // response为String类型，设计类去处理
            const parser = new ResponseParser();
            // 发送
            if (connection) {
                connection.write(this.toString());
            } else {
                connection = net.createConnection({
                    host: this.host,
                    port: this.port                    
                }, () => {
                    connection.write(this.toString());
                })
            }

            // 监听返回
            connection.on('data', data => {
                // parser解析返回的数据,生成response内容
                parser.receive(data.toString());
                // 如果解析完成，就关闭connect
                if (parser.isFinished) {
                    resolve(parser.response);
                    connection.end();
                }
            })

            connection.on('error', err => {
                reject(err);
                connection.end();
            })
        })
    }
}

class ResponseParser {
    constructor() {
    }

    receive(string) {
        console.log(string);
        for (let c of string) {
            this.receiveChar(c);
        }
    }

    receiveChar(char) {

    }
}

void async function () {
    let request = new Request({
        method: 'POST',// http协议要求的
        host: '127.0.0.1',// IP
        port: '8088',// TCP
        path: '/',//HTTP
        headers: {
            ['X-Foo2']: 'customed'
        },
        body: {
            name: 'winter'
        }
    })

    let response = await request.send();

    console.log(response)
}()