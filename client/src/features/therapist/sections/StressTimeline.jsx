// src/components/therapist/sections/StressTimeline.jsx
import React, { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, ReferenceArea
} from 'recharts';
import StressBadge from '../ui/StressBadge';

const GROUP_BY_OPTIONS = [
    { value: 'story', label: 'Per Storia' },
    { value: 'session', label: 'Singola Sessione' },
    { value: '5sessions', label: 'Gruppi 5' },
    { value: '10sessions', label: 'Gruppi 10' },
    { value: 'week', label: 'Settimana' }
];

const StressTimeline = ({ sessions, allStories, baseline, onSessionClick }) => {
    const [groupBy, setGroupBy] = useState('story');
    const [showRange, setShowRange] = useState(true);
    const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
    const [selectedStory, setSelectedStory] = useState('all');

    // Ordina per data crescente
    const sortedSessions = useMemo(() => {
        return [...sessions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [sessions]);

    // Filtra per date
    const filteredSessions = useMemo(() => {
        if (!dateFilter.from && !dateFilter.to) return sortedSessions;

        return sortedSessions.filter(s => {
            const date = new Date(s.createdAt);
            const from = dateFilter.from ? new Date(dateFilter.from) : null;
            const to = dateFilter.to ? new Date(dateFilter.to) : null;

            if (from && date < from) return false;
            if (to && date > to) return false;
            return true;
        });
    }, [sortedSessions, dateFilter]);

    // Raggruppa per storia
    const sessionsByStory = useMemo(() => {
        const groups = {};
        filteredSessions.forEach(s => {
            if (!groups[s.storyId]) {
                groups[s.storyId] = {
                    storyId: s.storyId,
                    sessions: [],
                    storyInfo: (allStories && allStories[s.storyId]) || { title: 'Storia Sconosciuta', slides: 5 }
                };
            }
            groups[s.storyId].sessions.push(s);
        });
        return Object.values(groups).sort((a, b) =>
            new Date(a.sessions[0].createdAt) - new Date(b.sessions[0].createdAt)
        );
    }, [filteredSessions, allStories]);

    // Helper per numero settimana
    const getWeekNumber = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const formatDateRange = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        if (s.getMonth() === e.getMonth()) {
            return `${s.getDate()}-${e.getDate()} ${s.toLocaleDateString('it-IT', { month: 'short' })}`;
        }
        return `${s.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    };

    // Genera i dati aggregati in base al raggruppamento selezionato
    const aggregatedData = useMemo(() => {
        let dataToProcess = filteredSessions;

        // Se selezionata una storia specifica, filtra solo quella
        if (selectedStory !== 'all') {
            dataToProcess = filteredSessions.filter(s => s.storyId === selectedStory);
        }

        if (dataToProcess.length === 0) return [];

        // === RAGGRUPPAMENTO PER STORIA ===
        if (groupBy === 'story') {
            return sessionsByStory.map((storyGroup, idx) => {
                const stressValues = storyGroup.sessions.map(s => s.stressIndex);
                const prevGroup = idx > 0 ? sessionsByStory[idx - 1] : null;
                const prevAvg = prevGroup
                    ? Math.round(prevGroup.sessions.reduce((sum, s) => sum + s.stressIndex, 0) / prevGroup.sessions.length)
                    : null;

                return {
                    label: storyGroup.storyInfo.title.length > 15
                        ? storyGroup.storyInfo.title.substring(0, 15) + '...'
                        : storyGroup.storyInfo.title,
                    fullLabel: storyGroup.storyInfo.title,
                    dateRange: formatDateRange(
                        storyGroup.sessions[0].createdAt,
                        storyGroup.sessions[storyGroup.sessions.length - 1].createdAt
                    ),
                    shortDate: new Date(storyGroup.sessions[storyGroup.sessions.length - 1].createdAt)
                        .toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
                    stressAvg: Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length),
                    stressMin: Math.min(...stressValues),
                    stressMax: Math.max(...stressValues),
                    completamento: Math.round(storyGroup.sessions.reduce((sum, s) => sum + (s.completionRate || 0), 0) / storyGroup.sessions.length),
                    count: storyGroup.sessions.length,
                    sessions: storyGroup.sessions,
                    trend: prevAvg !== null
                        ? (Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length) - prevAvg)
                        : 0,
                    startDate: storyGroup.sessions[0].createdAt,
                    endDate: storyGroup.sessions[storyGroup.sessions.length - 1].createdAt,
                    storySlides: storyGroup.storyInfo.slides,
                    storyId: storyGroup.storyId
                };
            });
        }

        // === SOTTOGRUPPI: singola sessione, gruppi 5, gruppi 10, settimana ===
        // Se siamo in "session", "5sessions", "10sessions", "week" ma selectedStory è 'all',
        // mostriamo tutte le sessioni (comportamento precedente)

        if (groupBy === 'session') {
            return dataToProcess.map((s, i) => ({
                label: `S${i + 1}`,
                fullLabel: `Sessione ${i + 1}`,
                dateRange: new Date(s.createdAt).toLocaleDateString('it-IT', {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }),
                shortDate: new Date(s.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
                stressAvg: s.stressIndex,
                stressMin: s.stressIndex,
                stressMax: s.stressIndex,
                completamento: s.completionRate || 0,
                count: 1,
                sessions: [s],
                trend: i > 0 ? s.stressIndex - dataToProcess[i - 1].stressIndex : 0,
                startDate: s.createdAt,
                endDate: s.createdAt,
                storyTitle: (allStories && allStories[s.storyId])?.title || 'Sconosciuta'
            }));
        }

        if (groupBy === '5sessions') {
            const groups = [];
            for (let i = 0; i < dataToProcess.length; i += 5) {
                const group = dataToProcess.slice(i, i + 5);
                const stressValues = group.map(s => s.stressIndex);
                const prevGroup = groups.length > 0 ? groups[groups.length - 1] : null;

                groups.push({
                    label: `S${i + 1}-${Math.min(i + 5, dataToProcess.length)}`,
                    fullLabel: `Sessioni ${i + 1} a ${Math.min(i + 5, dataToProcess.length)}`,
                    dateRange: formatDateRange(group[0].createdAt, group[group.length - 1].createdAt),
                    shortDate: new Date(group[group.length - 1].createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
                    stressAvg: Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length),
                    stressMin: Math.min(...stressValues),
                    stressMax: Math.max(...stressValues),
                    completamento: Math.round(group.reduce((sum, s) => sum + (s.completionRate || 0), 0) / group.length),
                    count: group.length,
                    sessions: group,
                    trend: prevGroup ? (Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length) - prevGroup.stressAvg) : 0,
                    startDate: group[0].createdAt,
                    endDate: group[group.length - 1].createdAt
                });
            }
            return groups;
        }

        if (groupBy === '10sessions') {
            const groups = [];
            for (let i = 0; i < dataToProcess.length; i += 10) {
                const group = dataToProcess.slice(i, i + 10);
                const stressValues = group.map(s => s.stressIndex);
                const prevGroup = groups.length > 0 ? groups[groups.length - 1] : null;

                groups.push({
                    label: `S${i + 1}-${Math.min(i + 10, dataToProcess.length)}`,
                    fullLabel: `Sessioni ${i + 1} a ${Math.min(i + 10, dataToProcess.length)}`,
                    dateRange: formatDateRange(group[0].createdAt, group[group.length - 1].createdAt),
                    shortDate: new Date(group[group.length - 1].createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
                    stressAvg: Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length),
                    stressMin: Math.min(...stressValues),
                    stressMax: Math.max(...stressValues),
                    completamento: Math.round(group.reduce((sum, s) => sum + (s.completionRate || 0), 0) / group.length),
                    count: group.length,
                    sessions: group,
                    trend: prevGroup ? (Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length) - prevGroup.stressAvg) : 0,
                    startDate: group[0].createdAt,
                    endDate: group[group.length - 1].createdAt
                });
            }
            return groups;
        }

        // groupBy === 'week'
        const weekGroups = {};
        dataToProcess.forEach(s => {
            const date = new Date(s.createdAt);
            const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
            if (!weekGroups[weekKey]) {
                weekGroups[weekKey] = {
                    sessions: [],
                    weekNum: getWeekNumber(date),
                    year: date.getFullYear()
                };
            }
            weekGroups[weekKey].sessions.push(s);
        });

        const groups = Object.values(weekGroups).map((group, i, arr) => {
            const stressValues = group.sessions.map(s => s.stressIndex);
            const prevGroup = i > 0 ? arr[i - 1] : null;
            const prevAvg = prevGroup
                ? Math.round(prevGroup.sessions.map(s => s.stressIndex).reduce((a, b) => a + b, 0) / prevGroup.sessions.length)
                : null;

            return {
                label: `Sett. ${group.weekNum}`,
                fullLabel: `Settimana ${group.weekNum} del ${group.year}`,
                dateRange: formatDateRange(group.sessions[0].createdAt, group.sessions[group.sessions.length - 1].createdAt),
                shortDate: new Date(group.sessions[group.sessions.length - 1].createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
                stressAvg: Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length),
                stressMin: Math.min(...stressValues),
                stressMax: Math.max(...stressValues),
                completamento: Math.round(group.sessions.reduce((sum, s) => sum + (s.completionRate || 0), 0) / group.sessions.length),
                count: group.sessions.length,
                sessions: group.sessions,
                trend: prevAvg !== null ? (Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length) - prevAvg) : 0,
                startDate: group.sessions[0].createdAt,
                endDate: group.sessions[group.sessions.length - 1].createdAt
            };
        });

        return groups;
    }, [filteredSessions, sessionsByStory, groupBy, selectedStory, allStories]);

    const baselineValue = baseline?.avgStressIndex || baseline?.stressIndex;

    const minDate = sortedSessions.length > 0
        ? new Date(sortedSessions[0].createdAt).toISOString().split('T')[0]
        : '';
    const maxDate = sortedSessions.length > 0
        ? new Date(sortedSessions[sortedSessions.length - 1].createdAt).toISOString().split('T')[0]
        : '';

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const data = payload[0].payload;

        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[260px]">
                {/* Header */}
                <div className="mb-3 pb-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{data.fullLabel}</p>
                    <p className="text-sm font-black text-indigo-700 mt-1">📅 {data.dateRange}</p>
                    {data.storySlides && (
                        <p className="text-xs text-gray-500 mt-1">📖 {data.storySlides} scene nella storia</p>
                    )}
                    {data.storyTitle && (
                        <p className="text-xs text-gray-500 mt-1">📖 Storia: {data.storyTitle}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Stress medio:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-lg text-purple-700">{data.stressAvg}</span>
                            {data.trend !== 0 && (
                                <span className={`text-xs font-bold ${data.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {data.trend > 0 ? '↑' : '↓'} {Math.abs(data.trend)}
                                </span>
                            )}
                        </div>
                    </div>

                    {showRange && data.count > 1 && (
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Range stress:</span>
                            <span className="font-medium">{data.stressMin} - {data.stressMax}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completamento:</span>
                        <span className="font-bold text-emerald-600">{data.completamento}%</span>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Sessioni incluse:</span>
                        <span className="font-bold">{data.count}</span>
                    </div>
                </div>

                {/* Mini bolle sessioni */}
                {data.count > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Dettaglio sessioni:</p>
                        <div className="flex gap-1 flex-wrap">
                            {data.sessions.map((s, i) => (
                                <span
                                    key={i}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white cursor-pointer hover:scale-110 transition-transform
                    ${s.stressIndex < 20 ? 'bg-emerald-400' : s.stressIndex < 45 ? 'bg-amber-400' : s.stressIndex < 70 ? 'bg-orange-400' : 'bg-red-400'}
                  `}
                                    title={`${new Date(s.createdAt).toLocaleDateString('it-IT')} - Stress: ${s.stressIndex}`}
                                    onClick={() => onSessionClick?.(s)}
                                >
                                    {i + 1}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            {/* Header con controlli */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-800">📈 Andamento Stress Index</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {groupBy === 'story'
                                ? 'Raggruppato per storia'
                                : groupBy === 'week'
                                    ? 'Media settimanale'
                                    : groupBy === 'session'
                                        ? 'Sessione per sessione'
                                        : `Gruppi di ${groupBy === '5sessions' ? '5' : '10'} sessioni`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {groupBy !== 'story' && groupBy !== 'session' && (
                            <button
                                onClick={() => setShowRange(!showRange)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showRange ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                                    }`}
                            >
                                {showRange ? '👁️ Range ON' : '👁️ Range OFF'}
                            </button>
                        )}

                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {GROUP_BY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setGroupBy(opt.value)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${groupBy === opt.value
                                            ? 'bg-white text-gray-800 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selettore storia (visibile solo in modalità story o quando filtri) */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">📚 Storia:</span>
                    <select
                        value={selectedStory}
                        onChange={(e) => setSelectedStory(e.target.value)}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none bg-white"
                    >
                        <option value="all">Tutte le storie</option>
                        {sessionsByStory.map(story => (
                            <option key={story.storyId} value={story.storyId}>
                                {story.storyInfo.title} ({story.sessions.length} sessioni, {story.storyInfo.slides} scene)
                            </option>
                        ))}
                    </select>

                    {selectedStory !== 'all' && (
                        <span className="text-xs text-indigo-600 font-bold">
                            {sessionsByStory.find(s => s.storyId === selectedStory)?.storyInfo.slides} scene per sessione
                        </span>
                    )}
                </div>

                {/* Filtro date */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">📅 Periodo:</span>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-400 font-bold uppercase">Da</label>
                            <input
                                type="date"
                                value={dateFilter.from}
                                min={minDate}
                                max={dateFilter.to || maxDate}
                                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                                className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                            />
                        </div>
                        <span className="text-gray-400 font-bold">→</span>
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-400 font-bold uppercase">A</label>
                            <input
                                type="date"
                                value={dateFilter.to}
                                min={dateFilter.from || minDate}
                                max={maxDate}
                                onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                                className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                            />
                        </div>
                        {(dateFilter.from || dateFilter.to) && (
                            <button
                                onClick={() => setDateFilter({ from: '', to: '' })}
                                className="px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                ✕ Reset
                            </button>
                        )}
                    </div>
                    {filteredSessions.length !== sortedSessions.length && (
                        <span className="text-xs text-indigo-600 font-bold ml-auto">
                            Mostrate {filteredSessions.length} di {sortedSessions.length} sessioni
                        </span>
                    )}
                </div>
            </div>

            {/* Legenda fasce stress */}
            <div className="flex justify-center gap-2 mb-4">
                {[
                    { label: 'Calmo', color: '#dcfce7', range: '0-19' },
                    { label: 'Lieve', color: '#fef9c3', range: '20-44' },
                    { label: 'Moderato', color: '#ffedd5', range: '45-69' },
                    { label: 'Alto', color: '#fee2e2', range: '70-100' }
                ].map(f => (
                    <div key={f.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: f.color, border: '1px solid #e5e7eb' }} />
                        <span className="text-[10px] font-bold text-gray-500">{f.label}</span>
                    </div>
                ))}
            </div>

            {aggregatedData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-gray-400">
                    Nessun dato nel periodo selezionato
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                        data={aggregatedData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={aggregatedData.length > 8 ? -30 : 0}
                            textAnchor={aggregatedData.length > 8 ? 'end' : 'middle'}
                            height={aggregatedData.length > 8 ? 50 : 30}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            ticks={[0, 25, 50, 75, 100]}
                        />

                        <ReferenceArea y1={0} y2={19} fill="#dcfce7" fillOpacity={0.4} />
                        <ReferenceArea y1={20} y2={44} fill="#fef9c3" fillOpacity={0.4} />
                        <ReferenceArea y1={45} y2={69} fill="#ffedd5" fillOpacity={0.4} />
                        <ReferenceArea y1={70} y2={100} fill="#fee2e2" fillOpacity={0.4} />

                        {baselineValue && (
                            <ReferenceLine
                                y={baselineValue}
                                stroke="#6b7280"
                                strokeDasharray="8 4"
                                strokeWidth={2}
                                label={{
                                    value: `Baseline ${baselineValue}`,
                                    position: 'right',
                                    fill: '#6b7280',
                                    fontSize: 11,
                                    fontWeight: 'bold'
                                }}
                            />
                        )}

                        <Tooltip content={<CustomTooltip />} />

                        <Line
                            type="monotone"
                            dataKey="stressAvg"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={(props) => {
                                const { cx, cy, payload } = props;
                                const color = payload.stressAvg < 20 ? '#10b981' : payload.stressAvg < 45 ? '#f59e0b' : payload.stressAvg < 70 ? '#f97316' : '#ef4444';
                                return (
                                    <g>
                                        <circle cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={2} />
                                        {payload.trend !== 0 && (
                                            <text
                                                x={cx}
                                                y={cy - 12}
                                                textAnchor="middle"
                                                fill={payload.trend > 0 ? '#ef4444' : '#10b981'}
                                                fontSize={10}
                                                fontWeight="bold"
                                            >
                                                {payload.trend > 0 ? '↑' : '↓'}
                                            </text>
                                        )}
                                    </g>
                                );
                            }}
                            activeDot={{ r: 8, strokeWidth: 0, fill: '#7c3aed' }}
                        />

                        {aggregatedData.some(d => d.completamento < 100) && (
                            <Line
                                type="monotone"
                                dataKey="completamento"
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeDasharray="6 4"
                                dot={{ fill: '#10b981', r: 3 }}
                                opacity={0.6}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            )}

            {/* Statistiche */}
            <div className="mt-6 grid grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sessioni Totali</p>
                    <p className="text-2xl font-black text-gray-800">{filteredSessions.length}</p>
                </div>
                <div className="text-center border-x border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stress Medio</p>
                    <p className="text-2xl font-black text-purple-700">
                        {filteredSessions.length > 0
                            ? Math.round(filteredSessions.reduce((sum, s) => sum + s.stressIndex, 0) / filteredSessions.length)
                            : 0
                        }
                    </p>
                </div>
                <div className="text-center border-r border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Periodo</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">
                        {filteredSessions.length > 0
                            ? `${new Date(filteredSessions[0].createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${new Date(filteredSessions[filteredSessions.length - 1].createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`
                            : '-'
                        }
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tendenza</p>
                    <p className={`text-2xl font-black ${aggregatedData.length > 1 && aggregatedData[aggregatedData.length - 1].trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {aggregatedData.length > 1
                            ? (aggregatedData[aggregatedData.length - 1].trend > 0 ? '↑' : '↓') + ' ' + Math.abs(aggregatedData[aggregatedData.length - 1].trend)
                            : '-'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StressTimeline;
