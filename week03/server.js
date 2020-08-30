const http = require('http')

http.createServer((request, response) => {
  let body = []
  request.on('error', (err) => {
    console.error(err)
  }).on('data', (chunk) => {
    body.push(chunk)
  }).on('end', () => {
    body = Buffer.concat(body).toString()
    console.log('body:', body)
    response.writeHead(200, {'Content-Type': 'text/html'})
    response.end(`<html lang=en>
  <head>
    <meta charset=UTF-8 a="b" />
    <title>Document</title>
    <style>
      .version {
        display: flex;
        justify-content: space-between;
      }
      div .version .nickName {
        color: #666666;
      }
      .nickName {
        color: red;
      }
      .content .out {
        color: #666666;
        text-align: center;
        border: 1px solid #F4F4F4;
        border-radius: 20px;
      }
    </style>
  </head>
<body>
<div class="content">
  <div class="version">
    <div class="nickName">chen jian</div>
  </div>
  <div class="out">OUT</div>
</div>
</body>
</html>
`)
  })
}).listen(8088)

console.log('server started')