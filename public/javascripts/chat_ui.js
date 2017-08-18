var socket = io.connect();

$(document).ready(function() {
    var chatApp = new Chat(socket);

    socket.on('nameResult', function(result) { // Display results of a name-change attempt
        var message;
        if (result.success) {
            message = 'You are now known as ' + result.name + '.';
        } else {
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    });

    socket.on('joinResult', function(result) { // Display results of a room change
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });

    socket.on('message', function(message) { // Display received  messages
        var newElement = $('<div class="rec-msg"></div>').text(message.text);
        $('#messages').append(newElement);
    });

    socket.on('rooms', function(rooms) {
        $('#room-list').empty();
        for (var room in rooms) {
            room = room.substring(1, room.length);
            if (room != '') {
                $('#room-list').append(divEscapedRoomList(room));
            }
        }
        $('#room-list div').click(function() { // Allow click of a room name to change to that room
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });

    setInterval(function() { // Request list of rooms available intermittently
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();
    $('#send-form').submit(function() { // Allow submitting the form to send a chat message
        processUserInput(chatApp, socket);
        return false;
    });
});

function divEscapedContentElement(message) {
    return $('<div class="user-msg"></div>').text("Me:"+message);
}

function divEscapedRoomList(message) {
    return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div class="sys-msg"></div>').html('<span class="command">' + message + '</span>');
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    var systemMessage;
    if (message.charAt(0) == '/') { // If user input begins with slash, treat it as command
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage($('#room').text(), message); //  Broadcast noncommand input to other users
        $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
}