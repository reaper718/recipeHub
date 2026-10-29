const { Users } = require("../models");

// Get the logged-in user's profile
exports.getProfile = async (req, res) => {
    try {
        const user = await Users.findByPk(req.user.id, {
            attributes: ["id", "name", "email", "phone", "createdAt"]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            profile: user
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile."
        });
    }
};


// Update the logged-in user's profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (name === undefined && phone === undefined) {
            return res.status(400).json({
                success: false,
                message: "Provide a name or phone number to update."
            });
        }

        if (name !== undefined) {
            if (typeof name !== "string" ||
                name.trim().length === 0 ||
                name.trim().length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Name must contain 1–100 characters."
                });
            }
        }

        if (phone !== undefined && phone !== null) {
            if (typeof phone !== "string" ||
                phone.trim().length > 20) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number must be text of at most 20 characters."
                });
            }
        }

        const user = await Users.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (name !== undefined) {
            user.name = name.trim();
        }

        if (phone !== undefined) {
            user.phone = phone?.trim() || null;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            profile: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile."
        });
    }
};
