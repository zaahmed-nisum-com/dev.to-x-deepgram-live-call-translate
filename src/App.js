import logo from './logo.svg';
import './App.css';
import Streaming from './pages/streaming';

const APP_ID = '20a9600e27274878acd571fbb8ca7f0f'

function App() {
  return (
    <Streaming APP_ID={APP_ID} />
  );
}

export default App;
