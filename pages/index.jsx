import { useEffect, useRef, useState, useReducer } from 'react';

import { useHotkeys } from 'react-hotkeys-hook';
import TextareaAutosize from 'react-textarea-autosize';
import RandExp from 'randexp';

import { PCode } from '@h4us/p-code';

const replReducer = (state, action) => {
  const { logSize } = state;
  const { type, payload } = action;

  let ret = state;

  switch (type) {
  case 'run':
    console.log('has regexp? ', state.rStack);
    const newlog = state.log.concat(payload.log);
    ret = Object.assign(ret, {
      log: newlog,
      logIndex: newlog.length,
      logSize: newlog.length,
      stack: '',
      rStack: '',
    });
    break;
  case 'inc':
    ret.logIndex = Math.min(state.logIndex + 1, Math.max(logSize - 1, 0));
    //
    ret.stack = state.log[ret.logIndex];
    break;
  case 'dec':
    ret.logIndex = Math.max(state.logIndex - 1, 0);
    //
    ret.stack = state.log[ret.logIndex];
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
  const [runlog, setRunlog] = useState([]);
  const [minibuf, setMinibuf] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const pRef = useRef('');
  const pCodeRef = useRef();
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const runloop = (time) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      const fps = 30;

      if (deltaTime > (1000 / fps)) {
        if (pCodeRef.current != undefined) {
          if(pCodeRef.current.isPlaying) {
            if(pCodeRef.current.hasNext()) {
              let node = pCodeRef.current.tokens[pCodeRef.current.pointer];
              pCodeRef.current.execute(node);
              pCodeRef.current.next();
            } else {
              pCodeRef.current.isPlaying = false;
            }
          } else {
            if(pCodeRef.current.doLoop) {
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

  const [replState, replDispatch] = useReducer(replReducer, {
    log: [],
    logIndex: 0,
    logSize: 0,
    stack: '',
    rStack: '',
    lastAction: ''
  });

  useHotkeys(
    'esc',
    _ => {
      if (replState.rStack.length > 0) {
        pRef.current.value = replState.rStack;
      }
      replDispatch({ type: 'reset' });
      setElapsed((n) => n + 1);
    },
    { enableOnTags: ['TEXTAREA', 'INPUT'] }
  );

  useHotkeys(
    'enter',
    _ => {
      if (
        ['inc', 'dec', 'regexp'].includes(replState.lastAction)
          && replState.stack
      ) {
        pRef.current.value = replState.stack;
        replDispatch({ type: 'pop' });
        setElapsed((n) => n + 1);
      }
    },
    { enableOnTags: ['TEXTAREA', 'INPUT'] }
  );

  useHotkeys(
    'ctrl+space',
    () => {
      let re = false;

      // TODO:
      try {
        re = new RegExp(pRef.current.value);
      } catch(err) {
        console.error(err);
      }

      if (re) {
        replDispatch({
          type: 'regexp',
          payload: { rStack: pRef.current.value, result: new RandExp(re).gen() }
        });
        setElapsed((n) => n + 1);
      }
      // --
    },
    {
      enableOnTags: ['TEXTAREA', 'INPUT']
    }
  );

  useHotkeys(
    'ctrl+,',
    _ => {
      replDispatch({ type: 'dec'});
      setElapsed((n) => n + 1);
    },
    {
      enableOnTags: ['TEXTAREA']
    }
  );

  useHotkeys(
    'ctrl+.',
    _ => {
      replDispatch({ type: 'inc'});
      setElapsed((n) => n + 1);
    },
    {
      enableOnTags: ['TEXTAREA']
    }
  );

  useHotkeys(
    'ctrl+enter',
    _ => {
      const execute = (replState.stack.length > 0) ? replState.stack : pRef.current.value;

      if (execute.length > 0) {
        replDispatch({ type: 'run', payload: { log: execute } });
        pRef.current.value = '';
        setElapsed((n) => n + 1);
      }
    },
    {
      enableOnTags: ['TEXTAREA']
    },
    // [ runlog, minibuf ]
  );

  useEffect(() => {
    if (replState.lastAction == 'run' &&  replState.log.length > 0) {
      if (pCodeRef.current == undefined) {
        pCodeRef.current = new PCode({
          defaultVolume: -12,
          comment: { enable: true },
          meta: { enable: true }
        });
      }

      if (pCodeRef.current != undefined) {
        pCodeRef.current.run(replState.log[replState.log.length - 1]);
      }
    }

    if (['run', 'reset', 'push', 'pop'].includes(replState.lastAction)) {
      pRef.current.focus();
    }
  }, [ elapsed ]);

  useEffect(() => {
    window.visualViewport.addEventListener('resize', (e) => {
      const vp = e.target;
      console.log(vp, vp.height, vp.offsetTop, vp.scale);
      // if (bottomNavRef.current) {
      //   console.log(bottomNavRef.current);
      // }
    });

    requestRef.current = requestAnimationFrame(runloop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <>
      <main>
        <div className="px-5 py-5">
          {/* history */}
          <ul className="break-all">
            {
              replState.log.length > 0 &&
                replState.log.slice(-20).map((el, i) => (
                  <li>
                    <span className="w-12 inline-flex text-gray-500">{Math.max(replState.log.length-20, 0)+i}</span>{el}
                  </li>
                ))
            }
          </ul>

          {/* real textarea & completion view */}
          <div className="flex flex-no-wrap items-stretch justify-between w-full">
            <button className="w-12 flex items-center justify-around px-2 bg-gray-100 focus:outline-none focus:shadow-outline">
              <svg fill="#000" stroke="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M10.7 10.8l-6-6c-0.4-0.4-1-0.4-1.4 0s-0.4 1 0 1.4l5.3 5.3-5.3 5.3c-0.4 0.4-0.4 1 0 1.4 0.2 0.2 0.4 0.3 0.7 0.3s0.5-0.1 0.7-0.3l6-6c0.4-0.4 0.4-1 0-1.4zM20 18.5h-8c-0.6 0-1 0.4-1 1s0.4 1 1 1h8c0.6 0 1-0.4 1-1s-0.4-1-1-1z"></path>
              </svg>
            </button>
            <TextareaAutosize placeholder="Type here" ref={pRef} className={`w-full ml-1 resize-none${ replState.stack?.length > 0 ? ' hidden' : '' }`} />
            <TextareaAutosize className={`w-full ml-1 resize-none text-green-500${ replState.stack?.length > 0 ? '' : ' hidden' }`} disabled>
              {replState.stack}
            </TextareaAutosize>
          </div>

          {/* regexp stack view */}
          <div className={`flex flex-no-wrap items-stretch justify-between w-full${ replState.rStack?.length > 0 ? '' : ' hidden' }`}>
            <span className="w-12 flex items-center justify-around px-2 ml-10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4">
                <path fill-rule="evenodd" d="M5.75 21a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM2.5 19.25a3.25 3.25 0 106.5 0 3.25 3.25 0 00-6.5 0zM5.75 6.5a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM2.5 4.75a3.25 3.25 0 106.5 0 3.25 3.25 0 00-6.5 0zM18.25 6.5a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM15 4.75a3.25 3.25 0 106.5 0 3.25 3.25 0 00-6.5 0z"></path>
                <path fill-rule="evenodd" d="M5.75 16.75A.75.75 0 006.5 16V8A.75.75 0 005 8v8c0 .414.336.75.75.75z"></path><path fill-rule="evenodd" d="M17.5 8.75v-1H19v1a3.75 3.75 0 01-3.75 3.75h-7a1.75 1.75 0 00-1.75 1.75H5A3.25 3.25 0 018.25 11h7a2.25 2.25 0 002.25-2.25z"></path>
              </svg>
            </span>
            <TextareaAutosize className={`w-full ml-1 resize-none bg-white text-gray-500`} disabled>
              {replState.rStack}
            </TextareaAutosize>
          </div>

          {/* help */}
          <div className="w-full pl-12 text-gray-600 text-xs italic">
            {
              (!replState.stack || replState.stack.length == 0) ?
              `<Ctrl+Enter> Run | <Ctrl+Space> Random regexp completion`
              : `<Ctrl+Enter> Run | <Ctrl+Space> Random regexp completion | <Enter> Edit result | <Esc> Clear completion`
            }
            {
              replState.log.length > 0 &&
                ` | <Ctrl+,> History backward | <Ctrl+.> History forward`
            }
            {
              (replState.rStack?.length > 0 && !['run', 'regexp'].includes(replState.lastAction)) &&
                ` | <Esc> Pop original input`
            }
          </div>
        </div>
      </main>
    </>
  );
}
