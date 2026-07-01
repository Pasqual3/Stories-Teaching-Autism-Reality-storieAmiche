import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { appContext } from '../../../../context/appContext';
import { toast } from 'react-toastify';

const ClinicalDiary = ({ childId, initials, onClose }) => {
    const { backendUrl, userData } = useContext(appContext);
    
    const [notes, setNotes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [selectedTag, setSelectedTag] = useState('');
    const tags = ['Comportamento', 'Progressi', 'Preoccupazioni', 'Genitori', 'Altro'];

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(
                    `${backendUrl}/api/analytics/therapist/${userData._id}/child/${childId}/notes`,
                    { withCredentials: true }
                );
                if (data.success) {
                    setNotes(data.notes);
                }
            } catch (error) {
                toast.error('Errore caricamento note cliniche');
            } finally {
                setLoading(false);
            }
        };
        fetchNotes();
    }, [childId, userData._id, backendUrl]);

    const handleSave = async () => {
        if (!newNote.trim()) return;
        setIsSaving(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/analytics/therapist/${userData._id}/child/${childId}/note`,
                { content: newNote, tag: selectedTag || 'Altro' },
                { withCredentials: true }
            );
            if (data.success) {
                setNotes([data.note, ...notes]);
                setNewNote('');
                setSelectedTag('');
                setIsModalOpen(false);
                toast.success('Nota salvata');
            }
        } catch (error) {
            toast.error('Errore salvataggio nota');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (noteId) => {
        try {
            const { data } = await axios.delete(
                `${backendUrl}/api/analytics/therapist/${userData._id}/child/${childId}/note/${noteId}`,
                { withCredentials: true }
            );
            if (data.success) {
                setNotes(notes.filter(n => n._id !== noteId));
                toast.success('Nota eliminata');
            }
        } catch (error) {
            toast.error('Errore eliminazione nota');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            📖 Diario Clinico di {initials}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Osservazioni e note qualitative</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-2"
                        >
                            ＋ Nuova Osservazione
                        </button>
                        <button onClick={onClose} className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800 font-bold text-xl flex items-center justify-center transition-colors">
                            ×
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">Caricamento note...</div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <span className="text-4xl block mb-2">✍️</span>
                        <p className="text-gray-500">Nessuna nota presente.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notes.map((note) => (
                            <div key={note._id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                                            {note.tag || 'Nota'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(note.createdAt).toLocaleString('it-IT')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(note._id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal Aggiunta Nota */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
                            <h2 className="text-2xl font-black text-gray-800 mb-2">Aggiungi Osservazione</h2>

                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-xl">
                                <p className="text-sm text-amber-800">
                                    ⚠️ Per garantire la <strong>privacy</strong>, non inserire nomi reali. Usa solo riferimenti clinici.
                                </p>
                            </div>

                            <div className="flex gap-2 mb-4 flex-wrap">
                                {tags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(tag)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${selectedTag === tag
                                                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                                                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Scrivi qui la tua osservazione..."
                                className="w-full h-40 px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-emerald-400 focus:outline-none transition-all placeholder:italic resize-none"
                                autoFocus
                            />

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !newNote.trim()}
                                    className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-lg transition-all ${isSaving || !newNote.trim()
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-emerald-600 hover:scale-105'
                                        }`}
                                >
                                    {isSaving ? 'Salvataggio...' : 'Salva Nota'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicalDiary;
