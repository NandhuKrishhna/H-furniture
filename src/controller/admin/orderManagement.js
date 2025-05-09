const { orderCollection } = require("../../models/orderModel");
const { userCollection } = require("../../models/UserModels");
const { walletCollection } = require("../../models/walletModel");
const { OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = require("../../utils/http");
const { fetchOrderData, fetchSaleReportData } = require("../../utils/helpers")


module.exports = {
    getOrdersPage: async (req, res, next) => {
        try {
            const orders = await orderCollection.find().sort({ orderDate: -1 }).lean();
            console.log('Orders:', orders);

            res.status(OK).render("admin/order_management", { orders })
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    orderDetails: async (req, res, next) => {
        try {
            const { orderId, itemId } = req.params;
            console.log(orderId, itemId);


            const order = await orderCollection.findById(orderId)
                .populate({
                    path: 'orderItems.productId',
                    model: 'product_data',
                })
                .populate({
                    path: 'userId',
                    model: 'user_data',
                });

            if (!order) {
                return res.status(NOT_FOUND).json({
                    message: 'Order not found'
                });
            }

            const item = order.orderItems.find(item => item._id.toString() === itemId);
            if (!item) {
                return res.status(NOT_FOUND).json({
                    message: 'Item not found in the order'
                });
            }
            console.log("Item:", item);


            const user = await userCollection.findById(order.userId).select('email');
            if (!user) {
                return res.status(NOT_FOUND).json({
                    message: 'User not found'
                });
            }
            res.status(OK).render('admin/orderDetails', {
                order,
                item,
                updatedAt: order.updatedAt,
                userEmail: user.email,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    },
    updateOrderStatus: async (req, res, next) => {

        try {
            const { orderId, itemId, status } = req.body;

            await orderCollection.updateOne(
                { _id: orderId, 'orderItems._id': itemId },
                { $set: { 'orderItems.$.status': status } }
            );

            res.status(OK).json({ message: 'Product status updated successfully.' });
        } catch (error) {
            console.error(error);
            res.status(INTERNAL_SERVER_ERROR).json({ message: 'Error updating product status.' });
        }
    },
    approveReturn: async (req, res, next) => {
        try {
            const { orderId, itemId } = req.body;
            console.log(req.body);


            const updatedOrder = await orderCollection.findOneAndUpdate(
                { _id: orderId, 'orderItems._id': itemId },
                {
                    $set: {
                        'orderItems.$.status': 'Returned',
                        'orderItems.$.returnRequest.status': 'Approved',
                        'orderItems.$.returnRequest.approvalDate': new Date(),
                    }
                },
                { new: true }
            );


            const updatedItem = updatedOrder.orderItems.find(item => item._id.toString() === itemId);
            console.log('Updated Item:', updatedItem);


            const refundAmount = updatedItem.price - updatedItem.discountValue;
            console.log('Refund Amount:', refundAmount);
            res.status(OK).json({
                success: true,
                message: "Return request approved successfully"
            });

            // ----- Amount refund to wallet -----
            const user = await userCollection.findById(updatedOrder.userId);
            console.log('User:', user);

            if (updatedItem) {
                let wallet = await walletCollection.findOne({ userId: user._id });
                console.log('Existing Wallet:', wallet);

                if (wallet) {
                    wallet.balance += refundAmount;
                    wallet.history.push({
                        transactionType: "Refunded",
                        amount: refundAmount,
                        date: new Date()
                    });
                    await wallet.save();
                } else {
                    const newWallet = new walletCollection({
                        userId: user._id,
                        balance: refundAmount,
                        history: [{
                            transactionType: 'Refunded',
                            amount: refundAmount,
                            date: new Date()
                        }]
                    });
                    console.log('New Wallet Created:', newWallet);
                    await newWallet.save();
                }
            }

        } catch (error) {
            console.log(error);
            next(error);
        }
    },
    rejectReturn: async (req, res, next) => {
        try {
            const { orderId, itemId } = req.body;
            console.log(req.body);
            const updatedOrder = await orderCollection.findOneAndUpdate(
                { _id: orderId, 'orderItems._id': itemId },
                {
                    $set: {
                        'orderItems.$.returnRequest.status': 'Rejected',
                        'orderItems.$.returnRequest.approvalDate': new Date(),
                    }
                },
                { new: true }
            );

            const updatedItem = updatedOrder.orderItems.find(item => item._id.toString() === itemId);
            console.log('Updated Item:', updatedItem);
            res.status(OK).json({
                success: true,
                message: "Return request rejected successfully"
            });

        } catch (error) {
            console.log(error);
            next(error);
        }
    },
    getSaleReport: async (req, res, next) => {
        try {
            const period = req.query.period || 'daily';
            const reportData = await fetchSaleReportData(period);
            // console.log(reportData);
            res.render('admin/sales', {
                ...reportData,
                period,
            });
        } catch (error) {
            console.error('Error fetching sales summary:', error);
            res.status(INTERNAL_SERVER_ERROR).send('Internal Server Error');
        }
    },
    downlordSalesReport: async (req, res, next) => {
        try {
            const period = req.query.period || 'daily';
            const reportData = await fetchSaleReportData(period);


            const doc = new PDFDocument({
                size: [1200, 1200],
                margin: 50
            });

            let filename = `sales_report_${period}.pdf`;
            filename = encodeURIComponent(filename);

            res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-type', 'application/pdf');

            doc.pipe(res);


            doc.fontSize(18).text('Mazen Furniture', { align: 'center' });
            doc.fontSize(14).text(`Sales Report - ${period}`, { align: 'center' });

            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            doc.fontSize(10).text(`Generated on: ${formattedDate}`, { align: 'center' });

            doc.moveDown();

            const headers = [
                { text: 'DATE', width: 60 },
                { text: 'ORDER ID', width: 100 },
                { text: 'CUSTOMER NAME', width: 150 },
                { text: 'ITEM', width: 100 },
                { text: 'ORIGINAL PRICE', width: 100 },
                { text: 'SOLD PRICE', width: 100 },
                { text: 'OFFER', width: 100 },
                { text: 'DISCOUNT', width: 100 },
                { text: 'COUPON', width: 100 },
                { text: 'PAYMENT METHOD', width: 120 },
                { text: 'STATUS', width: 80 }
            ];

            const totalWidth = headers.reduce((sum, header) => sum + header.width, 0);
            const startX = 50;
            let y = doc.y;


            doc.fontSize(10);
            headers.reduce((x, header) => {
                doc.text(header.text, x, y, { width: header.width, align: 'center' });
                return x + header.width;
            }, startX);

            y += 30;


            doc.moveTo(startX, y - 10)
                .lineTo(startX + totalWidth, y - 10)
                .stroke();


            const rowHeight = 20;


            doc.fontSize(8);
            reportData.orderDetails.forEach(order => {
                let rowY = y;

                headers.reduce((x, header, index) => {

                    let text = '';
                    switch (index) {
                        case 0: text = order.date; break;
                        case 1: text = order.orderId; break;
                        case 2: text = order.fullName; break;
                        case 3: text = order.productName; break;
                        case 4: text = order.originalPrice; break;
                        case 5: text = order.soldPrice; break;
                        case 6: text = order.offer; break;
                        case 7: text = order.discount; break;
                        case 8: text = order.couponApplied; break;
                        case 9: text = order.paymentMethod; break;
                        case 10: text = order.paymentStatus; break;
                    }

                    const fontSize = index === 1 ? 7 : 8;
                    doc.fontSize(fontSize);
                    const textWidth = doc.widthOfString(text);
                    const textHeight = doc.heightOfString(text);

                    const verticalOffset = (rowHeight - textHeight) / 2;


                    doc.text(text, x, rowY + verticalOffset, { width: header.width, align: 'center' });
                    return x + header.width;
                }, startX);

                rowY += rowHeight;
                doc.moveTo(startX, rowY)
                    .lineTo(startX + totalWidth, rowY)
                    .stroke();

                y = rowY;
            });


            doc.moveTo(startX, y)
                .lineTo(startX + totalWidth, y)
                .stroke();

            doc.end();
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(INTERNAL_SERVER_ERROR).send('Internal Server Error');
        }
    },
    dashboard: async (req, res, next) => {
        try {
            const timeframe = req.query.timeframe || 'monthly';
            const data = await fetchOrderData(timeframe);
            res.status(OK).render("admin/dashboard", {
                data,
                timeframe
            });
        } catch (error) {
            console.log('Error fetching dashboard data:', error);
            next(error);
        }
    }
}