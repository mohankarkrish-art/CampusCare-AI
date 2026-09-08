const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        complaintId: {
            type: String,
            required: true,
            unique: true
        },

        category: {
            type: String,
            required: true
        },

        priority: {
            type: String,
            required: true
        },

        location: {
            type: String,
            default: "Not specified"
        },

        problem: {
            type: String,
            required: true
        },

        recommendedAction: {
            type: String,
            default: "Not specified"
        },

        status: {
            type: String,
            default: "Open"
        }
    },
    {
        timestamps: true
    }
);

const Complaint = mongoose.model(
    "Complaint",
    complaintSchema
);

module.exports = Complaint;