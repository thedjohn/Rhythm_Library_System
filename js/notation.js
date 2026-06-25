window.rhythmNotation = (() => {

    // Cache row data so updatePlayhead can redraw without C# round-trip
    const rowCache = {};
    // Cache pattern group data for highlight redraws
    const patternCache = {};

    function beats(n) {
        if (!n) return 1;
        const key = n.endsWith('_tied') ? n.slice(0, -5) : n;
        return ({ quarter: 1, half: 2, dotted_quarter: 1.5, eighth: 0.5, snare_fine: 1 })[key] ?? 1;
    }

    // ─── Rhythm Sequence Row ──────────────────────────────────────────────────

    function drawStaffRow(canvasId, measuresNotes, activeFlags, isFirstRow, playheadFrac) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        rowCache[canvasId] = { measuresNotes, activeFlags, isFirstRow };

        const dpr = window.devicePixelRatio || 1;
        const W   = (canvas.parentElement?.clientWidth - 2) || 900;
        const H   = 64;
        canvas.width  = W * dpr; canvas.height  = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);

        const nm = measuresNotes.length;
        if (nm === 0) return;

        const staffY   = H * 0.55;
        const clefW    = 22;
        const tSigW    = isFirstRow ? 20 : 0;
        const L        = clefW + tSigW + 4;
        const R        = W - 8;
        const staffW   = R - L;
        const mW       = staffW / nm;

        // Active measure highlight
        activeFlags.forEach((active, m) => {
            if (active) { ctx.fillStyle = '#fffde7'; ctx.fillRect(L + m * mW, 0, mW, H); }
        });

        // Staff line
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(L, staffY); ctx.lineTo(R, staffY); ctx.stroke();

        // Percussion clef
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(6,  staffY - 14); ctx.lineTo(6,  staffY + 6);
        ctx.moveTo(13, staffY - 14); ctx.lineTo(13, staffY + 6);
        ctx.stroke();

        // Time sig
        if (isFirstRow) {
            ctx.fillStyle = '#000'; ctx.font = 'bold 14px serif'; ctx.textAlign = 'center';
            ctx.fillText('4', clefW + 10, staffY - 2);
            ctx.fillText('4', clefW + 10, staffY + 12);
        }

        // Opening barline
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(L, staffY - 16); ctx.lineTo(L, staffY + 8); ctx.stroke();

        // Barlines
        for (let m = 1; m <= nm; m++) {
            const x = L + m * mW, last = m === nm;
            if (last) {
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(x - 4, staffY - 16); ctx.lineTo(x - 4, staffY + 8); ctx.stroke();
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(x, staffY - 16); ctx.lineTo(x, staffY + 8); ctx.stroke();
            } else {
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(x, staffY - 16); ctx.lineTo(x, staffY + 8); ctx.stroke();
            }
        }

        // Notes + beat numbers
        for (let m = 0; m < nm; m++) {
            const notes    = measuresNotes[m] || [];
            const mL       = L + m * mW + 6;
            const mR       = L + (m + 1) * mW - 6;
            const noteArea = mR - mL;
            const totalB   = notes.reduce((s, n) => s + beats(n), 0) || 4;
            let bAcc = 0;
            for (const n of notes) {
                if (!n) { bAcc += 1; continue; }
                const nx = mL + (bAcc / totalB) * noteArea;
                if (!n.endsWith('_tied')) drawRhythmNote(ctx, n.endsWith('_tied') ? n.slice(0,-5) : n, nx, staffY);
                bAcc += beats(n);
            }
            const patNum = { quarter: '2', eighth: '1', dotted_quarter: '3', half: '4', snare_fine: '' };
            ctx.fillStyle = '#555'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
            let ba = 0;
            for (const n of notes) {
                if (n && !n.endsWith('_tied')) {
                    const key = n.endsWith('_tied') ? n.slice(0,-5) : n;
                    const lbl = patNum[key];
                    if (lbl) ctx.fillText(lbl, mL + (ba / totalB) * noteArea, staffY + 20);
                }
                ba += beats(n);
            }
        }

        // Red playhead line
        if (playheadFrac != null && playheadFrac >= 0) {
            const phX = L + (playheadFrac / nm) * staffW;
            ctx.strokeStyle = '#e53935'; ctx.lineWidth = 2; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(phX, staffY - 22); ctx.lineTo(phX, staffY + 10); ctx.stroke();
        }
    }

    // Redraw a cached row with a new playhead fraction (-1 = no line)
    function updatePlayhead(canvasId, rowFrac) {
        const c = rowCache[canvasId];
        if (c) drawStaffRow(canvasId, c.measuresNotes, c.activeFlags, c.isFirstRow, rowFrac);
    }

    function drawRhythmNote(ctx, noteType, x, staffY) {
        const filled = noteType !== 'half' && noteType !== 'snare_fine';
        const rx = 5.5, ry = 3.8, stemTopY = staffY - 26;
        if (noteType !== 'snare_fine') {
            ctx.save(); ctx.translate(x, staffY); ctx.rotate(-12 * Math.PI / 180);
            if (filled) {
                ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2); ctx.fillStyle='#000'; ctx.fill();
            } else {
                ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
                ctx.fillStyle='#fff'; ctx.fill(); ctx.strokeStyle='#000'; ctx.lineWidth=1.4; ctx.stroke();
            }
            ctx.restore();
        }
        const stemX = x + rx - 1;
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(stemX, staffY - 1); ctx.lineTo(stemX, stemTopY); ctx.stroke();
        if (noteType === 'eighth') {
            ctx.beginPath(); ctx.moveTo(stemX, stemTopY);
            ctx.bezierCurveTo(stemX+9, stemTopY+3, stemX+9, stemTopY+9, stemX+3, stemTopY+13);
            ctx.stroke();
        }
        if (noteType === 'dotted_quarter') {
            ctx.beginPath(); ctx.arc(x + rx + 4, staffY - ry, 2.2, 0, Math.PI*2); ctx.fillStyle='#000'; ctx.fill();
        }
        if (noteType === 'snare_fine') {
            ctx.save();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x-rx+1, staffY-ry+1); ctx.lineTo(x+rx-1, staffY+ry-1);
            ctx.moveTo(x+rx-1, staffY-ry+1); ctx.lineTo(x-rx+1, staffY+ry-1);
            ctx.stroke();
            // Accent mark (>) above the note
            const aY = staffY - 31;
            ctx.lineWidth = 1.3; ctx.lineJoin = 'miter';
            ctx.beginPath();
            ctx.moveTo(x - 5, aY + 4); ctx.lineTo(x, aY - 4); ctx.lineTo(x + 5, aY + 4);
            ctx.stroke();
            ctx.restore();
        }
    }

    // ─── Pattern Group (two staff lines: hands + feet) ────────────────────────

    function drawPatternGroup(canvasId, drums, subdivCount, activeBeat) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        if (drums !== undefined) patternCache[canvasId] = { drums, subdivCount };
        const cached = patternCache[canvasId];
        if (!cached) return;
        drums = cached.drums; subdivCount = cached.subdivCount;
        activeBeat = (activeBeat === undefined || activeBeat === null) ? -1 : activeBeat;

        const subs     = subdivCount || 4;
        // Number of beams = note value: 16ths=2, 32nds=3, triplet 8ths=1
        const numBeams = subs === 8 ? 3 : subs === 3 ? 1 : 2;

        const dpr = window.devicePixelRatio || 1;
        const W   = (canvas.parentElement?.clientWidth - 2) || 220;
        const H   = 124;
        canvas.width  = W * dpr; canvas.height  = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

        // Layout
        const limbW    = 22;
        const clefW    = 14;
        const L        = clefW + limbW + 8;
        const R        = W - 8;
        const staffW   = R - L;

        const handY    = 62;   // hand staff line
        const footY    = 90;   // foot staff line
        const beamTopY = 26;   // topmost beam Y — leaves room for accent mark above
        const beamGap  = 4;    // px between beams
        const stemBase = beamTopY;  // stems reach the top beam line

        const hasHands = drums.some(d => d.limb === 'RH' || d.limb === 'LH');
        const hasFeet  = drums.some(d => d.limb === 'RF' || d.limb === 'LF');

        const barTop    = hasHands ? handY - 14 : footY - 12;
        const barBottom = hasFeet  ? footY + 7  : handY + 7;

        // Percussion clef (two vertical bars)
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(4,  barTop); ctx.lineTo(4,  barBottom);
        ctx.moveTo(10, barTop); ctx.lineTo(10, barBottom);
        ctx.stroke();

        // Staff lines
        ctx.lineWidth = 1.4;
        if (hasHands) { ctx.beginPath(); ctx.moveTo(L, handY); ctx.lineTo(R, handY); ctx.stroke(); }
        if (hasFeet)  { ctx.beginPath(); ctx.moveTo(L, footY); ctx.lineTo(R, footY); ctx.stroke(); }

        // Opening barline
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(L, barTop); ctx.lineTo(L, barBottom); ctx.stroke();

        // Closing double barline
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(R - 5, barTop); ctx.lineTo(R - 5, barBottom); ctx.stroke();
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(R, barTop); ctx.lineTo(R, barBottom); ctx.stroke();

        // Limb labels to the left of the barline
        ctx.fillStyle = '#444'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'right';
        const usedLimbs = new Set(drums.map(d => d.limb));
        if (usedLimbs.has('RH')) ctx.fillText('RH', L - 3, handY - 3);
        if (usedLimbs.has('LH')) ctx.fillText('LH', L - 3, handY + 9);
        if (usedLimbs.has('RF')) ctx.fillText('RF', L - 3, footY - 1);
        if (usedLimbs.has('LF')) ctx.fillText('LF', L - 3, footY + 10);

        // Slot positions
        const maxBeat    = drums.reduce((mx, d) => Math.max(mx, d.beat), 0);
        const totalSlots = Math.max(maxBeat + 1, subs);
        const slotW      = staffW / totalSlots;

        // Column highlight for active beat
        if (activeBeat >= 0) {
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = '#e53935';
            ctx.fillRect(L + activeBeat * slotW, 0, slotW, H);
            ctx.restore();
        }

        // Draw noteheads and collect stem X positions
        const stemXs = [];
        drums.forEach(d => {
            const cx     = L + (d.beat + 0.5) * slotW;
            const isFoot = d.limb === 'RF' || d.limb === 'LF';
            const sY     = isFoot ? footY : handY;
            // RH/RF sit above the line; LH/LF sit below
            const yOff   = (d.limb === 'RH' || d.limb === 'RF') ? -6 : 6;
            drawDrumNotehead(ctx, d.drum, d.accent, d.ghost, cx, sY + yOff, d.beat === activeBeat ? '#e53935' : null);
            stemXs.push({ cx, noteY: sY + yOff });
        });

        // Trailing rest: if notes don't fill all slots, draw appropriate rest symbol
        const trailingEmpty = totalSlots - (maxBeat + 1);
        if (trailingEmpty >= 2) {
            // Eighth rest (or longer) — draw at the midpoint of the empty region
            const restX = L + (maxBeat + 1 + trailingEmpty / 2) * slotW;
            const restY = hasFeet ? (handY + footY) / 2 : handY;
            drawEighthRest(ctx, restX, restY);
        } else if (trailingEmpty === 1) {
            // 16th rest
            const restX = L + (maxBeat + 1.5) * slotW;
            const restY = hasFeet ? (handY + footY) / 2 : handY;
            drawSixteenthRest(ctx, restX, restY);
        }

        // Stems up to beam area
        stemXs.forEach(({ cx, noteY }) => {
            ctx.strokeStyle = '#000'; ctx.lineWidth = 1.3;
            ctx.beginPath(); ctx.moveTo(cx + 5, noteY - 1); ctx.lineTo(cx + 5, stemBase); ctx.stroke();
        });

        // Beams or flags
        const sortedSX = stemXs.map(s => s.cx + 5).sort((a, b) => a - b);
        if (sortedSX.length > 1) {
            for (let b = 0; b < numBeams; b++) {
                const by = beamTopY + b * beamGap;
                ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.lineCap = 'square';
                if (b === 0) {
                    // Primary beam: always full span
                    ctx.beginPath(); ctx.moveTo(sortedSX[0], by); ctx.lineTo(sortedSX[sortedSX.length-1], by); ctx.stroke();
                } else {
                    // Secondary beam: groups of 4 — creates single-flag bridge between groups
                    for (let g = 0; g < sortedSX.length; g += 4) {
                        const end = Math.min(g + 3, sortedSX.length - 1);
                        if (g < end) {
                            ctx.beginPath(); ctx.moveTo(sortedSX[g], by); ctx.lineTo(sortedSX[end], by); ctx.stroke();
                        } else {
                            // Orphan single at end of group: short stub rightward
                            ctx.beginPath(); ctx.moveTo(sortedSX[g], by); ctx.lineTo(sortedSX[g] + 8, by); ctx.stroke();
                        }
                    }
                }
            }
            // Triplet bracket
            if (subs === 3) {
                const midX = (sortedSX[0] + sortedSX[sortedSX.length-1]) / 2;
                const bY   = beamTopY - 6;
                ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sortedSX[0], bY+4); ctx.lineTo(sortedSX[0], bY);
                ctx.lineTo(sortedSX[sortedSX.length-1], bY);
                ctx.lineTo(sortedSX[sortedSX.length-1], bY+4);
                ctx.stroke();
                ctx.fillStyle = '#000'; ctx.font = '9px serif'; ctx.textAlign = 'center';
                ctx.fillText('3', midX, bY - 1);
            }
        } else if (sortedSX.length === 1) {
            // Single note: draw flags
            const sx = sortedSX[0];
            for (let b = 0; b < numBeams; b++) {
                const fY = beamTopY + b * beamGap;
                ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(sx, fY);
                ctx.bezierCurveTo(sx+10, fY+3, sx+10, fY+9, sx+4, fY+14);
                ctx.stroke();
            }
        }

        // Accent marks (>) above beam area for accented notes
        drums.forEach(d => {
            if (!d.accent) return;
            const cx = L + (d.beat + 0.5) * slotW + 5;
            const aY = beamTopY - 13;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 1.3; ctx.lineJoin = 'miter';
            ctx.beginPath();
            ctx.moveTo(cx - 5, aY - 4); ctx.lineTo(cx + 4, aY); ctx.lineTo(cx - 5, aY + 4);
            ctx.stroke();
        });
        // No beat numbers at bottom
    }

    function drawEighthRest(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 44px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('𝄾', x, y);  // U+1D13E MUSICAL SYMBOL EIGHTH REST
        ctx.restore();
    }

    function drawSixteenthRest(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(x - 2, y - 6, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 1,  y,     2.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 2, y - 4); ctx.lineTo(x + 4, y + 7); ctx.stroke();
        ctx.restore();
    }

    // ─── Drum Legend ──────────────────────────────────────────────────────────

    function drawPatternLegend(canvasId, uniqueDrums) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const W   = (canvas.parentElement?.clientWidth - 2) || 220;
        const H   = 44;
        canvas.width  = W * dpr; canvas.height  = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#eef'; ctx.fillRect(0, 0, W, H);

        // Top divider
        ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(6, 0.5); ctx.lineTo(W-6, 0.5); ctx.stroke();

        const labels = {
            snare: 'Snare', snare_ghost: 'Ghost SN', kick: 'Kick',
            high_tom: 'Hi Tom', low_tom: 'Lo Tom', cymbal: 'Cymbal', hi_hat: 'Hi-Hat'
        };

        const n = uniqueDrums.length || 1;
        const iW = (W - 12) / n;
        uniqueDrums.forEach((drum, i) => {
            const cx = 6 + i * iW + iW / 2;
            const ny = 16;
            const r  = 4;
            const isX = drum === 'hi_hat' || drum === 'cymbal';
            const isGhost = drum === 'snare_ghost';

            const isHiTom = drum === 'high_tom';
            const isLoTom = drum === 'low_tom';
            if (isX) {
                ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx-r, ny-r); ctx.lineTo(cx+r, ny+r);
                ctx.moveTo(cx+r, ny-r); ctx.lineTo(cx-r, ny+r);
                ctx.stroke();
            } else if (isGhost) {
                ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(cx, ny, r-1, 0, Math.PI*2); ctx.stroke();
                ctx.fillStyle = '#aaa'; ctx.font = '9px serif'; ctx.textAlign = 'center';
                ctx.fillText('(', cx-r-1, ny+3); ctx.fillText(')', cx+r+1, ny+3);
            } else if (isHiTom) {
                ctx.save(); ctx.translate(cx, ny); ctx.rotate(-12 * Math.PI / 180);
                ctx.beginPath(); ctx.ellipse(0, 0, r+1.5, r, 0, 0, Math.PI*2);
                ctx.fillStyle = '#fff'; ctx.fill();
                ctx.strokeStyle = '#222'; ctx.lineWidth = 1.4; ctx.stroke();
                ctx.restore();
            } else if (isLoTom) {
                const s = r + 1;
                ctx.fillStyle = '#222'; ctx.fillRect(cx - s, ny - s, s * 2, s * 2);
            } else {
                ctx.save(); ctx.translate(cx, ny); ctx.rotate(-12 * Math.PI / 180);
                ctx.beginPath(); ctx.ellipse(0, 0, r+1.5, r, 0, 0, Math.PI*2);
                ctx.fillStyle = '#222'; ctx.fill(); ctx.restore();
            }
            ctx.fillStyle = '#333'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(labels[drum] || drum, cx, ny + 16);
        });
    }

    function drawDrumNotehead(ctx, drum, accent, ghost, x, y, color) {
        const isX     = drum === 'hi_hat' || drum === 'cymbal';
        const isHiTom = drum === 'high_tom';
        const isLoTom = drum === 'low_tom';
        const col = color || '#000';
        const r = 4;
        if (isX) {
            ctx.strokeStyle = color || '#000'; ctx.lineWidth = accent ? 1.8 : 1.3;
            ctx.beginPath();
            ctx.moveTo(x-r, y-r); ctx.lineTo(x+r, y+r);
            ctx.moveTo(x+r, y-r); ctx.lineTo(x-r, y+r);
            ctx.stroke();
        } else if (ghost) {
            ctx.strokeStyle = color || '#888'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(x, y, r-1, 0, Math.PI*2); ctx.stroke();
        } else if (isHiTom) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(-12 * Math.PI / 180);
            ctx.beginPath(); ctx.ellipse(0, 0, r+1.5, r, 0, 0, Math.PI*2);
            ctx.fillStyle = color ? color : '#fff'; ctx.fill();
            ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();
            ctx.restore();
        } else if (isLoTom) {
            const s = r + 1;
            ctx.fillStyle = col;
            ctx.fillRect(x - s, y - s, s * 2, s * 2);
        } else {
            ctx.save(); ctx.translate(x, y); ctx.rotate(-12 * Math.PI / 180);
            ctx.beginPath(); ctx.ellipse(0, 0, r+1.5, r, 0, 0, Math.PI*2);
            ctx.fillStyle = col; ctx.fill();
            ctx.restore();
        }
    }

    function flashPatternBeat(canvasId, beat, durationMs) {
        // Draw with this beat highlighted
        const cached = patternCache[canvasId];
        if (!cached) return;
        drawPatternGroup(canvasId, undefined, undefined, beat);
        // After durationMs, redraw normally
        setTimeout(() => {
            const still = patternCache[canvasId];
            if (still) drawPatternGroup(canvasId, undefined, undefined, -1);
        }, durationMs);
    }

    function highlightPatternBeat(canvasId, beat) {
        const cached = patternCache[canvasId];
        if (!cached) return;
        // Redraw the group cleanly first
        drawPatternGroup(canvasId, cached.drums, cached.subdivCount);
        if (beat < 0) return;
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.width / dpr;
        const H = canvas.height / dpr;
        const L = 28, R = W - 12;
        const staffW = R - L;
        const totalSlots = cached.subdivCount * (cached.drums.length > 0
            ? Math.max(...cached.drums.map(d => Math.floor((d.beat ?? 0) / cached.subdivCount) + 1), 1) * cached.subdivCount
            : cached.subdivCount);
        // Recompute totalSlots the same way drawPatternGroup does
        const maxBeat = cached.drums.length > 0 ? Math.max(...cached.drums.map(d => d.beat ?? 0)) : 0;
        const subs = cached.subdivCount;
        const groups = Math.ceil((maxBeat + 1) / subs);
        const slots = Math.max(groups, 1) * subs;
        const slotW = staffW / slots;
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#2979ff';
        ctx.fillRect(L + beat * slotW, 0, slotW, H);
        ctx.restore();
    }

    function getElementWidth(id) {
        const el = document.getElementById(id);
        return el ? el.offsetWidth : 0;
    }

    return { drawStaffRow, updatePlayhead, drawPatternGroup, drawPatternLegend, flashPatternBeat, getElementWidth };
})();
