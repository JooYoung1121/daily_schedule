import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { fetchCategories, saveCategories, DEFAULT_CATEGORIES } from '../github'

const Ctx = createContext(null)

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const shaRef = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { categories: data, sha } = await fetchCategories()
      setCategories(data)
      shaRef.current = sha
    } catch (err) {
      console.error('카테고리 불러오기 실패:', err)
    }
  }

  async function persist(next) {
    const prev = categories
    setCategories(next) // optimistic
    try {
      const newSha = await saveCategories(next, shaRef.current)
      shaRef.current = newSha
    } catch (err) {
      setCategories(prev)
      console.error('카테고리 저장 실패:', err)
      throw err
    }
  }

  const addCategory = useCallback(async (cat) => {
    const newCat = { ...cat, id: `cat_${Date.now()}` }
    await persist([...categories, newCat])
  }, [categories])

  const updateCategory = useCallback(async (id, updates) => {
    await persist(categories.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [categories])

  const deleteCategory = useCallback(async (id) => {
    await persist(categories.filter(c => c.id !== id))
  }, [categories])

  // Find a category by id, fallback to a neutral one
  const getCategory = useCallback((id) => {
    return categories.find(c => c.id === id)
      ?? { id, label: id, color: '#9B8E87' }
  }, [categories])

  return (
    <Ctx.Provider value={{ categories, addCategory, updateCategory, deleteCategory, getCategory }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCategories() {
  return useContext(Ctx)
}
