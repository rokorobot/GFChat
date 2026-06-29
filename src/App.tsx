import React from 'react';
import { BrowserRouter } from 'react-router-dom';

const App = () => {
  return (
    <BrowserRouter>
      <div style={{ padding: 32, fontFamily: "sans-serif", color: "#d63384", fontWeight: "bold" }}>
        GF.Chat App with Router works
      </div>
    </BrowserRouter>
  );
};

export default App;
