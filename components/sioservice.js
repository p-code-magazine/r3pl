// TODO:
import io from 'socket.io-client';

export default function sioservice(url = '/', userName = '', sioRef = { current: false }, dispatch, bang) {
  const instance = sioRef;

  instance.current = io(url);

  instance.current.on('login', (data) => {
    console.info('login', data);
    // this.numUsers = data.numUsers;
    // this.tabText = `server: online[${data.numUsers}]`;
  });

  instance.current.on('new message', (data) => {
    const { username = '', message = '', r = false, timestamp } = data;

    dispatch({
      type: 'server-reply',
      payload: {
        username, message, regexp: r, timestamp
      }
    });
    bang((n) => n + 1);
  });

  // instance.current.on('reply command', (data) => {
  //   console.info('reply command');
  // });

  instance.current.on('user joined', (data) => {
    console.info('user joined', data);
  });

  instance.current.on('user left', (data) => {
    console.info('user left', data);
  });

  // instance.current.on('typing', (data) => {
  //   if (this.typingUsers.findIndex((el) => el == data.username) < 0) {
  //     this.typingUsers.push(data.username);
  //   }

  //   this.tabText = `server: online[${data.numUsers}] | ${this.typingUsers.join(',')} typing..`;
  // });

  instance.current.on('disconnect', () => {
    console.info('you have been disconnected');
  });

  instance.current.on('reconnect', () => {
    console.info('you have been reconnected');
  });

  instance.current.emit('add user', userName);
};
// --
