// src/components/GamePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import './GamePage.css';

interface User {
  id: number;
  username: string;
  email: string;
}

interface Village {
  id: number;
  name: string;
  coordinates: string;
  isActive: boolean;
}

interface Building {
  id: number;
  name: string;
  level: number;
  cost: number;
  buildTime: string;
  icon: string;
}

interface Resource {
  name: string;
  amount: number;
  production?: number;
  inProduction?: number;
}

interface Unit {
  name: string;
  amount: number;
  inRecruitment: number;
  icon: string;
}

interface Command {
  type: 'incoming' | 'outgoing';
  description: string;
  arrivalTime: string;
  timeLeft: number;
}

export default function GamePage(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [commandsExpanded, setCommandsExpanded] = useState<boolean>(false);
  const [buildQueueExpanded, setBuildQueueExpanded] = useState<boolean>(false);
  const navigate = useNavigate();

  // Mock data
  const [currentProject] = useState({
    name: "Vylepšení kovárny",
    progress: 67
  });

  const [villages] = useState<Village[]>([
    { id: 1, name: "Hlavní vesnice", coordinates: "456|537", isActive: true },
    { id: 2, name: "Severní základna", coordinates: "445|523", isActive: false }
  ]);

  const [activeVillage] = useState(villages[0]);

  const [buildings] = useState<Building[]>([
    { id: 1, name: "Radnice", level: 15, cost: 2500, buildTime: "2:30", icon: "/buildings/town_hall.jpeg" },
    { id: 2, name: "Městská čtvrť", level: 8, cost: 1200, buildTime: "1:45", icon: "/buildings/residential.jpeg" },
    { id: 3, name: "Skladiště", level: 12, cost: 800, buildTime: "1:15", icon: "/buildings/warehouse.jpeg" },
    { id: 4, name: "Zlatý důl", level: 10, cost: 1500, buildTime: "2:00", icon: "/buildings/gold_mine.jpeg" },
    { id: 5, name: "Univerzita", level: 5, cost: 3000, buildTime: "4:20", icon: "/buildings/university.jpeg" },
    { id: 6, name: "Trhy", level: 7, cost: 900, buildTime: "1:30", icon: "/buildings/market.jpeg" },
    { id: 7, name: "Dílna", level: 6, cost: 1100, buildTime: "1:50", icon: "/buildings/workshop.jpeg" },
    { id: 8, name: "Kasárna", level: 9, cost: 1800, buildTime: "2:15", icon: "/buildings/barracks.jpeg" },
    { id: 9, name: "Kovárna", level: 8, cost: 1400, buildTime: "2:05", icon: "/buildings/smithy.jpeg" },
    { id: 10, name: "Opevnění", level: 11, cost: 2200, buildTime: "3:00", icon: "/buildings/wall.jpeg" },
    { id: 11, name: "Brána", level: 4, cost: 1600, buildTime: "2:45", icon: "/buildings/gate.jpeg" }
  ]);

  const [buildQueue] = useState([
    { name: "Kovárna", level: 9, timeLeft: "1:23:45" },
    { name: "Skladiště", level: 13, timeLeft: "3:12:30" }
  ]);

  const [resources] = useState<Resource[]>([
    { name: "Vény", amount: 45632, production: 2340 },
    { name: "Mince", amount: 12500 },
    { name: "Koně", amount: 156, inProduction: 12 },
    { name: "Luky", amount: 89, inProduction: 5 },
    { name: "Vozy", amount: 23, inProduction: 2 }
  ]);

  const [units] = useState<Unit[]>([
    { name: "Ozbrojenec", amount: 245, inRecruitment: 15, icon: "/units/warrior.jpeg" },
    { name: "Jezdec", amount: 67, inRecruitment: 8, icon: "/units/cavalry.jpeg" },
    { name: "Lukostřelec", amount: 134, inRecruitment: 12, icon: "/units/archer.jpeg" },
    { name: "Beranidlo", amount: 8, inRecruitment: 2, icon: "/units/ram.jpeg" },
    { name: "Trebuchet", amount: 3, inRecruitment: 1, icon: "/units/trebuchet.jpeg" },
    { name: "Generál", amount: 1, inRecruitment: 0, icon: "/units/general.jpeg" },
    { name: "Špeh", amount: 12, inRecruitment: 3, icon: "/units/spy.jpeg" }
  ]);

  const [commands] = useState<Command[]>([
    { type: 'incoming', description: 'Návrat z Vesnice barbarů (409|536)', arrivalTime: '0:40:28', timeLeft: 2428 },
    { type: 'incoming', description: 'Podpora od Hráč123 (445|523)', arrivalTime: '1:15:42', timeLeft: 4542 },
    { type: 'outgoing', description: 'Útok na Nepřítel456 (467|541)', arrivalTime: '2:30:15', timeLeft: 9015 },
    { type: 'incoming', description: 'Útok od Válečník789 (456|537)', arrivalTime: '3:45:00', timeLeft: 13500 },
    { type: 'outgoing', description: 'Podpora pro Spojenec321 (434|529)', arrivalTime: '4:20:30', timeLeft: 15630 }
  ]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<void> => {
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

  const handleLogout = (): void => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const copyCoordinates = (): void => {
    navigator.clipboard.writeText(activeVillage.coordinates);
    // Můžete přidat toast notifikaci
  };

  const formatTime = (timeLeft: number): string => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const displayedCommands = commandsExpanded ? commands : commands.slice(0, 3);

  if (loading) {
    return (
      <div className="game-loading">
        <div className="game-loading__text">Načítání...</div>
      </div>
    );
  }

  return (
    <div className="game-page">
      {/* Hlavní menu (Menu 1) */}
      <header className="game-header">
        <div className="game-header__container">
          <nav className="game-header__nav">
            <button className="game-nav__item" disabled>
              Náhled království
            </button>
            <button 
              className="game-nav__item game-nav__item--active"
              onClick={() => navigate('/map')}
            >
              Mapa
            </button>
            <button className="game-nav__item" disabled>
              Profil
            </button>
            <button className="game-nav__item" disabled>
              Aliance
            </button>
            <button className="game-nav__item" disabled>
              Žebříček
            </button>
            <button className="game-nav__item" disabled>
              Nastavení
            </button>
          </nav>
          
          <button
            onClick={handleLogout}
            className="game-header__logout"
          >
            Odhlásit se
          </button>
        </div>
      </header>

      {/* Aktuální projekt (Menu 2) */}
      <div className="game-project">
        <div className="game-project__container">
          <div className="game-project__info">
            <span className="game-project__label">Aktuální rozpracovaný projekt:</span>
            <span className="game-project__name">{currentProject.name}</span>
          </div>
          <div className="game-project__progress">
            <div className="game-project__progress-bar">
              <div 
                className="game-project__progress-fill"
                style={{ width: `${currentProject.progress}%` }}
              ></div>
            </div>
            <span className="game-project__progress-text">{currentProject.progress}%</span>
          </div>
        </div>
      </div>

      {/* Hlavní obsah */}
      <main className="game-main">
        <div className="game-layout">
          {/* Levý panel - Seznam držav (Menu 3) */}
          <aside className="game-sidebar">
            <div className="game-card">
              <h3 className="game-sidebar__title">Náhled vlastních držav</h3>
              <div className="game-villages">
                {villages.map(village => (
                  <div 
                    key={village.id}
                    className={`game-village ${village.isActive ? 'game-village--active' : ''}`}
                  >
                    <div className="game-village__name">{village.name}</div>
                    <div className="game-village__coords">{village.coordinates}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Hlavní content */}
          <div className="game-content">
            {/* Aktuální vesnice (Menu 4) */}
            <div className="game-current-village">
              <div className="game-card">
                <div className="game-current-village__header">
                  <h3 className="game-current-village__title">
                    {activeVillage.name} ({activeVillage.coordinates})
                  </h3>
                  <button 
                    className="game-current-village__copy"
                    onClick={copyCoordinates}
                    title="Kopírovat souřadnice"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid pro budovy, suroviny a armádu */}
            <div className="game-content-grid">
              {/* Budovy */}
              <div className="game-buildings">
                <div className="game-card">
                  <h3 className="game-section__title">Vesnice</h3>
                  
                  {/* Stavební fronta */}
                  <div className="game-build-queue">
                    <button 
                      className="game-build-queue__header"
                      onClick={() => setBuildQueueExpanded(!buildQueueExpanded)}
                    >
                      <span>Stavební fronta ({buildQueue.length})</span>
                      {buildQueueExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {buildQueueExpanded && (
                      <div className="game-build-queue__content">
                        {buildQueue.map((item, index) => (
                          <div key={index} className="game-build-queue__item">
                            <span>{item.name} (úroveň {item.level})</span>
                            <span className="game-build-queue__time">{item.timeLeft}</span>
                            <button className="game-build-queue__cancel">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="game-buildings__grid">
                    {buildings.map(building => (
                      <div key={building.id} className="game-building">
                        <div className="game-building__icon">
                          <img src={building.icon} alt={building.name} />
                        </div>
                        <div className="game-building__info">
                          <h4 className="game-building__name">{building.name}</h4>
                          <div className="game-building__level">Úroveň {building.level}</div>
                          <div className="game-building__cost">
                            <span>💰 {building.cost}</span>
                          </div>
                          <div className="game-building__time">{building.buildTime}</div>
                          <button className="game-building__build">Postavit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suroviny a produkce */}
              <div className="game-resources">
                <div className="game-card">
                  <h3 className="game-section__title">Suroviny a produkce</h3>
                  <div className="game-resources__list">
                    {resources.map((resource, index) => (
                      <div key={index} className="game-resource">
                        <div className="game-resource__name">{resource.name}:</div>
                        <div className="game-resource__amount">{resource.amount.toLocaleString()}</div>
                        {resource.production && (
                          <div className="game-resource__production">+{resource.production}/h</div>
                        )}
                        {resource.name === 'Mince' && (
                          <button className="game-resource__action">
                            <Plus size={16} />
                          </button>
                        )}
                        {resource.inProduction && (
                          <div className="game-resource__in-production">
                            V produkci: {resource.inProduction}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Armáda */}
              <div className="game-army">
                <div className="game-card">
                  <h3 className="game-section__title">Armáda</h3>
                  <div className="game-army__list">
                    {units.map((unit, index) => (
                      <div key={index} className="game-unit">
                        <div className="game-unit__icon">
                          <img src={unit.icon} alt={unit.name} />
                        </div>
                        <div className="game-unit__info">
                          <div className="game-unit__name">{unit.name}</div>
                          <div className="game-unit__amount">{unit.amount.toLocaleString()}</div>
                          {unit.inRecruitment > 0 && (
                            <div className="game-unit__recruitment">
                              Rekrutuje se: {unit.inRecruitment}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="game-army__recruit">
                    Rekrutovat další jednotky
                  </button>
                </div>
              </div>
            </div>

            {/* Příkazy */}
            <div className="game-commands">
              <div className="game-card">
                <button 
                  className="game-commands__header"
                  onClick={() => setCommandsExpanded(!commandsExpanded)}
                >
                  <h3 className="game-section__title">
                    Příkazy ({commands.length})
                  </h3>
                  {commandsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                <div className="game-commands__content">
                  <div className="game-commands__grid">
                    <div className="game-commands__column">
                      <h4 className="game-commands__subtitle">Příchozí jednotky</h4>
                      {displayedCommands
                        .filter(cmd => cmd.type === 'incoming')
                        .map((command, index) => (
                          <div key={index} className="game-command">
                            <div className="game-command__description">
                              {command.description}
                            </div>
                            <div className="game-command__time">
                              Dorazí za: {command.arrivalTime}
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    <div className="game-commands__column">
                      <h4 className="game-commands__subtitle">Odchozí jednotky</h4>
                      {displayedCommands
                        .filter(cmd => cmd.type === 'outgoing')
                        .map((command, index) => (
                          <div key={index} className="game-command">
                            <div className="game-command__description">
                              {command.description}
                            </div>
                            <div className="game-command__time">
                              Dorazí za: {command.arrivalTime}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {!commandsExpanded && commands.length > 3 && (
                    <div className="game-commands__more">
                      ... a {commands.length - 3} dalších příkazů
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="game-footer">
        <div className="game-footer__container">
          <p className="game-footer__text">
            © 2025 Patrik Brnušák
          </p>
          <p className="game-footer__text">
            Postaveno na Convex - moderní backend pro webové aplikace
          </p>
        </div>
      </footer>
    </div>
  );
}