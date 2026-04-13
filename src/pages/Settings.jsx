import { useState } from 'react'
import { Github, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { testToken, getToken, clearToken } from '../github'
import CategoryManager from '../components/CategoryManager'

const ENV_HAS_TOKEN = !!(import.meta.env.VITE_GH_PAT)

export default function Settings() {
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showCatMgr, setShowCatMgr] = useState(false)

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
    <div className="flex flex-col bg-warm-100 overflow-hidden" style={{ height: '100%' }}>

      <div className="px-5 pt-8 pb-4 flex-shrink-0">
        <h1 className="text-[1.35rem] font-bold text-warm-900 tracking-tight">설정</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-28 space-y-6">

        {/* GitHub 연결 */}
        <section>
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">GitHub 연결</p>
          <div className="bg-warm-50 rounded-2xl divide-y divide-warm-200 shadow-warm-sm">

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
                    ? testResult.ok
                      ? <CheckCircle2 size={13} className="text-sage" />
                      : <XCircle size={13} className="text-red-400" />
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

        {/* 카테고리 */}
        <section>
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">카테고리</p>
          <div className="bg-warm-50 rounded-2xl shadow-warm-sm">
            <button
              onClick={() => setShowCatMgr(true)}
              className="w-full px-4 py-3.5 flex items-center justify-between active:bg-warm-100 rounded-2xl transition-colors"
            >
              <p className="text-[13px] font-semibold text-warm-800">카테고리 관리</p>
              <span className="text-[12px] text-warm-400">추가·수정·삭제 →</span>
            </button>
          </div>
        </section>

        {/* 앱 정보 */}
        <section>
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">앱 정보</p>
          <div className="bg-warm-50 rounded-2xl divide-y divide-warm-200 shadow-warm-sm">
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

      {showCatMgr && <CategoryManager onClose={() => setShowCatMgr(false)} />}
    </div>
  )
}
