import React, { useState } from 'react';

const ImagePreview = ({ imageUrl }: { imageUrl: string }) => {
  const [showFull, setShowFull] = useState(false);

  return (
    <div>
      {/* Preview thumbnail */}
      <img
        src={imageUrl}
        alt="allegato"
        onClick={() => setShowFull(true)}
        style={{
          width: '50%',
          height: 'auto',
          cursor: 'pointer',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      />

      {/* Modal full screen */}
      {showFull && (
        <div
          onClick={() => setShowFull(false)}
          style={{
            position: 'static',
            top: 0,
            left: 0,
            width: 'screen',
            height: 'screen',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 0,
            cursor: 'zoom-out',
            borderRadius: '10px',
            padding: '10px',
          }}
        >
          <img
            src={imageUrl}
            alt="allegato full"
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '10px' }}
          />
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
