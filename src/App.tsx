import { Navigate, Route, Routes } from 'react-router-dom'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ApplicationStatusPage } from './pages/ApplicationStatusPage'
import { ApplyPage } from './pages/ApplyPage'
import { JobApplyPage } from './pages/JobApplyPage'
import { JobPostingsPage } from './pages/JobPostingsPage'
import { ImpressumPage } from './pages/ImpressumPage'
import { DatenschutzPage } from './pages/DatenschutzPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Footer } from './components/Footer'

function App() {
  return (
    <>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/status/:token" element={<ApplicationStatusPage />} />
        <Route path="/apply/job/:jobPostingId" element={<JobApplyPage />} />
        <Route path="/apply/:tenantId" element={<ApplyPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/jobs"
          element={
            <ProtectedRoute>
              <JobPostingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
