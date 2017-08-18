var http = require('http'); // Built-in http module provides HTTP server and client functionality
var fs = require('fs'); // Built-in fs module provides filesystem-related functionality
var path = require('path'); // Built-in path module provides filesystem path–related functionality
var mime = require('mime'); // Add-on mime module provides ability to derive a MIME type based on a filename extension
var cache = {}; // cache object is where the contents of cached files are stored

// creating the http server
var server = http.createServer(function(request, response) { // Create HTTPserver, using anonymous function to define per-request behavior
    var filePath = false;
    if (request.url == '/') {
        filePath = 'public/index.html'; // Determine HTML file to be served by default
    } else {
        filePath = 'public' + request.url; // Translate URL path to relative file path
    }
    var absPath = './' + filePath;
    serveStatic(response, cache, absPath); // Serve static file
});

server.listen(3000, function() {
    console.log("Server listening on port 3000.");
});

// loads functionality from a custom Node module and starts the Socket.IO server
var chatServer = require('./lib/chat_server');
chatServer.listen(server); // providing it with an defined  HTTP server so it can share the same  TCP / IP port

// handle the sending of 404 errors
function send404(response) {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.write('Error 404: resource not found.');
    response.end();
}

//  sends the contents of the file
function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200, { "content-type": mime.lookup(path.basename(filePath)) } //auto fill the mime type by using the filepath 
    );
    response.end(fileContents);
}

//  determines whether or not a file is cached and,if so, serves it
function serveStatic(response, cache, absPath) {
    if (cache[absPath]) { // Check if file is cached in memory
        sendFile(response, absPath, cache[absPath]); // Serve file from memory
    } else {
        fs.exists(absPath, function(exists) { // Check if file exists
            if (exists) {
                fs.readFile(absPath, function(err, data) { // Read file from disk
                    if (err) {
                        send404(response);
                    } else {
                        cache[absPath] = data;
                        sendFile(response, absPath, data); // Serve file read from disk
                    }
                });
            } else {
                send404(response); // Send HTTP 404 response
            }
        });
    }
}