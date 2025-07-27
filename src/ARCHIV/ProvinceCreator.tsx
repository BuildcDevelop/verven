// ============================================================
// MODAL PRO VYTVOŘENÍ NOVÉ DRŽAVY
// ============================================================

import React, { useState, useEffect } from 'react';
import { ProvinceCreatorProps, Position } from '../types/game-types';

const ProvinceCreator: React.FC<ProvinceCreatorProps> = ({
  isOpen,
  onClose,
  onProvinceCreated,
  selectedPosition
}) => {
  const [provinceName, setProvinceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // RESET FORMULÁŘE PŘI OTEVŘENÍ/ZAVŘENÍ
  // ============================================================

  useEffect(() => {
    if (isOpen) {
      setProvinceName('');
      setError(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  // ============================================================
  // VYTVOŘENÍ DRŽAVY
  // ============================================================

  const handleCreateProvince = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!provinceName.trim()) {
      setError('Zadejte název državy');
      return;
    }

    if (!selectedPosition) {
      setError('Není vybrána pozice na mapě');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Zde by byla volání API přes GameService
      // Pro demo vytvoříme mock provincii
      const newProvince = {
        id: `province-${Date.now()}`,
        name: provinceName,
        ownerId: 'current-player',
        allianceId: undefined,
        color: '#FF6B6B',
        centerPosition: selectedPosition,
        tileIds: [],
        population: 100,
        resources: 50,
        buildings: [],
        createdAt: new Date()
      };

      // Simulace API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      onProvinceCreated(newProvince);
      onClose();
    } catch (err) {
      setError('Chyba při vytváření državy');
    } finally {
      setIsCreating(false);
    }
  };

  // ============================================================
  // ZAVŘENÍ MODALU
  // ============================================================

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!isOpen) return null;

  return (
    <div className="province-creator-overlay" onClick={handleBackdropClick}>
      <div className="province-creator-modal">
        <div className="province-creator-header">
          <h3>Vytvořit novou državu</h3>
          <button 
            className="close-button"
            onClick={handleClose}
            disabled={isCreating}
            aria-label="Zavřít"
          >
            ×
          </button>
        </div>

        <div className="province-creator-content">
          {selectedPosition && (
            <div className="selected-position">
              <strong>Vybraná pozice:</strong> [{selectedPosition.x}, {selectedPosition.y}]
            </div>
          )}

          <form onSubmit={handleCreateProvince}>
            <div className="form-group">
              <label htmlFor="province-name">
                Název državy:
              </label>
              <input
                id="province-name"
                type="text"
                value={provinceName}
                onChange={(e) => setProvinceName(e.target.value)}
                placeholder="Zadejte název državy..."
                maxLength={50}
                disabled={isCreating}
                autoFocus
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="province-info">
              <h4>Nová država bude obsahovat:</h4>
              <ul>
                <li>5x5 políček území</li>
                <li>Začáteční populace: 100</li>
                <li>Základní zdroje: 50</li>
                <li>Možnost stavět budovy</li>
              </ul>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="cancel-button"
                disabled={isCreating}
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="create-button"
                disabled={isCreating || !provinceName.trim()}
              >
                {isCreating ? (
                  <>
                    <span className="spinner"></span>
                    Vytváření...
                  </>
                ) : (
                  'Vytvořit državu'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .province-creator-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .province-creator-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideIn 0.3s ease-out;
        }

        .province-creator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .province-creator-header h3 {
          margin: 0;
          font-size: 1.4em;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .close-button:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .province-creator-content {
          padding: 20px;
        }

        .selected-position {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #007bff;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .form-group input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .error-message {
          background: #ffe6e6;
          color: #d63384;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }

        .province-info {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .province-info h4 {
          margin: 0 0 12px 0;
          color: #495057;
          font-size: 1.1em;
        }

        .province-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .province-info li {
          margin-bottom: 4px;
          color: #6c757d;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-button, .create-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
        }

        .cancel-button:hover:not(:disabled) {
          background: #5a6268;
        }

        .create-button {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
        }

        .create-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        .cancel-button:disabled, .create-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-50px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .province-creator-modal {
            width: 95%;
            margin: 20px;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .cancel-button, .create-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ProvinceCreator;