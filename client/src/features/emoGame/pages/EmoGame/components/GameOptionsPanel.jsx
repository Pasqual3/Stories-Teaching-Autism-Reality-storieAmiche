import React from 'react';

const Toggle = ({ checked, onChange, activeColor, label, badge }) => (
    <label className="flex items-center cursor-pointer mb-3">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? activeColor : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
        </div>
        <div className="ml-3 text-gray-700 font-medium flex items-center gap-2">
            {label}
            {badge && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
    </label>
);

const GameOptionsPanel = ({
    isSequencingGameActive = false,
    setIsSequencingGameActive,
    isEmotionGameActive = true,
    setIsEmotionGameActive,
    isStrangeStoryActive = true,
    setIsStrangeStoryActive
}) => (
    <div className="mb-8 p-4 bg-purple-50 rounded-xl border border-purple-100">
        <div className="space-y-4">
            <Toggle
                checked={isEmotionGameActive}
                onChange={() => setIsEmotionGameActive(!isEmotionGameActive)}
                activeColor="bg-teal-500"
                label={<span>Abilita Gioco: <strong>Indovina l'Emozione</strong></span>}
                badge="Terapeutico"
            />

            <hr className="border-purple-100 my-2" />

            {/* Toggle Strange Stories */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors">
                <input
                    type="checkbox"
                    checked={isStrangeStoryActive}
                    onChange={(e) => setIsStrangeStoryActive(e.target.checked)}
                    className="h-5 w-5 accent-orange-500"
                />
                <div>
                    <span className="font-bold text-orange-700">🧠 Strange Stories Test</span>
                    <p className="text-xs text-orange-500 mt-0.5">Aggiungi domande Theory of Mind dopo ogni scena</p>
                </div>
            </label>
        </div>
    </div>
);

export default GameOptionsPanel;