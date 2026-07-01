import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export const useAuth = (backendUrl) => {
    const navigate = useNavigate();

    const [isLoggedin, setIsLoggedin] = useState(false);
    const [userData, setUserdata] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const isLoggedinRef = useRef(isLoggedin);
    useEffect(() => { isLoggedinRef.current = isLoggedin; }, [isLoggedin]);

    const intentionalLogoutRef = useRef(false);

    const getUserData = useCallback(async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/data`);
            if (data.success) {
                setUserdata(data.userData);
                return data.userData;
            }
            setUserdata(null);
            return null;
        } catch {
            return null;
        }
    }, [backendUrl]);

    const getAuthState = useCallback(async () => {
        setIsCheckingAuth(true);
        try {
            const { data } = await axios.get(`${backendUrl}/api/auth/is-auth`);
            if (data.success) {
                setIsLoggedin(true);
                await getUserData();
            } else {
                setIsLoggedin(false);
                setUserdata(null);
            }
        } catch {
            setIsLoggedin(false);
            setUserdata(null);
        } finally {
            setIsCheckingAuth(false);
        }
    }, [backendUrl, getUserData]);

    const clearAuth = useCallback(() => {
        setIsLoggedin(false);
        setUserdata(null);
    }, []);

    const logoutAction = useCallback(async () => {
        try {
            axios.defaults.withCredentials = true;
            intentionalLogoutRef.current = true;
            const { data } = await axios.post(`${backendUrl}/api/auth/logout`);
            if (data.success) {
                clearAuth();
                navigate('/');
                toast.info('Logout effettuato');
            }
        } catch (error) {
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                clearAuth();
                navigate('/');
                toast.info('Logout effettuato');
            } else {
                toast.error(error.response?.data?.message || error.message);
            }
        } finally {
            setTimeout(() => { intentionalLogoutRef.current = false; }, 3000);
        }
    }, [backendUrl, clearAuth, navigate]);

    return {
        isLoggedin, setIsLoggedin,
        userData, setUserdata,
        isCheckingAuth,
        isLoggedinRef,
        intentionalLogoutRef,
        getUserData,
        getAuthState,
        clearAuth,
        logoutAction,
    };
};