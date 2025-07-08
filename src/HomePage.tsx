import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Gamepad2, Shield, Sword, Users } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  const [buildInfoExpanded, setBuildInfoExpanded] = useState(false);
  
  const currentBuild = {
    version: "v0.1.0-alpha",
    date: "8. července 2025",
    changes: [
      "Základní struktura projektu",
      "Implementace Convex backend",
      "Přihlašovací systém",
      "Základní UI komponenty"
    ]
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="homepage">
      <div className="homepage__overlay"></div>
      <div className="homepage__pattern"></div>
      
      <div className="homepage__container">
        {/* Header */}
        <div className="homepage__header">
          <div className="homepage__logo-wrapper">
            <img 
              src="/verven.jpeg" 
              alt="Verven Logo" 
              className="homepage__logo"
            />
          </div>
          
          <h1 className="homepage__title">Verven</h1>
          
          <p className="homepage__subtitle">
            Vstupte do světa středověké strategie, kde budujete své léno, 
            spravujete vesnice a vedete svůj lid k prosperitě
          </p>
          
          {/* Akční tlačítka */}
          <div className="homepage__buttons">
            <button
              onClick={handleLogin}
              className="homepage__button homepage__button--primary"
            >
              <Gamepad2 size={24} />
              Přihlásit se
            </button>
            
            <button
              disabled
              className="homepage__button homepage__button--disabled"
            >
              <Users size={24} />
              Registrace
              <span className="homepage__button-note">(brzy)</span>
            </button>
          </div>
        </div>

        {/* Funkce hry */}
        <div className="homepage__features">
          <div className="homepage__feature">
            <Shield className="homepage__feature-icon" size={48} />
            <h3 className="homepage__feature-title">Stavba léna</h3>
            <p className="homepage__feature-description">Budujte a rozvíjejte své středověké sídlo</p>
          </div>
          
          <div className="homepage__feature">
            <Sword className="homepage__feature-icon" size={48} />
            <h3 className="homepage__feature-title">Strategické boje</h3>
            <p className="homepage__feature-description">Veďte svá vojska do epických bitev</p>
          </div>
          
          <div className="homepage__feature">
            <Users className="homepage__feature-icon" size={48} />
            <h3 className="homepage__feature-title">Správa vesnic</h3>
            <p className="homepage__feature-description">Spravujte obyvatele a suroviny</p>
          </div>
        </div>

        {/* Build informace */}
        <div className="homepage__build-section">
          <div className="homepage__build-card">
            <button
              onClick={() => setBuildInfoExpanded(!buildInfoExpanded)}
              className="homepage__build-header"
            >
              <div>
                <h3 className="homepage__build-title">
                  Aktuální build: {currentBuild.version}
                </h3>
                <p className="homepage__build-date">
                  Vydáno: {currentBuild.date}
                </p>
              </div>
              {buildInfoExpanded ? (
                <ChevronUp className="homepage__build-chevron" size={24} />
              ) : (
                <ChevronDown className="homepage__build-chevron" size={24} />
              )}
            </button>
            
            {buildInfoExpanded && (
              <div className="homepage__build-content">
                <h4 className="homepage__build-changes-title">Novinky v tomto buildu:</h4>
                <ul className="homepage__build-changes">
                  {currentBuild.changes.map((change, index) => (
                    <li key={index} className="homepage__build-change">
                      <span className="homepage__build-bullet">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="homepage__footer">
          <p className="homepage__copyright">
            © 2025 Patrik Brnušák
          </p>
          <p className="homepage__convex">
            Postaveno na Convex - moderní backend pro webové aplikace
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;