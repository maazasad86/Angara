const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');

const W = 36;
const DIVIDER = '='.repeat(W);
const THIN = '-'.repeat(W);
const CACHE_TTL_MS = 5 * 60 * 1000;

const printerState = {
    name: null,
    type: 'windows',
    host: null,
    port: null,
    manualOverride: false,
    lastDetectedAt: null,
};

function pad(str, len, align = 'LEFT') {
    const s = String(str || '').substring(0, len);
    if (align === 'RIGHT')  return s.padStart(len);
    if (align === 'CENTER') return s.padStart(Math.floor((len + s.length) / 2)).padEnd(len);
    return s.padEnd(len);
}

function center(str) {
    return pad(str, W, 'CENTER');
}

function tableRow(cols) {
    const widths = cols.map(c => Math.floor(c.width * W));
    return cols.map((c, i) => pad(c.text, widths[i], c.align)).join('');
}

function padLine(left, right) {
    const space = W - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
}

async function getDefaultPrinter() {
    const { stdout } = await execAsync('wmic printer where Default=TRUE get Name /value');
    const match = stdout.match(/Name=(.+)/);
    return match ? match[1].trim().replace(/\r/g, '') : null;
}

async function resolveActivePrinter() {
    if (printerState.manualOverride) return printerState;
    const now = Date.now();
    const expired = !printerState.lastDetectedAt || (now - printerState.lastDetectedAt > CACHE_TTL_MS);
    if (expired) {
        const name = await getDefaultPrinter();
        printerState.name = name;
        printerState.type = 'windows';
        printerState.host = null;
        printerState.port = null;
        printerState.lastDetectedAt = now;
        if (name) console.log(`[Printer] Auto-detected: ${name}`);
    }
    return printerState;
}

const LOGO_PATH = path.join(__dirname, '..', '..', 'client', 'src', 'assets', 'printlogo.jpeg');

async function sendViaDrawPrinter(printerName, lines) {
    const escaped     = printerName.replace(/'/g, "''");
    const tmpJson     = path.join(os.tmpdir(), `receipt_${Date.now()}.json`);
    const escapedJson = tmpJson.replace(/\\/g, '\\\\');
    const logoExists  = fs.existsSync(LOGO_PATH);
    const escapedLogo = LOGO_PATH.replace(/\\/g, '\\\\');

    fs.writeFileSync(tmpJson, JSON.stringify(lines), 'utf8');

    const psScript = `
Add-Type -AssemblyName System.Drawing

$lines    = [System.IO.File]::ReadAllText('${escapedJson}') | ConvertFrom-Json
$font     = New-Object System.Drawing.Font('Courier New', 8,  [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$boldFont = New-Object System.Drawing.Font('Courier New', 9,  [System.Drawing.FontStyle]::Bold,    [System.Drawing.GraphicsUnit]::Point)
$bigFont  = New-Object System.Drawing.Font('Courier New', 11, [System.Drawing.FontStyle]::Bold,    [System.Drawing.GraphicsUnit]::Point)
$brush    = [System.Drawing.Brushes]::Black

$script:lineIdx   = 0
$script:allLines  = $lines
$script:logoDrawn = $false

$doc = New-Object System.Drawing.Printing.PrintDocument
$doc.PrinterSettings.PrinterName = '${escaped}'
$doc.DefaultPageSettings.PaperSize = New-Object System.Drawing.Printing.PaperSize('80mm Roll', 315, 30000)
$doc.DefaultPageSettings.Margins   = New-Object System.Drawing.Printing.Margins(0, 45, 6, 6)

$doc.add_PrintPage({
    param($s, $e)
    $g    = $e.Graphics
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $x    = [float]$e.MarginBounds.Left
    $y    = [float]$e.MarginBounds.Top
    $maxY = [float]$e.MarginBounds.Bottom
    $pw   = [float]$e.MarginBounds.Width

    if (-not $script:logoDrawn) {
        $script:logoDrawn = $true
        ${logoExists ? `
        try {
            $logo   = [System.Drawing.Image]::FromFile('${escapedLogo}')
            $aspect = [float]$logo.Width / [float]$logo.Height
            $imgW   = [float]$pw
            $imgH   = [float]($imgW / $aspect)
            if ($imgH -gt 120) { $imgH = 120; $imgW = $imgH * $aspect }
            $imgX   = $x + ($pw - $imgW) / 2
            $g.DrawImage($logo, $imgX, $y, $imgW, $imgH)
            $y += $imgH + 4
            $logo.Dispose()
        } catch {}` : ''}
    }

    while ($script:lineIdx -lt $script:allLines.Count) {
        $raw     = $script:allLines[$script:lineIdx]
        $isBig   = $raw.StartsWith('!!BIG!!')
        $isBold  = $raw.StartsWith('!!BOLD!!')
        $isRight = $raw.StartsWith('!!RIGHT!!')
        $useFont = if ($isBig) { $bigFont } elseif ($isBold) { $boldFont } else { $font }
        $text    = $raw -replace '^!!(BIG|BOLD|RIGHT)!!', ''
        $lineH   = $useFont.GetHeight($g) + 1

        if ($y + $lineH -gt $maxY) {
            $e.HasMorePages = $true
            return
        }
        if ($isRight) {
            $tw = $g.MeasureString($text, $useFont).Width
            $g.DrawString($text, $useFont, $brush, ($x + $pw - $tw), $y)
        } else {
            $g.DrawString($text, $useFont, $brush, $x, $y)
        }
        $y += $lineH
        $script:lineIdx++
    }
    $e.HasMorePages = $false
})

$doc.Print()
$font.Dispose()
$boldFont.Dispose()
$bigFont.Dispose()
Write-Host 'PRINT_DONE'
Remove-Item '${escapedJson}' -Force -ErrorAction SilentlyContinue
`;

    const psFile = path.join(os.tmpdir(), `print_${Date.now()}.ps1`);
    fs.writeFileSync(psFile, psScript, 'utf8');
    try {
        const { stderr } = await execAsync(
            `powershell -ExecutionPolicy Bypass -NonInteractive -File "${psFile}"`
        );
        if (stderr && stderr.trim()) console.warn('[Printer] PS stderr:', stderr.trim());
    } catch (err) {
        throw new Error(err.stderr || err.stdout || err.message);
    } finally {
        try { fs.unlinkSync(psFile); } catch {}
        try { fs.unlinkSync(tmpJson); } catch {}
    }
}


function sendViaTCP(host, port, lines) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const ESC = 0x1b;
        const GS  = 0x1d;
        const parts = [
            Buffer.from([ESC, 0x40]),
            Buffer.from(lines.map(l => l.replace(/^!!(BOLD|BIG)!!/, '')).join('\n') + '\n', 'utf8'),
            Buffer.from([GS, 0x56, 0x42, 0x00]),
        ];
        const data = Buffer.concat(parts);
        socket.setTimeout(5000);
        socket.connect(port, host, () => { socket.write(data, () => socket.end()); });
        socket.on('close', () => resolve());
        socket.on('timeout', () => { socket.destroy(); reject(new Error(`TCP timeout ${host}:${port}`)); });
        socket.on('error', reject);
    });
}

async function sendToPrinter(state, lines) {
    if (state.type === 'tcp') {
        await sendViaTCP(state.host, state.port, lines);
    } else {
        await sendViaDrawPrinter(state.name, lines);
    }
}

function buildCustomerReceipt({ items, orderType, customerName, totalAmount, orderId }) {
    const shortId = orderId ? orderId.toString().slice(-4).toUpperCase() : 'NEW';
    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-PK');
    const timeStr = now.toLocaleTimeString('en-PK', { hour12: true });

    const lines = [];

    lines.push('!!BOLD!!' + center('Angaara Bites'));
    lines.push(center('Ph: +92 3342471192'));
    lines.push(THIN);

    lines.push(`Order: ${shortId}` + ' '.repeat(Math.max(1, W - `Order: ${shortId}`.length - `Type: ${orderType}`.length)) + `Type: ${orderType}`);
    lines.push(`Date: ${dateStr}, ${timeStr}`);
    if (customerName) lines.push(`Cust: ${customerName}`);
    lines.push(THIN);

    lines.push('!!BOLD!!' + tableRow([
        { text: 'ITEM',  align: 'LEFT',   width: 0.52 },
        { text: 'QTY',   align: 'CENTER', width: 0.13 },
        { text: 'PRICE', align: 'RIGHT',  width: 0.35 },
    ]));
    lines.push(THIN);

    items.forEach(item => {
        const name  = (item.name  || 'Item').substring(0, 18);
        const qty   = String(item.quantity || 1);
        const price = String((item.price || 0) * (item.quantity || 1));
        lines.push(tableRow([
            { text: name,  align: 'LEFT',   width: 0.52 },
            { text: qty,   align: 'CENTER', width: 0.13 },
            { text: price, align: 'RIGHT',  width: 0.35 },
        ]));
    });

    lines.push(THIN);
    lines.push(padLine('TOTAL:', ''));
    lines.push('!!BIG!!' + '!!RIGHT!!' + `Rs. ${totalAmount}`);
    lines.push(THIN);
    lines.push('');
    lines.push(center('Thank You! Please Visit Again.'));
    lines.push('');
    lines.push('');
    lines.push('');

    return lines;
}

function buildKOT({ type, items, orderType, tableNo, orderId, isAddon }) {
    const shortId = orderId ? orderId.toString().slice(-4).toUpperCase() : null;
    const kitchen = type === 'KOT_DESI' ? 'DESI KITCHEN' : 'FAST FOOD';
    const timeStr = new Date().toLocaleTimeString('en-PK', { hour12: true });

    const lines = [];

    lines.push('');
    if (isAddon) {
        lines.push('!!BIG!!' + center('** ADD-ON KOT **'));
    } else {
        lines.push('!!BIG!!' + center('** KOT **'));
    }
    lines.push('!!BOLD!!' + center(kitchen));
    lines.push(DIVIDER);

    if (shortId) lines.push(`Order #: ${shortId}   |   Type: ${orderType}`);
    else         lines.push(`Type: ${orderType}`);
    lines.push(`Time: ${timeStr}`);
    if (tableNo) lines.push(`Table No: ${tableNo}`);

    lines.push(DIVIDER);
    lines.push('ITEMS:');
    lines.push(THIN);

    items.forEach(item => {
        const isDeal = Array.isArray(item.items) && item.items.length > 0;
        if (isDeal) {
            item.items.forEach(di => {
                const name    = (di.item && di.item.name) ? di.item.name : 'Item';
                const variant = (di.variant || di.chosenVariant) ? ` [${di.variant || di.chosenVariant}]` : '';
                const qty     = (di.quantity || 1) * (item.quantity || 1);
                lines.push('!!BOLD!!' + `  [ ${qty} ]  ${name}${variant}`);
            });
            if (item.notes) lines.push(`         Note: ${item.notes}`);
        } else {
            const variant = item.variant ? ` [${item.variant}]` : '';
            lines.push('!!BOLD!!' + `  [ ${item.quantity || 1} ]  ${item.name || 'Item'}${variant}`);
            if (item.notes) lines.push(`         Note: ${item.notes}`);
        }
    });

    lines.push(DIVIDER);
    lines.push('');
    lines.push('');
    lines.push('');

    return lines;
}

router.post('/config', (req, res) => {
    const { type, name, host, port } = req.body;

    if (type === 'tcp') {
        if (!host || !port) return res.status(400).json({ message: 'host and port required for TCP' });
        printerState.type = 'tcp';
        printerState.host = host;
        printerState.port = parseInt(port, 10);
        printerState.name = `${host}:${port}`;
        printerState.manualOverride = true;
        printerState.lastDetectedAt = Date.now();
        console.log(`[Printer] Override -> TCP ${host}:${port}`);
        return res.json({ message: 'Printer set to TCP/IP', printer: printerState.name });
    }

    if (type === 'windows') {
        if (!name) return res.status(400).json({ message: 'name required for Windows printer' });
        printerState.type = 'windows';
        printerState.name = name;
        printerState.host = null;
        printerState.port = null;
        printerState.manualOverride = true;
        printerState.lastDetectedAt = Date.now();
        console.log(`[Printer] Override -> Windows: ${name}`);
        return res.json({ message: 'Printer set to Windows printer', printer: name });
    }

    if (type === 'auto') {
        printerState.manualOverride = false;
        printerState.lastDetectedAt = null;
        console.log('[Printer] Reset to auto-detection');
        return res.json({ message: 'Printer reset to auto-detection' });
    }

    res.status(400).json({ message: 'type must be tcp, windows, or auto' });
});

router.get('/status', async (req, res) => {
    const state = await resolveActivePrinter();
    res.json({
        printer: state.name || null,
        type: state.type,
        manualOverride: state.manualOverride,
        lastDetectedAt: state.lastDetectedAt ? new Date(state.lastDetectedAt).toISOString() : null,
        cacheExpiresIn: state.manualOverride || !state.lastDetectedAt
            ? null
            : Math.max(0, Math.round((CACHE_TTL_MS - (Date.now() - state.lastDetectedAt)) / 1000)) + 's',
    });
});

router.post('/', async (req, res) => {
    try {
        const { type, items, orderType, customerName, totalAmount, tableNo, orderId, isAddon } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items to print' });
        }

        const state = await resolveActivePrinter();

        if (!state.name) {
            return res.json({ message: 'Simulated print (No printer found)', type });
        }

        let lines;
        if (type === 'CUSTOMER_RECEIPT') {
            lines = buildCustomerReceipt({ items, orderType, customerName, totalAmount, orderId });
        } else if (type === 'KOT_DESI' || type === 'KOT_FASTFOOD') {
            lines = buildKOT({ type, items, orderType, tableNo, orderId, isAddon });
        } else {
            return res.status(400).json({ message: `Unknown print type: ${type}` });
        }

        await sendToPrinter(state, lines);
        console.log(`[Printer] Printed on: ${state.name}`);
        res.json({ message: 'Printed successfully', type, printer: state.name });
    } catch (err) {
        console.error('[Printer] ERROR:', err.message);
        res.json({ message: 'Simulated print (Printer error)', error: err.message, type: req.body.type });
    }
});

module.exports = router;
