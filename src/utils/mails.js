const nodemailer = require('nodemailer');
require('dotenv').config(); 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODMAILER_EMAIL,
    pass: process.env.NODMAILER_PASSWORD,
  },
});



async function sendEmail(email, subject, text) {
  const mailOptions = {
    to : email,
    from: process.env.NODMAILER_EMAIL, 
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function sendOrderPlacedEmail(email, orderDetails) {
  try {
    const productDetails = orderDetails.products.map(product => {
      return `Product: ${product.name}\nQuantity: ${product.quantity}\nPrice: $${product.price}\n`;
    }).join("\n");

    const details = {
      from: "habusfurniture@gmail.com",
      to: email,
      subject: `Order Placed Successfully - Order #${orderDetails.razorpayOrderId}`,
      text: `Thank you for your purchase!\n\nYour order has been placed successfully.\n\nOrder ID: ${orderDetails.razorpayOrderId}\n\nProducts:\n${productDetails}\nTotal Amount: $${orderDetails.totalAmount}\n\nWe will notify you once your order is shipped.`,
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(details, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve("Order placed email sent: " + info.response);
        }
      });
    });
  } catch (err) {
    console.error("Error sending order placed email:", err);
    throw err;
  }
}


async function sendOrderUpdatedEmail(userEmail, orderDetails) {
  const subject = 'Order Status Updated';
  const text = `Your order status has been updated. Order ID: ${orderDetails.orderId}. New Status: ${orderDetails.status}.`;
  await sendEmail(userEmail, subject, text);
}

async function sendOrderCanceledEmail(userEmail, orderDetails) {
  const subject = 'Order Canceled';
  const text = `Your order has been canceled, and the amount has been refunded to your wallet. Order ID: ${orderDetails.orderId}. Refund Amount: ${orderDetails.refundAmount}.`;
  await sendEmail(userEmail, subject, text);
}


async function sendReturnRequestEmail(userEmail, returnDetails) {
  const subject = 'Return Request Received';
  const text = `Your return request has been received. Return ID: ${returnDetails.returnId}. Status: ${returnDetails.status}.`;
  await sendEmail(userEmail, subject, text);
}

async function sendReturnApprovedEmail(userEmail, returnDetails) {
  const subject = 'Return Request Approved';
  const text = `Your return request has been approved. Return ID: ${returnDetails.returnId}. Refund Amount: ${returnDetails.refundAmount}.`;
  await sendEmail(userEmail, subject, text);
}

module.exports = {
  sendOrderPlacedEmail,
  sendOrderUpdatedEmail,
  sendOrderCanceledEmail,
  sendReturnRequestEmail,
  sendReturnApprovedEmail,
};
