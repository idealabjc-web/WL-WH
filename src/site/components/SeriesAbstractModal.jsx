import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Send } from "lucide-react";

/**
 * Reusable themed Call-for-Abstracts modal for flagship event pages.
 */
export default function SeriesAbstractModal({
    isOpen,
    onClose,
    seriesLabel,
    subtitle,
    tracks = [],
    defaultTrackId = "",
    namePlaceholder = "e.g. Dr. Alex Mercer, MD, PhD",
    emailPlaceholder = "e.g. alex.mercer@hospital.org",
    institutionPlaceholder = "e.g. University Health Network",
    titlePlaceholder = "e.g. Clinical AI in Precision Medicine",
    accentColor = "#E5484D",
    accentBorder = "rgba(248, 113, 113, 0.35)",
    titleClass = "sc-crimson-text",
    buttonClass = "sc-btn sc-btn-crimson",
}) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        institution: "",
        track: defaultTrackId || tracks[0]?.id || "",
        presentationTitle: "",
        abstractText: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (defaultTrackId) {
            setFormData((prev) => ({ ...prev, track: defaultTrackId }));
        }
    }, [defaultTrackId]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
        }, 700);
    };

    const inputStyle = {
        width: "100%",
        height: "44px",
        padding: "0 14px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid var(--sc-border-strong)",
        color: "#fff",
        outline: "none",
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 110,
                background: "rgba(3, 5, 15, 0.88)",
                backdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "linear-gradient(145deg, #0e1329, #080b18)",
                    border: `1px solid ${accentBorder}`,
                    borderRadius: "28px",
                    maxWidth: "600px",
                    width: "100%",
                    padding: "36px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    position: "relative",
                    boxShadow: `0 30px 100px rgba(0,0,0,0.8), 0 0 50px -10px ${accentColor}40`,
                }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid var(--sc-border)",
                        borderRadius: "50%",
                        width: "36px",
                        height: "36px",
                        display: "grid",
                        placeItems: "center",
                        color: "#fff",
                        cursor: "pointer",
                    }}
                    aria-label="Close modal"
                >
                    <X size={18} />
                </button>

                {submitted ? (
                    <div style={{ textAlign: "center", padding: "30px 10px" }}>
                        <div
                            style={{
                                width: "68px",
                                height: "68px",
                                borderRadius: "50%",
                                background: "rgba(74, 222, 128, 0.15)",
                                border: "1px solid #4ade80",
                                display: "grid",
                                placeItems: "center",
                                margin: "0 auto 20px",
                                color: "#4ade80",
                            }}
                        >
                            <CheckCircle2 size={36} />
                        </div>
                        <h3 style={{ fontFamily: "var(--sc-display)", fontSize: "26px", marginBottom: "10px" }}>
                            Abstract Proposal Received!
                        </h3>
                        <p style={{ color: "var(--sc-muted)", fontSize: "15px", lineHeight: "1.6" }}>
                            Thank you, <b>{formData.fullName}</b>. Your submission for the <b>{seriesLabel}</b> has been logged.
                            Our Scientific Steering Committee will contact you at <b>{formData.email}</b> within 3–5 business days.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSubmitted(false);
                                onClose();
                            }}
                            className={buttonClass}
                            style={{ marginTop: "24px" }}
                        >
                            <span>Done</span>
                        </button>
                    </div>
                ) : (
                    <div>
                        <span className="sc-eyebrow" style={{ color: accentColor }}>
                            CALL FOR SPEAKERS · {seriesLabel.toUpperCase()}
                        </span>
                        <h2 style={{ fontFamily: "var(--sc-display)", fontSize: "28px", margin: "6px 0 12px" }}>
                            Submit Your <span className={titleClass}>Abstract</span>
                        </h2>
                        <p style={{ color: "var(--sc-muted)", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
                            {subtitle}
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                    Full Name &amp; Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder={namePlaceholder}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                    Official Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder={emailPlaceholder}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                    Institution / Hospital / Organization *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.institution}
                                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                    placeholder={institutionPlaceholder}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                    Summit Track *
                                </label>
                                <select
                                    value={formData.track}
                                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                                    style={{ ...inputStyle, background: "#101633" }}
                                >
                                    {tracks.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                    Presentation / Keynote Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.presentationTitle}
                                    onChange={(e) => setFormData({ ...formData, presentationTitle: e.target.value })}
                                    placeholder={titlePlaceholder}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sc-muted)", marginBottom: "6px" }}>
                                    Abstract Summary (200 – 400 words) *
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={formData.abstractText}
                                    onChange={(e) => setFormData({ ...formData, abstractText: e.target.value })}
                                    placeholder="Summarize your core hypothesis, methodologies, clinical results, and global significance..."
                                    style={{
                                        ...inputStyle,
                                        height: "auto",
                                        padding: "12px 14px",
                                        resize: "vertical",
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={buttonClass}
                                style={{ height: "48px", marginTop: "10px", width: "100%" }}
                            >
                                {submitting ? (
                                    <span>Submitting Proposal...</span>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        <span>Submit Keynote Abstract</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

