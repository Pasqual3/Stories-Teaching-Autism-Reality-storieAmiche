import React from 'react';

/**
 * TextFormatToolbar
 *
 * Barra di strumenti per inserire marcatori TTS e di formattazione testo
 * direttamente nella textarea della scena, alla posizione del cursore.
 *
 * Props:
 *   textareaRef  – ref React della <textarea> da manipolare
 *   value        – valore corrente della textarea (stringa)
 *   onChange     – callback chiamata con il nuovo valore (stringa)
 */

const BUTTONS = [
    {
        group: 'Pause',
        items: [
            {
                label: 'Pausa corta',
                title: 'Inserisce una breve pausa (~300ms) nel parlato TTS',
                icon: '⏸',
                insert: '{{PAUSA_CORTA}}',
                style: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100',
            },
            {
                label: 'Pausa lunga',
                title: 'Inserisce una pausa più lunga (~700ms) nel parlato TTS',
                icon: '⏭',
                insert: '{{PAUSA_LUNGA}}',
                style: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100',
            },
            {
                label: 'Enfasi',
                title: 'Aggiunge enfasi vocale nel punto inserito (quando supportato dal modello TTS)',
                icon: '🔊',
                insert: '{{ENFASI}}',
                style: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100',
            },
        ],
    },
    {
        group: 'Stile',
        items: [
            {
                label: 'Grassetto',
                title: 'Avvolge il testo selezionato in grassetto (mostrato in bold a schermo)',
                icon: 'B',
                wrapOpen: '{{BOLD}}',
                wrapClose: '{{/BOLD}}',
                style: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 font-black',
            },
            {
                label: 'Corsivo',
                title: 'Avvolge il testo selezionato in corsivo (mostrato in italic a schermo)',
                icon: 'I',
                wrapOpen: '{{ITALIC}}',
                wrapClose: '{{/ITALIC}}',
                style: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 italic',
            },
        ],
    },
];

const TextFormatToolbar = ({ textareaRef, value, onChange }) => {
    const insertAtCursor = (btn) => {
        const el = textareaRef?.current;
        if (!el) return;

        const start = el.selectionStart ?? value.length;
        const end   = el.selectionEnd   ?? value.length;
        const selected = value.slice(start, end);

        let newText;
        let newCursorPos;

        if (btn.wrapOpen) {
            // Avvolge il testo selezionato (o inserisce i tag vuoti se nulla è selezionato)
            const inner = selected || '';
            newText =
                value.slice(0, start) +
                btn.wrapOpen +
                inner +
                btn.wrapClose +
                value.slice(end);
            newCursorPos = start + btn.wrapOpen.length + inner.length + btn.wrapClose.length;
        } else {
            // Inserisce il marcatore puntuale alla posizione del cursore
            newText = value.slice(0, start) + btn.insert + value.slice(end);
            newCursorPos = start + btn.insert.length;
        }

        onChange(newText);

        // Ripristina focus e cursore dopo il re-render React
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(newCursorPos, newCursorPos);
        });
    };

    return (
        <div className="mb-2 flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl">

            {BUTTONS.map((group, gi) => (
                <React.Fragment key={group.group}>
                    {/* Separatore verticale tra gruppi (non prima del primo) */}
                    {gi > 0 && <span className="w-px h-5 bg-gray-200 self-center mx-0.5" />}

                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-0.5 select-none self-center">
                        {group.group}
                    </span>

                    {group.items.map((btn) => (
                        <button
                            key={btn.label}
                            type="button"
                            title={btn.title}
                            onClick={() => insertAtCursor(btn)}
                            className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-all ${btn.style}`}
                        >
                            <span className="mr-1">{btn.icon}</span>
                            {btn.label}
                        </button>
                    ))}
                </React.Fragment>
            ))}

            <span className="ml-auto text-[9px] text-gray-400 italic self-center hidden sm:block">
                Seleziona testo + B/I per avvolgere · Cursore + pausa/enfasi per inserire
            </span>
        </div>
    );
};

export default TextFormatToolbar;
