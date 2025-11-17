import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import RoundsListPage from '@/pages/RoundsListPage'
import RoundPage from '@/pages/RoundPage'

/**
 * Компонент защищенного маршрута
 *
 * Перенаправляет на /login если пользователь не авторизован
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/**
 * Корневой компонент приложения с роутингом
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/rounds" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rounds"
          element={
            <ProtectedRoute>
              <RoundsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rounds/:id"
          element={
            <ProtectedRoute>
              <RoundPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
