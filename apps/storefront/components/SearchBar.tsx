'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchBarProps {
  categories: any[];
  theme: any;
}

export function SearchBar({ categories, theme }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !category) return;
    
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="flex w-full max-w-2xl items-center mx-4 rounded-xl overflow-hidden shadow-sm"
      style={{ border: `1px solid ${theme.borderColor}` }}
    >
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="px-3 py-2 outline-none h-10 border-r text-sm cursor-pointer"
        style={{ 
          backgroundColor: theme.surfaceColor, 
          color: theme.textColor,
          borderColor: theme.borderColor,
          flexShrink: 0
        }}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.nameEn}</option>
        ))}
      </select>
      
      <input
        type="text"
        placeholder="Search for products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow px-4 py-2 h-10 outline-none w-full"
        style={{ 
          backgroundColor: theme.backgroundColor, 
          color: theme.textColor 
        }}
      />
      
      <button
        type="submit"
        className="px-6 py-2 h-10 flex items-center justify-center hover:opacity-90 transition-opacity"
        style={{ 
          backgroundColor: theme.primaryColor,
          color: 'white',
          flexShrink: 0
        }}
        aria-label="Search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </form>
  );
}
