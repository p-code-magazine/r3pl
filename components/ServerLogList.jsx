const COLORS = [
  '#e21400', '#91580f', '#f8a700', '#f78b00',
  '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
  '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

const getUsernameColor = (username) => {
  let hash = 7;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + (hash << 5) - hash;
  }
  const index = Math.abs(hash % COLORS.length);
  return COLORS[index];
};

export default function ServerLogList(props) {
  // TODO:
  const { replState, logStartRef, logEndRef } = props;

  return (
    <ul className="break-all">
      {
        replState.serverLog.length > 0 &&
          replState.serverLog.slice(replState.serverSeekIndex, replState.serverSeekIndex + 30).map((el, i) => (
          i == 0 ? (
            <li className="flex items-start log-item-first" ref={logStartRef}>
              <span className="w-10 flex-shrink-0 text-gray-500">{Math.max(replState.serverSeekIndex, 0) + i}</span>
              <span className="mr-4" style={{ color: getUsernameColor(el.username) }}>{el.username}</span>
              <mark className="flex-shrink bg-transparent hover:bg-gray-400">{el.message}</mark>
            </li>
          ) : (
              (replState.serverLog.length > 1 && i == (Math.min(replState.serverLog.length, replState.serverSeekIndex + 30) - 1)) ? (
                <li className="flex items-start log-item-last" ref={logEndRef}>
                  <span className="w-10 flex-shrink-0 text-gray-500">{Math.max(replState.serverSeekIndex, 0) + i}</span>
                  <span className="mr-4" style={{ color: getUsernameColor(el.username) }}>{el.username}</span>
                  <mark className="flex-shrink bg-transparent hover:bg-gray-400">{el.message}</mark>
                </li>

              ) : (
                  <li className="flex items-start">
                    <span className="w-10 flex-shrink-0 text-gray-500">{Math.max(replState.serverSeekIndex, 0) + i}</span>
                    <span className="mr-4" style={{ color: getUsernameColor(el.username) }}>{el.username}</span>
                    <mark className="flex-shrink bg-transparent hover:bg-gray-400">{el.message}</mark>
                  </li>
                )
            )
        ))
      }
    </ul>
  );
}
