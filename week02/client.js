const net = require('net');
const { resolve, parse } = require('path');
const { rejects } = require('assert');
const { CLIENTRENEGWINDOW } = require('tls');

class Request {
  constructor(options) {
    this.method = options.method || 'GET';
    this.host = options.host;
    this.port = options.port || 80;
    this.path = options.path || '/';
    this.body = options.body || {};
    this.headers = options.headers || {};
    if(!this.headers['Content-Type']) {
      this.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    if(this.headers['Content-Type'] === 'application/json')
      this.bodyText = JSON.stringify(this.body)
    else if(this.headers['Content-Type'] === 'application/x-www-form-urlencoded')
      this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&')
    
    this.headers['Content-length'] = this.bodyText.length
  }

  send(connection) {
    return new Promise((resolve, reject) => {
      const parser = new ResponseParser()
      if (connection) {
        connection.write(this.toString())
      } else {
        connection = net.createConnection({
          host: this.host,
          port: this.port
        }, () => {
          connection.write(this.toString())
        })
      }

      connection.on('data', data => {
        parser.receive(data.toString())
        if (parser.isFinished) {
          resolve(parser.response)
          connection.end()
        }
      })
      
      connection.on('error', err => {
        reject(err)
        connection.end()
      })
    });
  }

  toString() { 
    return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r
${this.bodyText}`
  }
}

class ResponseParser {
  constructor() {
    this.statusLine = "";
    this.headers = {};
    this.headerName = "";
    this.headerValue = "";
    this.bodyParser = null;
  }

  get isFinished() {
    return this.bodyParser && this.bodyParser.isFinished;
  }

  get response() {
    this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
    return {
      statusCode: RegExp.$1,
      statusText: RegExp.$2,
      headers: this.headers,
      body: this.bodyParser.content.join('')
    }
  }

  receive(string) {
    let state = this.WAITINGSTATUSLINE
    for (let i = 0; i < string.length; i++) {
      state = state(string.charAt(i));
    }
  }

  WAITINGSTATUSLINE = (c)=> {
    if (c === '\r') {
      this.statusLine
      return this.WAITINGSTATUSLINEEND;
    } else {
      this.statusLine += c;
      return this.WAITINGSTATUSLINE
    }
  }

  WAITINGSTATUSLINEEND = (c)=> {
    if (c === '\n') {
      return this.WAITINGHEADERLINE
    }
  }

  WAITINGHEADERLINE = (c)=> {
    if (c === ':') {
      return this.WAITINGHEADERSPACE;
    } else {
      this.headerName += c;
      return this.WAITINGHEADERLINE
    }
  }

  WAITINGHEADERSPACE = (c)=> {
    if (c === ' ') {
      return this.WAITINGHEADERVALUE
    }
  }

  WAITINGHEADERVALUE = (c)=> {
    if (c === '\r') {
      this.headers[this.headerName] = this.headerValue;
      this.headerName = "";
      this.headerValue = "";
      return this.WAITINGHEADERVALUE;
    } else if (c === '\n') {
      return this.WAITINGHEADERLINEEND
    } else {
      this.headerValue += c;
      return this.WAITINGHEADERVALUE
    }
  }

  WAITINGHEADERLINEEND = (c)=> {
    if (c === '\r') {
      return this.WAITINGHEADERBLOCKEND
    } else {
      return this.WAITINGHEADERLINE(c)
    }
  }

  WAITINGHEADERBLOCKEND = (c)=> {
    if (c === '\n') {
      return this.WATINGBODY
    }
  }

  WATINGBODY = (c)=> {
    if (this.headers['Transfer-Encoding'] === 'chunked') {
      this.bodyParser = new TrunkedBodyParser()
    }
    return this.bodyParser.WAITINGLENGTHLINE(c)
  }
}

class TrunkedBodyParser {
  constructor() {
    this.length = 0;
    this.content = [];
    this.isFinished = false;
  }
  /*
  Content-Type: text/html\r\n
  Date: Wed, 26 Aug 2020 16:54:50 GMT\r\n
  Connection: keep-alive\r\n
  Transfer-Encoding: chunked\r\n
  \r\n
  d\r\n
   Hello World\n\r\n
  0\r\n
  \r\n
  */
  WAITINGLENGTHLINE = (c)=> {
    if (c === '\r') {
      if (this.length === 0) {
        this.isFinished = true
        return this.END
      }
      return this.WAITINGLENGTHLINEEND;
    } else {
      this.length *= 16;
      this.length += parseInt(c, 16);
      return this.WAITINGLENGTHLINE
    }
  }

  WAITINGLENGTHLINEEND = (c) => {
    if (c === '\n') {
      return this.READINGTRUNK;
    }
  }

  READINGTRUNK = (c)=> {
    this.content.push(c);
    this.length--;
    if (this.length === 0) {
      return this.WAITINGNEWLINE;
    } else {
      return this.READINGTRUNK
    }
  }
  WAITINGNEWLINE = (c)=> {
    if (c === '\r') {
      return this.WAITINGNEWLINEEND;
    }
  }
  WAITINGNEWLINEEND = (c)=> {
    if (c === '\n') {
      return this.WAITINGLENGTHLINE;
    }
  }

  END = _=> this.END
}

void async function() {
  let request = new Request({
    method: 'POST',
    host: '127.0.0.1',
    port: '8088',
    path: '/',
    headers: {
      ['X-Foo2']: 'customed'
    },
    body: {
      name: 'winter'
    }
  })

  let response = await request.send();

  console.log(response);
  
}()