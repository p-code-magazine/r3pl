import { useEffect, useRef, useState, useContext } from 'react';

import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/router';

import { PlaygroundContext } from '../components/playgroundcontext';

export default function EntryPage() {
  const router = useRouter();
  const { loginNameRef } = useContext(PlaygroundContext);

  const nameInputRef = useRef('');

  useHotkeys(
    'enter',
    (e) => {
      (async () => {
        try {
          const res = await window.fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: nameInputRef.current.value })
          });
          const rjson = await res.json();
          const { status } = rjson;

          console.log(loginNameRef);

          loginNameRef.current = nameInputRef.current.value;
          router.push('/playground');
        } catch (err) {
          console.error(err);
        }
      })();
    },
    { enableOnTags: ['INPUT'] },
  );

  useEffect(() => {
    // requestRef.current = requestAnimationFrame(runloop);
    // return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <main className="bg-black w-screen h-screen">
      <div className="fixed top-0 left-0 w-full h-full justify-between flex m-0 p-0">
        <section className="w-full h-full text-lg bg-black">
          <div className="absolute w-full top-1/2 text-center">
            <input
              ref={nameInputRef}
              placeholder="What's your nickname?" type="text"
              className="bg-transparent border-b border-solid border-white text-white text-center" />
            {
              /* loginAndPlayback && */
              /*   <p style="font-size:66%; color:#999; text-align:center;">Playback after login:{loginAndPlayback}</p> */
            }
          </div>
        </section>
      </div>
    </main>
  );
}
