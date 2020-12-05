const http = require('http');

http.createServer((request, response) => {
    let body = [];
    request.on('error', (err) => {
        console.log(err);
    }).on('data', (chunk) => {
        console.log(chunk);
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        console.log(body);
        response.writeHeader(200, { 'Content-Type': 'text/html' });
        response.end('Hello World\n');
    })
}).listen(8088);

console.log('server started');