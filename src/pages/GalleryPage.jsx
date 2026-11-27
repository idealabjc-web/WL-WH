import React, { useState, useEffect, useRef } from "react";
import {
  Image,
  Video,
  Upload,
  FolderPlus,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  Compass,
  Layers,
  Play,
  Film,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";
import {
  fetchGalleryItems,
  uploadGalleryMedia,
  deleteGalleryMedia,
} from "../api/galleryApi";

const CATEGORIES = [
  { id: "all", label: "All Items", icon: Layers, color: "bg-slate-100 text-slate-700" },
  { id: "day1", label: "Day 1", icon: Calendar, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "day2", label: "Day 2", icon: Calendar, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "day3_tour", label: "Day 3 Tour", icon: Compass, color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "other", label: "Other / All Categories", icon: FolderPlus, color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const matchesCategoryFilter = (itemCategory, targetId) => {
  if (targetId === "all") return true;
  if (targetId === "day3_tour") {
    return itemCategory === "day3_tour" || itemCategory === "day3" || itemCategory === "tour";
  }
  return itemCategory === targetId;
};

const getCategoryObj = (catId) => {
  if (catId === "day3" || catId === "tour" || catId === "day3_tour") {
    return CATEGORIES.find((c) => c.id === "day3_tour");
  }
  return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
};

const UPLOAD_CATEGORIES = CATEGORIES.filter((c) => c.id !== "all");
const MAX_UPLOAD_FILES = 3;

export default function GalleryPage({ currentEvent = { slug: "dubai", name: "Dubai" }, userEmail = "", toast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMediaType, setSelectedMediaType] = useState("all"); // 'all' | 'photo' | 'video'

  const showToast = (msg) => {
    if (typeof toast === "function") {
      toast(msg);
    }
  };
  
  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("day1");
  const [uploadMediaType, setUploadMediaType] = useState("photo"); // 'photo' | 'video'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadLimitError, setUploadLimitError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, currentFilename: "" });
  const fileInputRef = useRef(null);

  // Lightbox Preview State
  const [previewIndex, setPreviewIndex] = useState(null);

  // Load items on mount and when event changes
  useEffect(() => {
    loadGallery();
  }, [currentEvent?.slug]);

  const loadGallery = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchGalleryItems(currentEvent?.slug || "dubai");
      if (result.success) {
        setItems(result.data || []);
      } else {
        setItems([]);
        setLoadError(result.error || "Could not load gallery items.");
        showToast("Gallery notice: " + result.error);
      }
    } catch (err) {
      setItems([]);
      setLoadError(err?.message || "Unexpected error loading gallery.");
      showToast("Gallery error: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = matchesCategoryFilter(item.category, selectedCategory);
    const matchesType = selectedMediaType === "all" || item.media_type === selectedMediaType;
    return matchesCategory && matchesType;
  });

  // Handle File Selection (strictly limited to MAX_UPLOAD_FILES at once)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    // Reset input value so the same file(s) can be re-selected cleanly
    e.target.value = "";
    if (!files.length) return;

    setUploadLimitError("");

    // Filter by selected media type
    const validFiles = files.filter((file) => {
      if (uploadMediaType === "photo") {
        return file.type.startsWith("image/");
      } else {
        return file.type.startsWith("video/");
      }
    });

    if (validFiles.length < files.length) {
      showToast(
        `Skipped ${files.length - validFiles.length} file(s) that were not ${uploadMediaType === "photo" ? "images" : "videos"}.`
      );
    }

    if (!validFiles.length) return;

    const remainingSlots = MAX_UPLOAD_FILES - selectedFiles.length;
    if (remainingSlots <= 0) {
      const msg = `Maximum ${MAX_UPLOAD_FILES} ${uploadMediaType === "photo" ? "images" : "videos"} allowed at once. Bulk/multiple uploads beyond ${MAX_UPLOAD_FILES} are not allowed.`;
      setUploadLimitError(msg);
      showToast(msg);
      return;
    }

    if (validFiles.length > remainingSlots) {
      const msg = `You can only upload up to ${MAX_UPLOAD_FILES} ${uploadMediaType === "photo" ? "images" : "videos"} at once. You selected ${validFiles.length}, but only ${remainingSlots} slot(s) remaining.`;
      setUploadLimitError(msg);
      showToast(msg);
      return;
    }

    // Attach local preview object URLs for UI display
    const newFilesWithPreview = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      previewUrl: uploadMediaType === "photo" ? URL.createObjectURL(file) : null,
      sizeFormatted: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    }));

    setSelectedFiles((prev) => [...prev, ...newFilesWithPreview]);
  };

  const removeSelectedFile = (id) => {
    setUploadLimitError("");
    setSelectedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearSelectedFiles = () => {
    selectedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setSelectedFiles([]);
    setUploadLimitError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Perform Upload (max 3 files per batch, no concurrent multiple uploads)
  const handleBatchUpload = async () => {
    if (isUploading) return;
    if (!selectedFiles.length) {
      showToast("Please select at least one file to upload.");
      return;
    }
    if (selectedFiles.length > MAX_UPLOAD_FILES) {
      const msg = `Maximum ${MAX_UPLOAD_FILES} files allowed at once.`;
      setUploadLimitError(msg);
      showToast(msg);
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length, currentFilename: "" });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      setUploadProgress({
        current: i + 1,
        total: selectedFiles.length,
        currentFilename: item.file.name,
      });

      const res = await uploadGalleryMedia({
        file: item.file,
        eventSlug: currentEvent?.slug || "dubai",
        category: uploadCategory,
        mediaType: uploadMediaType,
        caption: item.file.name.replace(/\.[^/.]+$/, ""),
        userEmail: userEmail || "staff@wlwh.org",
      });

      if (res.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to upload ${item.file.name}:`, res.error);
      }
    }

    setIsUploading(false);
    clearSelectedFiles();
    setIsUploadOpen(false);

    if (failCount === 0) {
      showToast(`Successfully uploaded ${successCount} ${uploadMediaType}(s) to ${uploadCategory.toUpperCase()}!`);
    } else {
      showToast(`Uploaded ${successCount} files, but ${failCount} failed.`);
    }

    // Refresh media list
    loadGallery();
  };

  // Delete item handler
  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.filename}"?`)) return;

    const res = await deleteGalleryMedia(item.id, item.storage_path);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast("Media deleted successfully.");
      if (previewIndex !== null) setPreviewIndex(null);
    } else {
      showToast("Failed to delete media: " + res.error);
    }
  };

  // Lightbox navigation
  const currentPreviewItem = previewIndex !== null ? filteredItems[previewIndex] : null;

  const handlePrevPreview = () => {
    if (previewIndex > 0) setPreviewIndex(previewIndex - 1);
  };

  const handleNextPreview = () => {
    if (previewIndex < filteredItems.length - 1) setPreviewIndex(previewIndex + 1);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (previewIndex === null) return;
      if (e.key === "Escape") setPreviewIndex(null);
      if (e.key === "ArrowLeft") handlePrevPreview();
      if (e.key === "ArrowRight") handleNextPreview();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, filteredItems.length]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Conference Gallery</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-amber-100 text-amber-800">
              {currentEvent?.name || "Summit"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse and manage conference media organized by Day 1, Day 2, Day 3 Tour, and other highlights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadGallery}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh gallery"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => {
              clearSelectedFiles();
              setIsUploadOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-xl shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
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
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-slate-200/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Media Type Filter */}
        <div className="flex items-center gap-2 self-start lg:self-auto bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setSelectedMediaType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedMediaType === "all" ? "bg-amber-50 text-amber-700 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => setSelectedMediaType("photo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedMediaType === "photo" ? "bg-amber-50 text-amber-700 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>
          <button
            onClick={() => setSelectedMediaType("video")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedMediaType === "video" ? "bg-amber-50 text-amber-700 font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
        </div>
      </div>

      {/* Setup Notice if SQL table not yet created */}
      {loadError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Gallery Database Setup Needed</p>
            <p className="text-xs text-amber-800 mt-0.5">
              {loadError} — Please make sure you have executed the gallery SQL script in your Supabase SQL Editor to create the <code className="px-1 py-0.5 bg-amber-100 rounded">gallery</code> table and <code className="px-1 py-0.5 bg-amber-100 rounded">conference-gallery</code> bucket.
            </p>
          </div>
        </div>
      )}

      {/* Media Grid / Empty State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading conference gallery...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Image className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No media uploaded yet</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1 mb-5">
            {selectedCategory !== "all"
              ? `There are no media items under ${CATEGORIES.find((c) => c.id === selectedCategory)?.label}.`
              : "Conference photos and videos uploaded by staff will appear here."}
          </p>
          <button
            onClick={() => {
              clearSelectedFiles();
              setIsUploadOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Upload Now</span>
          </button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filteredItems.map((item, idx) => {
            const isVideo = item.media_type === "video";
            const categoryObj = getCategoryObj(item.category);

            return (
              <div
                key={item.id}
                className="break-inside-avoid group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col mb-4"
              >
                {/* Media Preview Box */}
                <div
                  className="relative bg-slate-950 cursor-pointer overflow-hidden flex items-center justify-center"
                  onClick={() => setPreviewIndex(idx)}
                >
                  {isVideo ? (
                    <div className="relative w-full aspect-video flex items-center justify-center bg-slate-950">
                      <video
                        src={item.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-semibold flex items-center gap-1">
                        <Film className="w-2.5 h-2.5 text-amber-400" /> Video
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.caption || item.filename}
                      className="w-full h-auto max-h-[440px] object-contain bg-slate-950 group-hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Top-Right Badges */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${categoryObj.color}`}>
                      {categoryObj.label}
                    </span>
                  </div>

                  {/* Hover Overlay Controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewIndex(idx);
                      }}
                      className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-sm transition-transform hover:scale-110"
                      title="View Fullscreen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={item.filename}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-sm transition-transform hover:scale-110"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="p-2 rounded-full bg-red-600/90 hover:bg-red-600 text-white shadow-sm transition-transform hover:scale-110"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Meta Footer */}
                <div className="p-3 flex flex-col justify-between flex-1 bg-white">
                  <p className="text-xs font-semibold text-slate-800 truncate" title={item.caption || item.filename}>
                    {item.caption || item.filename}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                    <span>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                      {item.file_size ? ` · ${(item.file_size / (1024 * 1024)).toFixed(1)} MB` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 hover:text-white hover:bg-red-600 bg-red-50 transition-colors cursor-pointer"
                      title="Delete this media item"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          UPLOAD MODAL (Batch upload with Tag & Type selection)
          ========================================================================= */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Upload Conference Media</h3>
                  <p className="text-xs text-slate-500">Add photos and videos to the conference gallery</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isUploading) {
                    clearSelectedFiles();
                    setIsUploadOpen(false);
                  }
                }}
                disabled={isUploading}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-5 max-h-[75vh] overflow-y-auto pr-1">
              {/* Step 1: Select Category Tag */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Step 1: Select Gallery Category Tag
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {UPLOAD_CATEGORIES.map((cat) => {
                    const isSelected = uploadCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setUploadCategory(cat.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-50/70 text-amber-900 font-bold ring-2 ring-amber-500/20"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-amber-600" : "text-slate-400"}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Media Type (Photo vs Video) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Step 2: Choose Upload Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (uploadMediaType !== "photo") {
                        clearSelectedFiles();
                        setUploadMediaType("photo");
                      }
                    }}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all ${
                      uploadMediaType === "photo"
                        ? "border-amber-500 bg-amber-50/70 text-amber-900 font-bold ring-2 ring-amber-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Image className="w-4 h-4 text-amber-500" />
                    <div className="text-left">
                      <p className="text-xs font-bold leading-tight">Photo Upload</p>
                      <p className="text-[10px] text-slate-500 font-normal">JPG, PNG, WebP, GIF</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (uploadMediaType !== "video") {
                        clearSelectedFiles();
                        setUploadMediaType("video");
                      }
                    }}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all ${
                      uploadMediaType === "video"
                        ? "border-amber-500 bg-amber-50/70 text-amber-900 font-bold ring-2 ring-amber-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Video className="w-4 h-4 text-amber-500" />
                    <div className="text-left">
                      <p className="text-xs font-bold leading-tight">Video Upload</p>
                      <p className="text-[10px] text-slate-500 font-normal">MP4, MOV, WebM</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 3: File Selector Dropzone (Max 3 files at once) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Step 3: Select Files to Upload
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Max {MAX_UPLOAD_FILES} at once ({selectedFiles.length}/{MAX_UPLOAD_FILES})
                  </span>
                </div>
                <div
                  onClick={() => {
                    if (isUploading) return;
                    if (selectedFiles.length >= MAX_UPLOAD_FILES) {
                      const msg = `Limit reached: maximum ${MAX_UPLOAD_FILES} ${uploadMediaType === "photo" ? "images" : "videos"} allowed at once.`;
                      setUploadLimitError(msg);
                      showToast(msg);
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    selectedFiles.length >= MAX_UPLOAD_FILES || isUploading
                      ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                      : "border-amber-300 hover:border-amber-500 bg-amber-50/20 hover:bg-amber-50/40 cursor-pointer"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    disabled={selectedFiles.length >= MAX_UPLOAD_FILES || isUploading}
                    accept={
                      uploadMediaType === "photo"
                        ? "image/*,.heic,.webp"
                        : "video/*,.mp4,.mov,.webm,.avi"
                    }
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-amber-100 flex items-center justify-center mx-auto mb-2 text-amber-600">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedFiles.length >= MAX_UPLOAD_FILES
                      ? `Maximum ${MAX_UPLOAD_FILES} ${uploadMediaType === "photo" ? "photos" : "videos"} selected`
                      : `Click to select up to ${MAX_UPLOAD_FILES} ${uploadMediaType === "photo" ? "photos" : "videos"} at once`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedFiles.length >= MAX_UPLOAD_FILES
                      ? "Remove a file below or click Upload to continue"
                      : `Limit: ${MAX_UPLOAD_FILES} files per upload · ${MAX_UPLOAD_FILES - selectedFiles.length} slot(s) remaining`}
                  </p>
                </div>

                {uploadLimitError && (
                  <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{uploadLimitError}</span>
                  </div>
                )}
              </div>

              {/* Selected Files List & Preview */}
              {selectedFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Selected Files ({selectedFiles.length} / {MAX_UPLOAD_FILES})
                    </span>
                    <button
                      type="button"
                      onClick={clearSelectedFiles}
                      className="text-[11px] text-red-500 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {selectedFiles.map((item) => (
                      <div
                        key={item.id}
                        className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white aspect-square flex flex-col items-center justify-center text-center p-1"
                      >
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-slate-600">
                            <Video className="w-6 h-6 text-amber-500 mb-1" />
                            <span className="text-[10px] truncate max-w-[80px]">
                              {item.file.name}
                            </span>
                          </div>
                        )}

                        <span className="absolute bottom-1 right-1 px-1 bg-black/60 text-[9px] text-white rounded">
                          {item.sizeFormatted}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeSelectedFile(item.id)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress Indicator */}
              {isUploading && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      Uploading ({uploadProgress.current}/{uploadProgress.total})...
                    </span>
                    <span>
                      {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-amber-800 truncate">
                    Uploading: {uploadProgress.currentFilename}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  clearSelectedFiles();
                  setIsUploadOpen(false);
                }}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {isUploading
                    ? "Uploading..."
                    : `Upload ${selectedFiles.length ? selectedFiles.length : ""} ${
                        uploadMediaType === "photo" ? "Photo(s)" : "Video(s)"
                      }`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULLSCREEN LIGHTBOX VIEWER
          ========================================================================= */}
      {previewIndex !== null && currentPreviewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-white">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-black uppercase">
                {getCategoryObj(currentPreviewItem.category)?.label || currentPreviewItem.category}
              </span>
              <span className="text-sm font-medium truncate max-w-md">
                {currentPreviewItem.caption || currentPreviewItem.filename}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={currentPreviewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                download={currentPreviewItem.filename}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => handleDelete(currentPreviewItem)}
                className="p-2 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Media Content */}
          <div
            className="relative flex-1 flex items-center justify-center p-4 max-h-[82vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {previewIndex > 0 && (
              <button
                onClick={handlePrevPreview}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-transform hover:scale-110 z-10"
                title="Previous (Left Arrow)"
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

            {/* Next Button */}
            {previewIndex < filteredItems.length - 1 && (
              <button
                onClick={handleNextPreview}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-transform hover:scale-110 z-10"
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div
            className="p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-xs text-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {currentPreviewItem.uploaded_by && (
                <span>Uploaded by: {currentPreviewItem.uploaded_by} · </span>
              )}
              {currentPreviewItem.created_at && (
                <span>{new Date(currentPreviewItem.created_at).toLocaleString()}</span>
              )}
            </div>
            <div>
              Item {previewIndex + 1} of {filteredItems.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
