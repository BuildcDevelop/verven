// src/components/interactive/ProvinceManagementPanel.tsx
import React from 'react';

interface Building {
  id: string;
  name: string;
  icon: string;
  level: number;
  description: string;
}

interface ProvinceManagementPanelProps {
  provinceName: string;
  coordinates: { x: number; y: number };
  position: { x: number; y: number };
  onClose: () => void;
  onExpandedDetail: () => void;
}

const ProvinceManagementPanel: React.FC<ProvinceManagementPanelProps> = ({
  provinceName,
  coordinates,
  position,
  onClose,
  onExpandedDetail
}) => {
  // Mock budovy pro demonstraci
  const buildings: Building[] = [
    {
      id: 'townhall',
      name: 'Radnice',
      icon: '🏛️',
      level: Math.floor(Math.random() * 10) + 1,
      description: 'Centrum správy državy'
    },
    {
      id: 'academy',
      name: 'Akademie',
      icon: '📚',
      level: Math.floor(Math.random() * 8) + 1,
      description: 'Výzkum nových technologií'
    },
    {
      id: 'barracks',
      name: 'Kasárny',
      icon: '⚔️',
      level: Math.floor(Math.random() * 12) + 1,
      description: 'Výcvik pěších jednotek'
    },
    {
      id: 'stables',
      name: 'Stáje',
      icon: '🐎',
      level: Math.floor(Math.random() * 8) + 1,
      description: 'Výcvik jízdních jednotek'
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: 'linear-gradient(135deg, rgba(20, 25, 35, 0.95) 0%, rgba(30, 35, 45, 0.95) 100%)',
        border: '2px solid rgba(74, 144, 226, 0.6)',
        borderRadius: '12px',
        padding: '0',
        backdropFilter: 'blur(15px)',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(74, 144, 226, 0.3)',
        minWidth: '320px',
        maxWidth: '450px',
        color: '#e8eaed',
        fontSize: '14px',
        animation: 'slideIn 0.3s ease-out',
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()} // Zabráníme zavření při kliknutí na panel
    >
      {/* Header s názvem a souřadnicemi */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
        padding: '12px 16px',
        borderRadius: '10px 10px 0 0',
        borderBottom: '1px solid rgba(74, 144, 226, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '18px' }}>👑</span>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}>
            {provinceName}
          </h3>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: '2px'
          }}>
            Souřadnice: ({coordinates.x}, {coordinates.y})
          </div>
        </div>
      </div>

      {/* Hlavní obsah */}
      <div style={{ padding: '16px' }}>
        {/* Tlačítko Rozšířený detail */}
        <button
          onClick={onExpandedDetail}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.8) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.6)',
            borderRadius: '8px',
            color: 'white',
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '16px',
            transition: 'all 0.2s ease',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 1) 0%, rgba(16, 185, 129, 1) 100%)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.8) 100%)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🔍 Rozšířený detail državy
        </button>

        {/* Nadpis Budovy */}
        <div style={{
          fontSize: '15px',
          fontWeight: '600',
          color: '#4a90e2',
          marginBottom: '12px',
          textAlign: 'center',
          letterSpacing: '0.5px'
        }}>
          🏗️ Budovy
        </div>

        {/* Grid budov */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {buildings.map((building) => (
            <div
              key={building.id}
              style={{
                background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(75, 85, 99, 0.6) 100%)',
                border: '1px solid rgba(156, 163, 175, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(74, 144, 226, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)';
                e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(75, 85, 99, 0.6) 100%)';
                e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Ikona budovy */}
              <div style={{
                fontSize: '24px',
                marginBottom: '6px'
              }}>
                {building.icon}
              </div>
              
              {/* Název budovy */}
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '4px'
              }}>
                {building.name}
              </div>
              
              {/* Úroveň budovy */}
              <div style={{
                fontSize: '12px',
                color: '#fbbf24',
                fontWeight: '700',
                background: 'rgba(251, 191, 36, 0.2)',
                borderRadius: '4px',
                padding: '2px 6px',
                display: 'inline-block'
              }}>
                Úroveň {building.level}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div style={{
          marginTop: '16px',
          padding: '8px 12px',
          background: 'rgba(74, 144, 226, 0.1)',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '6px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.8)',
          textAlign: 'center'
        }}>
          💡 Klikni mimo mapu pro zavření panelu
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ProvinceManagementPanel;