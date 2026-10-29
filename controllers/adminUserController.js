
const { Op } = require("sequelize");
const { Users } = require("../models");

const getUsers = async (req, res) => {
    try {
        const search = (req.query.search || "").trim();
        const where = {};

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const users = await Users.findAll({
            where,
            attributes: [
                "id",
                "name",
                "email",
                "phone",
                "role",
                "createdAt"
            ],
            order: [["createdAt", "DESC"]],
            limit: 100
        });

        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error("Admin get users error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch users."
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        // Prevent an admin from deleting their own account.
        if (userId === Number(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account."
            });
        }

        const user = await Users.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Protect the last administrator.
        if (user.role === "admin") {
            const adminCount = await Users.count({
                where: { role: "admin" }
            });

            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete the last administrator."
                });
            }
        }

        await user.destroy();

        return res.status(200).json({
            success: true,
            message: "User account deleted successfully.",
            deletedUserId: userId
        });
    } catch (error) {
        console.error("Admin delete user error:", error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete user. Check database relationships and foreign-key constraints."
        });
    }
};

module.exports = {
    getUsers,
    deleteUser
}