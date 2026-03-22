import React, { useState, useEffect } from 'react';
import { ExternalLink, Play, Globe, Loader2 } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
}

interface Metadata {
  title?: string;
  description?: string;
  image?: string;
  logo?: string;
  publisher?: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [isYouTube, setIsYouTube] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match) {
      setIsYouTube(true);
      setVideoId(match[1]);
    } else {
      setIsYouTube(false);
      setVideoId(null);
      fetchMetadata();
    }
  }, [url]);

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      // Using microlink.io as a free metadata provider
      const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data.status === 'success') {
        setMetadata({
          title: data.data.title,
          description: data.data.description,
          image: data.data.image?.url,
          logo: data.data.logo?.url,
          publisher: data.data.publisher
        });
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isYouTube && videoId) {
    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 group">
        <div className="relative aspect-video">
          <img 
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
            alt="YouTube Thumbnail"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
            <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Play size={24} fill="currentColor" />
            </div>
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute inset-0"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
            <Play size={14} className="text-red-500" />
            YouTube Video
          </div>
          <ExternalLink size={14} className="text-gray-400" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-4 block p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-indigo-500 shadow-sm">
            <Globe size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {url.replace(/^https?:\/\/(www\.)?/, '')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              Loading preview... <Loader2 size={10} className="animate-spin" />
            </p>
          </div>
        </div>
      </a>
    );
  }

  if (metadata) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-4 block rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group overflow-hidden"
      >
        {metadata.image && (
          <div className="aspect-[2/1] w-full overflow-hidden border-b border-gray-100 dark:border-gray-800">
            <img 
              src={metadata.image} 
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {metadata.logo ? (
              <img src={metadata.logo} alt="" className="w-4 h-4 rounded" referrerPolicy="no-referrer" />
            ) : (
              <Globe size={14} className="text-indigo-500" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
              {metadata.publisher || url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
            </span>
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {metadata.title}
          </h4>
          {metadata.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
              {metadata.description}
            </p>
          )}
        </div>
      </a>
    );
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="mt-4 block p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-indigo-500 shadow-sm">
          <Globe size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {url.replace(/^https?:\/\/(www\.)?/, '')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            Visit Website <ExternalLink size={10} />
          </p>
        </div>
      </div>
    </a>
  );
}
