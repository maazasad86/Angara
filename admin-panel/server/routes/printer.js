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
                lineCharacter: "-",
                width: 42,
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
            printer.alignCenter();
            printer.setTextDoubleHeight();
            printer.bold(true);
            printer.println("Angaara Bites");
            
            printer.setTextNormal();
            printer.bold(false);
            printer.println("Ph: +92 3342471192");
            printer.drawLine();
            
            printer.alignLeft();
            const shortOrderId = orderId ? orderId.toString().slice(-4).toUpperCase() : 'NEW';
            
            printer.tableCustom([
                { text: "Order:", align: "LEFT", width: 0.15 },
                { text: shortOrderId, align: "LEFT", width: 0.35 },
                { text: "Type:", align: "LEFT", width: 0.15 },
                { text: orderType, align: "LEFT", width: 0.35 }
            ]);
            
            printer.tableCustom([
                { text: "Date:", align: "LEFT", width: 0.15 },
                { text: new Date().toLocaleString('en-PK', { hour12: true }), align: "LEFT", width: 0.85 }
            ]);
            
            if (customerName) {
                printer.tableCustom([
                    { text: "Cust:", align: "LEFT", width: 0.15 },
                    { text: customerName, align: "LEFT", width: 0.85 }
                ]);
            }
            
            printer.drawLine();
            
            printer.bold(true);
            printer.tableCustom([
                { text: "ITEM", align: "LEFT", width: 0.50 },
                { text: "QTY", align: "CENTER", width: 0.15 },
                { text: "PRICE", align: "RIGHT", width: 0.35 }
            ]);
            printer.bold(false);
            printer.drawLine();

            items.forEach(item => {
                printer.tableCustom([
                    { text: item.name.substring(0, 20), align: "LEFT", width: 0.50 },
                    { text: item.quantity.toString(), align: "CENTER", width: 0.15 },
                    { text: (item.price * item.quantity).toString(), align: "RIGHT", width: 0.35 }
                ]);
            });

            printer.drawLine();
            
            printer.setTextDoubleHeight();
            printer.bold(true);
            printer.tableCustom([
                { text: "TOTAL:", align: "LEFT", width: 0.40 },
                { text: `Rs. ${totalAmount}`, align: "RIGHT", width: 0.60 }
            ]);
            printer.setTextNormal();
            printer.bold(false);
            
            printer.drawLine();
            
            printer.alignCenter();
            printer.println("Thank You! Please Visit Again.");
        }
        else if (type === 'KOT_DESI' || type === 'KOT_FASTFOOD') {
            const isAddon = req.body.isAddon;
            
            printer.alignCenter();
            printer.bold(true);
            printer.setTextDoubleHeight();
            printer.setTextDoubleWidth();
            
            if (isAddon) {
                printer.println(`** ADD-ON KOT **`);
            } else {
                printer.println(`** KOT **`);
            }
            
            printer.setTextNormal();
            printer.setTextDoubleHeight();
            printer.println(type === 'KOT_DESI' ? "DESI KITCHEN" : "FAST FOOD");
            printer.setTextNormal();
            printer.drawLine();
            
            printer.alignLeft();
            if (orderId) {
                const shortOrderId = orderId.toString().slice(-4).toUpperCase();
                printer.println(`Order: ${shortOrderId}  |  Type: ${orderType}`);
            } else {
                printer.println(`Type: ${orderType}`);
            }
            printer.println(`Time: ${new Date().toLocaleTimeString('en-PK', { hour12: true })}`);
            if (tableNo) printer.println(`Table No: ${tableNo}`);
            printer.drawLine();
            
            // Kitchen Items - very clear and big
            printer.setTextDoubleHeight();
            printer.bold(true);
            items.forEach(item => {
                printer.println(`[ ${item.quantity} ] x ${item.name}`);
                if (item.notes) {
                    printer.setTextNormal();
                    printer.println(`  -> Note: ${item.notes}`);
                    printer.setTextDoubleHeight();
                    printer.bold(true);
                }
            });
            printer.setTextNormal();
            printer.drawLine();
            printer.println(" "); // Small bottom margin for clean cut
        }

        printer.cut();
        printer.beep();
        
        // Execute print
        try {
            await printer.execute();
            console.log("Print executed successfully.");
            res.json({ message: 'Printed successfully', type });
        } catch (printErr) {
            console.error("Print Execute Error:", printErr);
            res.status(500).json({ message: 'Error executing print command', error: printErr.message });
        }
    } catch (err) {
        console.error('PRINTER ROUTE ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
