import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeAndSort, parseBabyTimeText } from '../src/data/babyTimeParser.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const dataPath = path.join(repoRoot, 'data', 'babytime.json')
const zipPaths = process.argv.slice(2)

if (!zipPaths.length) {
  console.error('사용법: npm run import:babytime -- <BabyTime 월별 zip> [...]')
  process.exit(1)
}

const FIELD_NAMES = [
  'startDate', 'startTime', 'endDate', 'endTime', 'type', 'durationMin',
  'amountMl', 'side', 'diaperType', 'diaperColor', 'temperature',
  'amountUnit', 'weaningFood', 'memo',
]

function normalizeRecord(record) {
  return Object.fromEntries(
    FIELD_NAMES.map(field => [field, record[field] ?? null]),
  )
}

function monthOf(record) {
  return record.startDate?.slice(0, 7) || null
}

const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
const incomingRecords = []
const replacedMonths = new Set()

for (const zipPath of zipPaths) {
  if (!fs.existsSync(zipPath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${zipPath}`)
  }

  const text = execFileSync('unzip', ['-p', zipPath, '*_asc.txt'], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
  const records = parseBabyTimeText(text)
  if (!records.length) {
    throw new Error(`파싱된 기록이 없습니다: ${zipPath}`)
  }

  records.forEach(record => {
    const month = monthOf(record)
    if (month) replacedMonths.add(month)
    incomingRecords.push(normalizeRecord(record))
  })
}

const preservedRecords = (currentData.records || [])
  .map(normalizeRecord)
  .filter(record => !replacedMonths.has(monthOf(record)))

const seen = new Set()
const mergedRecords = mergeAndSort([preservedRecords, incomingRecords])
  .filter(record => {
    const key = JSON.stringify(record)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

const nextData = {
  records: mergedRecords,
  updatedAt: new Date().toISOString(),
}

fs.writeFileSync(dataPath, `${JSON.stringify(nextData, null, 2)}\n`)

const weaningRecords = mergedRecords.filter(record => record.type === '이유식')
console.log(JSON.stringify({
  replacedMonths: [...replacedMonths].sort(),
  recordCount: mergedRecords.length,
  range: [
    mergedRecords[0]?.startDate || null,
    mergedRecords.at(-1)?.startDate || null,
  ],
  weaningRecords: weaningRecords.length,
  weaningRange: [
    weaningRecords[0]?.startDate || null,
    weaningRecords.at(-1)?.startDate || null,
  ],
}, null, 2))
