export default function SimpleHelp(props) {
  const { replState } = props;

  return (
    <div className="w-full pl-16 pr-5 my-2 text-gray-700 text-xs italic hidden md:block">
      {
        (!replState.stack || replState.stack.length == 0) ?
          `<Ctrl+Enter> Run | <Ctrl+Space> Random regexp completion`
          : `<Ctrl+Enter> Run | <Ctrl+Space> Random regexp completion | <Enter> Edit result | <Esc> Clear completion`
      }
      {
        replState.log.length > 0 &&
        ` | <Ctrl+,> History backward | <Ctrl+.> History forward | <Ctrl+Shift+,> History backward (Server) | <Ctrl+Shift+.> History forward (Server)`
      }
      {
        (replState.rStack?.length > 0 && !['run', 'regexp'].includes(replState.lastAction)) &&
        ` | <Esc> Pop original RegExp`
      }
    </div>
  );
}
