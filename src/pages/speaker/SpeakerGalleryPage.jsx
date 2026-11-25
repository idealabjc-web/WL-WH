import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Video,
  Download,
  Eye,
  X,
  RefreshCw,
  Calendar,
  Compass,
  Layers,
  FolderPlus,
  Play,
  Film,
  ChevronLeft,
  ChevronRight,
  Camera,
} from "lucide-react";
import { fetchGalleryItems } from "../../api/galleryApi";

const CATEGORIES = [
  { id: "all", label: "All Items", icon: Layers },
  { id: "day1", label: "Day 1", icon: Calendar },
  { id: "day2", label: "Day 2", icon: Calendar },
  { id: "day3_tour", label: "Day 3 Tour", icon: Compass },
  { id: "other", label: "Other / All Categories", icon: FolderPlus },
];

const matchesCategoryFilter = (itemCategory, targetId) => {
  if (targetId === "all") return true;
  if (targetId === "day3_tour") {
    return itemCategory === "day3_tour" || itemCategory === "day3" || itemCategory === "tour";
  }
  return itemCategory === targetId;
};

const getCategoryLabel = (catId) => {
  if (catId === "day3" || catId === "tour" || catId === "day3_tour") return "Day 3 Tour";
  return CATEGORIES.find((c) => c.id === catId)?.label || "Other";
};

export default function SpeakerGalleryPage({ eventSlug = "dubai", eventName = "Dubai", isDarkMode = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMediaType, setSelectedMediaType] = useState("all");
  const [previewIndex, setPreviewIndex] = useState(null);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const res = await fetchGalleryItems(eventSlug || "dubai");
      if (res.success) {
        setItems(res.data || []);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Speaker gallery load error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [eventSlug]);

  const filteredItems = items.filter((item) => {
    const matchesCat = matchesCategoryFilter(item.category, selectedCategory);
    const matchesType = selectedMediaType === "all" || item.media_type === selectedMediaType;
    return matchesCat && matchesType;
  });

  const currentPreviewItem = previewIndex !== null ? filteredItems[previewIndex] : null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (previewIndex === null) return;
      if (e.key === "Escape") setPreviewIndex(null);
      if (e.key === "ArrowLeft" && previewIndex > 0) setPreviewIndex(previewIndex - 1);
      if (e.key === "ArrowRight" && previewIndex < filteredItems.length - 1) setPreviewIndex(previewIndex + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, filteredItems.length]);

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header Banner */}
      <div className={`rounded-3xl p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDarkMode
          ? "bg-[#0A1233]/90 border-[#1E2A5A] text-white"
          : "bg-white border-slate-200 text-slate-900 shadow-sm"
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#4457F5]/20 text-[#8B9BFF] flex items-center justify-center border border-[#4457F5]/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span>Conference Gallery</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#4457F5]/20 text-[#8B9BFF] border border-[#4457F5]/30">
                  {eventName}
                </span>
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 ${isDarkMode ? "text-[#9AA5CC]" : "text-slate-500"}`}>
                Browse &amp; download official conference photos and videos from Day 1, Day 2, and Day 3 Tour.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadGallery}
          disabled={loading}
          className={`self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            isDarkMode
              ? "bg-[#050A1F] hover:bg-[#1E2A5A]/50 border-[#1E2A5A] text-[#B4BEE6]"
              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Category & Media Type Filters */}
      <div className={`rounded-2xl p-4 border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDarkMode
          ? "bg-[#0A1233]/70 border-[#1E2A5A]"
          : "bg-white border-slate-200 shadow-xs"
      }`}>
        {/* Day / Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count =
              cat.id === "all"
                ? items.length
                : items.filter((i) => matchesCategoryFilter(i.category, cat.id)).length;
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#4457F5] text-white shadow-md shadow-blue-600/25"
                    : isDarkMode
                    ? "bg-[#050A1F] text-[#9AA5CC] hover:text-white border border-[#1E2A5A]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive
                    ? "bg-white/20 text-white"
                    : isDarkMode
                    ? "bg-[#1E2A5A] text-[#B4BEE6]"
                    : "bg-white text-slate-700"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Media Type Filter */}
        <div className={`flex items-center gap-1.5 self-start lg:self-auto p-1 rounded-xl border ${
          isDarkMode ? "bg-[#050A1F] border-[#1E2A5A]" : "bg-slate-100 border-slate-200"
        }`}>
          {[
            { id: "all", label: "All Media", icon: null },
            { id: "photo", label: "Photos", icon: ImageIcon },
            { id: "video", label: "Videos", icon: Video },
          ].map((mt) => {
            const Icon = mt.icon;
            const isActive = selectedMediaType === mt.id;
            return (
              <button
                key={mt.id}
                type="button"
                onClick={() => setSelectedMediaType(mt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#4457F5] text-white"
                    : isDarkMode
                    ? "text-[#9AA5CC] hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{mt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-3xl border ${
          isDarkMode ? "bg-[#0A1233]/60 border-[#1E2A5A] text-[#9AA5CC]" : "bg-white border-slate-200 text-slate-500"
        }`}>
          <RefreshCw className="w-8 h-8 text-[#4457F5] animate-spin mb-3" />
          <p className="text-sm font-medium">Loading conference gallery...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 px-6 rounded-3xl border border-dashed text-center ${
          isDarkMode ? "bg-[#0A1233]/40 border-[#1E2A5A] text-[#9AA5CC]" : "bg-white border-slate-300 text-slate-500"
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-[#4457F5]/15 text-[#8B9BFF] flex items-center justify-center mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            No photos or videos available yet
          </h3>
          <p className="text-xs sm:text-sm max-w-md mt-1">
            Official conference photos and videos for Day 1, Day 2, and Day 3 Tour will appear here as soon as our media team uploads them.
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filteredItems.map((item, idx) => {
            const isVideo = item.media_type === "video";
            const catLabel = getCategoryLabel(item.category);

            return (
              <div
                key={item.id}
                onClick={() => setPreviewIndex(idx)}
                className={`break-inside-avoid group relative rounded-2xl overflow-hidden border cursor-pointer transition-all hover:scale-[1.01] mb-4 ${
                  isDarkMode
                    ? "bg-[#0A1233] border-[#1E2A5A] hover:border-[#4457F5]/70"
                    : "bg-white border-slate-200 hover:border-indigo-400 shadow-sm"
                }`}
              >
                <div className="relative bg-[#050A1F] overflow-hidden flex items-center justify-center">
                  {isVideo ? (
                    <div className="relative w-full aspect-video flex items-center justify-center bg-[#050A1F]">
                      <video
                        src={item.url}
                        preload="metadata"
                        className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-[#4457F5] text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 ml-0.5 fill-white" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-bold flex items-center gap-1">
                        <Film className="w-2.5 h-2.5 text-[#8B9BFF]" /> Video
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.caption || item.filename}
                      loading="lazy"
                      className="w-full h-auto max-h-[440px] object-contain bg-[#050A1F] group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  )}

                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#050A1F]/85 text-[#8B9BFF] border border-[#1E2A5A]">
                    {catLabel}
                  </span>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="p-2 rounded-full bg-white/90 text-slate-900 shadow">
                      <Eye className="w-4 h-4" />
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={item.filename}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-full bg-[#4457F5] text-white shadow hover:bg-[#3446d8]"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="p-3">
                  <p className={`text-xs font-semibold truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {item.caption || item.filename || catLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {previewIndex !== null && currentPreviewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between backdrop-blur-md"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-white">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#4457F5] text-white uppercase">
                {getCategoryLabel(currentPreviewItem.category)}
              </span>
              <span className="text-sm font-medium truncate max-w-xs sm:max-w-md">
                {currentPreviewItem.caption || currentPreviewItem.filename}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={currentPreviewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                download={currentPreviewItem.filename}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4457F5] hover:bg-[#3446d8] text-white text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="relative flex-1 flex items-center justify-center p-4 max-h-[82vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {previewIndex > 0 && (
              <button
                type="button"
                onClick={() => setPreviewIndex(previewIndex - 1)}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-transform hover:scale-110 z-10 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {currentPreviewItem.media_type === "video" ? (
              <video
                src={currentPreviewItem.url}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-xl shadow-2xl object-contain"
              />
            ) : (
              <img
                src={currentPreviewItem.url}
                alt={currentPreviewItem.caption || currentPreviewItem.filename}
                className="max-h-full max-w-full rounded-xl shadow-2xl object-contain"
              />
            )}

            {previewIndex < filteredItems.length - 1 && (
              <button
                type="button"
                onClick={() => setPreviewIndex(previewIndex + 1)}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-transform hover:scale-110 z-10 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div
            className="p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-xs text-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <span>
              {currentPreviewItem.created_at
                ? new Date(currentPreviewItem.created_at).toLocaleDateString()
                : ""}
            </span>
            <span>
              Item {previewIndex + 1} of {filteredItems.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
