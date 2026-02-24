import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import LoginPage from './pages/LoginPage';
import Register from './pages/RegisterPage';
import JobsPage from './pages/JobsPage';
import JobPage from './pages/JobPage';
import DashboardPage from './pages/DashboardPage';
import LaunchpadPage from './pages/LaunchpadPage';
import Profile from './pages/Profile';
import AppliedJobsPage from './pages/AppliedJobsPage';
import SavedJobsPage from './pages/SavedJobsPage';
import LandingPage from './pages/LandingPage';
import NewLandingPage from './pages/NewLandingPage';
import OnboardingPage from './pages/OnboardingPage';
import CompanyPreferences from './pages/CompanyPreferences';
import PreferredJobsPage from './pages/PreferredJobsPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public (guest-only) Routes — redirect to /dashboard if already logged in */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<NewLandingPage />} />

        {/* Onboarding (post-registration) */}
        {/* <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} /> */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <JobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/launchpad"
          element={
            <ProtectedRoute>
              <LaunchpadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applied-all"
          element={
            <ProtectedRoute>
              <AppliedJobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-all"
          element={
            <ProtectedRoute>
              <SavedJobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-preferences"
          element={
            <ProtectedRoute>
              <CompanyPreferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preferred-jobs"
          element={
            <ProtectedRoute>
              <PreferredJobsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/" replace />} />

        {/* 404 or catch-all */}
        <Route path="*" element={<Navigate to="/error" replace />} />

        <Route path="/error" element={<Error />} />
      </Routes>
    </Router>
  );
}

export default App;