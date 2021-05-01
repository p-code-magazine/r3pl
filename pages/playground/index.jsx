import { useEffect, useRef, useState, useReducer, useContext } from 'react';

import { useHotkeys } from 'react-hotkeys-hook';
import { useGesture, useWheel, useDrag } from 'react-use-gesture';
import { useInView } from 'react-intersection-observer';

import { useRouter } from 'next/router';

import TextareaAutosize from 'react-textarea-autosize';
import RandExp from 'randexp';

import { PCode } from '@p-code-magazine/p-code';

import { PlaygroundContext } from '../../components/playgroundcontext';
import sioservice from '../../components/sioservice';
import replReducer from '../../components/replservice';

import SimpleHelp from '../../components/SimpleHelp';
import CommandHelp from '../../components/CommandHelp';
import HotkeyButtons from '../../components/HotkeyButtons';
import LogList from '../../components/LogList';
import ServerLogList from '../../components/ServerLogList';

export default function IndexPage() {
  const { loginNameRef } = useContext(PlaygroundContext);
  const router = useRouter();

  const [elapsed, setElapsed] = useState(0);
  const [showCmdhelp, setShowCmdHelp] = useState(false);

  const pRef = useRef('');
  const logAreaRef = useRef();
  const logListRef = useRef();
  const slogListRef = useRef();
  const pCodeRef = useRef([false, false, false, false, false, false]);
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
  const busRef = useRef('auto');

  const runloop = (time) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      const fps = 30;

      if (deltaTime > (1000 / fps)) {
        if (pCodeRef.current != undefined) {
          for(let el of pCodeRef.current) {
            if (el) {
              if (el.isPlaying) {
                if (el.hasNext()) {
                  let node = el.tokens[el.pointer];
                  el.execute(node);
                  el.next();
                } else {
                  el.isPlaying = false;
                }
              } else {
                if (el.doLoop) {
                  el.reset();
                  el.isPlaying = true;
                } else {
                  el.stop();
                }
              }
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
      // ['inc', 'dec', 'regexp'].includes(replState.lastAction)
      ['inc', 'dec', 'jump', 'remote-inc', 'remote-dec', 'remote-jump', 'regexp'].includes(replState.lastAction)
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

  const serverIncAction = _ => {
    replDispatch({ type: 'remote-inc' });
    setElapsed((n) => n + 1);
  };

  const severDecAction = _ => {
    replDispatch({ type: 'remote-dec' });
    setElapsed((n) => n + 1);
  };

  const jumpAction = (to) => {
    replDispatch({ type: 'jump', payload: { jumpTo: to }});
    setElapsed((n) => n + 1);
  };

  const serverJumpAction = (to) => {
    replDispatch({ type: 'remote-jump', payload: { jumpTo: to }});
    setElapsed((n) => n + 1);
  };

  const runAction = _ => {
    const execute = (replState.stack.length > 0) ? replState.stack : pRef.current.value;

    if (execute.length > 0) {
      // TODO:
      const isLocal = /^\$ .+/.test(execute);

      if (isLocal) {
        //! set audio bus
        if (execute.indexOf('$ bus') == 0) {
          const bVal = execute.replace('$ bus ', '');
          const bNum = parseInt(bVal);

          if (!isNaN(bNum) && bNum < pCodeRef.current.length && bNum >= 0) {
            busRef.current = bNum;
          } else if (bVal == 'auto') {
            busRef.current = 'auto';
          }
        }

        if (execute.indexOf('$ help') == 0) {
          setShowCmdHelp((c) => !c);
        }
      }

      //
      // const nbus = Math.floor(Math.random() * pCodeRef.current.length);
      const nbus = busRef.current == 'auto' ? Math.floor(Math.random() * pCodeRef.current.length) : busRef.current;
      // --

      sioRef.current.emit(
        'new message', {
          message: (replState.rStack.length > 0 ? [execute, replState.rStack] : execute),
          bus: nbus
        }
      );

      replDispatch({ type: 'run', payload: { log: execute } });
      pRef.current.value = '';

      if (replState.lastAction == 'run' && replState.log.length > 0 && !isLocal) {
        if (pCodeRef.current != undefined) {
          console.log('in bus -> ', nbus);

          pCodeRef.current = pCodeRef.current.map((el, i) => {
            if (i == nbus) {
              let p;
              if (!el) {
                p = new PCode({
                  defaultVolume: -12,
                  comment: { enable: true },
                  meta: { enable: true }
                });
                p.run(replState.log[replState.log.length - 1][0]);
              } else {
                p = el;
                p.run(replState.log[replState.log.length - 1][0]);
              }
              return p;
            } else {
              return el;
            }
          });
        }
      }

      setElapsed((n) => n + 1);
    }
  };

  const [replState, replDispatch] = useReducer(replReducer, {
    // TODO:
    //
    log: [],
    logIndex: 0,
    logSize: 0,
    seekIndex: 0,
    //
    serverLog: [],
    serverLogIndex: 0,
    serverLogSize: 0,
    serverSeekIndex: 0,
    //
    stack: '',
    rStack: '',
    lastAction: '',
    lastRun: 0
  });

  useHotkeys(
    'esc', _ => {
      showCmdhelp ? setShowCmdHelp(false)  : resetAction();
    },
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

  useHotkeys(
    'ctrl+shift+.', serverIncAction,
    { enableOnTags: ['TEXTAREA'] }
  );

  useHotkeys(
    'ctrl+shift+,', severDecAction,
    { enableOnTags: ['TEXTAREA'] }
  );

  const bindWheel = useWheel(({ args: [idx], direction, wheeling, delta, distance }) => {
    // console.log(idx, direction, wheeling, delta, distance);

    if (logListRef.current && idx == 0) {
      replDispatch({ type: 'seek', payload: { seekDelta: direction[1] } });
      setElapsed((n) => n + 1);
    } else if (slogListRef.current && idx == 1) {
      replDispatch({ type: 'server-seek', payload: { seekDelta: direction[1] } });
      setElapsed((n) => n + 1);
    }
  });

  useEffect(() => {
    if (['run', 'reset', 'push', 'pop'].includes(replState.lastAction)) {
      pRef.current.focus();
    }

    if (replState.serverLogSize > 0) {
      const slast = replState.serverLog[replState.serverLogSize - 1];
      const sts = new Date(slast.timestamp).getTime();

      if (sts > replState.lastRun) {
        if (pCodeRef.current != undefined) {
          const sc = replState.serverLog[replState.serverLogSize - 1];

          pCodeRef.current = pCodeRef.current.map((el, i) => {
            if (i == parseInt(sc.bus)) {
              let p;
              if (!el) {
                p = new PCode({
                  defaultVolume: -12,
                  comment: { enable: true },
                  meta: { enable: true }
                });
                p.run(sc.message);
              } else {
                p = el;
                p.run(sc.message);
              }
              console.log('remote! in bus -> ', sc.bus);
              return p;
            } else {
              return el;
            }
          });

          replDispatch({ type: 'server-run' });
        }
      }
    }
  }, [elapsed]);

  useEffect(() => {
    let pendingUpdate = false;

    if (!loginNameRef.current) {
      router.push('/entry');
    }

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

    sioservice(
      process.env.NEXT_PUBLIC_API_SERVER,
      loginNameRef.current, sioRef,
      replDispatch,
      setElapsed
    );

    requestRef.current = requestAnimationFrame(runloop);
    return () => {
      cancelAnimationFrame(requestRef.current);
      if (sioRef.current) sioRef.current.disconnect();
    };
  }, []);

  return (
    <>
      <main
        className="absolute left-0 top-0 flex w-full max-h-screen overflow-y-scroll"
        ref={logAreaRef}>

        {/* history: local */}
        <div
          className="px-5 pt-5 py-24 overscroll-y-none w-1/2"
          {...bindWheel(0)}
          ref={logListRef}>
          <LogList replState={replState} logStartRef={logStartRef} logEndRef={logEndRef} jumpAction={jumpAction} />
        </div>

        {/* history: server */}
        <div
          className="px-5 pt-5 py-24 overscroll-y-none w-1/2"
          {...bindWheel(1)}
          ref={slogListRef}>
          <ServerLogList replState={replState} logStartRef={logStartRef} logEndRef={logEndRef} jumpAction={serverJumpAction} />
        </div>
      </main>

      <CommandHelp show={showCmdhelp} />

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
        {/* <HotkeyButtons */}
        {/*   runAction={runAction} */}
        {/*   regexpAction={regexpAction} */}
        {/*   resetAction={resetAction} */}
        {/*   popAction={popAction} */}
        {/*   incAction={incAction} */}
        {/*   decAction={decAction} /> */}
      </footer>
    </>
  );
}
