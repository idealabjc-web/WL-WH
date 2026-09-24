import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import { TIME_SLOTS, EVENT_DAYS } from '../api/speakersApi';

export default function AgendaPoster({ speakers, room }) {
    const posterRef = useRef(null);

    const downloadJPEG = async () => {
        if (!posterRef.current) return;
        try {
            const canvas = await html2canvas(posterRef.current, { scale: 2, useCORS: true });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.download = `Agenda_${room.replace(/\s+/g, '_')}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Failed to generate poster:", error);
            alert("Failed to download JPEG. Check console for details.");
        }
    };

    const getSpeaker = (day, timeSlot) => {
        return speakers.find(s => s.conferenceRoom === room && s.day === day && s.timeSlot === timeSlot);
    };

    const redColor = "#c00000"; // Deep vibrant red matching the canva
    const blackColor = "#111111";

    // Reconstruct the Canva slot design
    const renderSlot = (timeSlot, day) => {
        const isLunch = timeSlot.toLowerCase().includes("lunch");
        const speaker = getSpeaker(day, timeSlot);

        if (isLunch) {
            return (
                <div key={timeSlot} className="flex items-center w-full mb-1.5 rounded-full overflow-hidden border-[1.5px] border-black bg-[#c00000] shadow-sm relative h-[36px]">
                    <div className="flex-1 text-center font-bold text-white text-[13px] tracking-wide pl-2 uppercase font-sans block" style={{ lineHeight: "33px" }}>LUNCH BREAK</div>
                    <div className="bg-white text-black font-bold text-[11px] rounded-full border-[1.5px] border-[#c00000] px-3 mx-1 flex items-center justify-center shrink-0 min-w-[86px] h-[28px] font-sans">
                        {timeSlot.replace(" (Lunch)", "")}
                    </div>
                </div>
            );
        }

        const initial = speaker ? (speaker.name ? speaker.name.charAt(0).toUpperCase() : "?") : "?";

        // Available slot but not assigned
        if (!speaker) {
            return (
                <div key={timeSlot} className="flex items-center w-full mb-1.5 rounded-full overflow-hidden border-[1.5px] border-black bg-[#c00000] shadow-sm relative h-[36px]">
                    <div className="w-[34px] h-[34px] bg-black/40 rounded-md shrink-0 -ml-[1.5px] border-[1.5px] border-black flex items-center justify-center text-white/50 text-[14px]">?</div>
                    <div className="flex-1 text-left font-bold text-white text-[13px] px-3 font-sans opacity-60 overflow-hidden whitespace-nowrap block" style={{ lineHeight: "33px" }}>TBA</div>
                    <div className="bg-white text-black font-bold text-[11px] rounded-full border-[1.5px] border-[#c00000] px-3 mx-1 flex items-center justify-center shrink-0 min-w-[86px] h-[28px] font-sans z-10">
                        {timeSlot}
                    </div>
                </div>
            );
        }

        return (
            <div key={timeSlot} className="flex items-center w-full mb-1.5 rounded-full overflow-hidden border-[1.5px] border-black bg-[#c00000] shadow-sm relative h-[36px]">
                {speaker.photoUrl ? (
                    <>
                        <img 
                            src={speaker.photoUrl} 
                            alt={speaker.name} 
                            className="w-[34px] h-[34px] object-cover rounded-md shrink-0 -ml-[1.5px] border-[1.5px] border-black bg-white z-10"
                            crossOrigin="anonymous"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden w-[34px] h-[34px] bg-slate-200 rounded-md shrink-0 -ml-[1.5px] border-[1.5px] border-black items-center justify-center text-slate-700 text-[13px] font-bold font-sans z-10">
                            {initial}
                        </div>
                    </>
                ) : (
                    <div className="flex w-[34px] h-[34px] bg-slate-200 rounded-md shrink-0 -ml-[1.5px] border-[1.5px] border-black items-center justify-center text-slate-700 text-[13px] font-bold font-sans z-10">
                        {initial}
                    </div>
                )}
                <div className="flex-1 text-left font-bold text-white text-[13px] px-3 font-sans overflow-hidden whitespace-nowrap uppercase block" style={{ lineHeight: "33px" }}>{speaker.name}</div>
                <div className="bg-white text-black font-bold text-[11px] rounded-full border-[1.5px] border-[#c00000] px-3 mx-1 flex items-center justify-center shrink-0 min-w-[86px] h-[28px] font-sans z-10">
                    {timeSlot}
                </div>
            </div>
        );
    };

    const bookableSlots = TIME_SLOTS;

    return (
        <div className="flex flex-col items-center py-4 bg-slate-50/50 rounded-2xl border border-slate-200">
            <button 
                onClick={downloadJPEG} 
                className="mb-6 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all"
            >
                <Download size={18} /> Download High-Res JPEG
            </button>
            
            <div className="w-full max-w-[1150px] overflow-auto border-4 border-slate-200 shadow-2xl rounded-sm bg-slate-200 p-2">
                <div 
                    ref={posterRef} 
                    className="bg-white w-[1120px] p-4 flex flex-col relative mx-auto"
                    style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif" }}
                >
                    {/* Header blocks */}
                    <div className="w-full flex flex-col mb-1.5">
                        <div className="bg-[#c00000] text-white text-center py-2.5 font-bold text-[40px] tracking-wider mb-1 border-b-2 border-white">
                            WL-WH GLOBAL CONGRESS 2026
                        </div>
                        <div className="bg-[#c00000] text-white flex justify-between px-8 py-2 font-bold text-[24px] border-b-2 border-white">
                            <div className="uppercase tracking-wide">TENTATIVE AGENDA</div>
                            <div className="uppercase tracking-wide">{room.toUpperCase()}</div>
                            <div className="uppercase tracking-wide">DUBAI, UAE</div>
                        </div>
                    </div>

                    {/* Columns area */}
                    <div className="flex flex-1 gap-2 pt-0.5">
                        
                        {/* Day 1 Column */}
                        <div className="flex-1 flex flex-col">
                            <div className="bg-[#c00000] text-white text-center py-1.5 font-bold text-[15px] mb-2 border border-[#900000]">
                                {EVENT_DAYS[0] ? EVENT_DAYS[0].toUpperCase() + ", 2026" : "NOVEMBER-25, 2026"}
                            </div>
                            
                            <div className="flex flex-col flex-1">
                                {/* Opening ceremony Day 1 */}
                                <div className="flex items-center w-full mb-1.5 rounded-full overflow-hidden border-[1.5px] border-black bg-[#c00000] shadow-sm relative h-[36px]">
                                    <div className="w-[34px] h-[34px] bg-black rounded-md shrink-0 -ml-[1.5px] border-[1.5px] border-black flex items-center justify-center text-white text-[14px] font-sans">
                                        🎤
                                    </div>
                                    <div className="flex-1 text-left font-bold text-white text-[13px] uppercase px-3 font-sans overflow-hidden whitespace-nowrap block" style={{ lineHeight: "33px" }}>OPENING CEREMONY</div>
                                </div>
                                {bookableSlots.map(slot => renderSlot(slot, EVENT_DAYS[0]))}
                            </div>
                        </div>

                        {/* Day 2 Column */}
                        <div className="flex-1 flex flex-col">
                            <div className="bg-[#c00000] text-white text-center py-1.5 font-bold text-[15px] mb-2 border border-[#900000]">
                                {EVENT_DAYS[1] ? EVENT_DAYS[1].toUpperCase() + ", 2026" : "NOVEMBER-26, 2026"}
                            </div>
                            
                            <div className="flex flex-col flex-1">
                                {/* Opening ceremony Day 2 */}
                                <div className="flex items-center w-full mb-1.5 rounded-full overflow-hidden border-[1.5px] border-black bg-[#c00000] shadow-sm relative h-[36px]">
                                    <div className="w-[34px] h-[34px] bg-black rounded-md shrink-0 -ml-[1.5px] border-[1.5px] border-black flex items-center justify-center text-white text-[14px] font-sans">
                                        🎤
                                    </div>
                                    <div className="flex-1 text-left font-bold text-white text-[13px] uppercase px-3 font-sans overflow-hidden whitespace-nowrap block" style={{ lineHeight: "33px" }}>OPENING CEREMONY</div>
                                </div>
                                {bookableSlots.map(slot => renderSlot(slot, EVENT_DAYS[1]))}
                            </div>
                        </div>

                        {/* Image / Graphic Column */}
                        <div className="flex-1 flex flex-col relative bg-slate-900 border-[1.5px] border-black overflow-hidden mb-1.5">
                            {/* Decorative column header inside the frame */}
                            <div className="w-full bg-[#c00000] text-white text-center py-1.5 font-bold text-[15px] border-b border-[#900000] z-30">
                                NOVEMBER-27, 2026
                            </div>
                            
                            <div className="flex-1 relative">
                                <img src="/images/dubai_image_1.jpg" alt="Dubai" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
                                
                                {/* Text overlay */}
                                <div className="absolute top-0 inset-x-0 flex flex-col items-center justify-start z-10 text-center pt-8 bg-gradient-to-b from-black/60 to-transparent pb-16 px-4">
                                    <h1 className="text-white text-[4rem] italic drop-shadow-md leading-none mb-[-15px] z-20 w-full" style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.4)"}}>Speakers</h1>
                                    <h1 className="text-[#c00000] text-[4.5rem] font-sans font-black tracking-widest drop-shadow-xl z-10 w-full" style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.5)"}}>TOUR</h1>
                                </div>
                                
                                {/* Center Event Highlights */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 mt-10 px-8 text-center">
                                    <div className="bg-black/40 backdrop-blur-sm border-[1px] border-white/20 p-8 rounded-2xl shadow-xl w-full">
                                        <h4 className="text-white font-serif italic text-3xl mb-4 drop-shadow-md">
                                            Leisure & Networking
                                        </h4>
                                        <div className="w-16 h-[2px] bg-[#c00000] mx-auto mb-4"></div>
                                        <p className="text-white/90 font-sans text-[13px] font-semibold leading-relaxed tracking-wide shadow-black drop-shadow-sm">
                                            A day dedicated to exploring the vibrant city of Dubai at your own pace. Build lasting connections, exchange ideas with global peers, and immerse yourself in the rich local culture.
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Bottom Text */}
                                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col items-center justify-end z-10 text-center bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-28 pb-8">
                                    <h3 className="text-white font-serif italic text-[1.6rem] mb-1 leading-tight" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>Discover Innovation.</h3>
                                    <p className="text-white/95 text-[0.85rem] font-sans tracking-[0.2em] uppercase font-bold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>An unforgettable experience in Dubai</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
