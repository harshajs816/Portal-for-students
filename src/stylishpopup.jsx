import React, { useState } from 'react';

const StylishPopup = () => {
  // State to control popup visibility
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div>
      {/* Button to trigger the popup */}
      <button 
        onClick={() => setShowPopup(true)} 
        className="btn btn-success rounded-pill px-4 py-2 shadow-sm fw-bold"
      >
        Show Stylish Popup
      </button>

      {/* Modal Overlay & Content */}
      {showPopup && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark semi-transparent background
            backdropFilter: 'blur(4px)'           // Modern blur effect behind the popup
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            {/* Modal Box */}
            <div className="modal-content border-0 shadow-lg rounded-4">
              
              {/* Header */}
              <div className="modal-header border-0 pb-0">
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPopup(false)}
                  aria-label="Close"
                ></button>
              </div>
              
              {/* Body */}
              <div className="modal-body text-center py-4 px-5">
                {/* Success Icon */}
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" fill="#198754" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                </div>
                
                <h3 className="fw-bolder text-dark mb-2">Upload Successful!</h3>
                <p className="text-muted mb-0">Student ki receipt successfully upload aur verify ho gayi hai.</p>
              </div>
              
              {/* Footer */}
              <div className="modal-footer border-0 pt-0 pb-4 justify-content-center gap-2">
                <button 
                  type="button" 
                  className="btn btn-light rounded-pill px-4 fw-bold" 
                  onClick={() => setShowPopup(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-success rounded-pill px-4 shadow-sm fw-bold" 
                  onClick={() => setShowPopup(false)}
                >
                  View List
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StylishPopup;