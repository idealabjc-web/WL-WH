// Portrait event ID badge (canvas 1080×1800 px, white background)
// Implements exact fixed assets and variable fields with absolute coordinates:
//
// FIXED ASSETS:
// - top_bg.jpg: aerial photo at x=0, y=0, width 1080, height ~800, object-fit: cover.
//   Bottom edge soft curved wave fading into white (y=780–810).
// - organizer_logos.png: row of 6 organizer logos at x=37, y=105, height ~70 across width.
// - bottom_waves.png: layered navy (#0B2A7A) & royal-blue (#1E6FC0) waves with flowing line-art.
//   Anchor to bottom, full width 1080, height ~380 (y=1420 to 1800), area behind QR stays white.
//
// VARIABLE FIELDS (centered on x=540 unless noted):
// 1. Label "Our Event Organisers :" at x=37, y=63. Bold italic, 30 px, navy #0B2A4A.
// 2. Banner: rounded pill, x=75 to 1005, y=219 to 321 (930×102), gradient #1E5FC0 to #3B7BD8,
//    3 px white outline, soft inner glow. Text "{{event_name}}", bold uppercase white, 72 px, centered.
// 3. Speaker photo: circle, outer dia 690 px, center (540, 755), top y=410, bottom y=1100.
//    14 px white ring plus soft drop shadow. Headshot cropped chest-up.
// 4. Flag card: white rounded card (radius 24), 260×155 px, at x=760, y=880 with shadow.
//    Flag inside at ~190×125, centered in card. Overlaps bottom-right of circle.
// 5. Name "{{speaker_name}}": center y=1170, bold, 96 px, color #2E8FCB, rounded geometric sans.
//    Shrink-to-fit if wider than 900 px.
// 6. Divider: 2 px dark line, x=325 to 755, y=1232, tapering at both ends.
// 7. Role "{{role}}": center y=1266, italic regular, 40 px, #333.
// 8. Dates "{{dates}} | {{city_country}}": center y=1340, bold, 44 px, #0B2A4A.
// 9. QR code encoding {{qr_url}}: 185×185 px at x=448, y=1395 on white tile with 10 px padding.
//    Small badge ID text below QR (16 px, grey, y=1590).
import QRCode from "qrcode";
import { getCountryCode, getCountryFlagUrl, getCountryName } from "./countryFlags";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImage(src) {
    return new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        if (!src.startsWith('data:') && !src.startsWith('blob:')) {
            img.crossOrigin = "anonymous";
        }
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/** Tapered 2 px dark divider line from x1 to x2 at y */
function drawTaperedDivider(ctx, x1, x2, y) {
    const cx = (x1 + x2) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.quadraticCurveTo(cx, y - 1, x2, y);
    ctx.quadraticCurveTo(cx, y + 1, x1, y);
    ctx.closePath();
    const grad = ctx.createLinearGradient(x1, y, x2, y);
    grad.addColorStop(0, "rgba(30, 41, 59, 0.0)");
    grad.addColorStop(0.2, "rgba(30, 41, 59, 0.55)");
    grad.addColorStop(0.5, "rgba(30, 41, 59, 0.85)");
    grad.addColorStop(0.8, "rgba(30, 41, 59, 0.55)");
    grad.addColorStop(1, "rgba(30, 41, 59, 0.0)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
}

/** Draw country flag matching speaker's registered country (with high-res CDN and vector fallback) */
async function drawCountryFlag(ctx, x, y, w, h, countryInput) {
    ctx.save();
    roundRect(ctx, x, y, w, h, 8);
    ctx.clip();

    const countryCode = getCountryCode(countryInput) || "ae";
    const flagUrl = `https://flagcdn.com/w320/${countryCode}.png`;
    const flagImg = await loadImage(flagUrl);

    if (flagImg) {
        ctx.drawImage(flagImg, x, y, w, h);
    } else {
        // Fallback: UAE host flag
        const hoistW = w * 0.28;
        const flyW = w - hoistW;
        const stripeH = h / 3;

        ctx.fillStyle = "#00732f";
        ctx.fillRect(x + hoistW, y, flyW, stripeH);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x + hoistW, y + stripeH, flyW, stripeH);

        ctx.fillStyle = "#000000";
        ctx.fillRect(x + hoistW, y + stripeH * 2, flyW, stripeH);

        ctx.fillStyle = "#d80027";
        ctx.fillRect(x, y, hoistW, h);
    }

    // Subtle edge border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.restore();
}

// ─── Main Badge Generator ─────────────────────────────────────────────────────

async function generateRoom2IdCardJpeg(speaker) {
    const W = 1080;
    const H = 1800;
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Background Image (same as Room 1)
    const topBgImg = (await loadImage(`/top_bg.jpg?v=dubai_${Date.now()}`)) || (await loadImage("/dubai_bg.jpg"));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 805);
    ctx.bezierCurveTo(W * 0.65, 825, W * 0.35, 775, 0, 795);
    ctx.closePath();
    ctx.clip();
    if (topBgImg) {
        const sc = Math.max(W / topBgImg.width, 820 / topBgImg.height);
        const dw = topBgImg.width * sc;
        const dh = topBgImg.height * sc;
        ctx.drawImage(topBgImg, (W - dw) / 2, 0, dw, dh);
    }
    const fadeGrad = ctx.createLinearGradient(0, 680, 0, 810);
    fadeGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
    fadeGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.45)");
    fadeGrad.addColorStop(1, "rgba(255, 255, 255, 0.98)");
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, 660, W, 160);
    ctx.restore();

    // Top Organizers
    ctx.fillStyle = "#0f172a";
    ctx.font = "italic 800 32px 'Red Hat Display', Montserrat, sans-serif";
    ctx.fillText("Our Event Organisers :", 50, 100);
    const orgLogos = await loadImage("/organizer_logos.png");
    if (orgLogos) {
        ctx.drawImage(orgLogos, 50, 120, 980, (980/orgLogos.width) * orgLogos.height);
    } else {
        const logoFiles = [
            "/COMPANY_LOGOS/IDIAS.jpg", 
            "/COMPANY_LOGOS/WYN.jpg", 
            "/COMPANY_LOGOS/ICON.jpg", 
            "/COMPANY_LOGOS/PROSUMMITS.jpg",
            "/COMPANY_LOGOS/IDIAS.jpg", 
            "/COMPANY_LOGOS/WYN.jpg", 
            "/COMPANY_LOGOS/ICON.jpg", 
            "/COMPANY_LOGOS/PROSUMMITS.jpg"
        ];
        const loadedLogos = await Promise.all(logoFiles.map(loadImage));
        const active = loadedLogos.filter(Boolean);
        if (active.length > 0) {
            const spacing = 1006 / active.length;
            active.forEach((logo, i) => {
                const lx = 37 + i * spacing;
                const aspect = logo.width / logo.height;
                const lw = Math.min(70 * aspect, spacing - 16);
                ctx.save();
                roundRect(ctx, lx, 105, lw + 12, 70, 8);
                ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
                ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.drawImage(logo, lx + 6, 110, lw, 60);
                ctx.restore();
            });
        }
    }

    // Glowing Orange Title Banner
    const bannerX = 75;
    const bannerY = 219;
    const bannerW = 930;
    const bannerH = 102;
    const bannerR = 51; // Pill shape

    ctx.save();
    ctx.shadowColor = "rgba(234, 88, 12, 0.6)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, bannerX, bannerY, bannerW, bannerH, bannerR);
    const gradient = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY);
    gradient.addColorStop(0, "#ea580c");
    gradient.addColorStop(1, "#f97316");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, bannerX, bannerY, bannerW, bannerH, bannerR);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    const eventName = (speaker.eventName || "WL-WH GLOBAL CONGRESS 2026").toUpperCase();
    ctx.save();
    let bannerFontSize = 72;
    ctx.font = `900 ${bannerFontSize}px 'Red Hat Display', Montserrat, sans-serif`;
    while (ctx.measureText(eventName).width > 860 && bannerFontSize > 36) {
        bannerFontSize -= 2;
        ctx.font = `900 ${bannerFontSize}px 'Red Hat Display', Montserrat, sans-serif`;
    }
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 6;
    ctx.fillText(eventName, 540, bannerY + bannerH / 2);
    ctx.restore();

    // Circular Speaker Image
    const cx = 540;
    const cy = 755;
    const r = 345;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#e0f2fe";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 7, 0, 2 * Math.PI);
    ctx.clip();
    const photoUrl = speaker.croppedPhotoUrl || speaker.photoUrl || speaker.photo_url;
    const speakerPhoto = await loadImage(photoUrl);
    if (speakerPhoto) {
        const sc = Math.max(((r-7)*2)/speakerPhoto.width, ((r-7)*2)/speakerPhoto.height);
        const dw = speakerPhoto.width * sc;
        const dh = speakerPhoto.height * sc;
        ctx.drawImage(speakerPhoto, cx - dw/2, cy - dh/2, dw, dh);
    }
    ctx.restore();

    ctx.lineWidth = 14;
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, r - 7, 0, 2 * Math.PI);
    ctx.stroke();

    // Flag
    const flagCardX = 760;
    const flagCardY = 880;
    const flagCardW = 260;
    const flagCardH = 155;
    const flagCardR = 24;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;
    roundRect(ctx, flagCardX, flagCardY, flagCardW, flagCardH, flagCardR);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
    
    const flagW = 190;
    const flagH = 125;
    const flagX = flagCardX + (flagCardW - flagW) / 2;
    const flagY = flagCardY + (flagCardH - flagH) / 2;
    await drawCountryFlag(ctx, flagX, flagY, flagW, flagH, speaker.country || "ae");

    // Speaker Info
    const speakerDisplayName = speaker.name || "Speaker Name";
    ctx.save();
    let nameFontSize = 96;
    ctx.font = `900 ${nameFontSize}px 'Red Hat Display', Montserrat, sans-serif`;
    while (ctx.measureText(speakerDisplayName).width > 900 && nameFontSize > 40) {
        nameFontSize -= 2;
        ctx.font = `900 ${nameFontSize}px 'Red Hat Display', Montserrat, sans-serif`;
    }
    ctx.fillStyle = "#f97316";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(speakerDisplayName, 540, 1170);
    ctx.restore();

    drawTaperedDivider(ctx, 325, 755, 1232);

    ctx.fillStyle = "#334155";
    ctx.font = "italic 500 40px 'Red Hat Display', Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(speaker.role || speaker.designation || "Keynote Speaker", 540, 1266);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 44px 'Red Hat Display', Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let infoText = "";
    if (speaker.day || speaker.timeSlot || speaker.conferenceRoom) {
        const d = speaker.day ? speaker.day.replace("November", "Nov").trim() : "";
        const t = speaker.timeSlot ? speaker.timeSlot.replace(" (Lunch)", "").trim() : "";
        const r = speaker.conferenceRoom || "Room 2";
        infoText = [d, t, r].filter(Boolean).join(" | ");
    } else {
        infoText = "25-26 November, 2026 | Dubai, UAE";
    }
    ctx.fillText(infoText, 540, 1340);

    // Bottom Waves (Orange) - Draw BEFORE QR Code
    ctx.save();
    
    // Layer 1: Dark Mahogany (Background)
    ctx.beginPath();
    ctx.moveTo(0, 1480);
    ctx.bezierCurveTo(350, 1380, 650, 1650, 1080, 1450);
    ctx.lineTo(1080, 1800);
    ctx.lineTo(0, 1800);
    ctx.closePath();
    const grad1 = ctx.createLinearGradient(0, 1400, W, H);
    grad1.addColorStop(0, "#7c2d12"); 
    grad1.addColorStop(1, "#431407");
    ctx.fillStyle = grad1;
    ctx.fill();

    // Layer 2: Rich Crimson Orange
    ctx.beginPath();
    ctx.moveTo(0, 1530);
    ctx.bezierCurveTo(400, 1420, 700, 1720, 1080, 1520);
    ctx.lineTo(1080, 1800);
    ctx.lineTo(0, 1800);
    ctx.closePath();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = -5;
    const grad2 = ctx.createLinearGradient(0, 1500, W, H);
    grad2.addColorStop(0, "#c2410c"); 
    grad2.addColorStop(1, "#7c2d12");
    ctx.fillStyle = grad2;
    ctx.fill();

    // Layer 3: Vibrant Core Orange
    ctx.beginPath();
    ctx.moveTo(0, 1580);
    ctx.bezierCurveTo(300, 1480, 750, 1750, 1080, 1580);
    ctx.lineTo(1080, 1800);
    ctx.lineTo(0, 1800);
    ctx.closePath();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 20;
    const grad3 = ctx.createLinearGradient(0, 1580, W, H);
    grad3.addColorStop(0, "#ea580c"); 
    grad3.addColorStop(1, "#9a3412");
    ctx.fillStyle = grad3;
    ctx.fill();

    // Layer 4: Bright Tangerine (Foreground)
    ctx.beginPath();
    ctx.moveTo(0, 1660);
    ctx.bezierCurveTo(450, 1560, 800, 1800, 1080, 1660);
    ctx.lineTo(1080, 1800);
    ctx.lineTo(0, 1800);
    ctx.closePath();
    ctx.shadowColor = "rgba(234, 88, 12, 0.5)";
    ctx.shadowBlur = 25;
    const grad4 = ctx.createLinearGradient(0, 1660, W, H);
    grad4.addColorStop(0, "#fb923c"); 
    grad4.addColorStop(1, "#ea580c");
    ctx.fillStyle = grad4;
    ctx.fill();

    // Reset shadow for line art
    ctx.shadowColor = "transparent";
    ctx.shadowOffsetY = 0;

    // Flowing glowing neon lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 1500); ctx.bezierCurveTo(350, 1400, 650, 1670, 1080, 1470); ctx.stroke();
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 1550); ctx.bezierCurveTo(400, 1440, 700, 1740, 1080, 1540); ctx.stroke();
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(255,255,255,0.7)";
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(0, 1600); ctx.bezierCurveTo(300, 1500, 750, 1770, 1080, 1600); ctx.stroke();

    ctx.restore();

    // QR Code - Draw AFTER Bottom Waves
    const qrSize = 185;
    const qrTilePadding = 10;
    const qrTileX = 448 - qrTilePadding; // 438
    const qrTileY = 1395 - qrTilePadding; // 1385
    const qrTileSize = qrSize + qrTilePadding * 2; // 205

    // White tile
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.10)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, qrTileX, qrTileY, qrTileSize, qrTileSize, 12);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
    
    // Subtle tile outline
    ctx.save();
    roundRect(ctx, qrTileX, qrTileY, qrTileSize, qrTileSize, 12);
    ctx.strokeStyle = "rgba(226, 232, 240, 0.9)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    try {
        const qrUrl = speaker.qrUrl || (typeof window !== "undefined" ? `${window.location.origin}/check-in/${speaker.id}` : speaker.id || "SPEAKER");
        const qrDataUrl = await QRCode.toDataURL(qrUrl, { 
            width: 400 * scale,
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" }
        });
        const qrImg = await loadImage(qrDataUrl);
        if (qrImg) ctx.drawImage(qrImg, 448, 1395, qrSize, qrSize);
    } catch(e) {
        console.warn("QR generation failed:", e);
    }

    // Export to blob
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
            resolve({
                dataUrl,
                blob,
                filename: `WL-WH-2026-ID-${(speaker.name || "Speaker").replace(/\s+/g, "_")}.jpg`,
                speaker,
                isStored: false,
            });
        }, "image/jpeg", 0.95);
    });
}

export async function generateIdCardJpeg(speaker) {
    if (speaker.conferenceRoom && (speaker.conferenceRoom.toLowerCase().includes("room 2") || speaker.conferenceRoom === "2")) {
        return await generateRoom2IdCardJpeg(speaker);
    }
    const W = 1080;
    const H = 1800;
    const scale = 2; // Optimal balance for high clarity (~2MB file size)
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Pure white canvas background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // ═══════════════════════════════════════════════════════════════════════════
    // FIXED ASSET 1: top_bg.jpg (aerial photo of Palm Jumeirah, Dubai)
    // x=0, y=0, width 1080, height ~800, object-fit: cover.
    // Bottom edge is a soft curved wave fading into white (around y=780–810).
    // ═══════════════════════════════════════════════════════════════════════════
    const topBgImg = (await loadImage(`/top_bg.jpg?v=dubai_${Date.now()}`)) || (await loadImage("/dubai_bg.jpg"));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 805);
    // Soft curved wave bottom edge
    ctx.bezierCurveTo(W * 0.65, 825, W * 0.35, 775, 0, 795);
    ctx.closePath();
    ctx.clip();

    if (topBgImg) {
        const sc = Math.max(W / topBgImg.width, 820 / topBgImg.height);
        const dw = topBgImg.width * sc;
        const dh = topBgImg.height * sc;
        ctx.drawImage(topBgImg, (W - dw) / 2, 0, dw, dh);
    }

    // Soft gradient fading into white (around y=780–810)
    const fadeGrad = ctx.createLinearGradient(0, 680, 0, 810);
    fadeGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
    fadeGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.45)");
    fadeGrad.addColorStop(1, "rgba(255, 255, 255, 0.98)");
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, 660, W, 160);
    ctx.restore();

    // ═══════════════════════════════════════════════════════════════════════════
    // FIXED ASSET 3: bottom_waves.png
    // ═══════════════════════════════════════════════════════════════════════════
    // Disable image loading to use the programmatic GREEN waves
    const bottomWavesImg = null;
    if (bottomWavesImg) {
        ctx.drawImage(bottomWavesImg, 0, 1420, 1080, 380);
    } else {
        // Layered waves rendering
        // Layer 1: Bright Green wave
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 1430);
        ctx.bezierCurveTo(W * 0.35, 1460, W * 0.65, 1610, W, 1650);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        const wave1Grad = ctx.createLinearGradient(0, 1430, W, H);
        wave1Grad.addColorStop(0, "#166534"); // green-800
        wave1Grad.addColorStop(1, "#22c55e"); // green-500
        ctx.fillStyle = wave1Grad;
        ctx.fill();
        ctx.restore();

        // Layer 2: Deep Forest Green wave
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 1510);
        ctx.bezierCurveTo(W * 0.4, 1540, W * 0.7, 1640, W, 1690);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        const wave2Grad = ctx.createLinearGradient(0, 1510, W, H);
        wave2Grad.addColorStop(0, "#14532d"); // green-900
        wave2Grad.addColorStop(1, "#052e16"); // green-950
        ctx.fillStyle = wave2Grad;
        ctx.fill();
        ctx.restore();

        // Thin flowing white line-art curves on top
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 1430);
        ctx.bezierCurveTo(W * 0.35, 1460, W * 0.65, 1610, W, 1650);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 1465);
        ctx.bezierCurveTo(W * 0.35, 1495, W * 0.7, 1630, W, 1670);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.40)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 1510);
        ctx.bezierCurveTo(W * 0.4, 1540, W * 0.7, 1640, W, 1690);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 1555);
        ctx.bezierCurveTo(W * 0.35, 1590, W * 0.75, 1670, W, 1720);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.30)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. LABEL: "Our Event Organisers :" at x=37, y=63. Bold italic, 30 px, green.
    // ═══════════════════════════════════════════════════════════════════════════
    ctx.save();
    ctx.font = "italic bold 30px 'Red Hat Display', Montserrat, Inter, -apple-system, sans-serif";
    ctx.fillStyle = "#064e3b"; // emerald-900

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
    ctx.shadowBlur = 4;
    ctx.fillText("Our Event Organisers :", 37, 63);
    ctx.restore();

    // ═══════════════════════════════════════════════════════════════════════════
    // FIXED ASSET 2: organizer_logos.png
    // Row of 6 organizer logos (IDIAS, WYN, ICON Global, Prosummits, PeerCite, WYN mic).
    // Place at x=37, y=105, height ~70, spaced across the width.
    // ═══════════════════════════════════════════════════════════════════════════
    const organizerLogosImg = await loadImage("/organizer_logos.png");
    if (organizerLogosImg) {
        ctx.drawImage(organizerLogosImg, 37, 105, 1006, 70);
    } else {
        // Fallback: draw organizer logo candidates in clean pills across the width
        const logoFiles = ["/COMPANY_LOGOS/IDIAS.jpg", "/COMPANY_LOGOS/WYN.jpg", "/COMPANY_LOGOS/ICON.jpg", "/COMPANY_LOGOS/PROSUMMITS.jpg"];
        const loadedLogos = await Promise.all(logoFiles.map(loadImage));
        const active = loadedLogos.filter(Boolean);
        if (active.length > 0) {
            const spacing = 1006 / active.length;
            active.forEach((logo, i) => {
                const lx = 37 + i * spacing;
                const aspect = logo.width / logo.height;
                const lw = Math.min(70 * aspect, spacing - 16);
                ctx.save();
                roundRect(ctx, lx, 105, lw + 12, 70, 8);
                ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
                ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.drawImage(logo, lx + 6, 110, lw, 60);
                ctx.restore();
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. BANNER: rounded pill, x=75 to 1005, y=219 to 321 (930×102)
    //    Green gradient, 3 px white outline, soft inner glow.
    //    Text "{{event_name}}", bold uppercase white, 72 px, centered.
    // ═══════════════════════════════════════════════════════════════════════════
    const bannerX = 75;
    const bannerY = 219;
    const bannerW = 930;
    const bannerH = 102;
    const bannerR = 51; // Pill shape

    // Drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(22, 101, 52, 0.35)"; // green-800 shadow
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, bannerX, bannerY, bannerW, bannerH, bannerR);
    const bannerGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY);
    bannerGrad.addColorStop(0, "#15803d"); // green-700
    bannerGrad.addColorStop(1, "#22c55e"); // green-500
    ctx.fillStyle = bannerGrad;
    ctx.fill();
    ctx.restore();

    // 3 px white outline
    ctx.save();
    roundRect(ctx, bannerX, bannerY, bannerW, bannerH, bannerR);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    // Banner Text
    const eventName = (speaker.eventName || "WL-WH GLOBAL CONGRESS 2026").toUpperCase();
    ctx.save();
    let bannerFontSize = 72;
    ctx.font = `bold ${bannerFontSize}px 'Red Hat Display', Montserrat, Inter, -apple-system, sans-serif`;
    while (ctx.measureText(eventName).width > 860 && bannerFontSize > 36) {
        bannerFontSize -= 2;
        ctx.font = `bold ${bannerFontSize}px 'Red Hat Display', Montserrat, Inter, -apple-system, sans-serif`;
    }
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 6;
    ctx.fillText(eventName, 540, bannerY + bannerH / 2);
    ctx.restore();

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. SPEAKER PHOTO: circle, outer diameter 690 px, center (540, 755),
    //    top y=410, bottom y=1100. 14 px white ring plus soft drop shadow.
    //    Headshot cropped chest-up (object-fit: cover). Overlaps photo/white boundary.
    // ═══════════════════════════════════════════════════════════════════════════
    const photoCX = 540;
    const photoCY = 755;
    const photoOuterR = 345; // 690 px diameter

    // Soft drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.24)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 12;
    ctx.beginPath();
    ctx.arc(photoCX, photoCY, photoOuterR, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    // 14 px white ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoCX, photoCY, photoOuterR - 7, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.restore();

    // Photo circle clip
    const photoInnerR = photoOuterR - 14; // 331 px
    let speakerPhoto = null;
    if (speaker.croppedPhotoUrl) {
        speakerPhoto = await loadImage(speaker.croppedPhotoUrl);
    } else if (speaker.photoUrl || speaker.photo_url) {
        speakerPhoto = await loadImage(speaker.photoUrl || speaker.photo_url);
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(photoCX, photoCY, photoInnerR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (speakerPhoto) {
        const sc = Math.max((photoInnerR * 2) / speakerPhoto.width, (photoInnerR * 2) / speakerPhoto.height);
        const dw = speakerPhoto.width * sc;
        const dh = speakerPhoto.height * sc;
        ctx.drawImage(speakerPhoto, photoCX - dw / 2, photoCY - dh / 2, dw, dh);
    } else {
        // Fallback neutral light-grey with corporate initials
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(photoCX - photoInnerR, photoCY - photoInnerR, photoInnerR * 2, photoInnerR * 2);
        ctx.fillStyle = "#1E5FC0";
        ctx.font = "bold 130px 'Red Hat Display', Montserrat, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const initials = (speaker.name || "WL").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
        ctx.fillText(initials, photoCX, photoCY);
    }
    ctx.restore();

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. FLAG CARD: white rounded card (radius 24), 260×155 px, at x=760, y=880,
    //    with subtle shadow. Flag of {{country}} inside at ~190×125, centered.
    //    Overlaps bottom-right of circle.
    // ═══════════════════════════════════════════════════════════════════════════
    const flagCardX = 760;
    const flagCardY = 880;
    const flagCardW = 260;
    const flagCardH = 155;
    const flagCardR = 24;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.20)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, flagCardX, flagCardY, flagCardW, flagCardH, flagCardR);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    // Flag centered inside card (190×125)
    const flagW = 190;
    const flagH = 125;
    const flagX = flagCardX + (flagCardW - flagW) / 2; // 795
    const flagY = flagCardY + (flagCardH - flagH) / 2; // 895
    await drawCountryFlag(ctx, flagX, flagY, flagW, flagH, speaker.country || "ae");

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. NAME "{{speaker_name}}": center y=1170, bold, 96 px, color green
    //    rounded geometric sans (Red Hat Display). Shrink-to-fit if wider than 900 px.
    // ═══════════════════════════════════════════════════════════════════════════
    const speakerDisplayName = speaker.name || "Speaker Name";
    ctx.save();
    let nameFontSize = 96;
    ctx.font = `bold ${nameFontSize}px 'Red Hat Display', Montserrat, Inter, -apple-system, sans-serif`;
    while (ctx.measureText(speakerDisplayName).width > 900 && nameFontSize > 40) {
        nameFontSize -= 2;
        ctx.font = `bold ${nameFontSize}px 'Red Hat Display', Montserrat, Inter, -apple-system, sans-serif`;
    }
    ctx.fillStyle = "#16a34a"; // green-600
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(speakerDisplayName, 540, 1170);
    ctx.restore();

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. DIVIDER: 2 px dark line, x=325 to 755, y=1232, tapering at both ends.
    // ═══════════════════════════════════════════════════════════════════════════
    drawTaperedDivider(ctx, 325, 755, 1232);

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. ROLE "{{role}}": center y=1266, italic regular, 40 px, #333.
    // ═══════════════════════════════════════════════════════════════════════════
    const roleText = (speaker.role && speaker.role.toLowerCase() !== "speaker")
        ? speaker.role
        : "Keynote Speaker";
    ctx.save();
    ctx.font = "italic 40px 'Red Hat Display', Montserrat, Inter, -apple-system, sans-serif";
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(roleText, 540, 1266);
    ctx.restore();

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. DATES "{{dates}} | {{city_country}}": center y=1340, bold, 44 px, green.
    // ═══════════════════════════════════════════════════════════════════════════
    let datesText = "";
    if (speaker.day || speaker.timeSlot || speaker.conferenceRoom) {
        const d = speaker.day ? speaker.day.replace("November", "Nov").trim() : "";
        const t = speaker.timeSlot ? speaker.timeSlot.replace(" (Lunch)", "").trim() : "";
        const r = speaker.conferenceRoom || "Room 1";
        datesText = [d, t, r].filter(Boolean).join(" | ");
    } else {
        const dates = speaker.dates || "25–26 November, 2026";
        const cityCountry = speaker.cityCountry || "Dubai, UAE";
        datesText = `${dates} | ${cityCountry}`;
    }

    ctx.save();
    ctx.font = "bold 44px 'Red Hat Display', Montserrat, Inter, -apple-system, sans-serif";
    ctx.fillStyle = "#064e3b"; // emerald-900
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "0.5px";
    ctx.fillText(datesText, 540, 1340);
    ctx.restore();

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. QR CODE encoding {{qr_url}}: 185×185 px at x=448, y=1395,
    //    on a white tile with 10 px padding. Generate with real QR library.
    //    Optional small badge ID text below QR (16 px, grey, y=1590).
    // ═══════════════════════════════════════════════════════════════════════════
    const qrSize = 185;
    const qrTilePadding = 10;
    const qrTileX = 448 - qrTilePadding; // 438
    const qrTileY = 1395 - qrTilePadding; // 1385
    const qrTileSize = qrSize + qrTilePadding * 2; // 205

    // White tile
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.10)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, qrTileX, qrTileY, qrTileSize, qrTileSize, 12);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    // Subtle tile outline
    ctx.save();
    roundRect(ctx, qrTileX, qrTileY, qrTileSize, qrTileSize, 12);
    ctx.strokeStyle = "rgba(226, 232, 240, 0.9)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    try {
        const qrUrl = speaker.qrUrl || (typeof window !== "undefined" ? `${window.location.origin}/check-in/${speaker.id}` : speaker.id || "SPEAKER");
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
            width: 400 * scale,
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
        });
        const qrImg = await loadImage(qrDataUrl);
        if (qrImg) {
            ctx.drawImage(qrImg, 448, 1395, qrSize, qrSize);
        }
    } catch (err) {
        console.warn("QR generation failed:", speaker.id, err);
    }

    // Small badge ID text below QR at y=1590
    ctx.save();
    ctx.font = "600 16px 'Courier New', monospace";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`ID: ${speaker.id || "—"}`, 540, 1590);
    ctx.restore();

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPORT AS JPEG, 1080×1800
    // ═══════════════════════════════════════════════════════════════════════════
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
                const safeName = (speaker.name || "speaker").replace(/[^a-zA-Z0-9_-]/g, "_");
                const filename = `ID_Badge_${safeName}_${speaker.id}.jpg`;
                resolve({ id: speaker.id, speaker, dataUrl, blob, filename, templateVersion: "v5_country_flags" });
            },
            "image/jpeg",
            0.92
        );
    });
}
