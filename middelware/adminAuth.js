const { Users } = require("../models");

const adminAuth = async (req, res, next) => {
    try {
        // The existing JWT middleware must run first.
        const user = await Users.findByPk(req.user.id, {
            attributes: ["id", "role"]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found."
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

        req.admin = user;
        next();
    } catch (error) {
        console.error("Admin authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify admin permissions."
        });
    }
};

module.exports = adminAuth;