import { useEffect, useRef, useState, useReducer } from 'react';

import { useHotkeys } from 'react-hotkeys-hook';
import TextareaAutosize from 'react-textarea-autosize';
import RandExp from 'randexp';

import { PCode } from '@h4us/p-code';

import Nav from '../components/nav';

export default function IndexPage() {
  const [runlog, setRunlog] = useState([]);
  const [minibuf, setMinibuf] = useState('');

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

  const logReducer = (state, action) => {
    const { logSize } = state;
    const { type, payload } = action;
    let ret;

    switch(type) {
    case 'inc':
      ret = {
        index: Math.min(state.index + 1, logSize - 1), logSize
      };
      break;
    case 'dec':
      ret = {
        index: Math.max(state.index - 1, 0), logSize
      };
      break;
    default:
      ret = {
        index: Math.max(payload ? payload.logSize : logSize, 0),
        logSize: (payload ? payload.logSize : logSize)
      };
    }

    return ret;
  };

  const [logState, logDispatch] = useReducer(logReducer, { index: 0, logSize: 0 });

  useHotkeys('esc', () => {
    logDispatch({ action: 'reset' });
    setMinibuf('');
  }, { enableOnTags: ['TEXTAREA', 'INPUT'] });

  useHotkeys('enter', (e) => {
    if (minibuf.length > 0) {
      pRef.current.value = minibuf;
      setMinibuf('');
    }
  }, { enableOnTags: ['TEXTAREA', 'INPUT'] }, [ minibuf ]);

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
        setMinibuf(new RandExp(re).gen());
      }
      // --
    },
    {
      enableOnTags: ['TEXTAREA', 'INPUT']
    }
  );

  useHotkeys(
    'ctrl+,',
    (e) => {
      logDispatch({ type: 'dec' });
    },
    {
      enableOnTags: ['TEXTAREA']
    },
    [ runlog, logState ]
  );

  useHotkeys(
    'ctrl+.',
    (e) => {
      logDispatch({ type: 'inc' });
    },
    {
      enableOnTags: ['TEXTAREA']
    },
    [ runlog, logState ]
  );

  useHotkeys(
    'ctrl+enter',
    (e) => {
      const execute = (minibuf.length > 0) ? minibuf : pRef.current.value;

      if (execute.length > 0) {
        setRunlog((prevLog) => { return prevLog.concat(execute); });
        setMinibuf('');
        pRef.current.value = '';
      }
    },
    {
      enableOnTags: ['TEXTAREA']
    },
    [ runlog, minibuf ]
  );

  useEffect(() => {
    if (minibuf.length == 0) {
      pRef.current.focus();
    }
  }, [ minibuf ]);

  useEffect(() => {
    console.log('fire');
    logDispatch({ action: 'reset', payload: { logSize: runlog.length }});

    if (runlog.length > 0) {
      if (pCodeRef.current == undefined) {
        pCodeRef.current = new PCode({
          defaultVolume: -12,
          comment: { enable: true },
          meta: { enable: true }
        });
      }

      if (pCodeRef.current != undefined) {
        pCodeRef.current.run(runlog[runlog.length - 1]);
      }
    }
  }, [ runlog ]);

  useEffect(() => {
    if (logState.index < logState.logSize) {
      setMinibuf(runlog[logState.index]);
    }
  }, [ logState ]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(runloop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <>
      {/* <Nav/> */}

      <main>
        {/* <p> */}
        {/*   {`You've pressed Control+. ${count} times.`} */}
        {/* </p> */}

        <div className="px-5 py-5">
          <ul className="break-all">
            {
              runlog.length > 0 &&
                runlog.slice(-20).map((el, i) => (
                  <li>
                    <span className="w-12 inline-flex text-gray-500">{Math.max(runlog.length-20, 0)+i}</span>{el}
                  </li>
                ))
            }
          </ul>

          <div className="flex flex-no-wrap items-stretch justify-between w-full">
            <button className="w-12 flex items-center justify-around px-2 bg-gray-100 focus:outline-none focus:shadow-outline">
              <svg fill="#000" stroke="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M10.7 10.8l-6-6c-0.4-0.4-1-0.4-1.4 0s-0.4 1 0 1.4l5.3 5.3-5.3 5.3c-0.4 0.4-0.4 1 0 1.4 0.2 0.2 0.4 0.3 0.7 0.3s0.5-0.1 0.7-0.3l6-6c0.4-0.4 0.4-1 0-1.4zM20 18.5h-8c-0.6 0-1 0.4-1 1s0.4 1 1 1h8c0.6 0 1-0.4 1-1s-0.4-1-1-1z"></path>
              </svg>
            </button>
            <TextareaAutosize placeholder="Type here" ref={pRef} className={`w-full ml-1 resize-none${ minibuf.length > 0 ? ' hidden' : '' }`} />
            <TextareaAutosize className={`w-full ml-1 resize-none text-green-500${ minibuf.length > 0 ? '' : ' hidden' }`} disabled>
              {minibuf}
            </TextareaAutosize>
          </div>

          <div className="w-full pl-12 text-gray-600 text-xs italic">
            {
              minibuf.length == 0 ?
              `<Ctrl+Enter> Run | <Ctrl+Space> Random regexp completion`
              : `<Ctrl+Enter> Run | <Ctrl+Space> Random regexp completion | <Enter> Edit result | <Esc> Clear completion`
            }
            {
              runlog.length > 0 && ` | <Ctrl+,> History backward | <Ctrl+.> History forward`
            }
          </div>
        </div>
      </main>
    </>
  );
}
