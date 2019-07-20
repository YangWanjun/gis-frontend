import React from 'react';
import ReactDOM from 'react-dom';
import GisMap from './GisMap';

const App = () => {
  return (
    <div>
      <GisMap />
    </div>
  );
};

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
