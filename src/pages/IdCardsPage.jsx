import React, { useState } from "react";
import JSZip from "jszip";
import {
    Download, RefreshCw, FileArchive, Search, Sparkles, CheckCircle2,
    Eye, X, AlertTriangle, ExternalLink
} from "lucide-react";
import { generateIdCardJpeg } from "../utils/idCardGenerator";
import { inputCls } from "../components/common/UIAtoms";

export default function IdCardsPage({
    speakers = [],
    cards: externalCards,
    setCards: externalSetCards,
    toast,
}) {
    // Cache map: { [speakerId]: { id, speaker, dataUrl, blob, filename } }
    const [internalCards, setInternalCards] = useState({});
    const cards = externalCards !== undefined ? externalCards : internalCards;
    const setCards = externalSetCards || setInternalCards;
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(null);
    const [zipping, setZipping] = useState(false);
    const [search, setSearch] = useState("");
    const [previewCard, setPreviewCard] = useState(null);

    const totalSpeakers = speakers.length;
    const generatedCount = Object.keys(cards).length;

    // Generate ID Cards for all speakers (skips already generated ones unless force = true)
    const handleGenerateCards = async (force = false) => {
        if (totalSpeakers === 0) {
            toast("No registered speakers found to generate cards.");
            return;
        }

        // Find speakers that haven't been generated yet (or all if force)
        const targetSpeakers = force ? speakers : speakers.filter((s) => !cards[s.id]);

        if (targetSpeakers.length === 0) {
            toast("All speaker ID cards have already been generated. Click 'Regenerate All' to refresh with QR codes.");
            return;
        }

        setGenerating(true);
        const updated = force ? {} : { ...cards };
        let done = 0;

        for (const s of targetSpeakers) {
            setProgress(`Generating ${done + 1} of ${targetSpeakers.length}: ${s.name}...`);
            try {
                const card = await generateIdCardJpeg(s);
                updated[s.id] = card;
            } catch (err) {
                console.error("Failed to generate card for", s.name, err);
            }
            done++;
        }

        setCards(updated);
        setGenerating(false);
        setProgress(null);
        toast(`Successfully generated ${targetSpeakers.length} ID card(s) with QR codes.`);
    };

    // Bundle all generated JPEG cards into a single ZIP file and trigger automatic download
    const handleDownloadZip = async () => {
        let currentCards = { ...cards };

        // If no cards generated yet, prompt user or auto-generate first
        if (Object.keys(currentCards).length === 0) {
            if (totalSpeakers === 0) {
                toast("No speakers available to generate ID cards.");
                return;
            }
            // Auto generate first
            toast("Generating ID cards first...");
            setGenerating(true);
            let done = 0;
            for (const s of speakers) {
                setProgress(`Generating ${done + 1} of ${speakers.length}: ${s.name}...`);
                const card = await generateIdCardJpeg(s);
                currentCards[s.id] = card;
                done++;
            }
            setCards(currentCards);
            setGenerating(false);
            setProgress(null);
        }

        setZipping(true);
        try {
            const zip = new JSZip();
            const cardList = Object.values(currentCards);

            // Add every JPEG image to the zip
            cardList.forEach((c) => {
                zip.file(c.filename, c.blob);
            });

            // Generate ZIP file
            const zipBlob = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 },
            });

            // Trigger browser download
            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipBlob);
            link.download = `WL-WH-2025-Speaker-ID-Cards-${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            toast(`Downloaded ZIP with ${cardList.length} JPEG ID card(s).`);
        } catch (err) {
            console.error("ZIP creation failed:", err);
            toast("Failed to build ZIP file. Please try again.");
        } finally {
            setZipping(false);
        }
    };

    // Download a single card as a JPEG
    const downloadSingleCard = (card) => {
        const link = document.createElement("a");
        link.href = card.dataUrl;
        link.download = card.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast(`Downloaded ${card.filename}`);
    };

    // Filter speakers for gallery display
    const filteredSpeakers = speakers.filter((s) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
            s.name.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q) ||
            (s.sessionTitle || "").toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6">
            {/* Top Operations Action Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Speaker ID Cards</h2>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                Official Template + QR Code
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Generate official printable JPEG badges with scannable on-site check-in QR codes, partner logos, and speaker photos.
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-600">
                            <span>Registered Speakers: <strong className="text-slate-900">{totalSpeakers}</strong></span>
                            <span>•</span>
                            <span>Generated Badges: <strong className="text-teal-700">{generatedCount} of {totalSpeakers}</strong></span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={() => handleGenerateCards(false)}
                            disabled={generating || zipping || totalSpeakers === 0}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 min-h-[44px]"
                        >
                            <Sparkles size={16} className={generating ? "animate-spin" : ""} />
                            {generating ? "Generating Badges..." : "Generate ID Cards"}
                        </button>

                        {generatedCount > 0 && (
                            <button
                                onClick={() => handleGenerateCards(true)}
                                disabled={generating || zipping}
                                title="Regenerate all ID cards with QR codes"
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-semibold text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 transition-all active:scale-95 min-h-[44px]"
                            >
                                <RefreshCw size={15} className={generating ? "animate-spin" : ""} />
                                Regenerate All
                            </button>
                        )}

                        <button
                            onClick={handleDownloadZip}
                            disabled={zipping || generating || totalSpeakers === 0}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 min-h-[44px]"
                        >
                            <FileArchive size={16} />
                            {zipping ? "Creating ZIP..." : "Generate & Download ZIP"}
                        </button>
                    </div>
                </div>

                {/* Live Progress Bar */}
                {progress && (
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-amber-500 rounded-full animate-spin shrink-0"></div>
                        <span className="text-xs sm:text-sm text-slate-700 font-medium">{progress}</span>
                    </div>
                )}
            </div>

            {/* Gallery Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">ID Cards Gallery</h3>
                        <span className="text-xs text-slate-500">Every card exports as high-res JPEG image</span>
                    </div>

                    {/* Search filter */}
                    <div className="relative sm:w-72">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            className={`${inputCls} pl-9 mb-0 text-xs sm:text-sm`}
                            placeholder="Filter by name, badge ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {filteredSpeakers.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-sm">
                        No registered speakers found matching your search.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredSpeakers.map((s) => {
                            const card = cards[s.id];
                            return (
                                <div
                                    key={s.id}
                                    className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 flex flex-col justify-between hover:border-amber-400/60 hover:shadow-md transition-all group"
                                >
                                    {/* Badge Thumbnail / Preview */}
                                    <div className="relative aspect-[3/5] rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-xs flex items-center justify-center mb-3">
                                        {card ? (
                                            <>
                                                <img
                                                    src={card.dataUrl}
                                                    alt={`ID Badge - ${s.name}`}
                                                    className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
                                                    onClick={() => setPreviewCard(card)}
                                                />
                                                <button
                                                    onClick={() => setPreviewCard(card)}
                                                    className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Preview Full Size"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="p-4 text-center">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-400 font-bold text-sm mb-2">
                                                    ID
                                                </div>
                                                <div className="text-xs font-semibold text-slate-600 mb-1">{s.name}</div>
                                                <div className="text-[11px] text-slate-400 font-mono mb-3">{s.id}</div>
                                                <button
                                                    onClick={async () => {
                                                        const generated = await generateIdCardJpeg(s);
                                                        setCards((prev) => ({ ...prev, [s.id]: generated }));
                                                        toast(`Generated badge for ${s.name}`);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all"
                                                >
                                                    <Sparkles size={12} /> Generate
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Metadata & Actions */}
                                    <div className="pt-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-bold text-sm text-slate-900 truncate" title={s.name}>
                                                {s.name}
                                            </div>
                                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                                                {s.id}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate mt-0.5">
                                            {s.sessionTitle || "Speaker"}
                                        </div>

                                        {/* Download button for single JPEG */}
                                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                                            {card ? (
                                                <button
                                                    onClick={() => downloadSingleCard(card)}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border border-slate-300 hover:border-amber-400 hover:bg-amber-50 text-slate-800 transition-colors"
                                                >
                                                    <Download size={13} /> Download JPEG
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Not yet generated</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal for full-size inspection */}
            {previewCard && (
                <div
                    onClick={() => setPreviewCard(null)}
                    className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-200"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative flex flex-col items-center max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            onClick={() => setPreviewCard(null)}
                            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="font-bold text-base text-slate-900 mb-1">
                            {previewCard.speaker.name} · Official ID Badge
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 font-mono">
                            {previewCard.filename} (JPEG 600×1000)
                        </p>

                        <div className="w-full max-w-[340px] rounded-xl overflow-hidden border border-slate-200 shadow-lg">
                            <img src={previewCard.dataUrl} alt={previewCard.filename} className="w-full h-auto" />
                        </div>

                        <div className="flex gap-2.5 mt-5 w-full max-w-[340px]">
                            <button
                                onClick={() => downloadSingleCard(previewCard)}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-2.5 rounded-xl shadow-xs transition-colors"
                            >
                                <Download size={16} /> Download JPEG
                            </button>
                            <button
                                onClick={() => setPreviewCard(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
