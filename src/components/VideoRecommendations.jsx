import { useState, useEffect } from 'react';
import { Play, ExternalLink, Video, AlertCircle, Loader, Youtube, X } from 'lucide-react';
import api from '../lib/api';

export const VideoRecommendations = ({ exerciseName, level = 'all', compact = false }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    if (!exerciseName) return;

    let isMounted = true;
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/videos/search', {
          params: { exercise: exerciseName, level, limit: compact ? 3 : 6 }
        });
        if (isMounted) {
          setVideos(res.data?.videos || []);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load video recommendations', err);
          setError(err.response?.data?.error || 'Could not load videos');
          // Provide direct YouTube search fallback
          setVideos([
            {
              id: 'search-fallback',
              title: `Watch ${exerciseName} tutorials on YouTube`,
              channelTitle: 'YouTube Fitness',
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' proper form exercise tutorial')}`,
              thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
              isFallback: true,
            }
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVideos();

    return () => {
      isMounted = false;
    };
  }, [exerciseName, level, compact]);

  if (!exerciseName) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Youtube size={18} className="text-red-500" />
          <h3 className="font-bold text-sm text-gray-200">
            Form & Technique Videos: <span className="capitalize text-emerald-400">{exerciseName.replace(/_/g, ' ')}</span>
          </h3>
        </div>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' workout proper form')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          <span>More on YouTube</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-6 bg-gray-900/40 rounded-xl border border-gray-800">
          <Loader size={20} className="animate-spin text-emerald-400 mr-2" />
          <span className="text-xs text-gray-400">Finding best form tutorials...</span>
        </div>
      )}

      {error && !loading && (!videos || videos.length === 0) && (
        <div className="p-3 bg-red-950/20 border border-red-800/40 rounded-xl flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {videos.map((vid, idx) => (
            <div
              key={vid.id || idx}
              className="group bg-gray-900/60 hover:bg-gray-850 border border-gray-800 hover:border-emerald-500/40 rounded-xl overflow-hidden transition-all duration-200 flex flex-col cursor-pointer"
              onClick={() => {
                if (vid.isFallback || !vid.id || vid.id === 'search-fallback') {
                  window.open(vid.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName)}`, '_blank');
                } else {
                  setActiveVideo(vid);
                }
              }}
            >
              <div className="relative aspect-video w-full bg-gray-950 overflow-hidden">
                {vid.thumbnail ? (
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-600">
                    <Video size={32} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <div className="w-10 h-10 rounded-full bg-red-600 group-hover:bg-red-500 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Play size={18} className="text-white fill-white ml-0.5" />
                  </div>
                </div>
                {vid.duration && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-[10px] font-mono rounded text-gray-300">
                    {vid.duration}
                  </span>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-200 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {vid.title}
                  </h4>
                  {vid.channelTitle && (
                    <p className="text-[11px] text-gray-500 mt-1 truncate">
                      {vid.channelTitle}
                    </p>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="text-emerald-400 text-[10px] font-medium uppercase tracking-wider">
                    {vid.level || level || 'Tutorial'}
                  </span>
                  <span className="flex items-center gap-1 hover:text-white">
                    Watch <ExternalLink size={10} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal Player */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-bold text-sm text-gray-100 truncate pr-4">
                {activeVideo.title}
              </h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Close video player"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-3 bg-gray-950 flex items-center justify-between text-xs text-gray-400">
              <span>Channel: <strong className="text-gray-200">{activeVideo.channelTitle}</strong></span>
              <a
                href={activeVideo.url || `https://www.youtube.com/watch?v=${activeVideo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:underline"
              >
                Open directly on YouTube <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRecommendations;
