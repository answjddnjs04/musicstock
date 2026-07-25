// 로그인/회원가입을 한 화면에서 토글로 처리(별도 페이지 라우팅 없음).
// isSupabaseEnabled가 false면 App.jsx가 이 화면 자체를 건너뛰므로,
// 이 컴포넌트는 Supabase가 설정된 배포 환경에서만 실제로 보인다.
import { useState } from 'react'
import { useApp } from '../context/AppContext'

export function AuthScreen() {
  const { signIn, signUp } = useApp()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const action = mode === 'signin' ? signIn : signUp
    const { error: authError } = await action(email, password)

    setIsSubmitting(false)
    if (authError) setError(authError.message)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-white">
      <h1 className="text-xl font-bold">MusicStock</h1>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="rounded-pill bg-surface px-4 py-2 text-sm placeholder:text-muted focus:outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="rounded-pill bg-surface px-4 py-2 text-sm placeholder:text-muted focus:outline-none"
        />

        {error && <p className="text-xs text-fall">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-pill bg-rise py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {mode === 'signin' ? '로그인' : '회원가입'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="text-xs text-muted"
      >
        {mode === 'signin'
          ? '계정이 없으신가요? 회원가입'
          : '이미 계정이 있으신가요? 로그인'}
      </button>
    </div>
  )
}
