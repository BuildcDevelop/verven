// src/components/game/InteractiveMap.tsx
import React, { useState, useRef, useEffect } from 'react';
interface Province {
id: string;
name: string;
type: 'own' | 'abandoned' | 'neutral' | 'ally' | 'enemy';
position: { x: number; y: number };
units?: {
OFF: number;
DEFF: number;
SIEGE: number;
SPEC: number;
};
owner?: string;
alliance?: string;
}
interface InteractiveMapProps {
onProvinceClick?: (province: Province) => void;
onProvinceHover?: (province: Province | null) => void;
}
const InteractiveMap: React.FC<InteractiveMapProps> = ({
onProvinceClick,
onProvinceHover
}) => {
const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
const mapRef = useRef<HTMLDivElement>(null);
// Ukázková data držav - později nahradit daty z Convex
const provinces: Province[] = [
{
id: '1',
name: 'Severní království',
type: 'own',
position: { x: 400, y: 300 },
units: { OFF: 250, DEFF: 180, SIEGE: 5, SPEC: 12 },
owner: 'Já',
alliance: 'Modrá aliance'
},
{
id: '2',
name: 'Východní údolí',
type: 'own',
position: { x: 600, y: 350 },
units: { OFF: 180, DEFF: 220, SIEGE: 3, SPEC: 8 },
owner: 'Já',
alliance: 'Modrá aliance'
},
{
id: '3',
name: 'Opuštěná vesnice',
type: 'abandoned',
position: { x: 300, y: 200 },
owner: 'Opuštěno',
alliance: 'Žádná'
},
{
id: '4',
name: 'Spojenecká pevnost',
type: 'ally',
position: { x: 500, y: 150 },
owner: 'Spojenec123',
alliance: 'Modrá aliance'
},
{
id: '5',
name: 'Nepřátelská citadela',
type: 'enemy',
position: { x: 200, y: 400 },
owner: 'Nepřítel456',
alliance: 'Červená horda'
}
];
const handleProvinceClick = (province: Province) => {
setSelectedProvince(province);
onProvinceClick?.(province);
};
const handleProvinceHover = (province: Province | null) => {
onProvinceHover?.(province);
};
const handleMouseDown = (e: React.MouseEvent) => {
if (e.target === mapRef.current) {
setIsDragging(true);
setDragStart({ x: e.clientX - dragPosition.x, y: e.clientY - dragPosition.y });
}
};
const handleMouseMove = (e: React.MouseEvent) => {
if (isDragging) {
setDragPosition({
x: e.clientX - dragStart.x,
y: e.clientY - dragStart.y
});
}
};
const handleMouseUp = () => {
setIsDragging(false);
};
const getProvinceColor = (type: Province['type']) => {
switch (type) {
case 'own': return '#3498db';
case 'abandoned': return '#ecf0f1';
case 'neutral': return '#9b59b6';
case 'ally': return '#27ae60';
case 'enemy': return '#e74c3c';
default: return '#95a5a6';
}
};
return (
<div
className="interactive-map"
style={{
width: '100%',
height: '100%',
position: 'relative',
overflow: 'hidden',
cursor: isDragging ? 'grabbing' : 'grab',
background: 'linear-gradient(45deg, #34495e, #2c3e50)'
}}
onMouseDown={handleMouseDown}
onMouseMove={handleMouseMove}
onMouseUp={handleMouseUp}
onMouseLeave={handleMouseUp}
ref={mapRef}
>
{/* Grid pattern */}
<div
style={{
position: 'absolute',
top: 0,
left: 0,
width: '200%',
height: '200%',
backgroundImage:             linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),             linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)          ,
backgroundSize: '50px 50px',
transform: translate(${dragPosition.x}px, ${dragPosition.y}px)
}}
/>
  {/* Provinces */}
  <div
    style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`
    }}
  >
    {provinces.map(province => (
      <div
        key={province.id}
        className="province"
        style={{
          position: 'absolute',
          left: province.position.x,
          top: province.position.y,
          width: 80,
          height: 80,
          borderRadius: 10,
          border: `2px solid ${getProvinceColor(province.type)}`,
          background: `linear-gradient(135deg, ${getProvinceColor(province.type)}, ${getProvinceColor(province.type)}dd)`,
          color: province.type === 'abandoned' ? '#2c3e50' : 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: `0 4px 15px ${getProvinceColor(province.type)}30`,
          transition: 'all 0.3s ease',
          transform: selectedProvince?.id === province.id ? 'scale(1.1)' : 'scale(1)'
        }}
        onClick={() => handleProvinceClick(province)}
        onMouseEnter={() => handleProvinceHover(province)}
        onMouseLeave={() => handleProvinceHover(null)}
      >
        <div style={{ fontSize: '0.7rem', marginBottom: 4, lineHeight: 1.1 }}>
          {province.name}
        </div>
        {province.units && (
          <div style={{ fontSize: '1.2rem', color: '#f39c12' }}>
            ⚔️ {province.units.OFF}
          </div>
        )}
      </div>
    ))}
  </div>

  {/* Map controls */}
  <div 
    style={{
      position: 'absolute',
      top: 10,
      right: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}
  >
    <button
      onClick={() => setDragPosition({ x: 0, y: 0 })}
      style={{
        padding: '0.5rem',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        borderRadius: '0.5rem',
        cursor: 'pointer'
      }}
    >
      🎯 Střed
    </button>
  </div>

  {/* Legend */}
  <div
    style={{
      position: 'absolute',
      bottom: 10,
      left: 10,
      background: 'rgba(0,0,0,0.8)',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid rgba(52, 211, 153, 0.3)',
      color: 'white',
      fontSize: '0.8rem'
    }}
  >
    <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Legenda:</div>
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <div style={{ width: 12, height: 12, background: '#3498db', borderRadius: '50%' }}></div>
        Vlastní
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <div style={{ width: 12, height: 12, background: '#27ae60', borderRadius: '50%' }}></div>
        Spojenec
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <div style={{ width: 12, height: 12, background: '#e74c3c', borderRadius: '50%' }}></div>
        Nepřítel
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <div style={{ width: 12, height: 12, background: '#ecf0f1', borderRadius: '50%' }}></div>
        Opuštěné
      </div>
    </div>
  </div>
</div>
);
};
export default InteractiveMap;