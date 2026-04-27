import { useState, useRef } from 'react'
import { Github, CheckCircle2, XCircle, RefreshCw, Download, Upload, Sun, Moon, Monitor } from 'lucide-react'
import {
  testToken, getToken, clearToken,
  fetchSchedules, fetchCategories, fetchSettings, fetchBabyTimeData,
  saveSchedules, saveCategories, saveSettings, saveBabyTimeData,
} from '../github'
import CategoryManager from '../components/CategoryManager'
import { useTheme } from '../context/ThemeContext'

const BACKUP_VERSION = 1

const THEME_OPTIONS = [
  { id: 'light',  label: '라이트', icon: Sun },
  { id: 'dark',   label: '다크',   icon: Moon },
  { id: 'system', label: '시스템', icon: Monitor },
]

const ENV_HAS_TOKEN = !!(import.meta.env.VITE_GH_PAT)

export default function Settings() {
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showCatMgr, setShowCatMgr] = useState(false)
  const [backupBusy, setBackupBusy] = useState(null)   // 'export' | 'import' | null
  const [backupMsg,  setBackupMsg]  = useState(null)   // { ok, text }
  const fileRef = useRef(null)
  const { theme, setTheme } = useTheme()

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

  async function handleExport() {
    setBackupBusy('export')
    setBackupMsg(null)
    try {
      const [{ schedules }, { categories }, { settings }, { babyData }] = await Promise.all([
        fetchSchedules(),
        fetchCategories(),
        fetchSettings(),
        fetchBabyTimeData().catch(() => ({ babyData: null })),
      ])
      const payload = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        schedules, categories, settings, babytime: babyData,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `daily_schedule_backup_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setBackupMsg({ ok: true, text: '백업 파일을 다운로드했어요.' })
    } catch (e) {
      setBackupMsg({ ok: false, text: `내보내기 실패: ${e.message}` })
    } finally {
      setBackupBusy(null)
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBackupBusy('import')
    setBackupMsg(null)
    try {
      const text    = await file.text()
      const payload = JSON.parse(text)
      if (!payload || typeof payload !== 'object') throw new Error('잘못된 파일 형식')
      if (payload.version !== BACKUP_VERSION)       throw new Error(`지원하지 않는 버전: ${payload.version}`)

      const ok = window.confirm(
        '현재 GitHub의 모든 데이터를 이 파일로 덮어쓸게요. 되돌릴 수 없어요. 계속할까요?\n\n' +
        `· 일정 ${payload.schedules?.length ?? 0}개\n` +
        `· 카테고리 ${payload.categories?.length ?? 0}개\n` +
        `· BabyTime 레코드 ${payload.babytime?.records?.length ?? 0}개`
      )
      if (!ok) { setBackupBusy(null); return }

      // 최신 sha 새로 받아서 conflict 회피
      const [s, c, st, b] = await Promise.all([
        fetchSchedules(),
        fetchCategories(),
        fetchSettings(),
        fetchBabyTimeData().catch(() => ({ babyData: null, sha: null })),
      ])

      const tasks = []
      if (Array.isArray(payload.schedules))                tasks.push(saveSchedules(payload.schedules, s.sha))
      if (Array.isArray(payload.categories))               tasks.push(saveCategories(payload.categories, c.sha))
      if (payload.settings && typeof payload.settings === 'object')
        tasks.push(saveSettings(payload.settings, st.sha))
      if (payload.babytime && typeof payload.babytime === 'object')
        tasks.push(saveBabyTimeData(payload.babytime, b.sha))

      await Promise.all(tasks)
      setBackupMsg({ ok: true, text: '복원 완료. 새로고침하면 적용돼요.' })
    } catch (err) {
      setBackupMsg({ ok: false, text: `복원 실패: ${err.message}` })
    } finally {
      setBackupBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
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

        {/* 테마 */}
        <section>
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">테마</p>
          <div className="bg-warm-50 rounded-2xl shadow-warm-sm p-2 flex gap-1">
            {THEME_OPTIONS.map(opt => {
              const Icon = opt.icon
              const active = theme === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all active:scale-95"
                  style={{
                    background: active ? '#D4715A' : 'transparent',
                    color:      active ? '#fff'    : 'rgb(var(--color-warm-500))',
                  }}
                >
                  <Icon size={16} />
                  <span className="text-[12px] font-semibold">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </section>

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

        {/* 데이터 백업 */}
        <section>
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">데이터 백업</p>
          <div className="bg-warm-50 rounded-2xl divide-y divide-warm-200 shadow-warm-sm">
            <div className="px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-warm-800">전체 데이터 내보내기</p>
                <p className="text-[11px] text-warm-400 mt-0.5">일정·카테고리·설정·BabyTime 묶음 JSON</p>
              </div>
              <button
                onClick={handleExport}
                disabled={!!backupBusy}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-warm-200 active:bg-warm-300 transition-colors text-[13px] font-semibold text-warm-700 disabled:opacity-50 flex-shrink-0"
              >
                {backupBusy === 'export'
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <Download size={13} />}
                내보내기
              </button>
            </div>

            <div className="px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-warm-800">백업에서 복원</p>
                <p className="text-[11px] text-warm-400 mt-0.5">현재 데이터를 덮어씁니다 (확인 후 진행)</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={!!backupBusy}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-warm-200 active:bg-warm-300 transition-colors text-[13px] font-semibold text-warm-700 disabled:opacity-50 flex-shrink-0"
              >
                {backupBusy === 'import'
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <Upload size={13} />}
                복원
              </button>
            </div>

            {backupMsg && (
              <div
                className="px-4 py-2.5 text-[12px] font-medium"
                style={{ color: backupMsg.ok ? '#5E9E8A' : '#E07B6A' }}
              >
                {backupMsg.text}
              </div>
            )}
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
