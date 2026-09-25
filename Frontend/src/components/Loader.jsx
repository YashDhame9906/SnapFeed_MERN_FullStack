import React from 'react';

const Loader = ({ message = 'Loading...', size = 'md' }) => {
  return (
    <div className={`loader-container loader-${size}`}>
      <div className="loader-spinner" role="status" aria-label="Loading"></div>
      {message && <p className="loader-text">{message}</p>}
    </div>
  );
};

export default Loader;
