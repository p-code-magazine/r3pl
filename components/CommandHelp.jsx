export default function CommandHelp(props) {
  const { show = false } = props;

  return (
    <div className="fixed w-full h-full text-white" style={{ background: 'rgba(0,0,0,.8)', visibility: show ? 'visible' : 'hidden' }}>
      <article className="help p-8">
        <header className="text-xl mb-4">Command help</header>

        <section className="mb-6">
          <h3 className="text-base mb-2">Local commands</h3>
          {/* <p>These commands are not sent to the public timeline. </p> */}
          <table>
            <thead>
              <tr>
                <th>command format</th>
                <th>[arguments]</th>
                <th>description</th>
                <th>example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cmdhelp">$ help</td>
                <td>None</td>
                <td>
                  <p>Show this help.</p>
                </td>
                <td className="cmdhelp">$ help</td>
              </tr>
              <tr>
                <td className="cmdhelp">$ bus [0-7|auto]</td>
                <td>0,1,2,3,4,5,6,7 or auto</td>
                <td>
                  <p>Set the target audio bus.</p>
                  <p>P-Code Playground has 8 individual buses.</p>
                  <p>You can choose it to run your code.</p>
                  <p>The default is 'auto'</p>
                </td>
                <td className="cmdhelp">$ bus 0<br /> $ bus 1<br />$ bus auto</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h3 className="text-base mb-2">Server commands</h3>
          <p>Currently not supported.</p>
          {/* <table> */}
          {/*   <thead> */}
          {/*     <tr> */}
          {/*       <th>command format</th> */}
          {/*       <th>[arguments]</th> */}
          {/*       <th>description</th> */}
          {/*       <th>example</th> */}
          {/*     </tr> */}
          {/*   </thead> */}
          {/*   <tbody> */}
          {/*     <tr> */}
          {/*       <td className="cmdhelp">$$ L</td> */}
          {/*       <td>None</td> */}
          {/*       <td> */}
          {/*         <p>List session log files.</p> */}
          {/*       </td> */}
          {/*       <td className="cmdhelp">$$ L</td> */}
          {/*     </tr> */}

          {/*     <tr> */}
          {/*       <td className="cmdhelp">$$ P [1|0][,file_name]</td> */}
          {/*       <td> */}
          {/*         <p>1 (play) or 0 (stop)</p> */}
          {/*         <p><span className="cmdhelp">file_name</span> is optional.</p> */}
          {/*         <p>If not set, playback current session log.</p> */}
          {/*       </td> */}
          {/*       <td> */}
          {/*         <p>Playback session log file.</p> */}
          {/*       </td> */}
          {/*       <td className="cmdhelp">$$ P 1<br />$$ P 0<br />$$ P 1,session-1595596296102.log</td> */}
          {/*     </tr> */}
          {/*   </tbody> */}
          {/* </table> */}
        </section>

        <div className="item">
          <p> P-Code language specification is <a className="underline" href="https://github.com/p-code-magazine/p-code/blob/master/LANGSPEC.md" target="_blank">here</a></p>
          <p>retype <span className="cmdhelp">'$ help'</span> or <span className="cmdhelp">'ESC'</span> key to close this pane</p>
        </div>
      </article>
    </div>
  );
}
