import React, { lazy, Suspense, useContext, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { appContext } from './context/appContext'
import { ToastContainer } from 'react-toastify'

import Home from './pages/Home'
import ChildDashboard from './pages/ChildDashboard'
import SocialStoryGuide from './pages/Guide/SocialStoryGuide'
import StrangeStoryGuide from './pages/Guide/StrangeStoryGuide'
import ChildProfileSelector from './components/ChildProfileSelector'
import EmoGameGuide from './pages/Guide/emogameguide'
import ExitChildModal from './components/ExitChildModal'

// Auth
import Login from './features/auth/components/Login'
import EmailVerify from './features/auth/components/EmailVerify'
import ResetPassword from './features/auth/components/ResetPassword'

// Lazy — caricati solo quando servono
const ViewStory = lazy(() => import('./features/story/components/viewStory'))
const ViewEmoGame = lazy(() => import('./features/emoGame/components/viewEmoGame'))
const NewStory = lazy(() => import('./features/story/pages/NewStory'))
const NewEmoGame = lazy(() => import('./features/emoGame/pages/EmoGame'))
const SequencingGame = lazy(() => import('./features/games/SequencingGame'))
const EmotionMatchingGame = lazy(() => import('./features/games/EmotionMatchingGame'))
const TherapistAnalytics = lazy(() => import('./features/therapist/TherapistAnalytics'))
const Profile = lazy(() => import('./features/profile/index'))

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isLoggedin, userData, isCheckingAuth } = useContext(appContext);
  const location = useLocation();

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-purple-500">Caricamento...</div>;
  }

  if (!isLoggedin || !userData) return <Navigate to="/login" />;

  // Se la modalità bambino è attiva, blocca l'accesso alle pagine protette del genitore
  if (userData.isChildActive && !location.pathname.startsWith('/child-dashboard')) {
    return <Navigate to="/child-dashboard" />;
  }

  if (allowedRoles && !allowedRoles.includes(userData.tipo_utente)) {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  const { isLoggedin, userData, isCheckingAuth } = useContext(appContext);
  const location = useLocation();
  const navigate = useNavigate();

  if (!isCheckingAuth && isLoggedin && userData?.isChildActive) {
    const path = location.pathname;
    const isAllowed =
      path.startsWith('/child-dashboard') ||
      path.startsWith('/story/') ||
      path.startsWith('/emoGame/') ||
      path.startsWith('/games/');
    if (!isAllowed) {
      return <Navigate to="/child-dashboard" replace />;
    }
  }

  return (
    <div>
      <ToastContainer />
      <ExitChildModal />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-purple-500">Caricamento...</div>}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/newStory' element={<ProtectedRoute><NewStory /></ProtectedRoute>} />
          <Route path="/edit-story/:id" element={<ProtectedRoute><NewStory /></ProtectedRoute>} />
          <Route path='/newEmoGame' element={<ProtectedRoute><NewEmoGame /></ProtectedRoute>} />
          <Route path='/edit-emoGame/:id' element={<ProtectedRoute><NewEmoGame /></ProtectedRoute>} />
          <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/email-verify' element={<EmailVerify />} />
          <Route path='/reset-password' element={<ResetPassword />} />
          <Route path='/story/:id' element={<ViewStory />} />
          <Route path='/emoGame/:id' element={<ViewEmoGame />} />
          <Route path="/child-select" element={<ProtectedRoute><ChildProfileSelector /></ProtectedRoute>} />
          <Route path="/games/sequencing/:storyId" element={<SequencingGame />} />
          <Route path="/games/emotions/:storyId" element={<EmotionMatchingGame />} />
          <Route path='/child-dashboard' element={<ProtectedRoute><ChildDashboard /></ProtectedRoute>} />
          <Route path='/therapist-analytics' element={<ProtectedRoute allowedRoles={['terapeuta']}><TherapistAnalytics /></ProtectedRoute>} />
          <Route path='/guide/social-stories' element={<SocialStoryGuide />} />
          <Route path='/guide/strange-stories' element={<StrangeStoryGuide />} />
          <Route path='/guide/emo-guide' element={<EmoGameGuide />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App