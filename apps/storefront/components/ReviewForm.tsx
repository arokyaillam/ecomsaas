'use client';

import { useState } from 'react';
import { Star, Upload, X } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  onSubmit: (review: ReviewData) => void;
  onCancel: () => void;
}

export interface ReviewData {
  rating: number;
  title: string;
  content: string;
  images: string[];
}

export function ReviewForm({ productId, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Use relative URL for client-side (proxied via Next.js rewrites)
  const API_URL = '';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const token = localStorage.getItem('customer_token');
        const res = await fetch(`${API_URL}/api/upload/image`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newImages.push(data.data.url);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setImages([...images, ...newImages]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a review title');
      return;
    }

    if (!content.trim()) {
      setError('Please enter review content');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('customer_token');
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          content: content.trim(),
          images: images.join(','),
        }),
      });

      if (res.ok) {
        onSubmit({ rating, title, content, images });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-[var(--border)] bg-white/5 mb-8">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'opacity-30'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors"
          maxLength={100}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Review</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell us what you liked or didn't like about this product"
          rows={4}
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors resize-none"
          maxLength={2000}
        />
        <p className="text-xs opacity-60 mt-1">{content.length}/2000 characters</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Photos (optional)</label>
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-20 h-20">
              <img
                src={img}
                alt={`Review ${idx + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors">
            <Upload className="w-5 h-5 opacity-60" />
            <span className="text-xs opacity-60 mt-1">{uploading ? '...' : 'Add'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg font-medium border border-[var(--border)] hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
