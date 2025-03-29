const { userAuth } = require("../middlewares/auth");
const express = require("express");
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorpay");
const crypto = require("crypto");

const Payment = require("../models/payment");
const membershipAmount = require("../utils/constants");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/user");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { membershipType } = req.body;
    const { firstName, lastName, emailId } = req.user;
    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType] * 100,
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType: membershipType,
      },
    });
  

    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });

    const savedPayment = await payment.save();

    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




paymentRouter.post("/payment/webhook", async (req, res) => {
    try {
      
        
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET; // Make sure this is set in .env
        const webhookSignature = req.get("X-Razorpay-Signature");

        if (!webhookSignature) {
            return res.status(400).json({ msg: "Webhook signature missing" });
        }

        // Validate Webhook Signature
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(JSON.stringify(req.body));
        const generatedSignature = hmac.digest("hex");

        if (webhookSignature !== generatedSignature) {
            return res.status(400).json({ msg: "Invalid Webhook Signature" });
        }

        const event = req.body.event; // Extract event type
        const payload = req.body.payload; // Extract payload data

 
        
        if (event === "payment.captured") {
            const paymentData = payload.payment.entity;
           

            const orderId = paymentData.order_id;
            const paymentId = paymentData.id;
            const amount = paymentData.amount;
            const emailId = paymentData.notes.emailId;
            const membershipType = paymentData.notes.membershipType;

            // Update payment status in database
            const updatedPayment = await Payment.findOneAndUpdate(
                { orderId },
                { status: "captured", paymentId },
                { new: true }
            );

            if (!updatedPayment) {
                return res.status(404).json({ msg: "Payment record not found" });
            }

           

            // Update user membership status
            const updatedUser = await User.findOneAndUpdate(
                { emailId },
                { isPremium: true, membershipType },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ msg: "User not found" });
            }

         

            return res.status(200).json({ msg: "Payment and User updated successfully",   user: updatedUser });
        }

        res.status(200).json({ msg: "Webhook processed" });
    } catch (error) {
        console.error("Webhook Error:", error);
        return res.status(500).json({ msg: "Internal server error" });
    }
});


paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
    const user = req.user.toJSON();
    if (user.isPremium) {
      return res.json({ ...user });
    }
    return res.json({ ...user });
  });

  

module.exports = paymentRouter;
