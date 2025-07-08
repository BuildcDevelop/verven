import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Gamepad2, Shield, Sword, Users } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900">
      {/* Pozadí s texturou */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTEydjEyaDEyVjMwem0tMTggMGgtMTJ2MTJoMTJWMzB6bTE4LTE4aC0xMnYxMmgxMlYxMnptLTE4IDBoLTEydjEyaDEyVjEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <img 
              src="/verven.jpeg" 
              alt="Verven Logo" 
              className="mx-auto w-32 h-32 object-cover rounded-full border-4 border-yellow-400 shadow-2xl"
            />
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Verven
          </h1>
          
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Vstupte do světa středověké strategie, kde budujete své léno, 
            spravujete vesnice a vedete svůj lid k prosperitě
          </p>
          
          {/* Akční tlačítka */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleLogin}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <Gamepad2 size={24} />
              Přihlásit se
            </button>
            
            <button
              disabled
              className="bg-gray-600 text-gray-300 font-bold py-4 px-8 rounded-lg text-lg cursor-not-allowed opacity-75 flex items-center gap-2"
            >
              <Users size={24} />
              Registrace
              <span className="text-xs ml-2">(brzy)</span>
            </button>
          </div>
        </div>

        {/* Funkce hry */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-6 text-center border border-emerald-400 border-opacity-30">
            <Shield className="mx-auto text-yellow-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">Stavba léna</h3>
            <p className="text-emerald-100">Budujte a rozvíjejte své středověké sídlo</p>
          </div>
          
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-6 text-center border border-emerald-400 border-opacity-30">
            <Sword className="mx-auto text-yellow-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">Strategické boje</h3>
            <p className="text-emerald-100">Veďte svá vojska do epických bitev</p>
          </div>
          
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-6 text-center border border-emerald-400 border-opacity-30">
            <Users className="mx-auto text-yellow-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">Správa vesnic</h3>
            <p className="text-emerald-100">Spravujte obyvatele a suroviny</p>
          </div>
        </div>

        {/* Build informace */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-lg border border-emerald-400 border-opacity-30 overflow-hidden">
            <button
              onClick={() => setBuildInfoExpanded(!buildInfoExpanded)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-emerald-800 hover:bg-opacity-30 transition-colors"
            >
              <div>
                <h3 className="text-lg font-bold text-white">
                  Aktuální build: {currentBuild.version}
                </h3>
                <p className="text-emerald-200 text-sm">
                  Vydáno: {currentBuild.date}
                </p>
              </div>
              {buildInfoExpanded ? (
                <ChevronUp className="text-yellow-400" size={24} />
              ) : (
                <ChevronDown className="text-yellow-400" size={24} />
              )}
            </button>
            
            {buildInfoExpanded && (
              <div className="px-6 pb-6 border-t border-emerald-400 border-opacity-20">
                <h4 className="text-white font-semibold mb-3 mt-4">Novinky v tomto buildu:</h4>
                <ul className="space-y-2">
                  {currentBuild.changes.map((change, index) => (
                    <li key={index} className="text-emerald-100 flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-emerald-200">
          <p className="mb-2">
            © 2025 Patrik Brnušák
          </p>
          <p className="text-sm opacity-75">
            Postaveno na Convex - moderní backend pro webové aplikace
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;