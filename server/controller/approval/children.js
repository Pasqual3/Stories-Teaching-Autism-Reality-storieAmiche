import { findParentsByTherapist, formatParentInfo, formatChildren } from './helpers.js';

export const getAssignedChildren = async (req, res) => {
    try {
        const parents = await findParentsByTherapist(req.userId, 'accepted');

        const result = parents.map(parent => ({
            ...formatParentInfo(parent),
            children: formatChildren(parent.children)
        }));

        res.json({ success: true, assignedChildren: result, families: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
