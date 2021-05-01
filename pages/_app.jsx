import { useState, useEffect, useRef } from 'react';

import Head from 'next/head';
import { useRouter } from 'next/router';

import { PlaygroundContext } from '../components/playgroundcontext';

import '../styles/index.css';

function MyApp({ Component, pageProps }) {
  console.info(`%cR3PL : version - ${process.env.NEXT_PUBLIC_R3PL_VERSION}`, 'background:black; color:white; padding: 0.1rem 0.5rem;');

  const router = useRouter();

  // TODO:
  const loginNameRef = useRef('');

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1"
        />
        <meta name="description" content="Description" />
        <meta name="keywords" content="Keywords" />
        <title>P-Code R3PL</title>

        {/* <link rel="manifest" href="/manifest.json" /> */}
        {/* <link */}
        {/*   href="/icons/favicon-16x16.png" */}
        {/*   rel="icon" */}
        {/*   type="image/png" */}
        {/*   sizes="16x16" */}
        {/* /> */}
        {/* <link */}
        {/*   href="/icons/favicon-32x32.png" */}
        {/*   rel="icon" */}
        {/*   type="image/png" */}
        {/*   sizes="32x32" */}
        {/* /> */}
        {/* <link rel="apple-touch-icon" href="/apple-icon.png"></link> */}
        {/* <meta name="theme-color" content="#317EFB" /> */}
      </Head>

      {
        /\/*(entry|playground).*/.test(router.pathname) ? (
          <PlaygroundContext.Provider value={{ loginNameRef }}>
            <Component {...pageProps} />
          </PlaygroundContext.Provider>
        ) : (
          <Component {...pageProps} />
        )
      }
    </>
  );
}

export default MyApp;
