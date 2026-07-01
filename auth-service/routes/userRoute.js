// GET genitori associati a un terapeuta
router.get('/therapist/:therapistId/parents', userAuth, async (req, res) => {
    try {
        const { therapistId } = req.params;

        // Verifica che il richiedente sia il terapeuta stesso o un admin
        if (req.userId !== therapistId) {
            // Qui puoi aggiungere check admin se serve
        }

        const parents = await userModel.find({
            "therapists": {
                $elemMatch: {
                    therapistId: new mongoose.Types.ObjectId(therapistId),
                    status: 'accepted'
                }
            }
        }).select('_id anagrafica.nome anagrafica.cognome');

        res.json({ success: true, parents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Verifica accesso terapeuta a un bambino
router.get('/therapist/:therapistId/child/:childId/verify', userAuth, async (req, res) => {
    try {
        const { therapistId, childId } = req.params;

        // Trova il bambino e verifica che il suo genitore abbia il terapeuta
        // Questa logica dipende da come strutturi i childId
        // Esempio semplificato:
        const parents = await userModel.find({
            "therapists": {
                $elemMatch: {
                    therapistId: new mongoose.Types.ObjectId(therapistId),
                    status: 'accepted'
                }
            },
            "children": { $elemMatch: { _id: childId } }
        });

        if (parents.length === 0) {
            return res.status(403).json({ success: false, message: 'Accesso negato' });
        }

        res.json({
            success: true,
            parentIds: parents.map(p => p._id.toString())
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});