require('dotenv').config({silent: true});

require('cf-deployment-tracker-client').track();

var server = require('./app');
var port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log('Server running on port: %d', port);
});
