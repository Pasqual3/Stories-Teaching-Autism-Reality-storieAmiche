import { useState, useCallback, useRef } from 'react';

/**
 * Hook per drag & drop touch-friendly
 * Gestisce tap (seleziona) + tap su target (sposta) invece di drag continuo
 * più adatto per bambini autistici che hanno difficoltà con gesture complesse
 */
export const useTouchDrag = ({ onMove, onSelect }) => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedSource, setSelectedSource] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartPos = useRef({ x: 0, y: 0 });
    const longPressTimer = useRef(null);

    const handleTouchStart = useCallback((e, item, source, index) => {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };

        // Long press per selezionare (più facile per bambini che tap casuale)
        longPressTimer.current = setTimeout(() => {
            setSelectedItem({ item, index });
            setSelectedSource(source);
            setIsDragging(true);
            onSelect?.({ item, source, index });
            // Vibrazione tattile se disponibile
            if (navigator.vibrate) navigator.vibrate(50);
        }, 300); // 300ms long press
    }, [onSelect]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) {
            // Se si muove troppo, annulla il long press (era uno scroll)
            const touch = e.touches[0];
            const dx = Math.abs(touch.clientX - touchStartPos.current.x);
            const dy = Math.abs(touch.clientY - touchStartPos.current.y);
            if (dx > 10 || dy > 10) {
                clearTimeout(longPressTimer.current);
            }
            return;
        }
        e.preventDefault(); // Previene scroll durante drag
    }, [isDragging]);

    const handleTouchEnd = useCallback((e) => {
        clearTimeout(longPressTimer.current);

        if (!isDragging || !selectedItem) {
            setIsDragging(false);
            return;
        }

        // Trova elemento sotto il dito
        const touch = e.changedTouches[0];
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropZone = elem?.closest('[data-drop-zone]');

        if (dropZone) {
            const targetIndex = parseInt(dropZone.dataset.dropZone);
            onMove?.({
                item: selectedItem.item,
                from: selectedSource,
                fromIndex: selectedItem.index,
                toIndex: targetIndex,
                toType: dropZone.dataset.zoneType || 'slot'
            });
        }

        setSelectedItem(null);
        setSelectedSource(null);
        setIsDragging(false);
    }, [isDragging, selectedItem, selectedSource, onMove]);

    return {
        selectedItem,
        isDragging,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        clearSelection: () => {
            setSelectedItem(null);
            setSelectedSource(null);
            setIsDragging(false);
        }
    };
};

export default useTouchDrag;