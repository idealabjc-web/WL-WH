import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import {
    Download, RefreshCw, FileArchive, Search, Sparkles, CheckCircle2,
    Eye, X, AlertTriangle, ExternalLink, Cloud, Edit, CreditCard,
    FolderArchive, Filter, CheckSquare, Square, Layers, Printer,
    FileText, ArrowRight, FolderDown, Users, LayoutGrid
} from "lucide-react";
import { generateIdCardJpeg } from "../utils/idCardGenerator";
import {
    uploadIdCardToStorage,
    fetchStoredIdCards,
    getLocalCachedCards,
    saveLocalCachedCards,
} from "../api/idCardsStorage";
import { supabase } from "../supabaseClient";
import { inputCls } from "../components/common/UIAtoms";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import getCroppedImg from "../utils/cropUtils";

export default function IdCardsPage({
    speakers = [],
    cards: externalCards,
    setCards: externalSetCards,
    toast,
}) {
    // Cache map: { [speakerId]: { id, speaker, dataUrl, publicUrl, blob, filename, isStored } }
    const [internalCards, setInternalCards] = useState({});
    const cards = externalCards !== undefined ? externalCards : internalCards;
    const setCards = externalSetCards || setInternalCards;

    // Sub-tab navigation: 'cards' | 'downloads'
    const [activeSubTab, setActiveSubTab] = useState("cards");

    // Operations state
    const [generating, setGenerating] = useState(false);
    const [loadingCards, setLoadingCards] = useState(false);
    const [progress, setProgress] = useState(null);
    const [zipping, setZipping] = useState(false);

    // ID Cards Tab filter & search
    const [search, setSearch] = useState("");
    const [roomFilter, setRoomFilter] = useState("all");
    const [previewCard, setPreviewCard] = useState(null);

    // Crop state
    const [editingSpeaker, setEditingSpeaker] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [savingCrop, setSavingCrop] = useState(false);

    // Downloads Tab custom builder states
    const [customRoomFilter, setCustomRoomFilter] = useState("all");
    const [customDayFilter, setCustomDayFilter] = useState("all");
    const [customTagFilter, setCustomTagFilter] = useState("all");
    const [customStatusFilter, setCustomStatusFilter] = useState("all"); // 'all' | 'generated' | 'pending'
    const [customSearch, setCustomSearch] = useState("");
    const [customFormat, setCustomFormat] = useState("pdf-zip"); // 'pdf-zip' | 'single-pdf' | 'jpeg-zip'
    const [customOrganizeRooms, setCustomOrganizeRooms] = useState(true);
    const [selectedSpeakerIds, setSelectedSpeakerIds] = useState(() => new Set());

    // Room categorization helper
    const getRoomName = (s) => (s?.conferenceRoom || s?.conference_room || s?.room || "").trim();
    const getRoomCategory = (s) => {
        const r = getRoomName(s).toLowerCase();
        if (r.includes("room 1") || r === "1") return "Room 1";
        if (r.includes("room 2") || r === "2") return "Room 2";
        return "Other";
    };

    const totalSpeakers = speakers.length;
    const generatedCount = Object.keys(cards).length;
    const cloudCount = useMemo(() => {
        return Object.values(cards).filter((c) => c && (c.isStored || c.publicUrl)).length;
    }, [cards]);
    const pendingCount = Math.max(0, totalSpeakers - generatedCount);

    const room1Speakers = useMemo(() => speakers.filter((s) => getRoomCategory(s) === "Room 1"), [speakers]);
    const room2Speakers = useMemo(() => speakers.filter((s) => getRoomCategory(s) === "Room 2"), [speakers]);
    const otherSpeakers = useMemo(() => speakers.filter((s) => getRoomCategory(s) === "Other"), [speakers]);

    const availableDays = useMemo(() => {
        const set = new Set();
        speakers.forEach((s) => {
            const d = (s.day || s.sessionDay || "").trim();
            if (d) set.add(d);
        });
        return Array.from(set).sort();
    }, [speakers]);

    const availableTags = useMemo(() => {
        const set = new Set();
        speakers.forEach((s) => {
            const t = (s.speakerTag || s.speaker_tag || s.role || "").trim();
            if (t) set.add(t);
        });
        return Array.from(set).sort();
    }, [speakers]);

    // Special Download: Printing Works (19" × 13" Press Sheets) Constants & Memos
    const SPEAKERS_PER_PRINT_SHEET = 10;
    const totalPrintingSheets = Math.ceil(speakers.length / SPEAKERS_PER_PRINT_SHEET);

    const printingSheets = useMemo(() => {
        const list = [];
        for (let i = 0; i < totalPrintingSheets; i++) {
            const start = i * SPEAKERS_PER_PRINT_SHEET;
            const end = Math.min(start + SPEAKERS_PER_PRINT_SHEET, speakers.length);
            list.push({
                index: i,
                sheetNumber: i + 1,
                speakers: speakers.slice(start, end),
                startNumber: start + 1,
                endNumber: end,
            });
        }
        return list;
    }, [speakers, totalPrintingSheets]);

    // Keep selection updated when speakers array loads
    useEffect(() => {
        if (speakers.length > 0 && selectedSpeakerIds.size === 0) {
            setSelectedSpeakerIds(new Set(speakers.map((s) => s.id)));
        }
    }, [speakers]);

    // 1. On Mount & Speakers Change: Load from cache and cloud, but do NOT auto-generate
    useEffect(() => {
        if (!speakers || speakers.length === 0) return;

        const initializeCards = async () => {
            const cached = getLocalCachedCards();
            const storedCards = await fetchStoredIdCards(speakers);
            const currentCards = { ...cached, ...storedCards };
            let hasNewGenerations = false;

            for (const s of speakers) {
                // If speaker has no card or has an old template card
                if (!currentCards[s.id] || currentCards[s.id].templateVersion !== "v12_speaker_tag") {
                    try {
                        const card = await generateIdCardJpeg(s);
                        currentCards[s.id] = card;
                        hasNewGenerations = true;
                    } catch (err) {
                        console.error("Auto card generation failed for", s.name, err);
                    }
                }
            }

            setCards(currentCards);
            if (Object.keys(storedCards).length > 0 || hasNewGenerations) {
                saveLocalCachedCards(currentCards);
            }
        };

        initializeCards();
    }, [speakers]);

    const handleLoadCards = async () => {
        if (totalSpeakers === 0) return;
        setLoadingCards(true);
        try {
            const storedCards = await fetchStoredIdCards(speakers);
            const currentCards = { ...cards };
            let count = 0;
            for (const s of speakers) {
                const stored = storedCards[s.id];
                if (stored && stored.templateVersion === "v12_speaker_tag") {
                    currentCards[s.id] = stored;
                } else if (!currentCards[s.id] || currentCards[s.id].templateVersion !== "v12_speaker_tag") {
                    try {
                        const card = await generateIdCardJpeg(s);
                        currentCards[s.id] = card;
                    } catch (err) {
                        console.error("Auto card generation failed for", s.name, err);
                    }
                }
                count++;
            }
            setCards(currentCards);
            saveLocalCachedCards(currentCards);
            if (toast) toast(`Loaded ID cards for ${count} speakers.`);
        } catch (e) {
            console.error("Failed to load cards:", e);
            if (toast) toast("Failed to load cards.");
        } finally {
            setLoadingCards(false);
        }
    };

    // 2. Generate and store single card to Supabase bucket
    const generateAndStoreSingleCard = async (speaker) => {
        if (toast) toast(`Generating badge for ${speaker.name}...`);
        try {
            const card = await generateIdCardJpeg(speaker);
            const uploadRes = await uploadIdCardToStorage(speaker, card.blob, card.filename);
            if (uploadRes.publicUrl) {
                card.publicUrl = uploadRes.publicUrl;
                card.isStored = true;
            }
            setCards((prev) => {
                const updated = { ...prev, [speaker.id]: card };
                saveLocalCachedCards(updated);
                return updated;
            });
            if (toast) toast(`Generated & stored ID badge for ${speaker.name}.`);
        } catch (err) {
            console.error("Single card generation failed:", err);
            if (toast) toast("Failed to generate ID badge.");
        }
    };

    // 3. Batch generate ID Cards for all speakers and save to Supabase Storage Bucket
    const handleGenerateCards = async (force = false) => {
        if (totalSpeakers === 0) {
            if (toast) toast("No registered speakers found to generate cards.");
            return;
        }

        const targetSpeakers = force ? speakers : speakers.filter((s) => !cards[s.id]);

        if (targetSpeakers.length === 0) {
            if (toast) toast("All speaker ID cards have already been generated. Click 'Regenerate All' to refresh.");
            return;
        }

        setGenerating(true);
        const updated = force ? {} : { ...cards };
        let done = 0;

        for (const s of targetSpeakers) {
            setProgress(`Generating & uploading ${done + 1} of ${targetSpeakers.length}: ${s.name}...`);
            try {
                const card = await generateIdCardJpeg(s);
                const uploadRes = await uploadIdCardToStorage(s, card.blob, card.filename);
                if (uploadRes.publicUrl) {
                    card.publicUrl = uploadRes.publicUrl;
                    card.isStored = true;
                }
                updated[s.id] = card;
            } catch (err) {
                console.error("Failed to generate card for", s.name, err);
            }
            done++;
        }

        setCards(updated);
        saveLocalCachedCards(updated);
        setGenerating(false);
        setProgress(null);
        if (toast) toast(`Successfully generated and stored ${targetSpeakers.length} ID card(s) in cloud bucket.`);
    };

    const handleEditCard = (speaker) => {
        setEditingSpeaker(speaker);
        if (speaker.idCardPosition) {
            setCrop(speaker.idCardPosition.crop || { x: 0, y: 0 });
            setZoom(speaker.idCardPosition.zoom || 1);
        } else {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        }
    };

    const handleSaveCrop = async () => {
        if (!editingSpeaker || !editingSpeaker.photoUrl) return;
        setSavingCrop(true);
        try {
            const croppedImgUrl = await getCroppedImg(editingSpeaker.photoUrl, croppedAreaPixels);

            // Generate new card with cropped image
            const updatedSpeaker = { ...editingSpeaker, croppedPhotoUrl: croppedImgUrl };
            const card = await generateIdCardJpeg(updatedSpeaker);

            // Upload to storage
            const uploadRes = await uploadIdCardToStorage(editingSpeaker, card.blob, card.filename);
            if (uploadRes.publicUrl) {
                card.publicUrl = uploadRes.publicUrl;
                card.isStored = true;
            }

            // Save position in DB
            const idCardPosition = { crop, zoom };
            await supabase.from("speakers").update({ id_card_position: idCardPosition }).eq("id", editingSpeaker.id);

            // Update local speaker obj
            editingSpeaker.idCardPosition = idCardPosition;

            // Update cards cache
            setCards((prev) => {
                const updated = { ...prev, [editingSpeaker.id]: card };
                saveLocalCachedCards(updated);
                return updated;
            });

            if (toast) toast(`ID Card saved successfully for ${editingSpeaker.name}.`);
            setEditingSpeaker(null);
        } catch (e) {
            console.error("Save crop error:", e);
            if (toast) toast("Failed to save ID Card.");
        } finally {
            setSavingCrop(false);
        }
    };

    // Card data URL extractor helper
    const getCardDataUrl = async (c) => {
        if (c.dataUrl) return c.dataUrl;
        if (c.publicUrl) {
            try {
                const res = await fetch(c.publicUrl);
                const blob = await res.blob();
                return await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.warn("Could not fetch card from publicUrl for", c.filename, e);
            }
        }
        if (c.blob) {
            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(c.blob);
            });
        }
        return null;
    };

    // Ensure all target speakers have generated cards before export
    const ensureCardsForSpeakers = async (targetSpeakers) => {
        let currentCards = { ...cards };
        const missing = targetSpeakers.filter((s) => !currentCards[s.id]);

        if (missing.length > 0) {
            setGenerating(true);
            let done = 0;
            for (const s of missing) {
                setProgress(`Generating ID badge ${done + 1} of ${missing.length}: ${s.name}...`);
                try {
                    const card = await generateIdCardJpeg(s);
                    const uploadRes = await uploadIdCardToStorage(s, card.blob, card.filename);
                    if (uploadRes.publicUrl) {
                        card.publicUrl = uploadRes.publicUrl;
                        card.isStored = true;
                    }
                    currentCards[s.id] = card;
                } catch (err) {
                    console.error("Failed to generate card for", s.name, err);
                }
                done++;
            }
            setCards(currentCards);
            saveLocalCachedCards(currentCards);
            setGenerating(false);
            setProgress(null);
        }
        return currentCards;
    };

    // 4. Master Batch Export Engine
    const handleBatchExport = async ({
        targetSpeakers,
        format = "pdf-zip", // 'pdf-zip' | 'single-pdf' | 'jpeg-zip'
        organizeByRooms = false,
        filenamePrefix = "WL-WH-2025-ID-Cards",
    }) => {
        if (!targetSpeakers || targetSpeakers.length === 0) {
            if (toast) toast("No speakers available to download.");
            return;
        }

        setZipping(true);
        setProgress(`Verifying ID cards for ${targetSpeakers.length} speaker(s)...`);

        try {
            const allCards = await ensureCardsForSpeakers(targetSpeakers);
            const cardList = targetSpeakers.map((s) => allCards[s.id]).filter(Boolean);

            if (cardList.length === 0) {
                if (toast) toast("No valid ID cards available to download.");
                setZipping(false);
                setProgress(null);
                return;
            }

            const timestamp = new Date().toISOString().slice(0, 10);

            // Format: Single Multi-Page PDF Document
            if (format === "single-pdf") {
                setProgress(`Compiling single PDF document for ${cardList.length} badge(s)...`);
                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "px",
                    format: [1080, 1800],
                });

                let firstPage = true;
                let current = 0;

                for (const c of cardList) {
                    current++;
                    setProgress(`Adding page ${current} of ${cardList.length}: ${c.speaker?.name || c.filename}...`);
                    const dataUrl = await getCardDataUrl(c);
                    if (dataUrl) {
                        if (!firstPage) {
                            pdf.addPage([1080, 1800], "portrait");
                        }
                        pdf.addImage(dataUrl, "JPEG", 0, 0, 1080, 1800);
                        firstPage = false;
                    }
                }

                pdf.save(`${filenamePrefix}_${timestamp}.pdf`);
                if (toast) toast(`Downloaded single PDF with ${cardList.length} ID card(s).`);
            } else {
                // Format: ZIP Archive (either PDFs or JPEGs)
                setProgress(`Building ZIP archive for ${cardList.length} badge(s)...`);
                const zip = new JSZip();

                let room1Folder, room2Folder, otherFolder;
                if (organizeByRooms) {
                    room1Folder = zip.folder("Room 1");
                    room2Folder = zip.folder("Room 2");
                    otherFolder = zip.folder("Other");
                }

                let doneCount = 0;
                for (const c of cardList) {
                    doneCount++;
                    setProgress(`Packaging card ${doneCount} of ${cardList.length}: ${c.speaker?.name || c.filename}...`);

                    const roomCategory = getRoomCategory(c.speaker);
                    const targetFolder = organizeByRooms
                        ? roomCategory === "Room 1"
                            ? room1Folder
                            : roomCategory === "Room 2"
                            ? room2Folder
                            : otherFolder
                        : zip;

                    if (format === "jpeg-zip") {
                        let blob = c.blob;
                        if (!blob) {
                            const dataUrl = await getCardDataUrl(c);
                            if (dataUrl) {
                                const res = await fetch(dataUrl);
                                blob = await res.blob();
                            }
                        }
                        if (blob) {
                            const jpegName =
                                c.filename.endsWith(".jpg") || c.filename.endsWith(".jpeg")
                                    ? c.filename
                                    : `${c.filename}.jpg`;
                            targetFolder.file(jpegName, blob);
                        }
                    } else {
                        // Default: individual PDF per badge
                        const dataUrl = await getCardDataUrl(c);
                        if (dataUrl) {
                            const pdf = new jsPDF({
                                orientation: "portrait",
                                unit: "px",
                                format: [1080, 1800],
                            });
                            pdf.addImage(dataUrl, "JPEG", 0, 0, 1080, 1800);
                            const pdfBlob = pdf.output("blob");
                            const pdfFilename =
                                c.filename.replace(/\.jpe?g$/i, "") + `_${Date.now()}.pdf`;
                            targetFolder.file(pdfFilename, pdfBlob);
                        }
                    }
                }

                setProgress("Compressing ZIP file...");
                const zipBlob = await zip.generateAsync({
                    type: "blob",
                    compression: "DEFLATE",
                    compressionOptions: { level: 6 },
                });

                const link = document.createElement("a");
                link.href = URL.createObjectURL(zipBlob);
                link.download = `${filenamePrefix}_${timestamp}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

                if (toast) toast(`Downloaded ZIP archive with ${cardList.length} ID card(s).`);
            }
        } catch (err) {
            console.error("Export failed:", err);
            if (toast) toast("Failed to build download file. Please try again.");
        } finally {
            setZipping(false);
            setProgress(null);
        }
    };

    // Specific Download Triggers
    const handleDownloadZip = () => {
        handleBatchExport({
            targetSpeakers: speakers,
            format: "pdf-zip",
            organizeByRooms: false,
            filenamePrefix: "WL-WH-All-Speaker-ID-Cards",
        });
    };

    const handleCustomDownloadZip = () => {
        handleBatchExport({
            targetSpeakers: speakers,
            format: "pdf-zip",
            organizeByRooms: true,
            filenamePrefix: "WL-WH-Organized-ID-Cards",
        });
    };

    const handleDownloadSinglePdf = () => {
        handleBatchExport({
            targetSpeakers: speakers,
            format: "single-pdf",
            organizeByRooms: false,
            filenamePrefix: "WL-WH-Combined-Speaker-ID-Cards",
        });
    };

    const handleDownloadRoomZip = (roomCategory) => {
        const roomSpeakers = speakers.filter((s) => getRoomCategory(s) === roomCategory);
        if (roomSpeakers.length === 0) {
            if (toast) toast(`No registered speakers found in ${roomCategory}.`);
            return;
        }
        handleBatchExport({
            targetSpeakers: roomSpeakers,
            format: "pdf-zip",
            organizeByRooms: false,
            filenamePrefix: `WL-WH-${roomCategory.replace(/\s+/g, "-")}-ID-Cards`,
        });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // SPECIAL DOWNLOAD: PRINTING WORKS (19" × 13" PRESS CUT SHEETS)
    // ═══════════════════════════════════════════════════════════════════════════
    const renderPrintingWorksSheetToDoc = async (doc, sheetSpeakers, sheetIndex, totalSheets, allCards) => {
        const SHEET_WIDTH_MM = 482.6; // 19 inches
        const SHEET_HEIGHT_MM = 330.2; // 13 inches
        const CARD_WIDTH_MM = 95;
        const CARD_HEIGHT_MM = 120;
        const START_X_MM = 3.8; // (482.6 - (5 * 95)) / 2 = 3.8 mm
        const START_Y_MM = 40.1; // (330.2 - (2 * 120 + 10)) / 2 = 40.1 mm
        const GAP_Y_MM = 10;

        // Clean white background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, SHEET_WIDTH_MM, SHEET_HEIGHT_MM, "F");

        // Header in top margin
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text(`WL-WH CONFERENCE 2026 — ID BADGES PRESS SHEET ${sheetIndex + 1} OF ${totalSheets}`, 15, 18);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(
            `Sheet Dimensions: 19" × 13" (482.6mm × 330.2mm) • Badge Cut Size: 95mm × 120mm • Grid: 2 Rows × 5 Columns • Badges on sheet: ${sheetSpeakers.length}`,
            15,
            25
        );

        // CMYK calibration color bars in the top right margin
        const cmykColors = [
            [0, 162, 232],   // Cyan
            [237, 28, 36],   // Magenta
            [255, 242, 0],   // Yellow
            [34, 177, 76],   // Green
            [0, 0, 0],       // Black
            [128, 128, 128], // 50% Black
        ];
        const barW = 8;
        const barH = 5;
        const barStartX = 410;
        cmykColors.forEach(([r, g, b], idx) => {
            doc.setFillColor(r, g, b);
            doc.rect(barStartX + idx * (barW + 2), 16, barW, barH, "F");
        });

        // Loop through the 10 slots (Row 0: 0-4, Row 1: 5-9)
        for (let i = 0; i < sheetSpeakers.length; i++) {
            const speaker = sheetSpeakers[i];
            const card = allCards[speaker.id];
            const row = Math.floor(i / 5); // Row 0 (0-4), Row 1 (5-9)
            const col = i % 5;             // Columns 0 to 4

            const x = START_X_MM + col * CARD_WIDTH_MM;
            const y = START_Y_MM + row * (CARD_HEIGHT_MM + GAP_Y_MM);

            if (card) {
                const dataUrl = await getCardDataUrl(card);
                if (dataUrl) {
                    doc.addImage(dataUrl, "JPEG", x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);
                }
            }

            // Draw trim / cutting guide lines
            doc.setDrawColor(210, 215, 225);
            doc.setLineWidth(0.25);
            doc.rect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);

            // Corner crop marks for guillotine cutting
            const markLen = 4;
            doc.setDrawColor(130, 140, 155);
            doc.setLineWidth(0.35);
            // Top-Left
            doc.line(x - markLen, y, x, y);
            doc.line(x, y - markLen, x, y);
            // Top-Right
            doc.line(x + CARD_WIDTH_MM, y, x + CARD_WIDTH_MM + markLen, y);
            doc.line(x + CARD_WIDTH_MM, y - markLen, x + CARD_WIDTH_MM, y);
            // Bottom-Left
            doc.line(x - markLen, y + CARD_HEIGHT_MM, x, y + CARD_HEIGHT_MM);
            doc.line(x, y + CARD_HEIGHT_MM, x, y + CARD_HEIGHT_MM + markLen);
            // Bottom-Right
            doc.line(x + CARD_WIDTH_MM, y + CARD_HEIGHT_MM, x + CARD_WIDTH_MM + markLen, y + CARD_HEIGHT_MM);
            doc.line(x + CARD_WIDTH_MM, y + CARD_HEIGHT_MM, x + CARD_WIDTH_MM, y + CARD_HEIGHT_MM + markLen);
        }

        // Fill remaining empty slots on the last sheet with dashed outlines
        for (let i = sheetSpeakers.length; i < 10; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const x = START_X_MM + col * CARD_WIDTH_MM;
            const y = START_Y_MM + row * (CARD_HEIGHT_MM + GAP_Y_MM);

            doc.setDrawColor(230, 235, 242);
            doc.setLineWidth(0.2);
            doc.rect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);

            doc.setFont("helvetica", "italic");
            doc.setFontSize(8.5);
            doc.setTextColor(190, 195, 205);
            doc.text("[Empty Slot]", x + CARD_WIDTH_MM / 2, y + CARD_HEIGHT_MM / 2, { align: "center" });
        }

        // Footer in bottom margin
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        const nowStr = new Date().toLocaleDateString();
        const startNum = sheetIndex * 10 + 1;
        const endNum = sheetIndex * 10 + sheetSpeakers.length;
        doc.text(
            `Sheet ${sheetIndex + 1} of ${totalSheets} • Commercial Cut Sheet • Badges #${startNum}–#${endNum} (${sheetSpeakers.length} on sheet) • 19" × 13" Press Layout • ${nowStr}`,
            15,
            318
        );
    };

    const generatePrintingWorksSheetPdf = async (sheetSpeakers, sheetIndex, totalSheets, allCards) => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: [482.6, 330.2],
        });
        await renderPrintingWorksSheetToDoc(doc, sheetSpeakers, sheetIndex, totalSheets, allCards);
        return doc;
    };

    // Download Individual Sheet as PDF (e.g. Sheet_01.pdf)
    const handleDownloadSinglePrintingSheet = async (sheetIndex) => {
        const startIdx = sheetIndex * 10;
        const endIdx = Math.min(startIdx + 10, speakers.length);
        const sheetSpeakers = speakers.slice(startIdx, endIdx);

        if (sheetSpeakers.length === 0) {
            if (toast) toast("No speakers found for this sheet.");
            return;
        }

        setZipping(true);
        setProgress(`Preparing ID cards for Sheet ${sheetIndex + 1} (${sheetSpeakers.length} badges)...`);

        try {
            const allCards = await ensureCardsForSpeakers(sheetSpeakers);
            setProgress(`Rendering 19" × 13" Press Sheet ${sheetIndex + 1}...`);

            const doc = await generatePrintingWorksSheetPdf(sheetSpeakers, sheetIndex, totalPrintingSheets, allCards);
            const padIndex = String(sheetIndex + 1).padStart(2, "0");
            doc.save(`Sheet_${padIndex}.pdf`);

            if (toast) toast(`Downloaded Sheet ${sheetIndex + 1} (${sheetSpeakers.length} badges on 19" × 13" press layout).`);
        } catch (err) {
            console.error("Failed to generate sheet PDF:", err);
            if (toast) toast("Failed to generate sheet PDF.");
        } finally {
            setZipping(false);
            setProgress(null);
        }
    };

    // Download ZIP of all sheet PDFs (Sheet_01.pdf to Sheet_N.pdf)
    const handleDownloadAllPrintingSheetsZip = async () => {
        if (speakers.length === 0) {
            if (toast) toast("No registered speakers found to print.");
            return;
        }

        setZipping(true);
        setProgress(`Verifying ID cards for all ${speakers.length} speakers across ${totalPrintingSheets} sheets...`);

        try {
            const allCards = await ensureCardsForSpeakers(speakers);
            const zip = new JSZip();

            for (let sheetIdx = 0; sheetIdx < totalPrintingSheets; sheetIdx++) {
                const startIdx = sheetIdx * 10;
                const endIdx = Math.min(startIdx + 10, speakers.length);
                const sheetSpeakers = speakers.slice(startIdx, endIdx);

                setProgress(`Generating Sheet ${sheetIdx + 1} of ${totalPrintingSheets} (${sheetSpeakers.length} badges)...`);
                const doc = await generatePrintingWorksSheetPdf(sheetSpeakers, sheetIdx, totalPrintingSheets, allCards);
                const pdfBlob = doc.output("blob");

                const padIndex = String(sheetIdx + 1).padStart(2, "0");
                zip.file(`Sheet_${padIndex}.pdf`, pdfBlob);
            }

            setProgress("Compressing ZIP file containing all sheets...");
            const zipBlob = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 },
            });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipBlob);
            link.download = `WL-WH-Printing-Works-All-Sheets-(19x13)-${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            if (toast) toast(`Downloaded ZIP with all ${totalPrintingSheets} press sheet PDFs (Sheet 1 to Sheet ${totalPrintingSheets}).`);
        } catch (err) {
            console.error("Failed to generate printing works ZIP:", err);
            if (toast) toast("Failed to build printing works ZIP file.");
        } finally {
            setZipping(false);
            setProgress(null);
        }
    };

    // Download Combined multi-page PDF (all sheets in 1 document)
    const handleDownloadAllPrintingSheetsCombinedPdf = async () => {
        if (speakers.length === 0) {
            if (toast) toast("No registered speakers found to print.");
            return;
        }

        setZipping(true);
        setProgress(`Verifying ID cards for all ${speakers.length} speakers across ${totalPrintingSheets} sheets...`);

        try {
            const allCards = await ensureCardsForSpeakers(speakers);
            const combinedDoc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: [482.6, 330.2],
            });

            for (let sheetIdx = 0; sheetIdx < totalPrintingSheets; sheetIdx++) {
                const startIdx = sheetIdx * 10;
                const endIdx = Math.min(startIdx + 10, speakers.length);
                const sheetSpeakers = speakers.slice(startIdx, endIdx);

                setProgress(`Compiling Sheet ${sheetIdx + 1} of ${totalPrintingSheets}...`);
                if (sheetIdx > 0) {
                    combinedDoc.addPage([482.6, 330.2], "landscape");
                }
                await renderPrintingWorksSheetToDoc(combinedDoc, sheetSpeakers, sheetIdx, totalPrintingSheets, allCards);
            }

            combinedDoc.save(`WL-WH-Printing-Works-Combined-Sheets-(19x13)-${new Date().toISOString().slice(0, 10)}.pdf`);
            if (toast) toast(`Downloaded combined ${totalPrintingSheets}-page press PDF.`);
        } catch (err) {
            console.error("Failed to generate combined PDF:", err);
            if (toast) toast("Failed to generate combined printing sheet PDF.");
        } finally {
            setZipping(false);
            setProgress(null);
        }
    };

    // 5. Download single card as PDF
    const downloadSingleCard = async (card) => {
        try {
            const downloadUrl = card.dataUrl || card.publicUrl;
            if (!downloadUrl) return;

            let dataUrlToUse = downloadUrl;

            if (downloadUrl.startsWith("http")) {
                const res = await fetch(downloadUrl);
                const blob = await res.blob();
                dataUrlToUse = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            }

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: [1080, 1800],
            });

            pdf.addImage(dataUrlToUse, "JPEG", 0, 0, 1080, 1800);

            const timestamp = Date.now();
            const pdfFilename = card.filename.replace(".jpg", "").replace(".jpeg", "") + `_${timestamp}.pdf`;

            pdf.save(pdfFilename);
            if (toast) toast(`Downloaded ${pdfFilename}`);
        } catch (err) {
            console.error("Download failed:", err);
            if (toast) toast("Download failed. Please try again.");
        }
    };

    // Filter speakers for gallery display (ID Cards tab)
    const filteredSpeakers = speakers.filter((s) => {
        if (roomFilter === "room1") {
            if (s.conferenceRoom && s.conferenceRoom.trim().toLowerCase() !== "room 1" && s.conferenceRoom.trim() !== "1") return false;
            if (!s.conferenceRoom) return false;
        }
        if (roomFilter === "room2") {
            if (!s.conferenceRoom || (s.conferenceRoom.trim().toLowerCase() !== "room 2" && s.conferenceRoom.trim() !== "2")) return false;
        }

        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
            (s.name || "").toLowerCase().includes(q) ||
            (s.id || "").toLowerCase().includes(q) ||
            (s.sessionTitle || "").toLowerCase().includes(q)
        );
    });

    // Filter speakers for Custom Downloads builder (Downloads tab)
    const filteredCustomSpeakers = useMemo(() => {
        return speakers.filter((s) => {
            if (
                customRoomFilter !== "all" &&
                getRoomCategory(s).toLowerCase().replace(/\s+/g, "") !== customRoomFilter.toLowerCase().replace(/\s+/g, "")
            ) {
                return false;
            }
            if (customDayFilter !== "all" && (s.day || s.sessionDay || "").trim() !== customDayFilter) {
                return false;
            }
            if (customTagFilter !== "all" && (s.speakerTag || s.speaker_tag || s.role || "").trim() !== customTagFilter) {
                return false;
            }
            if (customStatusFilter === "generated" && !cards[s.id]) {
                return false;
            }
            if (customStatusFilter === "pending" && cards[s.id]) {
                return false;
            }
            if (customSearch.trim()) {
                const q = customSearch.toLowerCase().trim();
                const matches =
                    (s.name || "").toLowerCase().includes(q) ||
                    (s.id || "").toLowerCase().includes(q) ||
                    (s.sessionTitle || "").toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [speakers, customRoomFilter, customDayFilter, customTagFilter, customStatusFilter, customSearch, cards]);

    // Custom Download Multi-selection Handlers
    const handleSelectAllFiltered = () => {
        setSelectedSpeakerIds((prev) => {
            const next = new Set(prev);
            filteredCustomSpeakers.forEach((s) => next.add(s.id));
            return next;
        });
    };

    const handleDeselectAllFiltered = () => {
        setSelectedSpeakerIds((prev) => {
            const next = new Set(prev);
            filteredCustomSpeakers.forEach((s) => next.delete(s.id));
            return next;
        });
    };

    const handleToggleSpeaker = (id) => {
        setSelectedSpeakerIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectOnlyReady = () => {
        const readyIds = new Set();
        filteredCustomSpeakers.forEach((s) => {
            if (cards[s.id]) readyIds.add(s.id);
        });
        setSelectedSpeakerIds(readyIds);
    };

    const handleExecuteCustomDownload = async () => {
        const targetSpeakers = speakers.filter((s) => selectedSpeakerIds.has(s.id));
        if (targetSpeakers.length === 0) {
            if (toast) toast("Please select at least one speaker to download.");
            return;
        }
        await handleBatchExport({
            targetSpeakers,
            format: customFormat,
            organizeByRooms: customOrganizeRooms,
            filenamePrefix: "WL-WH-Custom-ID-Cards",
        });
    };

    return (
        <div className="space-y-6">
            {/* Top Navigation Bar: Switch between 'ID Cards' and 'Downloads' */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-xs">
                {/* Navbar Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => setActiveSubTab("cards")}
                        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                            activeSubTab === "cards"
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                        <CreditCard size={16} className={activeSubTab === "cards" ? "text-amber-500" : ""} />
                        <span>ID Cards</span>
                        <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                activeSubTab === "cards"
                                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300"
                                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                        >
                            {totalSpeakers}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveSubTab("downloads")}
                        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                            activeSubTab === "downloads"
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                        <Download size={16} className={activeSubTab === "downloads" ? "text-indigo-500" : ""} />
                        <span>Downloads</span>
                        <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                activeSubTab === "downloads"
                                    ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300"
                                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                        >
                            {generatedCount} Ready
                        </span>
                    </button>
                </div>

                {/* Status indicators on the right */}
                <div className="flex items-center gap-3 px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 justify-between sm:justify-end">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Cloud: <strong className="text-slate-800 dark:text-slate-200">{cloudCount} synced</strong>
                    </span>
                    <span>•</span>
                    <span>
                        Generated: <strong className="text-teal-600 dark:text-teal-400">{generatedCount} of {totalSpeakers}</strong>
                    </span>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════
                TAB 1: ID CARDS GENERATOR & GALLERY
            ═══════════════════════════════════════════════════════════════════════ */}
            {activeSubTab === "cards" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Top Operations Action Card */}
                    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                                        Speaker ID Cards
                                    </h2>
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                        Official Template + QR Code
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Generate official printable badges with scannable on-site check-in QR codes, partner logos, and speaker photos.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                    <span>
                                        Registered: <strong className="text-slate-900 dark:text-slate-100">{totalSpeakers}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        Generated: <strong className="text-teal-600 dark:text-teal-400">{generatedCount} of {totalSpeakers}</strong>
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
                                <button
                                    onClick={handleLoadCards}
                                    disabled={loadingCards || generating || zipping || totalSpeakers === 0}
                                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 min-h-[44px]"
                                >
                                    <Cloud size={16} className={loadingCards ? "animate-pulse" : ""} />
                                    {loadingCards ? "Loading..." : "Load ID Cards"}
                                </button>

                                <button
                                    onClick={() => handleGenerateCards(false)}
                                    disabled={generating || zipping || loadingCards || totalSpeakers === 0}
                                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-300 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 min-h-[44px]"
                                >
                                    <Sparkles size={16} className={generating ? "animate-spin" : ""} />
                                    {generating ? "Generating Badges..." : "Generate ID Cards"}
                                </button>

                                {generatedCount > 0 && (
                                    <button
                                        onClick={() => handleGenerateCards(true)}
                                        disabled={generating || zipping}
                                        title="Regenerate all ID cards with QR codes"
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 min-h-[44px]"
                                    >
                                        <RefreshCw size={15} className={generating ? "animate-spin" : ""} />
                                        Regenerate All
                                    </button>
                                )}

                                <button
                                    onClick={() => setActiveSubTab("downloads")}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 min-h-[44px]"
                                >
                                    <Download size={16} />
                                    Go to Downloads <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Live Progress Bar */}
                        {progress && (
                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-amber-500 rounded-full animate-spin shrink-0"></div>
                                <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">{progress}</span>
                            </div>
                        )}
                    </div>

                    {/* Gallery Section */}
                    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">ID Cards Gallery</h3>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Every card exports as high-res printable badge image
                                </span>
                            </div>

                            {/* Search and Room Filter */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 w-full sm:w-auto shrink-0">
                                    <button
                                        onClick={() => setRoomFilter("all")}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                            roomFilter === "all"
                                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                    >
                                        All Rooms
                                    </button>
                                    <button
                                        onClick={() => setRoomFilter("room1")}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                            roomFilter === "room1"
                                                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-xs"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                    >
                                        Room 1
                                    </button>
                                    <button
                                        onClick={() => setRoomFilter("room2")}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                            roomFilter === "room2"
                                                ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 shadow-xs"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                    >
                                        Room 2
                                    </button>
                                </div>

                                <div className="relative w-full sm:w-72">
                                    <Search
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />
                                    <input
                                        className={`${inputCls} !pl-10 sm:!pl-10 mb-0 text-xs sm:text-sm`}
                                        placeholder="Filter by name, badge ID..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {filteredSpeakers.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">
                                No registered speakers found matching your search.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filteredSpeakers.map((s) => {
                                    const card = cards[s.id];
                                    return (
                                        <div
                                            key={s.id}
                                            className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between hover:border-amber-400/60 hover:shadow-md transition-all group"
                                        >
                                            {/* Badge Thumbnail / Preview */}
                                            <div className="relative aspect-[3/5] rounded-xl overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center mb-3">
                                                {card ? (
                                                    <>
                                                        <img
                                                            src={card.dataUrl || card.publicUrl}
                                                            alt={`ID Badge - ${s.name}`}
                                                            className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
                                                            onClick={() => setPreviewCard(card)}
                                                        />
                                                        {card.isStored && (
                                                            <span className="absolute top-2 left-2 bg-teal-700/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                                                <CheckCircle2 size={11} /> Cloud Saved
                                                            </span>
                                                        )}
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
                                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center text-slate-400 font-bold text-sm mb-2">
                                                            ID
                                                        </div>
                                                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                                            {s.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-mono mb-3">{s.id}</div>
                                                        <button
                                                            onClick={() => generateAndStoreSingleCard(s)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-xs transition-all active:scale-95"
                                                        >
                                                            <Sparkles size={12} /> Generate & Save
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Metadata & Actions */}
                                            <div className="pt-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div
                                                        className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate"
                                                        title={s.name}
                                                    >
                                                        {s.name}
                                                    </div>
                                                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {s.id}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                    {s.speakerTag || s.speaker_tag || s.role || s.sessionTitle || "Speaker"}
                                                </div>

                                                {/* Download and Edit buttons */}
                                                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        {card ? (
                                                            <button
                                                                onClick={() => downloadSingleCard(card)}
                                                                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-slate-800 dark:text-slate-200 transition-colors"
                                                            >
                                                                <Download size={13} /> Download PDF
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Not yet generated</span>
                                                        )}
                                                    </div>
                                                    {s.photoUrl && (
                                                        <button
                                                            onClick={() => handleEditCard(s)}
                                                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                                        >
                                                            <Edit size={13} /> Edit ID Card
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════
                TAB 2: DOWNLOADS & ALL CUSTOM DOWNLOADS
            ═══════════════════════════════════════════════════════════════════════ */}
            {activeSubTab === "downloads" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Header Banner & Stats */}
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                        <Download size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                                            ID Card Downloads & Custom Exports
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                            Download batch packages organized by room, multi-page print-ready documents, or customize your selection.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto">
                                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Total Speakers</div>
                                    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                        {totalSpeakers}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 text-center">
                                    <div className="text-xs text-emerald-700 dark:text-emerald-400">Ready Badges</div>
                                    <div className="text-base sm:text-lg font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                                        {generatedCount}
                                    </div>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-3 text-center">
                                    <div className="text-xs text-indigo-700 dark:text-indigo-400">Cloud Synced</div>
                                    <div className="text-base sm:text-lg font-bold text-indigo-800 dark:text-indigo-300 mt-0.5">
                                        {cloudCount}
                                    </div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-center">
                                    <div className="text-xs text-amber-700 dark:text-amber-400">Pending</div>
                                    <div className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-300 mt-0.5">
                                        {pendingCount}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Missing cards warning banner */}
                        {pendingCount > 0 && (
                            <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-900 dark:text-amber-300">
                                    <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                    <span>
                                        <strong>{pendingCount} speaker ID badge(s)</strong> have not been generated yet. Missing badges will auto-generate during export, or generate them in advance now.
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleGenerateCards(false)}
                                    disabled={generating || zipping}
                                    className="shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors"
                                >
                                    <Sparkles size={14} />
                                    Generate All Pending
                                </button>
                            </div>
                        )}

                        {/* Live progress banner */}
                        {progress && (
                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-indigo-400 border-t-indigo-600 rounded-full animate-spin shrink-0"></div>
                                <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">{progress}</span>
                            </div>
                        )}
                    </div>

                    {/* SECTION 1: Standard & Room Download Packages */}
                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <FolderDown size={18} className="text-indigo-500" />
                                    Quick Download Packages
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Pre-configured bulk downloads formatted for print shops, room teams, or full event archives.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Card 1: Custom Download (Organized by Rooms) */}
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                            <FolderArchive size={22} />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                            Organized ZIP
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                                        Organized by Rooms (ZIP)
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        Separates badges automatically into <strong>Room 1</strong>, <strong>Room 2</strong>, and <strong>Other</strong> folders inside a single compressed ZIP.
                                    </p>
                                </div>
                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={handleCustomDownloadZip}
                                        disabled={zipping || generating || totalSpeakers === 0}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-98 min-h-[42px]"
                                    >
                                        <FolderArchive size={15} />
                                        {zipping ? "Processing..." : "Download Organized ZIP"}
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Single Multi-Page PDF Document */}
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                            <Printer size={22} />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                            Multi-Page PDF
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                                        Combined Multi-Page PDF
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        All speaker ID cards compiled sequentially into one high-resolution PDF document (1080×1800 px per page), ready for bulk printing.
                                    </p>
                                </div>
                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={handleDownloadSinglePdf}
                                        disabled={zipping || generating || totalSpeakers === 0}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-98 min-h-[42px]"
                                    >
                                        <Download size={15} />
                                        {zipping ? "Processing..." : "Download Single PDF"}
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Complete Archive (ZIP of PDFs) */}
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
                                            <FileArchive size={22} />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                            Flat Archive
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                                        All ID Cards Archive (ZIP)
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        Standard flat ZIP archive containing separate individual printable PDF files for every registered speaker ({totalSpeakers} total).
                                    </p>
                                </div>
                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={handleDownloadZip}
                                        disabled={zipping || generating || totalSpeakers === 0}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-98 min-h-[42px]"
                                    >
                                        <FileArchive size={15} />
                                        {zipping ? "Creating ZIP..." : "Download All Badges ZIP"}
                                    </button>
                                </div>
                            </div>

                            {/* Card 4: Room 1 Only */}
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                                            <Layers size={22} />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            {room1Speakers.length} Badges
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                                        Conference Room 1 (ZIP)
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        Targeted ZIP package containing only speakers assigned to Conference Room 1.
                                    </p>
                                </div>
                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => handleDownloadRoomZip("Room 1")}
                                        disabled={zipping || generating || room1Speakers.length === 0}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all min-h-[40px]"
                                    >
                                        <Download size={14} />
                                        Download Room 1 Badges
                                    </button>
                                </div>
                            </div>

                            {/* Card 5: Room 2 Only */}
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-orange-400 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="p-2.5 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-xl">
                                            <Layers size={22} />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                                            {room2Speakers.length} Badges
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                                        Conference Room 2 (ZIP)
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        Targeted ZIP package containing only speakers assigned to Conference Room 2.
                                    </p>
                                </div>
                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => handleDownloadRoomZip("Room 2")}
                                        disabled={zipping || generating || room2Speakers.length === 0}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all min-h-[40px]"
                                    >
                                        <Download size={14} />
                                        Download Room 2 Badges
                                    </button>
                                </div>
                            </div>

                            {/* Card 6: Other / Unassigned */}
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
                                            <Users size={22} />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            {otherSpeakers.length} Badges
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                                        Other / Unassigned (ZIP)
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        Badges for speakers without Room 1 or Room 2 room assignments.
                                    </p>
                                </div>
                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => handleDownloadRoomZip("Other")}
                                        disabled={zipping || generating || otherSpeakers.length === 0}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all min-h-[40px]"
                                    >
                                        <Download size={14} />
                                        Download Other Badges
                                    </button>
                                </div>
                            </div>

                            {/* Card 7: Printing Works Quick Action */}
                            <div className="bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-indigo-500/5 dark:from-violet-950/20 dark:to-indigo-950/20 border-2 border-violet-300 dark:border-violet-700/60 rounded-2xl p-5 shadow-xs hover:border-violet-500 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="p-2.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-xl">
                                            <Printer size={22} />
                                        </div>
                                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-200 border border-violet-300 dark:border-violet-700">
                                            19" × 13" Press
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                        Printing Works Sheets (ZIP)
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        <strong>10 Badges/sheet</strong> (Row 1: 5 | Row 2: 5). Sized <strong>95mm × 120mm</strong> on 19" × 13" press sheets. <strong>{totalPrintingSheets} sheets</strong> for {totalSpeakers} speakers.
                                    </p>
                                </div>
                                <div className="mt-5 pt-4 border-t border-violet-200/60 dark:border-violet-900/40 flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={handleDownloadAllPrintingSheetsZip}
                                        disabled={zipping || generating || totalSpeakers === 0}
                                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98 min-h-[40px]"
                                    >
                                        <FileArchive size={14} />
                                        All Sheets ZIP
                                    </button>
                                    <button
                                        onClick={handleDownloadAllPrintingSheetsCombinedPdf}
                                        disabled={zipping || generating || totalSpeakers === 0}
                                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-xl border border-violet-200 dark:border-violet-700 transition-all min-h-[40px]"
                                    >
                                        <Printer size={14} />
                                        Combined PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: SPECIAL DOWNLOAD — PRINTING WORKS (19" × 13" PRESS SHEETS) */}
                    <div className="bg-white dark:bg-slate-950 border-2 border-violet-200 dark:border-violet-900/60 rounded-2xl p-5 sm:p-6 shadow-xs">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-xl">
                                        <LayoutGrid size={22} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                                Printing Works — 19" × 13" Press Cut Sheets
                                            </h3>
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
                                                Special Download
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Each ID card: <strong>95mm Width × 120mm Height</strong> • Sheet: <strong>19" Width × 13" Height</strong> (482.6mm × 330.2mm) • <strong>10 badges per sheet</strong> (Row 1: 5 | Row 2: 5).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                                    <span>
                                        Total Speakers: <strong className="text-slate-900 dark:text-slate-100">{totalSpeakers}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        Total Sheets: <strong className="text-violet-700 dark:text-violet-400">{totalPrintingSheets} Sheets</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        Last Sheet: <strong className="text-amber-700 dark:text-amber-400">{speakers.length % 10 === 0 ? 10 : speakers.length % 10} Badges</strong>
                                    </span>
                                </div>
                            </div>

                            {/* Master Bulk Download Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0">
                                <button
                                    onClick={handleDownloadAllPrintingSheetsZip}
                                    disabled={zipping || generating || totalSpeakers === 0}
                                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 min-h-[42px]"
                                    title="Download all sheet PDFs in a single ZIP"
                                >
                                    <FileArchive size={16} />
                                    {zipping ? "Processing..." : `Download All Sheets ZIP (${totalPrintingSheets})`}
                                </button>

                                <button
                                    onClick={handleDownloadAllPrintingSheetsCombinedPdf}
                                    disabled={zipping || generating || totalSpeakers === 0}
                                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 min-h-[42px]"
                                    title="Download all sheets compiled into one continuous PDF"
                                >
                                    <Printer size={16} />
                                    Combined Press PDF
                                </button>
                            </div>
                        </div>

                        {/* Individual Sheets Grid */}
                        <div className="mt-5">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                    Individual Press Sheets ({totalPrintingSheets} Total)
                                </h4>
                                <span className="text-[11px] text-slate-500">
                                    Click any sheet to download individual PDF
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                {printingSheets.map((sheet) => {
                                    const isLast = sheet.index === totalPrintingSheets - 1;
                                    const count = sheet.speakers.length;
                                    const row1Count = Math.min(5, count);
                                    const row2Count = Math.max(0, count - 5);

                                    return (
                                        <div
                                            key={sheet.sheetNumber}
                                            className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-900/40 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-md transition-all flex flex-col justify-between group"
                                        >
                                            {/* Card Top */}
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                                        Sheet {sheet.sheetNumber} of {totalPrintingSheets}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                                        {count} {count === 1 ? "Badge" : "Badges"}
                                                    </span>
                                                </div>

                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                                                    Speakers #{sheet.startNumber}–#{sheet.endNumber} • Row 1: {row1Count} | Row 2: {row2Count}
                                                    {isLast && count < 10 && (
                                                        <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">
                                                            (Last sheet: {10 - count} empty slots)
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Mini 2×5 Sheet Preview Box */}
                                                <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs mb-3">
                                                    <div className="grid grid-cols-5 gap-1 text-[8px]">
                                                        {Array.from({ length: 10 }).map((_, slotIdx) => {
                                                            const sp = sheet.speakers[slotIdx];
                                                            const card = sp ? cards[sp.id] : null;

                                                            if (!sp) {
                                                                return (
                                                                    <div
                                                                        key={slotIdx}
                                                                        className="aspect-[95/120] rounded-sm border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[7px] text-slate-300 dark:text-slate-600"
                                                                    >
                                                                        —
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div
                                                                    key={slotIdx}
                                                                    className="aspect-[95/120] rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-0.5 relative overflow-hidden group/slot"
                                                                    title={`${sp.name} (${sp.id})`}
                                                                >
                                                                    {sp.photoUrl ? (
                                                                        <img
                                                                            src={sp.photoUrl}
                                                                            alt=""
                                                                            className="w-3.5 h-3.5 rounded-full object-cover mb-0.5"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-3.5 h-3.5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[6px] mb-0.5">
                                                                            {sp.name ? sp.name[0] : "S"}
                                                                        </div>
                                                                    )}
                                                                    <span className="w-full truncate text-center text-[7px] font-semibold text-slate-700 dark:text-slate-300 leading-none">
                                                                        {sp.name ? sp.name.split(" ")[0] : "Spk"}
                                                                    </span>
                                                                    {card && (
                                                                        <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-500"></span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Download Button */}
                                            <button
                                                onClick={() => handleDownloadSinglePrintingSheet(sheet.index)}
                                                disabled={zipping || generating}
                                                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98 min-h-[38px]"
                                            >
                                                <Download size={13} />
                                                Download Sheet {sheet.sheetNumber} (PDF)
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: All Custom Downloads Builder */}
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Filter size={18} className="text-indigo-500" />
                                    All Custom Downloads Builder
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Filter by room, day, or role, choose format, and multi-select exact speakers for custom export.
                                </p>
                            </div>

                            {/* Format & Export Mode Selector */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <button
                                        onClick={() => setCustomFormat("pdf-zip")}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            customFormat === "pdf-zip"
                                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                    >
                                        ZIP of PDFs
                                    </button>
                                    <button
                                        onClick={() => setCustomFormat("single-pdf")}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            customFormat === "single-pdf"
                                                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                    >
                                        Multi-Page PDF
                                    </button>
                                    <button
                                        onClick={() => setCustomFormat("jpeg-zip")}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            customFormat === "jpeg-zip"
                                                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                    >
                                        ZIP of JPEGs
                                    </button>
                                </div>

                                {customFormat !== "single-pdf" && (
                                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                                        <input
                                            type="checkbox"
                                            checked={customOrganizeRooms}
                                            onChange={(e) => setCustomOrganizeRooms(e.target.checked)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Organize into Room Folders</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Interactive Filter Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 pb-4">
                            {/* Room Filter */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Room
                                </label>
                                <select
                                    value={customRoomFilter}
                                    onChange={(e) => setCustomRoomFilter(e.target.value)}
                                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                                >
                                    <option value="all">All Rooms ({totalSpeakers})</option>
                                    <option value="room1">Room 1 ({room1Speakers.length})</option>
                                    <option value="room2">Room 2 ({room2Speakers.length})</option>
                                    <option value="other">Other ({otherSpeakers.length})</option>
                                </select>
                            </div>

                            {/* Day Filter */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Day
                                </label>
                                <select
                                    value={customDayFilter}
                                    onChange={(e) => setCustomDayFilter(e.target.value)}
                                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                                >
                                    <option value="all">All Days</option>
                                    {availableDays.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Speaker Tag / Role Filter */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Speaker Tag / Role
                                </label>
                                <select
                                    value={customTagFilter}
                                    onChange={(e) => setCustomTagFilter(e.target.value)}
                                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                                >
                                    <option value="all">All Tags / Roles</option>
                                    {availableTags.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Card Status Filter */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Badge Status
                                </label>
                                <select
                                    value={customStatusFilter}
                                    onChange={(e) => setCustomStatusFilter(e.target.value)}
                                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="generated">Generated Badges Only ({generatedCount})</option>
                                    <option value="pending">Pending Badges Only ({pendingCount})</option>
                                </select>
                            </div>

                            {/* Search Filter */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Search Speaker
                                </label>
                                <div className="relative">
                                    <Search
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />
                                    <input
                                        className={`${inputCls} !pl-8 text-xs py-2`}
                                        placeholder="Name, ID, session..."
                                        value={customSearch}
                                        onChange={(e) => setCustomSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Selection Action Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={handleSelectAllFiltered}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
                                >
                                    <CheckSquare size={13} className="text-indigo-600" />
                                    Select All Filtered ({filteredCustomSpeakers.length})
                                </button>
                                <button
                                    onClick={handleDeselectAllFiltered}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
                                >
                                    <Square size={13} className="text-slate-400" />
                                    Deselect All
                                </button>
                                <button
                                    onClick={handleSelectOnlyReady}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
                                >
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    Select Ready Only
                                </button>
                            </div>

                            {/* Download Action Button */}
                            <div className="flex items-center gap-3 justify-between sm:justify-end">
                                <div className="text-xs font-medium text-slate-500">
                                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                                        {Array.from(selectedSpeakerIds).filter((id) =>
                                            filteredCustomSpeakers.some((s) => s.id === id)
                                        ).length}
                                    </strong>{" "}
                                    selected of {filteredCustomSpeakers.length}
                                </div>

                                <button
                                    onClick={handleExecuteCustomDownload}
                                    disabled={zipping || generating || selectedSpeakerIds.size === 0}
                                    className="inline-flex items-center justify-center gap-2 py-2 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 min-h-[38px]"
                                >
                                    <Download size={15} />
                                    {zipping
                                        ? "Preparing Download..."
                                        : `Download Custom Export (${selectedSpeakerIds.size})`}
                                </button>
                            </div>
                        </div>

                        {/* Speaker Selection Table / List */}
                        {filteredCustomSpeakers.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                                No speakers match the selected filters.
                            </div>
                        ) : (
                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[460px] overflow-y-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-100/80 dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="py-2.5 px-3 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        filteredCustomSpeakers.length > 0 &&
                                                        filteredCustomSpeakers.every((s) => selectedSpeakerIds.has(s.id))
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.checked) handleSelectAllFiltered();
                                                        else handleDeselectAllFiltered();
                                                    }}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </th>
                                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">Speaker</th>
                                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">Badge ID</th>
                                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">Room</th>
                                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 hidden sm:table-cell">Day / Slot</th>
                                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">Badge Status</th>
                                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredCustomSpeakers.map((s) => {
                                            const isSelected = selectedSpeakerIds.has(s.id);
                                            const card = cards[s.id];
                                            const roomCategory = getRoomCategory(s);

                                            return (
                                                <tr
                                                    key={s.id}
                                                    onClick={() => handleToggleSpeaker(s.id)}
                                                    className={`cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? "bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                                    }`}
                                                >
                                                    <td
                                                        className="py-2.5 px-3 text-center"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleSpeaker(s.id)}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            {s.photoUrl ? (
                                                                <img
                                                                    src={s.photoUrl}
                                                                    alt={s.name}
                                                                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                                                                />
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                                                    {s.name ? s.name.charAt(0) : "S"}
                                                                </div>
                                                            )}
                                                            <div className="truncate max-w-[180px] sm:max-w-[220px]">
                                                                <div className="truncate font-bold">{s.name}</div>
                                                                <div className="text-[11px] text-slate-400 font-normal truncate">
                                                                    {s.speakerTag || s.speaker_tag || s.role || "Speaker"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                                        {s.id}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                roomCategory === "Room 1"
                                                                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400"
                                                                    : roomCategory === "Room 2"
                                                                    ? "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400"
                                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                            }`}
                                                        >
                                                            {roomCategory}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-500 hidden sm:table-cell text-[11px]">
                                                        {s.day || "Day 1"} {s.timeSlot ? `• ${s.timeSlot}` : ""}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        {card ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle2 size={12} /> Ready
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                                <Sparkles size={12} /> Auto-generate
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                        {card ? (
                                                            <button
                                                                onClick={() => downloadSingleCard(card)}
                                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                                                                title="Download Single PDF"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => generateAndStoreSingleCard(s)}
                                                                className="text-[11px] text-indigo-600 font-semibold hover:underline"
                                                            >
                                                                Generate
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Popup Modal for ID card preview */}
            {previewCard &&
                createPortal(
                    <div
                        onClick={() => setPreviewCard(null)}
                        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        style={{ animation: "fadeIn 0.15s ease-out" }}
                    >
                        <style>{`
                            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                            @keyframes popIn { from { opacity: 0; transform: scale(0.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                        `}</style>
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-auto max-w-[90vw] max-h-[92vh] p-3 relative flex flex-col items-center"
                            style={{ animation: "popIn 0.2s ease-out" }}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setPreviewCard(null)}
                                className="absolute -top-3 -right-3 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors z-10 shadow-sm"
                                aria-label="Close preview"
                            >
                                <X size={18} />
                            </button>

                            {/* ID Card Image */}
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg bg-slate-50 dark:bg-slate-950">
                                <img
                                    src={previewCard.dataUrl || previewCard.publicUrl}
                                    alt={previewCard.filename}
                                    className="block w-auto h-auto max-w-[260px] max-h-[72vh] object-contain"
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-3 w-full">
                                <button
                                    onClick={() => downloadSingleCard(previewCard)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs transition-colors min-h-[40px]"
                                >
                                    <Download size={14} /> Download PDF
                                </button>
                                <button
                                    onClick={() => setPreviewCard(null)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors min-h-[40px]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Modal for Cropping/Editing Speaker ID Card */}
            {editingSpeaker &&
                createPortal(
                    <div
                        onClick={() => setEditingSpeaker(null)}
                        className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-200"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setEditingSpeaker(null)}
                                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4">
                                Edit Image for {editingSpeaker.name}
                            </h3>

                            <div className="relative w-full h-[350px] sm:h-[450px] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-5">
                                <Cropper
                                    image={editingSpeaker.photoUrl}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                                    onZoomChange={setZoom}
                                    cropShape="round"
                                    showGrid={false}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <button
                                    onClick={handleSaveCrop}
                                    disabled={savingCrop}
                                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-sm py-2.5 rounded-xl shadow-xs transition-colors min-h-[44px]"
                                >
                                    {savingCrop ? <Sparkles size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    {savingCrop ? "Saving..." : "Save ID Card"}
                                </button>
                                <button
                                    onClick={() => setEditingSpeaker(null)}
                                    disabled={savingCrop}
                                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
