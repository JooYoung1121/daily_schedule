import { useState } from 'react'
import { X, Github, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { testToken, getToken, clearToken, hasToken } from '../github'

const ENV_HAS_TOKEN = !!(import.meta.env.VITE_GH_PAT)

export default function SettingsModal({ onClose }) {
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState(null)

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    const result = await testToken()
    setTestResult(result)
    setTesting(false)
  }

  function handleResetToken() {
    if (!window.confirm('토큰을 초기화하면 앱을 다시 설정해야 해요. 계속할까요?')) return
    clearToken()
    window.location.reload()
  }

  const tokenMasked = (() => {
    const t = getToken()
    if (!t) return '없음'
    return t.slice(0, 8) + '••••••••••••••••'
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-[680px] mx-auto bg-warm-50 rounded-t-[28px] shadow-warm-lg animate-slide-up">
        <div className="flex justify-center pt-3">
          <div className="w-9 h-1 rounded-full bg-warm-300" />
        </div>

        <div className="px-5 pt-3 pb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-warm-900">설정</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 active:bg-warm-200 transition-colors">
            <X size={15} className="text-warm-600" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>

          {/* GitHub 연결 */}
          <section>
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">GitHub 연결</p>
            <div className="bg-warm-100 rounded-2xl divide-y divide-warm-200">

              <div className="px-4 py-3.5 flex items-center gap-3">
                <Github size={17} className="text-warm-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-warm-800">JooYoung1121 / daily_schedule</p>
                  <p className="text-[11px] text-warm-400 mt-0.5 truncate">토큰: {tokenMasked}</p>
                </div>
                {ENV_HAS_TOKEN && (
                  <span className="text-[11px] font-semibold text-sage bg-sage/10 px-2 py-0.5 rounded-full flex-shrink-0">빌드 내장</span>
                )}
              </div>

              <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-warm-800">연결 상태 확인</p>
                  {testResult && (
                    <p className={`text-[12px] mt-0.5 font-medium ${testResult.ok ? 'text-sage' : 'text-red-400'}`}>
                      {testResult.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-warm-200 active:bg-warm-300 transition-colors text-[13px] font-semibold text-warm-700 disabled:opacity-50"
                >
                  {testing
                    ? <RefreshCw size={13} className="animate-spin" />
                    : testResult
                      ? testResult.ok ? <CheckCircle2 size={13} className="text-sage" /> : <XCircle size={13} className="text-red-400" />
                      : <RefreshCw size={13} />
                  }
                  {testing ? '확인 중…' : '테스트'}
                </button>
              </div>

              {!ENV_HAS_TOKEN && (
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-warm-800">토큰 재설정</p>
                  <button
                    onClick={handleResetToken}
                    className="px-3.5 py-2 rounded-xl bg-red-50 active:bg-red-100 transition-colors text-[13px] font-semibold text-red-400"
                  >
                    초기화
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 앱 정보 */}
          <section>
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">앱 정보</p>
            <div className="bg-warm-100 rounded-2xl divide-y divide-warm-200">
              <div className="px-4 py-3.5 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-warm-800">버전</p>
                <p className="text-[13px] text-warm-400">0.1.0</p>
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-warm-800">데이터 저장소</p>
                <p className="text-[13px] text-warm-400">GitHub API</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
