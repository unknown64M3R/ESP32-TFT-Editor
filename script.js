
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const codeEditor = document.getElementById('code');
const errorDiv = document.getElementById('error');
const statusDiv = document.getElementById('status');
const runBtn = document.getElementById('runBtn');
const stopBtn = document.getElementById('stopBtn');
const sizeSelect = document.getElementById('sizeSelect');
const displaySizeText = document.getElementById('displaySize');
        
let executionStopped = false;
        
// ST77XX Color Constants
const ST77XX_BLACK = 0x0000;
const ST77XX_WHITE = 0xFFFF;
const ST77XX_RED = 0xF800;
const ST77XX_GREEN = 0x07E0;
const ST77XX_BLUE = 0x001F;
const ST77XX_CYAN = 0x07FF;
const ST77XX_MAGENTA = 0xF81F;
const ST77XX_YELLOW = 0xFFE0;
const ST77XX_ORANGE = 0xFC00;
        
// Convert RGB565 to RGB
function rgb565ToRgb(color) {
    const r = ((color >> 11) & 0x1F) * 255 / 31;
    const g = ((color >> 5) & 0x3F) * 255 / 63;
    const b = (color & 0x1F) * 255 / 31;
       return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
        
// TFT Wrapper Class
class TFT {
    constructor(ctx) {
        this.ctx = ctx;
        this.textColor = ST77XX_WHITE;
        this.textBgColor = -1;
        this.textSize = 1;
        this.cursorX = 0;
        this.cursorY = 0;
        this._width = canvas.width;
        this._height = canvas.height;
    }
            
    fillScreen(color) {
        this.ctx.fillStyle = rgb565ToRgb(color);
        this.ctx.fillRect(0, 0, this._width, this._height);
    }
            
    fill(color) {
        this.fillScreen(color);
    }
    
    fillRect(x, y, w, h, color) {
        this.ctx.fillStyle = rgb565ToRgb(color);
        this.ctx.fillRect(x, y, w, h);
    }
    
    drawRect(x, y, w, h, color) {
        this.ctx.strokeStyle = rgb565ToRgb(color);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
    
    fillRoundRect(x, y, w, h, r, color) {
        this.ctx.fillStyle = rgb565ToRgb(color);
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, r);
        this.ctx.fill();
    }
    
    drawRoundRect(x, y, w, h, r, color) {
        this.ctx.strokeStyle = rgb565ToRgb(color);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r);
        this.ctx.stroke();
    }
    
    drawFillRect(x, y, w, h, color) {
        this.fillRect(x, y, w, h, color);
    }
    
    drawFillRoundRect(x, y, w, h, r, color) {
        this.fillRoundRect(x, y, w, h, r, color);
    }
    
    fillCircle(x, y, radius, color) {
        this.ctx.fillStyle = rgb565ToRgb(color);
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawCircle(x, y, radius, color) {
        this.ctx.strokeStyle = rgb565ToRgb(color);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
            
    drawFillCircle(x, y, radius, color) {
        this.fillCircle(x, y, radius, color);
    }
    
    drawLine(x0, y0, x1, y1, color) {
        this.ctx.strokeStyle = rgb565ToRgb(color);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }
    
    drawPixel(x, y, color) {
        this.ctx.fillStyle = rgb565ToRgb(color);
        this.ctx.fillRect(x, y, 1, 1);
    }
    
    setTextColor(color, bg) {
        this.textColor = color;
        if (bg !== undefined) this.textBgColor = bg;
    }
    
    setTextSize(size) {
        this.textSize = size;
    }
            
    setTextAlign(align, baseline) {
        // align: 0/left - left, 1/center - center, 2/right - right
        // baseline: 0/top - top, 1/middle - middle, 2/bottom - bottom, 3/alphabetic - alphabetic
        
        // Parse align
        if (typeof align === 'string') {
            if (align[0] === 'l') align = 0;
            else if (align[0] === 'c') align = 1;
            else if (align[0] === 'r') align = 2;
        }
        
        // Parse baseline (default: 0/top)
        if (baseline === undefined) baseline = 0;
        if (typeof baseline === 'string') {
            if (baseline[0] === 't') baseline = 0;
            else if (baseline[0] === 'm') baseline = 1;
            else if (baseline[0] === 'b') baseline = 2;
            else if (baseline[0] === 'a') baseline = 3;
        }
                
        // Store text datum (0-11 like TFT_eSPI)
        this.textDatum = align + baseline * 3;
        
        // Set canvas text align
        if (align === 0) this.ctx.textAlign = 'left';
        else if (align === 1) this.ctx.textAlign = 'center';
        else if (align === 2) this.ctx.textAlign = 'right';
            
        // Set canvas text baseline
        if (baseline === 0) this.ctx.textBaseline = 'top';
        else if (baseline === 1) this.ctx.textBaseline = 'middle';
        else if (baseline === 2) this.ctx.textBaseline = 'bottom';
        else if (baseline === 3) this.ctx.textBaseline = 'alphabetic';
    }
        
    setCursor(x, y) {
        this.cursorX = x;
        this.cursorY = y;
    }
        
    print(text) {
        // Adafruit GFX Font: 5x8 pixels per character (6x8 with spacing)
        const charWidth = 6 * this.textSize;
        const charHeight = 8 * this.textSize;
            
        this.ctx.font = `bold ${charHeight}px monospace`;
        this.ctx.fillStyle = rgb565ToRgb(this.textColor);
        
        // Use stored textAlign and textBaseline if set, otherwise default to top-left
        if (this.textDatum !== undefined) {
            // textAlign and textBaseline already set by setTextAlign
        } else {
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
        }
        
        const str = String(text);
        
        // If using default left-aligned, draw character by character for fixed width
        if (this.ctx.textAlign === 'left' && this.textDatum === undefined) {
            for (let i = 0; i < str.length; i++) {
                this.ctx.fillText(str[i], this.cursorX, this.cursorY);
                this.cursorX += charWidth;
            }
        } else {
            // For center/right alignment, draw the whole string at once
            this.ctx.fillText(str, this.cursorX, this.cursorY);
            if (this.ctx.textAlign === 'left') {
                this.cursorX += str.length * charWidth;
            }
        }
    }
            
    println(text) {
        this.print(text);
        this.cursorY += 8 * this.textSize;
        this.cursorX = 0;
    }
    
    printf(format, ...args) {
        let result = format;
        let argIndex = 0;
        
        result = result.replace(/%([0-9]*)([dxX]|[0-9]*l[xX])/g, (match, width, type) => {
            if (argIndex >= args.length) return match;
            const value = args[argIndex++];
            
            if (type === 'd') {
                return String(value).padStart(parseInt(width) || 0, '0');
            } else if (type === 'x' || type === 'X' || type.includes('lx') || type.includes('lX')) {
                let hex = Number(value).toString(16);
                if (type === 'X' || type.includes('X')) hex = hex.toUpperCase();
                const padWidth = parseInt(width) || 0;
                return hex.padStart(padWidth, '0');
            }
            return match;
        });
        
        this.print(result);
    }
        
    // Bruce API: color conversion (mode: 16=RGB565, 8=RGB332)
    color(r, g, b, mode) {
        const r5 = (r >> 3) & 0x1F;
        const g6 = (g >> 2) & 0x3F;
        const b5 = (b >> 3) & 0x1F;
        const color = (r5 << 11) | (g6 << 5) | b5;
        if (mode === 8) {
            return ((color & 0xE000) >> 8) | ((color & 0x0700) >> 6) | ((color & 0x0018) >> 3);
        }
        return color;
    }
            
    // Bruce API aliases
    drawText(text, x, y) {
        const oldX = this.cursorX;
        const oldY = this.cursorY;
        this.setCursor(x, y);
        this.print(text);
        this.cursorX = oldX;
        this.cursorY = oldY;
    }
        
    drawString(text, x, y) {
        this.drawText(text, x, y);
    }

    drawTriangle(x0, y0, x1, y1, x2, y2, color) {
        this.ctx.strokeStyle = rgb565ToRgb(color);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawFillTriangle(x0, y0, x1, y1, x2, y2, color) {
        this.ctx.fillStyle = rgb565ToRgb(color);
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawArc(x, y, r, ir, startAngle, endAngle, fg, bg, smooth) {
        const start = startAngle * Math.PI / 180;
        const end = endAngle * Math.PI / 180;
        this.ctx.fillStyle = rgb565ToRgb(fg);
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, start, end);
        this.ctx.arc(x, y, ir, end, start, true);
        this.ctx.closePath();
        this.ctx.fill();
        if (bg >= 0 && bg !== fg) {
            this.ctx.fillStyle = rgb565ToRgb(bg);
            this.ctx.beginPath();
            this.ctx.arc(x, y, ir, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawWideLine(x0, y0, x1, y1, width, color) {
        this.ctx.strokeStyle = rgb565ToRgb(color);
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
        this.ctx.lineCap = 'butt';
        this.ctx.lineWidth = 1;
    }

    drawFastVLine(x, y, h, color) {
        this.ctx.fillStyle = rgb565ToRgb(color);
        this.ctx.fillRect(x, y, 1, h);
    }

    drawFastHLine(x, y, w, color) {
        this.ctx.fillStyle = rgb565ToRgb(color);
        this.ctx.fillRect(x, y, w, 1);
    }

    drawFillRectGradient(x, y, w, h, c1, c2, mode) {
        const grad = mode === 'v'
            ? this.ctx.createLinearGradient(x, y, x, y + h)
            : this.ctx.createLinearGradient(x, y, x + w, y);
        grad.addColorStop(0, rgb565ToRgb(c1));
        grad.addColorStop(1, rgb565ToRgb(c2));
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(x, y, w, h);
    }

    drawXBitmap(x, y, data, w, h, fg, bg) {
        const fgRgb = rgb565ToRgb(fg);
        const bgRgb = bg >= 0 ? rgb565ToRgb(bg) : null;
        const bytesPerRow = (w + 7) >> 3;
        for (let j = 0; j < h; j++) {
            for (let i = 0; i < w; i++) {
                const byteIdx = j * bytesPerRow + (i >> 3);
                const bit = 7 - (i & 7);
                if (byteIdx < data.length) {
                    const pixel = (data[byteIdx] >> bit) & 1;
                    this.ctx.fillStyle = pixel ? fgRgb : (bgRgb || fgRgb);
                    this.ctx.fillRect(x + i, y + j, 1, 1);
                }
            }
        }
    }

    getRotation() {
        return 0;
    }

    getBrightness() {
        return 100;
    }

    setBrightness(brightness, save) {
        // No-op in emulator
    }

    restoreBrightness() {
        // No-op in emulator
    }

    drawImage(path) {
        console.warn('drawImage not supported in browser emulator:', path);
    }

    drawJpg(path) {
        console.warn('drawJpg not supported in browser emulator:', path);
    }

    drawGif(path, x, y, center, playDurationMs) {
        console.warn('drawGif not supported in browser emulator:', path);
    }

    createSprite(width, height, colorDepth) {
        const sprite = new TFT(this.ctx);
        sprite._width = width || this._width;
        sprite._height = height || this._height;
        sprite._parentCanvas = this;
        return sprite;
    }

    // Bruce API: get display dimensions
    width() {
        return this._width;
    }

    height() {
        return this._height;
    }
}

// Global TFT instance (as pointer)
const tft = new TFT(ctx);
    
// Bruce API: display object (alias to tft)
const display = tft;

// GIF helper stubs (Bruce API: not supported in browser emulator)
class BruceGif {
    constructor(fs, path) {
        this._path = path;
        this._canvasWidth = 0;
        this._canvasHeight = 0;
        console.warn('GIF not supported in browser emulator:', path);
    }
    playFrame(x, y, sync) { return 0; }
    getCanvasWidth() { return this._canvasWidth; }
    getCanvasHeight() { return this._canvasHeight; }
    reset() {}
    openGIF(fs, path) { return false; }
}

// Bruce API: storage (uses localStorage, or native filesystem if user picks a directory)
let directoryHandle = null;

async function selectSaveDir() {
    try {
        directoryHandle = await window.showDirectoryPicker();
        document.getElementById('saveDirBtn').textContent = '📁 ' + directoryHandle.name;
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('Failed to pick directory:', e);
        }
    }
}

const storage = {
    _pathKey(pathObj) {
        let key = (pathObj.fs || 'littlefs') + '_' + pathObj.path;
        // Remove leading / and replace remaining / with _ for filesystem safety
        key = key.replace(/^\//, '').replace(/\//g, '_');
        return key;
    },
    async read(pathObj) {
        const key = this._pathKey(pathObj);
        if (directoryHandle) {
            try {
                const fileHandle = await directoryHandle.getFileHandle(key);
                const file = await fileHandle.getFile();
                return await file.text();
            } catch (e) {
                throw new Error('File not found: ' + key);
            }
        }
        const lsKey = 'bruce_' + key;
        const val = localStorage.getItem(lsKey);
        if (val === null) throw new Error('File not found: ' + key);
        return val;
    },
    async write(pathObj, data) {
        const key = this._pathKey(pathObj);
        if (directoryHandle) {
            const fileHandle = await directoryHandle.getFileHandle(key, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
            return;
        }
        localStorage.setItem('bruce_' + key, data);
    },
    readdir(pathObj) {
        if (pathObj.fs === 'sd') {
            if (!directoryHandle) throw new Error('No SD card selected');
            return [];
        }
        return [];
    },
    async remove(pathObj) {
        const key = this._pathKey(pathObj);
        if (directoryHandle) {
            try { await directoryHandle.removeEntry(key); } catch (e) {}
            return;
        }
        localStorage.removeItem('bruce_' + key);
    }
};

// Bruce API: device
const device = {
    getFreeHeapSize() {
        return {
            ram_free: 204800,
            ram_size: 327680,
            psram_free: 4194304,
            psram_size: 8388608
        };
    }
};

// Bruce API: keyboard
const _kbKeys = { next: false, prev: false, sel: false, esc: false };
document.addEventListener('keydown', (e) => {
    // Don't capture keys when editing code in the textarea
    if (document.activeElement && document.activeElement.id === 'code') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { _kbKeys.next = true; e.preventDefault(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { _kbKeys.prev = true; e.preventDefault(); }
    if (e.key === 'Enter') { _kbKeys.sel = true; e.preventDefault(); }
    if (e.key === 'Escape') { _kbKeys.esc = true; e.preventDefault(); }
});

const keyboard = {
    getNextPress() { const v = _kbKeys.next; _kbKeys.next = false; return v; },
    getPrevPress() { const v = _kbKeys.prev; _kbKeys.prev = false; return v; },
    getSelPress() { const v = _kbKeys.sel; _kbKeys.sel = false; return v; },
    getEscPress() { const v = _kbKeys.esc; _kbKeys.esc = false; return v; },
    keyboard(defaultText, maxLen, title) {
        return prompt(title || 'Enter text:', defaultText || '');
    }
};

// Bruce API: dialog
const dialog = {
    info(text) {
        alert(text);
    },
    choice(options) {
        const items = options.map(o => Array.isArray(o) ? o : [o, o]);
        const msg = items.map((item, i) => `${i + 1}. ${item[0]}`).join('\n');
        const result = prompt(`Choose:\n${msg}\n\nEnter number (1-${items.length}):`);
        const idx = parseInt(result) - 1;
        if (idx >= 0 && idx < items.length) return items[idx][1];
        return items[0][1];
    }
};

// Delay functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
 
function delayMicroseconds(us) {
    return new Promise(resolve => setTimeout(resolve, us / 1000));
}

// C++ to JavaScript transpiler
function transpileCppToJs(code) {
    let jsCode = code;
        
    // Replace tft-> with tft.
    jsCode = jsCode.replace(/tft->/g, 'tft.');
    
    // Replace display. (Bruce API) - keep as is (already correct)
    // jsCode = jsCode.replace(/display\./g, 'display.');
    
    // Handle require for Bruce API modules
    jsCode = jsCode.replace(/(?:var|const|let)\s+(\w+)\s*=\s*require\s*\(\s*["'](\w+)["']\s*\)\s*;?/g, (match, name, mod) => {
        if (['display', 'storage', 'device', 'keyboard', 'dialog'].includes(mod)) {
            return '// ' + name + ' already available';
        }
        return match;
    });
    
    
    // Replace uint8_t, uint16_t, uint32_t, int16_t etc. with let
    jsCode = jsCode.replace(/\b(uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+/g, 'let ');
            
    // Replace size_t with let
    jsCode = jsCode.replace(/\bsize_t\s+/g, 'let ');
        
    // Replace char arrays with let
    jsCode = jsCode.replace(/\bchar\s+(\w+)\[.*?\]/g, 'let $1');
        
    // Replace sprintf with template literals (simplified)
    jsCode = jsCode.replace(/sprintf\s*\(\s*(\w+)\s*,\s*"(.+?)"\s*,\s*(.+?)\s*\)/g, (match, var1, format, args) => {
        // Simple sprintf replacement
        let replacement = format;
        const argList = args.split(',').map(a => a.trim());
        let argIndex = 0;
        
        replacement = replacement.replace(/%([0-9]*)([dxX]|05[xX]|05l[xX])/g, (m, width, type) => {
            if (argIndex >= argList.length) return m;
            const arg = argList[argIndex++];
            
            if (type === 'd') {
                return '${' + arg + '}';
            } else if (type.includes('x') || type.includes('X')) {
                let hex = '${' + arg + '.toString(16)';
                if (width) hex += '.padStart(' + width + ', "0")';
                if (type.includes('X')) hex += '.toUpperCase()';
                return hex + '}';
            }
            return m;
        });
            
        return `${var1} = \`${replacement}\``;
    });
    
    // Replace strlen with .length
    jsCode = jsCode.replace(/strlen\s*\(\s*(\w+)\s*\)/g, '$1.length');
    
    // Yield to event loop in infinite loops so browser stays responsive
    // (insert BEFORE delay→await delay transformation so the injected delay gets awaited)
    jsCode = jsCode.replace(/(while\s*\(\s*true\s*\)\s*\{)/gi, '$1 delay(0);');
    jsCode = jsCode.replace(/(while\s*\(\s*1\s*\)\s*\{)/g, '$1 delay(0);');
    jsCode = jsCode.replace(/(for\s*\(;;\)\s*\{)/g, '$1 delay(0);');
    
    // Make delay/delayMicroseconds async (setTimeout-based, needs await)
    jsCode = jsCode.replace(/\bdelay\s*\(/g, 'await delay(');
    jsCode = jsCode.replace(/\bdelayMicroseconds\s*\(/g, 'await delayMicroseconds(');
    
    // Storage methods are async when using File System Access API
    jsCode = jsCode.replace(/\bstorage\.read\s*\(/g, 'await storage.read(');
    jsCode = jsCode.replace(/\bstorage\.write\s*\(/g, 'await storage.write(');
    jsCode = jsCode.replace(/\bstorage\.remove\s*\(/g, 'await storage.remove(');
    
    // Iteratively find functions needing async and add await before calls to them
    // (runs until stable so callers of async functions are also made async)
    while (true) {
        const lines = jsCode.split('\n');
        const needsAsync = new Set();
        const stack = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const funcMatch = line.match(/(?:^|\s)function\s+(\w+)\s*\(/);
            if (funcMatch) {
                const opens = (line.match(/\{/g) || []).length;
                const closes = (line.match(/\}/g) || []).length;
                stack.push({ name: funcMatch[1], line: i, depth: opens - closes, hasAwait: false });
            } else if (stack.length > 0) {
                const top = stack[stack.length - 1];
                const opens = (line.match(/\{/g) || []).length;
                const closes = (line.match(/\}/g) || []).length;
                top.depth += opens - closes;
                if (line.includes('await ')) top.hasAwait = true;
                if (top.depth <= 0) {
                    if (top.hasAwait) needsAsync.add(top.name);
                    stack.pop();
                }
            }
        }
        if (needsAsync.size === 0) break;
        const marked = new Set();
        for (const name of needsAsync) {
            const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const declRe = new RegExp('^(\\s*)function\\s+(' + escaped + ')\\s*\\(', 'm');
            jsCode = jsCode.replace(declRe, (match, ws, fn) => {
                marked.add(name);
                return ws + 'async function ' + fn + '(';
            });
        }
        if (marked.size === 0) break;
        for (const name of marked) {
            const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const callRe = new RegExp('(?<!function\\s+)(' + escaped + '\\s*\\()', 'g');
            jsCode = jsCode.replace(callRe, 'await $1');
        }
    }
    
    return jsCode;
}
    
// Auto-execute on code change — disabled while textarea is focused to avoid
// interrupting edits with game execution
let timeout;
codeEditor.addEventListener('input', () => {
    localStorage.setItem('bruce_editor_code', codeEditor.value);
    clearTimeout(timeout);
    if (document.activeElement && document.activeElement.id === 'code') return;
    timeout = setTimeout(executeCode, 800);
});
    
async function executeCode() {
    try {
        executionStopped = false;
        // Clear any stale keyboard state (e.g. from editing the textarea)
        _kbKeys.next = false;
        _kbKeys.prev = false;
        _kbKeys.sel = false;
        _kbKeys.esc = false;
        runBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        statusDiv.textContent = '▶ Running...';
        errorDiv.textContent = '';
        tft.fillScreen(ST77XX_BLACK);
        
        // Transpile C++ to JavaScript
        const jsCode = transpileCppToJs(codeEditor.value);
        
        // Execute as async function
        const asyncFunc = new Function('tft', 'display', 'delay', 'delayMicroseconds', 'storage', 'device', 'keyboard', 'dialog', 'ST77XX_BLACK', 'ST77XX_WHITE', 'ST77XX_RED', 'ST77XX_GREEN', 'ST77XX_BLUE', 'ST77XX_CYAN', 'ST77XX_MAGENTA', 'ST77XX_YELLOW', 'ST77XX_ORANGE', 
            `return (async () => {
                ${jsCode}
            })();`
        );
        
        await asyncFunc(tft, display, delay, delayMicroseconds, storage, device, keyboard, dialog, ST77XX_BLACK, ST77XX_WHITE, ST77XX_RED, ST77XX_GREEN, ST77XX_BLUE, ST77XX_CYAN, ST77XX_MAGENTA, ST77XX_YELLOW, ST77XX_ORANGE);
        
        if (!executionStopped) {
            statusDiv.textContent = '✓ Done';
        }
    } catch (error) {
        errorDiv.textContent = `❌ Error: ${error.message}`;
        statusDiv.textContent = '✗ Error';
        console.error(error);
    } finally {
        runBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
    }
}
    
function stopExecution() {
    executionStopped = true;
    statusDiv.textContent = '⬛ Stopped';
    runBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
}
    
function clearDisplay() {
    tft.fillScreen(ST77XX_BLACK);
    errorDiv.textContent = '';
    statusDiv.textContent = '';
}
    
function loadExample() {
    codeEditor.value = defaultCode;
    localStorage.setItem('bruce_editor_code', defaultCode);
    executeCode();
}
    
function loadDefaultCode() {
    const saved = localStorage.getItem('bruce_editor_code');
    if (saved) {
        codeEditor.value = saved;
    } else {
        codeEditor.value = defaultCode;
    }
}

function updateExampleCode() {
    loadDefaultCode();
    executeCode();
}

function changeDisplaySize() {
    const size = sizeSelect.value;
    const [width, height] = size.split('x').map(Number);
    
    canvas.width = width;
    canvas.height = height;
    displaySizeText.textContent = `${width} x ${height} pixels`;
    
    // Update TFT dimensions
    tft._width = width;
    tft._height = height;
    
    // Re-execute code with new size
    executeCode();
}

// Initial execution
loadDefaultCode();
executeCode();