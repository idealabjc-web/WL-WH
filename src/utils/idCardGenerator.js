// Generates high-resolution JPEG ID Card badges matching the WL-WH 2025 conference template

const LOGO_CANDIDATES = [
    ["/COMPANY_LOGOS/WYN.jpg", "/WYN.jpg"],
    ["/COMPANY_LOGOS/IDIAS.jpg", "/IDIAS.jpg"],
    ["/COMPANY_LOGOS/ICON.jpg", "/ICON.jpg"],
    ["/COMPANY_LOGOS/PROSUMMITS.jpg", "/PROSUMMITS.jpg"],
];

function loadImage(src) {
    return new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

// Preload logos with automatic fallback across path locations
let cachedLogos = null;
async function getOrganizerLogos() {
    if (!cachedLogos) {
        cachedLogos = await Promise.all(
            LOGO_CANDIDATES.map(async (paths) => {
                for (const p of paths) {
                    const img = await loadImage(p);
                    if (img) return img;
                }
                return null;
            })
        );
    }
    return cachedLogos;
}

export async function generateIdCardJpeg(speaker) {
    const width = 600;
    const height = 1000;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // 1. White Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // 2. Top Decorative Ribbon Waves
    // Layer 1: Dark Navy Blue
    ctx.fillStyle = "#0c2854";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, 85);
    ctx.bezierCurveTo(width * 0.7, 130, width * 0.35, 45, 0, 105);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Medium Azure Wave
    ctx.fillStyle = "#1d6bc0";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, 50);
    ctx.bezierCurveTo(width * 0.65, 95, width * 0.3, 20, 0, 75);
    ctx.closePath();
    ctx.fill();

    // Layer 3: Vibrant Cyan Accent Wave
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width * 0.45, 0);
    ctx.bezierCurveTo(width * 0.3, 40, width * 0.15, 45, 0, 50);
    ctx.closePath();
    ctx.fill();

    // 3. Organizer Section: "Our Event Organizers :"
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px Inter, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Our Event Organizers :", 24, 142);

    // Render 4 Company Logos
    const logos = await getOrganizerLogos();
    let logoX = 188;
    const logoY = 120;
    const logoHeight = 32;

    logos.forEach((logo) => {
        if (logo) {
            const aspect = logo.width / logo.height;
            const logoWidth = Math.min(logoHeight * aspect, 85);
            ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
            logoX += logoWidth + 14;
        }
    });

    // 4. Conference Title (Navy Blue, Bold)
    ctx.fillStyle = "#0a2540";
    ctx.font = "bold 20px Inter, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WOMEN LEADERSHIP - WOMEN", width / 2, 200);
    ctx.fillText("HEALTH (WL - WH 2025)", width / 2, 235);

    // Subtitle / Date & Location
    ctx.fillStyle = "#0f172a";
    ctx.font = "600 13px Inter, -apple-system, sans-serif";
    ctx.fillText("September 08-09, 2025 | Miami, Florida.", width / 2, 280);

    // 5. Flowing Cyan Accent Waves behind avatar
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 420 + i * 14);
        ctx.bezierCurveTo(width * 0.25, 360 + i * 20, width * 0.75, 590 + i * 15, width, 520 + i * 14);
        ctx.stroke();
    }
    ctx.restore();

    // 6. Center Circular Photo
    const avatarCenterX = width / 2;
    const avatarCenterY = 475;
    const avatarRadius = 140;

    let speakerPhoto = null;
    if (speaker.photoUrl) {
        try {
            speakerPhoto = await loadImage(speaker.photoUrl);
        } catch (e) {
            console.warn("Could not load photo for", speaker.name, e);
        }
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    if (speakerPhoto) {
        const scale = Math.max((avatarRadius * 2) / speakerPhoto.width, (avatarRadius * 2) / speakerPhoto.height);
        const drawW = speakerPhoto.width * scale;
        const drawH = speakerPhoto.height * scale;
        const drawX = avatarCenterX - drawW / 2;
        const drawY = avatarCenterY - drawH / 2;
        ctx.drawImage(speakerPhoto, drawX, drawY, drawW, drawH);
    } else {
        const grad = ctx.createLinearGradient(0, avatarCenterY - avatarRadius, 0, avatarCenterY + avatarRadius);
        grad.addColorStop(0, "#334155");
        grad.addColorStop(1, "#1e293b");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 56px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const initials = (speaker.name || "WL")
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
        ctx.fillText(initials, avatarCenterX, avatarCenterY);
    }
    ctx.restore();

    // Blue Border Ring around Circular Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // 7. Speaker Name (Bold Uppercase)
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 26px Inter, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const speakerName = (speaker.name || "SPEAKER").toUpperCase();
    ctx.fillText(speakerName, width / 2, 680);

    // 8. Speaker Role (Bold Blue)
    ctx.fillStyle = "#0056b3";
    ctx.font = "bold 20px Inter, -apple-system, sans-serif";
    const roleText = (speaker.role || "SPEAKER").toUpperCase();
    ctx.fillText(roleText, width / 2, 730);

    // 9. Black Horizontal Divider Line
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(width / 2 - 120, 755, 240, 3.5);

    // 10. ID Number
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 23px Inter, -apple-system, monospace";
    ctx.fillText(`ID NO: ${speaker.id}`, width / 2, 800);

    // 11. Bottom Decorative Waves
    // Layer 1: Dark Navy Blue Base
    ctx.fillStyle = "#0c2854";
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height - 100);
    ctx.bezierCurveTo(width * 0.75, height - 40, width * 0.3, height - 130, 0, height - 85);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Medium Blue Curve
    ctx.fillStyle = "#1d6bc0";
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height - 70);
    ctx.bezierCurveTo(width * 0.6, height - 120, width * 0.25, height - 20, 0, height - 60);
    ctx.closePath();
    ctx.fill();

    // Layer 3: Vibrant Light Blue Accent
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(width, height);
    ctx.lineTo(width * 0.55, height);
    ctx.bezierCurveTo(width * 0.7, height - 35, width * 0.85, height - 40, width, height - 45);
    ctx.closePath();
    ctx.fill();

    // Export as JPEG with 0.95 quality
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
                const safeName = (speaker.name || "speaker").replace(/[^a-zA-Z0-9_-]/g, "_");
                const filename = `ID_Card_${safeName}_${speaker.id}.jpg`;
                resolve({
                    id: speaker.id,
                    speaker,
                    dataUrl,
                    blob,
                    filename,
                });
            },
            "image/jpeg",
            0.95
        );
    });
}
