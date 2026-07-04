import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { readCache, writeCache, getStoryColor } from '../utils/storyCache';

const STORIES_PER_PAGE = 16;

export const useStories = (backendUrl, userData) => {
  const [userStories, setUserStories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tutte");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStoryKind, setSelectedStoryKind] = useState("Tutte"); // 'Tutte' | 'Social Story' | 'Strange Story'
  const [selectedGame, setSelectedGame] = useState("Tutti"); // 'Tutti' | 'Sequencing' | 'Emotion'
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStories = useCallback(async (forceRefresh = false) => {
    setError(null);

    if (!forceRefresh) {
      const cached = readCache();
      if (cached && cached.length > 0) {
        setUserStories(cached);
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      const { data } = await axios.get(backendUrl + '/api/story/all');

      if (data.success) {
        const coloredStories = data.stories.map((story) => ({
          ...story,
          color: getStoryColor(story._id)
        }));
        writeCache(coloredStories);
        setUserStories(coloredStories);
      } else {
        setError("Impossibile caricare le storie. Riprova.");
      }
    } catch (err) {
      if (err.response) {
        setError(`Errore del server (${err.response.status}). Riprova più tardi.`);
      } else {
        setError("Impossibile raggiungere il server. Controlla la connessione.");
      }
      console.error("❌ Error fetching stories:", err);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedType, selectedStoryKind, selectedGame, selectedDifficulty]);

  const categories = ["Tutte", ...new Set(userStories.map(s => s.category).filter(Boolean))];

  const filteredStories = userStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tutte" || story.category === selectedCategory;
    // story.gameType è ora sempre impostato dal backend ('story' o 'emoGame');
    // il fallback 'story' resta per sicurezza nel caso di dati non ancora aggiornati in cache.
    const storyGameType = story.gameType || 'story';
    // Le Adaptive Story sono salvate con gameType 'emoGame' + isAdaptive:true.
    // Le trattiamo come un tipo virtuale a sé stante ('adaptiveStory'), separato
    // sia da 'story' che da 'emoGame' puro, così hanno un tab/filtro dedicato.
    const effectiveType = (storyGameType === 'emoGame' && story.isAdaptive === true)
      ? 'adaptiveStory'
      : storyGameType;
    const matchesType = selectedType === "all" || effectiveType === selectedType;
    const matchesDifficulty = selectedDifficulty === "all" || story.difficulty === selectedDifficulty;

    const matchesStoryKind =
      storyGameType !== 'story' || selectedStoryKind === 'Tutte' ||
      (selectedStoryKind === 'Strange Story' ? story.isStrangeStoryActive === true : story.isStrangeStoryActive !== true);

    const matchesGame =
      storyGameType !== 'story' || selectedGame === 'Tutti' ||
      (selectedGame === 'Sequencing' ? story.isSequencingGameActive === true : story.isEmotionGameActive === true);

    return matchesSearch && matchesCategory && matchesType && matchesDifficulty && matchesStoryKind && matchesGame;
  });

  const sortedStories = [...filteredStories].sort((a, b) => {
    const createdA = new Date(a.createdAt || 0);
    const createdB = new Date(b.createdAt || 0);
    const titleA = (a.title || '').toLowerCase();
    const titleB = (b.title || '').toLowerCase();

    const isMine = (s) => userData && s.userId === userData._id;
    const hasToM = (s) => Array.isArray(s.paragraphs) && s.paragraphs.some(p => p?.strangeStoryTest?.active === true);
    const diffValue = (s) => {
      const map = { 'DifI': 1, 'DifII': 2, 'DifIII': 3 };
      return map[s?.difficulty] || 99;
    };

    switch (sortBy) {
      case 'newest':
        return createdB - createdA;
      case 'oldest':
        return createdA - createdB;
      case 'alpha_asc':
        return titleA.localeCompare(titleB);
      case 'alpha_desc':
        return titleB.localeCompare(titleA);
      case 'mine_first': {
        const ma = isMine(a) ? 0 : 1;
        const mb = isMine(b) ? 0 : 1;
        if (ma !== mb) return ma - mb;
        return createdB - createdA;
      }
      case 'tom_first': {
        const ta = hasToM(a) ? 0 : 1;
        const tb = hasToM(b) ? 0 : 1;
        if (ta !== tb) return ta - tb;
        return createdB - createdA;
      }
      case 'difficulty_asc': {
        const da = diffValue(a);
        const db = diffValue(b);
        if (da !== db) return da - db;
        return createdB - createdA;
      }
      case 'difficulty_desc': {
        const da = diffValue(a);
        const db = diffValue(b);
        if (da !== db) return db - da;
        return createdB - createdA;
      }
      case 'alphabetical':
        return (a.title || '').localeCompare(b.title || '');
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedStories.length / STORIES_PER_PAGE);
  const startIndex = (currentPage - 1) * STORIES_PER_PAGE;
  const displayedStories = sortedStories.slice(startIndex, startIndex + STORIES_PER_PAGE);

  return {
    displayedStories,
    totalResults: sortedStories.length,
    categories,
    totalPages,
    isLoading,
    error,
    currentPage,
    searchTerm,
    selectedCategory,
    selectedType,
    selectedStoryKind,
    setSelectedStoryKind,
    selectedGame,
    setSelectedGame,
    selectedDifficulty,
    setSelectedDifficulty,
    sortBy,
    setSortBy,
    setCurrentPage,
    setSearchTerm,
    setSelectedCategory,
    setSelectedType,
    fetchStories,
  };
};