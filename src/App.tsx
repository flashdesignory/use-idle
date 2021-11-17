import useIdle from './useIdle';

function App() {
  const onIdle = () => console.log('onIdle()');
  const onResume = () => console.log('onResume()');

  const {isIdle} = useIdle({onIdle, onResume});

  return (
    <div>
      {
        isIdle ? 'Are you still there?' : 'Hello there'
      }
    </div>
  )
}

export default App;
