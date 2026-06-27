const express = require('express');
const router = express.Router();
const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

// Optional: you can store this in .env
// e.g. PRINTER_INTERFACE=//localhost/ReceiptPrinter or tcp://192.168.1.100
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE || "printer:ReceiptPrinter";

router.post('/', async (req, res) => {
    try {
        const { type, items, orderType, customerName, totalAmount, tableNo, orderId } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items to print' });
        }

        let printer;
        let isConnected = false;
        try {
            printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: PRINTER_INTERFACE,
                characterSet: 'PC852_LATIN2',
                removeSpecialCharacters: false,
                lineCharacter: "=",
                options:{
                    timeout: 5000
                }
            });
            isConnected = await printer.isPrinterConnected();
        } catch (initErr) {
            console.warn("Printer initialization failed (No driver/printer found). Simulating print.");
            return res.json({ message: 'Simulated print (Printer offline/No driver)', type });
        }

        if (!isConnected) {
            console.warn("Printer not connected at", PRINTER_INTERFACE);
        }

        printer.alignCenter();
        
        if (type === 'CUSTOMER_RECEIPT') {
            printer.bold(true);
            printer.setTextSize(2, 2);
            printer.println("ANGARA RESTAURANT");
            printer.setTextNormal();
            printer.println("Food Street, Pakistan");
            printer.println("Ph: +92 300 1234567");
            printer.drawLine();
            
            printer.alignLeft();
            printer.println(`Order ID: ${orderId || 'NEW'}`);
            printer.println(`Type: ${orderType}`);
            if (customerName) printer.println(`Customer: ${customerName}`);
            printer.println(`Date: ${new Date().toLocaleString()}`);
            printer.drawLine();

            printer.tableCustom([
                { text: "Item", align: "LEFT", width: 0.5 },
                { text: "Qty", align: "CENTER", width: 0.15 },
                { text: "Price", align: "RIGHT", width: 0.35 }
            ]);
            printer.drawLine();

            items.forEach(item => {
                printer.tableCustom([
                    { text: item.name.substring(0, 20), align: "LEFT", width: 0.5 },
                    { text: item.quantity.toString(), align: "CENTER", width: 0.15 },
                    { text: (item.price * item.quantity).toString(), align: "RIGHT", width: 0.35 }
                ]);
            });

            printer.drawLine();
            printer.alignRight();
            printer.bold(true);
            printer.println(`Total Amount: Rs. ${totalAmount}`);
            printer.setTextNormal();
            printer.alignCenter();
            printer.println("Thank you for your visit!");
        } 
        else if (type === 'KOT_DESI' || type === 'KOT_FASTFOOD') {
            const isAddon = req.body.isAddon;
            
            printer.bold(true);
            printer.setTextSize(2, 2);
            if (isAddon) {
                printer.println(`[ ADD-ON KOT ]`);
            } else {
                printer.println(`[ KOT ]`);
            }
            printer.setTextSize(1, 1);
            printer.println(type === 'KOT_DESI' ? "DESI KITCHEN" : "FAST FOOD KITCHEN");
            printer.setTextNormal();
            printer.drawLine();
            
            printer.alignLeft();
            printer.println(`Type: ${orderType}`);
            printer.println(`Table/Order: ${tableNo || orderId || 'N/A'}`);
            printer.println(`Time: ${new Date().toLocaleTimeString()}`);
            printer.drawLine();
            
            printer.setTextSize(1, 1); // Large font for kitchen
            items.forEach(item => {
                printer.println(`${item.quantity}x ${item.name}`);
                if (item.notes) {
                    printer.setTextNormal();
                    printer.println(`   Note: ${item.notes}`);
                    printer.setTextSize(1, 1);
                }
            });
            printer.setTextNormal();
        }

        printer.cut();
        printer.beep();
        
        // Execute print
        if (isConnected) {
            try {
                await printer.execute();
                res.json({ message: 'Printed successfully', type });
            } catch (printErr) {
                console.error("Print Execute Error:", printErr);
                res.status(500).json({ message: 'Error executing print command', error: printErr.message });
            }
        } else {
            console.log("Simulating successful print because printer is disconnected.");
            res.json({ message: 'Simulated print (Printer offline)', type });
        }

    } catch (err) {
        console.error('PRINTER ROUTE ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
