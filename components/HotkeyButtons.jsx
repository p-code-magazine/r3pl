export default function HotkeyButtons(props) {
  const { runAction, regexpAction, resetAction, popAction, decAction } = props;

  return (
    <nav className="w-full flex md:hidden justify-between items-stretch">
      <button
        onClick={() => runAction()}
        className="flex-1 p-2 text-white bg-gray-800 focus:outline-none focus:shadow-outline">
        run
          </button>
      <button
        onClick={() => regexpAction()}
        className="flex-1 p-2 text-white bg-gray-800 focus:outline-none focus:shadow-outline">
        regexp
          </button>
      <button
        onClick={() => resetAction()}
        className="flex-1 p-2 text-white bg-gray-800 focus:outline-none focus:shadow-outline">
        reset
          </button>
      <button
        onClick={() => popAction()}
        className="flex-1 p-2 text-white bg-gray-800 focus:outline-none focus:shadow-outline">
        pop
          </button>
      <button
        onClick={() => incAction()}
        className="flex-1 p-2 text-white bg-gray-800 focus:outline-none focus:shadow-outline">
        rev
          </button>
      <button
        onClick={() => decAction()}
        className="flex-1 p-2 text-white bg-gray-800 focus:outline-none focus:shadow-outline">
        fwd
      </button>
    </nav>
  );
}
