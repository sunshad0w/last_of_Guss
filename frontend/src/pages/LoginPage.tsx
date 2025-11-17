import { useState, type FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { showError } from '@/utils/toast.utils'

/**
 * Страница авторизации
 *
 * Пользователь может войти или зарегистрироваться
 * Если пользователь не существует - создается автоматически
 */
export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Редирект если уже авторизован
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/rounds', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Валидация на клиенте
    if (!username.trim()) {
      showError('Введите имя пользователя')
      return
    }

    if (password.length < 8) {
      showError('Пароль должен содержать минимум 8 символов')
      return
    }

    setLoading(true)

    try {
      await login({ username: username.trim(), password })
      // Успешный вход - редирект произойдет через useEffect выше
      navigate('/rounds')
    } catch (err) {
      // Ошибка уже обработана в interceptor через toast
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">The Last of Guss</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="text-sm font-medium block mb-2">
                Имя пользователя:
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium block mb-2">
                Пароль:
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Загрузка...' : 'Войти'}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Если аккаунта не существует, он будет создан автоматически
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
