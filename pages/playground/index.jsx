import { useEffect, useRef, useState, useReducer, useContext } from 'react';

import { useHotkeys } from 'react-hotkeys-hook';
import { useGesture } from 'react-use-gesture';
import { useInView } from 'react-intersection-observer';

import TextareaAutosize from 'react-textarea-autosize';
import RandExp from 'randexp';
import io from 'socket.io-client';

import { PCode } from '@h4us/p-code';

import { PlaygroundContext } from '../../components/playgroundcontext';

import SimpleHelp from '../../components/SimpleHelp';
import HotkeyButtons from '../../components/HotkeyButtons';
import LogList from '../../components/LogList';

const initSIO = (url = '/', userName = '', sioRef= { current: false }) => {
  const instance = sioRef;

  instance.current = io(url);

  instance.current.on('login', (data) => {
    console.info('login');
    // this.numUsers = data.numUsers;
    // this.tabText = `server: online[${data.numUsers}]`;
  });

  instance.current.on('new message', (data) => {
    console.info('new message', data);
    // this.pushMessage('server', data);
  });

  instance.current.on('reply command', (data) => {
    console.info('reply command');
    // const { message = [], action } = data;
    // if (action == 'H' && message.length > 0) {
    //   this.serverHistory.splice(0, 0, ...message.reverse());
    //   this.serverHistoryIndex = message.length - 1;
    //   this.showHistory = 'server';
    // }

    // if (action == 'P' && message.length > 0) {
    //   //
    // }
  });

  instance.current.on('user joined', (data) => {
    console.info('user joined');
    // this.numUsers = data.numUsers;
    // this.tabText = `server: online[${data.numUsers}]`;
  });

  instance.current.on('user left', (data) => {
    console.info('user left');
    // this.numUsers = data.numUsers;
    // this.tabText = `server: online[${data.numUsers}]`;
  });

  instance.current.on('typing', (data) => {
    // if (this.typingUsers.findIndex((el) => el == data.username) < 0) {
    //   this.typingUsers.push(data.username);
    // }

    // this.tabText = `server: online[${data.numUsers}] | ${this.typingUsers.join(',')} typing..`;
  });

  instance.current.on('disconnect', () => {
    console.info('you have been disconnected');
  });

  instance.current.on('reconnect', () => {
    // if (this.userName.length > 0) {
    //   instance.current.emit('add user', this.userName);
    // }
    console.info('you have been reconnected');
  });

  instance.current.emit('add user', userName);
};

const replReducer = (state, action) => {
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
    default:
      break;
  }

  ret.lastAction = type;

  console.log('mutate =>', ret);

  return ret;
};

export default function IndexPage() {
  const { loginNameRef } = useContext(PlaygroundContext);

  const [elapsed, setElapsed] = useState(0);

  const pRef = useRef('');
  const logAreaRef = useRef();
  const logListRef = useRef();
  const pCodeRef = useRef();
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const [logStartRef, logStartInView ] = useInView({
    // root: logAreaRef.current,
    rootMargin: '-10px 0px -10px 0px'
  });

  const [logEndRef, logEndInView ] = useInView({
    rootMargin: '-10px 0px -96px 0px'
  });

  const vpH = useRef(0);
  const vpOh = useRef(0);

  const sioRef = useRef();

  const runloop = (time) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      const fps = 30;

      if (deltaTime > (1000 / fps)) {
        if (pCodeRef.current != undefined) {
          if (pCodeRef.current.isPlaying) {
            if (pCodeRef.current.hasNext()) {
              let node = pCodeRef.current.tokens[pCodeRef.current.pointer];
              pCodeRef.current.execute(node);
              pCodeRef.current.next();
            } else {
              pCodeRef.current.isPlaying = false;
            }
          } else {
            if (pCodeRef.current.doLoop) {
              pCodeRef.current.reset();
              pCodeRef.current.isPlaying = true;
            } else {
              pCodeRef.current.stop();
            }
          }
        }

        previousTimeRef.current = time - (deltaTime % fps);
      }
    } else {
      previousTimeRef.current = time;
    }

    requestRef.current = requestAnimationFrame(runloop);
  };

  const resetAction = _ => {
    if (replState.rStack.length > 0) {
      pRef.current.value = replState.rStack;
    }
    replDispatch({ type: 'reset' });
    setElapsed((n) => n + 1);
  };

  const popAction = _ => {
    if (
      ['inc', 'dec', 'regexp'].includes(replState.lastAction)
      && replState.stack
    ) {
      pRef.current.value = replState.stack;
      replDispatch({ type: 'pop' });
      setElapsed((n) => n + 1);
    }
  };

  const regexpAction = _ => {
    let re = false;
    let src = pRef.current.value;
    // if (pRef.current.value.length == 0 && replState.rStack.length > 0) {
    if (replState.rStack.length > 0) {
      src = replState.rStack;
    }

    // TODO:
    try {
      re = new RegExp(src);
    } catch (err) {
      console.error(err);
    }

    if (re && src.length > 0) {
      replDispatch({
        type: 'regexp',
        payload: { rStack: src, result: new RandExp(re).gen() }
      });
      setElapsed((n) => n + 1);
    }
    // --
  };

  const incAction = _ => {
    replDispatch({ type: 'inc' });
    setElapsed((n) => n + 1);
  };

  const decAction = _ => {
    replDispatch({ type: 'dec' });
    setElapsed((n) => n + 1);
  };

  const runAction = _ => {
    const execute = (replState.stack.length > 0) ? replState.stack : pRef.current.value;

    if (execute.length > 0) {
      // TODO--
      sioRef.current.emit(
        'new message', {
        message: (replState.rStack.length > 0 ? [execute, replState.rStack] : execute),
        bus: 0
      }
      );

      replDispatch({ type: 'run', payload: { log: execute } });

      pRef.current.value = '';

      if (replState.lastAction == 'run' && replState.log.length > 0) {
        if (pCodeRef.current == undefined) {
          pCodeRef.current = new PCode({
            defaultVolume: -12,
            comment: { enable: true },
            meta: { enable: true }
          });
        }

        if (pCodeRef.current != undefined) {
          pCodeRef.current.run(replState.log[replState.log.length - 1][0]);
        }
      }

      setElapsed((n) => n + 1);
    }
  };

  const [replState, replDispatch] = useReducer(replReducer, {
    log: [],
    logIndex: 0,
    logSize: 0,
    seekIndex: 0,
    stack: '',
    rStack: '',
    lastAction: ''
  });

  useHotkeys(
    'esc', resetAction,
    { enableOnTags: ['TEXTAREA', 'INPUT'] }
  );

  useHotkeys(
    'enter', popAction,
    { enableOnTags: ['TEXTAREA', 'INPUT'] }
  );

  useHotkeys(
    'ctrl+space', regexpAction,
    { enableOnTags: ['TEXTAREA', 'INPUT'] }
  );

  useHotkeys(
    'ctrl+.', incAction,
    { enableOnTags: ['TEXTAREA'] }
  );

  useHotkeys(
    'ctrl+,', decAction,
    { enableOnTags: ['TEXTAREA'] }
  );

  useHotkeys(
    'ctrl+enter', runAction,
    { enableOnTags: ['TEXTAREA'] },
    // [ runlog, minibuf ]
  );

  useGesture(
    {
      onDrag: (state) => {
        // TODO:
        // console.log('drag', state);
        if (logListRef.current) {
          if ((logStartInView && !logEndInView && state.direction[1] > 0)
            || (!logStartInView && logEndInView && state.direction[1] < 0)) {
            replDispatch({
              type: 'seek',
              payload: { seekDelta: Math.round(state.direction[1]) * -1 * Math.min(Math.abs(state.delta[1]), 5) }
            });
            setElapsed((n) => n + 1);
          }
        }
      },
      onWheel: (state) => {
        // TODO:
        if (logListRef.current) {
          if ((logStartInView && !logEndInView && state.direction[1] < 0)
            || (!logStartInView && logEndInView && state.direction[1] > 0)) {
            replDispatch({ type: 'seek', payload: { seekDelta: state.direction[1] } });
            setElapsed((n) => n + 1);
          }
        }
      }
    },
    {
      domTarget: logListRef,
      eventOptions: { passive: false }
    }
  );

  useEffect(() => {
    if (['run', 'reset', 'push', 'pop'].includes(replState.lastAction)) {
      pRef.current.focus();
    }
  }, [elapsed]);

  useEffect(() => {
    let pendingUpdate = false;

    console.log(loginNameRef, loginNameRef.current);

    function viewportHandler(event) {

      if (pendingUpdate) return;
      pendingUpdate = true;

      requestAnimationFrame(() => {
        pendingUpdate = false;

        const layoutViewport = document.querySelector('footer');
        const rootDoc = document.querySelector('body');
        const viewport = event.target;
        // const offsetTop = viewport.height
        //   - layoutViewport.getBoundingClientRect().height
        //   + viewport.offsetTop;

        if (rootDoc.clientHeight != viewport.height) {
          rootDoc.style.height = `${viewport.height}px`;
        }
        // document.querySelector('footer').style.transform = 'translateY(' +
        //   offsetTop + 'px) ' +
        //   'scale(' + 1 / viewport.scale + ')';
      });
    };

    window.visualViewport.addEventListener('scroll', viewportHandler);
    window.visualViewport.addEventListener('resize', viewportHandler);

    initSIO(process.env.NEXT_PUBLIC_API_SERVER, loginNameRef.current, sioRef);

    requestRef.current = requestAnimationFrame(runloop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <>
      <main
        className="absolute left-0 top-0 w-full max-h-screen overflow-y-scroll"
        ref={logAreaRef}>
        {/* history */}
        <div
          className="px-5 pt-5 py-24 overscroll-y-none"
          ref={logListRef}>
          <LogList replState={replState} logStartRef={logStartRef} logEndRef={logEndRef} />
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-white overscroll-y-none max-h-screen">
        {/* real textarea & completion view */}
        <div className="flex flex-no-wrap items-stretch justify-between w-full pl-2 pr-5 my-2">
          <span className="w-12 flex items-center justify-around px-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M9.25 12a.75.75 0 01-.22.53l-2.75 2.75a.75.75 0 01-1.06-1.06L7.44 12 5.22 9.78a.75.75 0 111.06-1.06l2.75 2.75c.141.14.22.331.22.53zm2 2a.75.75 0 000 1.5h5a.75.75 0 000-1.5h-5z"></path>
              <path fill-rule="evenodd" d="M0 4.75C0 3.784.784 3 1.75 3h20.5c.966 0 1.75.784 1.75 1.75v14.5A1.75 1.75 0 0122.25 21H1.75A1.75 1.75 0 010 19.25V4.75zm1.75-.25a.25.25 0 00-.25.25v14.5c0 .138.112.25.25.25h20.5a.25.25 0 00.25-.25V4.75a.25.25 0 00-.25-.25H1.75z"></path>
            </svg>
          </span>
          <TextareaAutosize placeholder="Type here" ref={pRef} className={`w-full ml-1 resize-none${replState.stack?.length > 0 ? ' hidden' : ''}`} />
          <TextareaAutosize className={`w-full ml-1 resize-none text-green-900 text-opacity-100${replState.stack?.length > 0 ? '' : ' hidden'}`} disabled>
            {replState.stack}
          </TextareaAutosize>
        </div>

        {/* regexp stack view */}
        <div className={`flex flex-no-wrap items-stretch justify-between w-full pl-2 pr-5 my-2${replState.rStack?.length > 0 ? '' : ' hidden'}`}>
          <span className="w-12 flex items-center justify-around px-2 ml-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
              <path fill-rule="evenodd" d="M5.75 21a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM2.5 19.25a3.25 3.25 0 106.5 0 3.25 3.25 0 00-6.5 0zM5.75 6.5a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM2.5 4.75a3.25 3.25 0 106.5 0 3.25 3.25 0 00-6.5 0zM18.25 6.5a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM15 4.75a3.25 3.25 0 106.5 0 3.25 3.25 0 00-6.5 0z"></path>
              <path fill-rule="evenodd" d="M5.75 16.75A.75.75 0 006.5 16V8A.75.75 0 005 8v8c0 .414.336.75.75.75z"></path><path fill-rule="evenodd" d="M17.5 8.75v-1H19v1a3.75 3.75 0 01-3.75 3.75h-7a1.75 1.75 0 00-1.75 1.75H5A3.25 3.25 0 018.25 11h7a2.25 2.25 0 002.25-2.25z"></path>
            </svg>
          </span>
          <TextareaAutosize className={`w-full ml-1 resize-none bg-white text-gray-900`} disabled>
            {replState.rStack}
          </TextareaAutosize>
        </div>

        {/* help */}
        <SimpleHelp replState={replState} />

        {/* hotkey alternative, for mobile device */}
        <HotkeyButtons
          runAction={runAction}
          regexpAction={regexpAction}
          resetAction={resetAction}
          popAction={popAction}
          incAction={incAction}
          decAction={decAction} />
      </footer>
    </>
  );
}
