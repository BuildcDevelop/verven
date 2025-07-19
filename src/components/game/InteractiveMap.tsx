// src/components/MapPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MapPage.css';

interface User {
  id: number;
  username: string;
  email: string;
}

interface GameData {
  OFF: number;
  DEFF: number;
  SIEGE: number;
  SPEC: number;
}

interface PlayerData {
  player: string;
  alliance: string;
}

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const armyDetailWindowRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUnitType, setCurrentUnitType] = useState<number>(0);
  const [selectedProvince, setSelectedProvince] = useState<HTMLDivElement | null>(null);

  // Herní data pouze pro vlastní državy
  const gameData: Record<string, GameData> = {
    'Severní království': {
      OFF: Math.floor(Math.random() * 500) + 100,
      DEFF: Math.floor(Math.random() * 400) + 150,
      SIEGE: Math.floor(Math.random() * 100) + 20,
      SPEC: Math.floor(Math.random() * 80) + 10
    },
    'Východní údolí': {
      OFF: Math.floor(Math.random() * 350) + 80,
      DEFF: Math.floor(Math.random() * 300) + 120,
      SIEGE: Math.floor(Math.random() * 80) + 15,
      SPEC: Math.floor(Math.random() * 60) + 8
    },
    'Horské křídlo': {
      OFF: Math.floor(Math.random() * 450) + 120,
      DEFF: Math.floor(Math.random() * 380) + 160,
      SIEGE: Math.floor(Math.random() * 70) + 12,
      SPEC: Math.floor(Math.random() * 90) + 15
    },
    'Pobřežní pevnost': {
      OFF: Math.floor(Math.random() * 400) + 90,
      DEFF: Math.floor(Math.random() * 450) + 180,
      SIEGE: Math.floor(Math.random() * 120) + 25,
      SPEC: Math.floor(Math.random() * 70) + 12
    },
    'Jižní pláně': {
      OFF: Math.floor(Math.random() * 600) + 150,
      DEFF: Math.floor(Math.random() * 350) + 100,
      SIEGE: Math.floor(Math.random() * 90) + 18,
      SPEC: Math.floor(Math.random() * 100) + 20
    },
    'Centrální bašta': {
      OFF: Math.floor(Math.random() * 550) + 140,
      DEFF: Math.floor(Math.random() * 500) + 200,
      SIEGE: Math.floor(Math.random() * 110) + 22,
      SPEC: Math.floor(Math.random() * 85) + 18
    }
  };

  // Data o hráčích a alicích pro cizí državy
  const playerData: Record<string, PlayerData> = {
    'Opuštěná država': { player: 'Opuštěno', alliance: 'Žádná' },
    'Svobodné město Kamenograd': { player: 'Starosta Kamil Stonavský', alliance: 'Nezávislé obce' },
    'Obchodní společenství Zlatý mostek': { player: 'Zlatoslav Obchodník', alliance: 'Nezávislé obce' },
    'Neutrální zóna Stříbrné jezero': { player: 'Rada starších', alliance: 'Nezávislé obce' },
    'Řemeslnický cech Železný důl': { player: 'Mistr Kovář Želenda', alliance: 'Nezávislé obce' },
    'Volná republika Bílé vrcholy': { player: 'Prezident Vrcholný', alliance: 'Nezávislé obce' },
    'Spojené kingdom Zelený háj': { player: 'Král Zeloslav Moudrý', alliance: 'Severní pakt' },
    'Aliance Křišťálových jezer': { player: 'Velkokněžna Křišťála', alliance: 'Severní pakt' },
    'Bratrská unie Zlaté pláně': { player: 'Bratr Zlatoslav', alliance: 'Severní pakt' },
    'Spojenecký bastión Smaragdové útesy': { player: 'Admirál Smaragd', alliance: 'Severní pakt' },
    'Přátelské království Jasná hvězda': { player: 'Královna Hvězdička', alliance: 'Severní pakt' },
    'Temné impérium Červené slunce': { player: 'Císař Temnotlav Krvavý', alliance: 'Osa zla' },
    'Válečná horda Černé kopí': { player: 'Náčelník Kopíslav Brutální', alliance: 'Osa zla' },
    'Krvavá říše Železný pěst': { player: 'Diktátor Železoslav Tyrančič', alliance: 'Osa zla' },
    'Barbarský klan Rudé vlky': { player: 'Vůdce smečky Vlčeslav', alliance: 'Osa zla' },
    'Invazní síly Temný úsvit': { player: 'Generál Úsvitoslav Temný', alliance: 'Osa zla' },
    'Nepřátelská citadela Krvavý meč': { player: 'Komandér Mečislav Bezlítostný', alliance: 'Osa zla' }
  };

  const unitTypes = ['OFF', 'DEFF', 'SIEGE', 'SPEC'];
  const unitIcons = ['⚔️', '🛡️', '🏰', '✨'];
  const unitNames = ['OFF (Útočné jednotky)', 'DEFF (Obranné jednotky)', 'SIEGE (Obléhací jednotky)', 'SPEC (Speciální jednotky)'];

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [wasDraggingInThisSession, setWasDraggingInThisSession] = useState(false);

  // Grid nastavení
  const GRID_SIZE = 30;
  const CELL_SIZE = 100;
  const PROVINCE_SIZE = 80;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const userData: User = {
        id: 1,
        username: 'Hráč',
        email: 'hrac@example.com'
      };
      
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Chyba při kontrole autentifikace:', error);
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const updateOwnProvinces = (unitTypeIndex: number) => {
    const unitType = unitTypes[unitTypeIndex];
    const unitIcon = unitIcons[unitTypeIndex];
    
    // Najdi všechny vlastní provincie
    const ownProvinces = document.querySelectorAll('.province.own');
    
    ownProvinces.forEach((province, index) => {
      const provinceName = province.getAttribute('data-name') || '';
      const data = gameData[provinceName];
      
      if (data) {
        const unitTypeElement = province.querySelector('.unit-type-indicator');
        const unitCountElement = province.querySelector('.unit-count-display');
        
        if (unitTypeElement && unitCountElement) {
          unitTypeElement.textContent = `${unitIcon} ${unitType}`;
          unitCountElement.textContent = data[unitType as keyof GameData].toString();
          
          // Animace změny
          (unitCountElement as HTMLElement).style.transform = 'scale(1.2)';
          (unitCountElement as HTMLElement).style.color = '#e74c3c';
          
          setTimeout(() => {
            (unitCountElement as HTMLElement).style.transform = 'scale(1)';
            (unitCountElement as HTMLElement).style.color = '#f39c12';
          }, 200);
        }
      }
    });
  };

  // Handle wheel scroll s opravou pro passive listeners
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    if (e.deltaY > 0) {
      setCurrentUnitType(prev => (prev + 1) % unitTypes.length);
    } else {
      setCurrentUnitType(prev => (prev - 1 + unitTypes.length) % unitTypes.length);
    }
  };

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (mapContainer) {
      // Přidání event listeneru s { passive: false } - toto řeší problém s preventDefault
      mapContainer.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        mapContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  useEffect(() => {
    updateOwnProvinces(currentUnitType);
  }, [currentUnitType]);

  const showArmyDetail = (province: HTMLDivElement) => {
    if (isDragging) return;
    
    const provinceType = province.getAttribute('data-type');
    const provinceName = province.getAttribute('data-name') || '';
    
    if (selectedProvince === province) return;
    
    // Získání souřadnic
    const pixelX = parseInt(province.style.left);
    const pixelY = parseInt(province.style.top);
    const gridX = Math.round(pixelX / CELL_SIZE) + 1;
    const gridY = Math.round(pixelY / CELL_SIZE) + 1;
    
    const nameWithCoords = `${provinceName} (${gridX}/${gridY})`;
    
    if (selectedProvince) {
      selectedProvince.classList.remove('selected');
    }
    
    setSelectedProvince(province);
    province.classList.add('selected');
    
    if (provinceType === 'own') {
      const data = gameData[provinceName];
      if (!data) return;
      
      const armyDetailWindow = armyDetailWindowRef.current;
      if (armyDetailWindow) {
        const headerElement = armyDetailWindow.querySelector('#armyDetailHeader');
        const offElement = armyDetailWindow.querySelector('#armyDetailOff');
        const deffElement = armyDetailWindow.querySelector('#armyDetailDeff');
        const siegeElement = armyDetailWindow.querySelector('#armyDetailSiege');
        const specElement = armyDetailWindow.querySelector('#armyDetailSpec');
        const militaryDiv = armyDetailWindow.querySelector('#armyDetailMilitary');
        const diplomacyDiv = armyDetailWindow.querySelector('#armyDetailDiplomacy');
        
        if (headerElement) headerElement.textContent = nameWithCoords;
        if (offElement) offElement.textContent = data.OFF.toString();
        if (deffElement) deffElement.textContent = data.DEFF.toString();
        if (siegeElement) siegeElement.textContent = data.SIEGE.toString();
        if (specElement) specElement.textContent = data.SPEC.toString();
        
        if (militaryDiv) (militaryDiv as HTMLElement).style.display = 'flex';
        if (diplomacyDiv) (diplomacyDiv as HTMLElement).style.display = 'none';
      }
    } else {
      const data = playerData[provinceName];
      if (!data) return;
      
      const armyDetailWindow = armyDetailWindowRef.current;
      if (armyDetailWindow) {
        const headerElement = armyDetailWindow.querySelector('#armyDetailHeader');
        const playerElement = armyDetailWindow.querySelector('#armyDetailPlayer');
        const allianceElement = armyDetailWindow.querySelector('#armyDetailAlliance');
        const militaryDiv = armyDetailWindow.querySelector('#armyDetailMilitary');
        const diplomacyDiv = armyDetailWindow.querySelector('#armyDetailDiplomacy');
        
        if (headerElement) headerElement.textContent = nameWithCoords;
        if (playerElement) playerElement.textContent = data.player;
        if (allianceElement) allianceElement.textContent = data.alliance;
        
        if (militaryDiv) (militaryDiv as HTMLElement).style.display = 'none';
        if (diplomacyDiv) (diplomacyDiv as HTMLElement).style.display = 'flex';
      }
    }
    
    if (armyDetailWindowRef.current) {
      armyDetailWindowRef.current.classList.add('visible');
    }
  };

  const hideArmyDetail = () => {
    if (isDragging) return;
    
    if (selectedProvince) {
      selectedProvince.classList.remove('selected');
      setSelectedProvince(null);
    }
    
    if (armyDetailWindowRef.current) {
      armyDetailWindowRef.current.classList.remove('visible');
    }
  };

  // Mouse handlers pro drag and drop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setWasDraggingInThisSession(false);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) * 2.0;
      const deltaY = (e.clientY - dragStart.y) * 2.0;
      
      const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (dragDistance > 5) {
        setWasDraggingInThisSession(true);
      }
      
      setMapPosition({
        x: mapPosition.x + deltaX,
        y: mapPosition.y + deltaY
      });
      
      if (mapContentRef.current) {
        mapContentRef.current.style.transform = `translate(${mapPosition.x + deltaX}px, ${mapPosition.y + deltaY}px)`;
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setTimeout(() => {
        setWasDraggingInThisSession(false);
      }, 50);
    }
  };

  const handleProvinceClick = (e: React.MouseEvent, province: HTMLDivElement) => {
    if (!isDragging && !wasDraggingInThisSession) {
      e.stopPropagation();
      showArmyDetail(province);
    }
  };

  const centerMap = () => {
    const gridCenterX = (GRID_SIZE * CELL_SIZE) / 2;
    const gridCenterY = (GRID_SIZE * CELL_SIZE) / 2;
    const containerCenterX = mapContainerRef.current ? mapContainerRef.current.offsetWidth / 2 : 400;
    const containerCenterY = mapContainerRef.current ? mapContainerRef.current.offsetHeight / 2 : 250;
    
    const newPosition = {
      x: containerCenterX - gridCenterX,
      y: containerCenterY - gridCenterY
    };
    
    setMapPosition(newPosition);
    
    if (mapContentRef.current) {
      mapContentRef.current.style.transform = `translate(${newPosition.x}px, ${newPosition.y}px)`;
    }
  };

  if (loading) {
    return (
      <div className="map-loading">
        <div className="map-loading__text">Načítání mapy...</div>
      </div>
    );
  }

  return (
    <div className="map-page">
      {/* Header */}
      <header className="map-header">
        <div className="map-header__container">
          <div className="map-header__info">
            <h1 className="map-header__title">🗺️ Verven - Interaktivní Mapa</h1>
            <p className="map-header__welcome">Vítej, {user?.username}!</p>
          </div>
          
          <div className="map-header__actions">
            <button
              onClick={() => navigate('/game')}
              className="map-header__button map-header__button--secondary"
            >
              Zpět do hry
            </button>
            <button
              onClick={handleLogout}
              className="map-header__button map-header__button--logout"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </header>

      {/* Instructions */}
      <div className="map-instructions">
        Scrolluj kolečkem nad mapou pro prohlížení vojenských jednotek vlastních držav | Tažením pohybuj po gridu 30x30 | Detail okno se zavře pouze při kliknutí na jinou državu
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="map-legend__item">
          <div className="map-legend__color map-legend__color--own"></div>
          <span>Vlastní državy</span>
        </div>
        <div className="map-legend__item">
          <div className="map-legend__color map-legend__color--abandoned"></div>
          <span>Opuštěné državy</span>
        </div>
        <div className="map-legend__item">
          <div className="map-legend__color map-legend__color--neutral"></div>
          <span>Neutrální državy</span>
        </div>
        <div className="map-legend__item">
          <div className="map-legend__color map-legend__color--ally"></div>
          <span>Spojenecké državy</span>
        </div>
        <div className="map-legend__item">
          <div className="map-legend__color map-legend__color--enemy"></div>
          <span>Nepřátelské državy</span>
        </div>
      </div>

      {/* Global unit indicator */}
      <div className="map-global-unit-indicator">
        🗡️ Zobrazuji: <span>{unitNames[currentUnitType]}</span>
      </div>

      {/* Map Container */}
      <div 
        className={`map-container ${isDragging ? 'map-container--dragging' : ''}`}
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={hideArmyDetail}
      >
        <div 
          className="map-content" 
          ref={mapContentRef}
          style={{ transform: `translate(${mapPosition.x}px, ${mapPosition.y}px)` }}
        >
          {/* Vlastní državy */}
          {Object.keys(gameData).map((name, index) => (
            <div
              key={`own-${index}`}
              className="province own"
              data-name={name}
              data-type="own"
              style={{
                left: `${(12 + Math.random() * 6) * CELL_SIZE + (CELL_SIZE - PROVINCE_SIZE) / 2}px`,
                top: `${(12 + Math.random() * 6) * CELL_SIZE + (CELL_SIZE - PROVINCE_SIZE) / 2}px`
              }}
              onClick={(e) => handleProvinceClick(e, e.currentTarget)}
            >
              <div className="province-name">{name}</div>
              <div className="unit-type-indicator">{unitIcons[currentUnitType]} {unitTypes[currentUnitType]}</div>
              <div className="unit-count-display">{gameData[name][unitTypes[currentUnitType] as keyof GameData]}</div>
            </div>
          ))}

          {/* Ostatní typy držav */}
          {Object.keys(playerData).map((name, index) => {
            let className = 'province ';
            if (name.includes('Opuštěná')) className += 'abandoned';
            else if (name.includes('Svobodné') || name.includes('Obchodní') || name.includes('Neutrální') || name.includes('Řemeslnický') || name.includes('Volná')) className += 'neutral';
            else if (name.includes('Spojené') || name.includes('Aliance') || name.includes('Bratrská') || name.includes('Spojenecký') || name.includes('Přátelské')) className += 'ally';
            else className += 'enemy';

            const type = className.split(' ')[1];
            
            return (
              <div
                key={`other-${index}`}
                className={className}
                data-name={name}
                data-type={type}
                style={{
                  left: `${Math.random() * (GRID_SIZE - 5) * CELL_SIZE + (CELL_SIZE - PROVINCE_SIZE) / 2}px`,
                  top: `${Math.random() * (GRID_SIZE - 5) * CELL_SIZE + (CELL_SIZE - PROVINCE_SIZE) / 2}px`
                }}
                onClick={(e) => handleProvinceClick(e, e.currentTarget)}
              >
                <div className="province-name">{name}</div>
              </div>
            );
          })}
        </div>

        {/* Army Detail Window */}
        <div className="army-detail-window" ref={armyDetailWindowRef}>
          <div className="army-detail-header" id="armyDetailHeader">Detail armády</div>
          
          {/* Obsah pro vlastní državy - vojenské jednotky */}
          <div className="army-detail-categories" id="armyDetailMilitary">
            <div className="army-detail-category">
              <div className="army-detail-type">⚔️ OFF</div>
              <div className="army-detail-count" id="armyDetailOff">0</div>
              <div className="army-detail-description">Útočné jednotky</div>
            </div>
            <div className="army-detail-category">
              <div className="army-detail-type">🛡️ DEFF</div>
              <div className="army-detail-count" id="armyDetailDeff">0</div>
              <div className="army-detail-description">Obranné jednotky</div>
            </div>
            <div className="army-detail-category">
              <div className="army-detail-type">🏰 SIEGE</div>
              <div className="army-detail-count" id="armyDetailSiege">0</div>
              <div className="army-detail-description">Obléhací jednotky</div>
            </div>
            <div className="army-detail-category">
              <div className="army-detail-type">✨ SPEC</div>
              <div className="army-detail-count" id="armyDetailSpec">0</div>
              <div className="army-detail-description">Speciální jednotky</div>
            </div>
          </div>
          
          {/* Obsah pro cizí državy - informace o hráči a alianci */}
          <div className="army-detail-categories" id="armyDetailDiplomacy" style={{ display: 'none' }}>
            <div className="army-detail-category" style={{ flex: 1 }}>
              <div className="army-detail-type">👤 VLÁDCE</div>
              <div className="army-detail-count" id="armyDetailPlayer" style={{ fontSize: '1.1em' }}>-</div>
              <div className="army-detail-description">Kdo vládne této držav</div>
            </div>
            <div className="army-detail-category" style={{ flex: 1 }}>
              <div className="army-detail-type">🤝 ALIANCE</div>
              <div className="army-detail-count" id="armyDetailAlliance" style={{ fontSize: '1.1em' }}>-</div>
              <div className="army-detail-description">Diplomatické spojenectví</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="map-footer">
        <div className="map-footer__container">
          <p className="map-footer__text">
            &copy; 2025 Verven Game. Všechna práva vyhrazena.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MapPage;