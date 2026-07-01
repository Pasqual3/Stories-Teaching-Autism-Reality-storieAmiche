import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export const useChildSession = (backendUrl, getUserData) => {
    const navigate = useNavigate();

    const [activeChild, setActiveChild] = useState(() => {
        try {
            const saved = localStorage.getItem('activeChild');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [isExitChildModalOpen, setIsExitChildModalOpen] = useState(false);
    const [exitChildError, setExitChildError] = useState('');
    const [isExitChildSubmitting, setIsExitChildSubmitting] = useState(false);
    const [sessionExitHandler, setSessionExitHandler] = useState(null);

    const setActiveChildPersisted = useCallback((child) => {
        if (child) {
            localStorage.setItem('activeChild', JSON.stringify(child));
        } else {
            localStorage.removeItem('activeChild');
        }
        setActiveChild(child);
    }, []);

    const healChildState = useCallback((serverUserData) => {
        if (serverUserData.isChildActive && serverUserData.activeChildId && (!activeChild || !activeChild.childId)) {
            setActiveChildPersisted({
                childId: serverUserData.activeChildId,
                parentId: serverUserData._id,
                childName: serverUserData.name,
            });
        } else if (!serverUserData.isChildActive && activeChild) {
            setActiveChildPersisted(null);
        }
    }, [activeChild, setActiveChildPersisted]);

    const submitExitChildPassword = useCallback(async (password) => {
        setIsExitChildSubmitting(true);
        setExitChildError('');
        try {
            const { data } = await axios.post(`${backendUrl}/api/user/logout-child`, { password });
            if (data.success) {
                setIsExitChildModalOpen(false);
                setActiveChildPersisted(null);
                await getUserData();
                navigate('/');
                toast.success(data.message || "Uscito dall'Area Bimbi");
                return true;
            }
            setExitChildError(data.message || 'Password errata. Riprova.');
            return false;
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || 'Errore di connessione.';
            setExitChildError(errMsg);
            return false;
        } finally {
            setIsExitChildSubmitting(false);
        }
    }, [backendUrl, getUserData, navigate, setActiveChildPersisted]);

    return {
        activeChild,
        setActiveChild: setActiveChildPersisted,
        setActiveChildPersisted,
        healChildState,
        isExitChildModalOpen,
        setIsExitChildModalOpen,
        exitChildError,
        setExitChildError,
        isExitChildSubmitting,
        submitExitChildPassword,
        sessionExitHandler,
        setSessionExitHandler,
    };
};