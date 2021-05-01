export default function LogList(props) {
  const { replState, logStartRef, logEndRef, jumpAction = () => {} } = props;

  return (
    <ul className="break-all">
      {
        replState.log.length > 0 &&
        replState.log.slice(replState.seekIndex, replState.seekIndex + 30).map((el, i) => (
          i == 0 ? (
            <li className="flex items-start log-item-first" ref={logStartRef} onClick={_ => jumpAction(Math.max(replState.seekIndex, 0) + i)}>
              <span className="w-10 flex-shrink-0 text-gray-500">{Math.max(replState.seekIndex, 0) + i}</span>
              <mark className="flex-shrink bg-transparent hover:bg-gray-400">{el[0]}</mark>
            </li>
          ) : (
              (replState.log.length > 1 && i == (Math.min(replState.log.length, 30) - 1)) ? (
                <li className="flex items-start log-item-last" ref={logEndRef} onClick={_ => jumpAction(Math.max(replState.seekIndex, 0) + i)}>
                  <span className="w-10 flex-shrink-0 text-gray-500">{Math.max(replState.seekIndex, 0) + i}</span>
                  <mark className="flex-shrink bg-transparent hover:bg-gray-400">{el[0]}</mark>
                </li>

              ) : (
                <li className="flex items-start" onClick={_ => jumpAction(Math.max(replState.seekIndex, 0) + i)}>
                    <span className="w-10 flex-shrink-0 text-gray-500">{Math.max(replState.seekIndex, 0) + i}</span>
                    <mark className="flex-shrink bg-transparent hover:bg-gray-400">{el[0]}</mark>
                  </li>
                )
            )
        ))
      }
    </ul>
  );
}
