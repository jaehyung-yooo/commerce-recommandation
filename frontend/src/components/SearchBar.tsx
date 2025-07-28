import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SearchBarProps {
  placeholder?: string
  className?: string
  value?: string
  onSearch?: (query: string) => void
}

interface SearchSuggestion {
  id: string
  text: string
  type: 'keyword' | 'product' | 'category'
}

function SearchBar({ 
  placeholder = "상품, 브랜드를 검색해보세요", 
  className = "",
  value = "",
  onSearch 
}: SearchBarProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // 실제로는 API에서 가져올 검색 제안 데이터
  const mockSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'iPhone 15', type: 'product' },
    { id: '2', text: 'iPhone 15 Pro', type: 'product' },
    { id: '3', text: 'iPhone 케이스', type: 'keyword' },
    { id: '4', text: 'MacBook', type: 'product' },
    { id: '5', text: 'Apple', type: 'category' },
    { id: '6', text: '전자기기', type: 'category' },
    { id: '7', text: '스마트폰', type: 'keyword' },
    { id: '8', text: '노트북', type: 'keyword' },
  ]

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)

    if (value.trim().length > 0) {
      // 실제로는 API를 호출하여 검색 제안을 가져옴
      const filteredSuggestions = mockSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filteredSuggestions.slice(0, 8))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch(query)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSearch(query)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      setSelectedIndex(-1)
      
      if (onSearch) {
        onSearch(searchQuery.trim())
      } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    handleSearch(suggestion.text)
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product':
        return '🏷️'
      case 'category':
        return '📁'
      case 'keyword':
        return '🔍'
      default:
        return '🔍'
    }
  }

  const getSuggestionLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product':
        return '상품'
      case 'category':
        return '카테고리'
      case 'keyword':
        return '검색어'
      default:
        return ''
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group ${
                index === selectedIndex ? 'bg-gray-50' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-3 text-lg">{getSuggestionIcon(suggestion.type)}</span>
                <div>
                  <span className="text-gray-900">{suggestion.text}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {getSuggestionLabel(suggestion.type)}
                  </span>
                </div>
              </div>
              <Search className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar 