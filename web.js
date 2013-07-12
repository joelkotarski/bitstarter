var express = require('express');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  var index = fs.readFileSync('index.html');
  var str = index.toString();
  response.send(str);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});