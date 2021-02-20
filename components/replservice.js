export default function replReducer(state, action) {
  const { logSize } = state;
  const { type, payload } = action;

  let ret = state;

  switch (type) {
    case 'run':
      ret.log.push(
        state.rStack ? [payload.log, state.rStack] : [payload.log]
      );
      ret = Object.assign(ret, {
        logIndex: ret.log.length,
        logSize: ret.log.length,
        stack: '',
        rStack: '',
        seekIndex: Math.max(ret.log.length - 30, 0),
        lastRun: Date.now()
      });
      break;
    case 'seek':
      const sd = state.seekIndex + payload.seekDelta;
      ret.seekIndex = Math.min(Math.max(state.logSize - 30, 0), Math.max(sd, 0));
      break;
    case 'inc':
      ret.logIndex = Math.min(state.logIndex + 1, Math.max(logSize - 1, 0));
      ret.stack = state.log.length > 0 ? state.log[ret.logIndex][0] : '';
      ret.rStack = (state.log.length > 0 && state.log[ret.logIndex].length > 1) ? state.log[ret.logIndex][1] : '';
      break;
    case 'dec':
      ret.logIndex = Math.max(state.logIndex - 1, 0);
      ret.stack = state.log.length > 0 ? state.log[ret.logIndex][0] : '';
      ret.rStack = (state.log.length > 0 && state.log[ret.logIndex].length > 1) ? state.log[ret.logIndex][1] : '';
      break;
    case 'regexp':
      ret = Object.assign(ret, {
        stack: payload.result,
        rStack: payload.rStack
      });
      break;
    case 'pop':
      ret.stack = '';
      break;
    // case 'push':
    //   break;
    case 'reset':
      ret = Object.assign(ret, {
        logIndex: Math.max(payload ? payload.logSize : logSize, 0),
        logSize: (payload ? payload.logSize : logSize),
        stack: '',
        rStack: ''
      });
      break;
    case 'server-reply':
      ret.serverLog.push(payload);
      ret = Object.assign(ret, {
        serverLogIndex: ret.serverLog.length,
        serverLogSize: ret.serverLog.length,
        serverSeekIndex: Math.max(ret.serverLog.length - 30, 0),
      });
      break;
    case 'server-run':
      ret.lastRun = Date.now();
      break;
    default:
      console.log('default', type, payload);
      break;
  }

  // TODO:
  if (type.indexOf('server-') != 0) {
    ret.lastAction = type;
  }

  console.log('mutate =>', ret);

  return ret;
};
