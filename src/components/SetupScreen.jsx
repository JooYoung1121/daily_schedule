import { useState } from 'react'
import { KeyRound, CheckCircle2, XCircle, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { setToken, clearToken, testToken } from '../github'

export default function SetupScreen({ onDone }) {
  const [token,    setTokenVal] = useState('')
  const [status,   setStatus]  = useState(null)   // null | 'testing' | 'ok' | 'fail'
  const [message,  setMessage] = useState('')
  const [showToken, setShowToken] = useState(false)

  async function handleTest() {
    if (!token.trim()) return
    setStatus('testing')
    setToken(token)
    const result = await testToken()
    setStatus(result.ok ? 'ok' : 'fail')
    setMessage(result.message)
    if (!result.ok) {
      // Clear bad token
      clearToken()
    }
  }

  function handleConfirm() {
    if (status !== 'ok') return
    setToken(token)
    onDone()
  }

  return (
    <div className="min-h-screen bg-warm-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Icon */}
        <div className="w-14 h-14 rounded-[18px] bg-terra/10 flex items-center justify-center mb-6">
          <KeyRound size={28} className="text-terra" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-warm-900 mb-2">처음 오셨군요</h1>
        <p className="text-warm-500 text-sm leading-relaxed mb-8">
          일정은 GitHub 레포지토리에 저장돼요.
          접근을 위해 GitHub Personal Access Token(PAT)이 필요해요.
          토큰은 이 기기에만 저장되고 외부로 전송되지 않아요.
        </p>

        {/* Steps */}
        <div className="bg-warm-50 rounded-2xl p-4 mb-6 space-y-3">
          <p className="text-xs font-bold text-warm-600 uppercase tracking-wide mb-1">토큰 발급 방법</p>
          {[
            'github.com → Settings → Developer settings',
            'Personal access tokens → Fine-grained tokens',
            'Generate new token 클릭',
            'Repository access → Only select repositories → daily_schedule',
            'Permissions → Contents: Read and Write',
            '생성 후 토큰 복사',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-terra/15 text-terra text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-warm-700">{step}</p>
            </div>
          ))}
          <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm font-semibold text-terra mt-2"
          >
            <ExternalLink size={13} />
            바로 발급하러 가기
          </a>
        </div>

        {/* Token input */}
        <div className="relative mb-3">
          <input
            type={showToken ? 'text' : 'password'}
            placeholder="github_pat_..."
            value={token}
            onChange={e => { setTokenVal(e.target.value); setStatus(null) }}
            className="w-full bg-warm-50 border-2 border-warm-200 focus:border-terra rounded-2xl
                       px-4 py-3.5 text-sm text-warm-900 placeholder-warm-300 outline-none
                       transition-colors pr-12 font-mono"
          />
          <button
            onClick={() => setShowToken(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400"
          >
            {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Status message */}
        {status === 'ok' && (
          <div className="flex items-center gap-2 text-sage text-sm font-semibold mb-3">
            <CheckCircle2 size={16} /> {message}
          </div>
        )}
        {status === 'fail' && (
          <div className="flex items-center gap-2 text-red-400 text-sm font-semibold mb-3">
            <XCircle size={16} /> {message}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={!token.trim() || status === 'testing'}
            className="flex-1 py-3.5 rounded-2xl border-2 border-terra text-terra font-bold text-[15px]
                       active:bg-terra/10 transition-colors disabled:opacity-40"
          >
            {status === 'testing' ? '확인 중…' : '연결 테스트'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={status !== 'ok'}
            className="flex-1 py-3.5 rounded-2xl bg-terra text-white font-bold text-[15px]
                       active:brightness-90 transition-all disabled:opacity-40"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  )
}
