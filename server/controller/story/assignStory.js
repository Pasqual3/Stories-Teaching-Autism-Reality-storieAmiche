import { userModel } from "../../models/userModel.js";

export const assignStoryToChildren = async (req, res) => {
    try {
        const { storyId, childrenIds } = req.body;

        if (!storyId || !childrenIds) {
            return res.status(400).json({ success: false, message: "Dati incompleti." });
        }

        // Carichiamo l'utente genitore dal database
        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Utente non trovato." });
        }

        // Convertiamo tutti gli ID ricevuti in stringhe semplici per evitare bug di tipo
        const targetChildrenIds = childrenIds.map(id => String(id));
        const targetStoryIdStr = String(storyId);

        // Cicliamo su ogni bambino del genitore e aggiorniamo il suo array "stories"
        user.children.forEach(child => {
            const childIdStr = String(child._id);
            
            // Inizializza l'array delle storie se non esiste
            if (!child.stories) {
                child.stories = [];
            }

            // Convertiamo le storie attualmente assegnate al bambino in stringhe per fare i confronti
            const currentStoriesStr = child.stories.map(s => String(typeof s === 'object' ? s._id : s));

            const shouldHaveStory = targetChildrenIds.includes(childIdStr);

            if (shouldHaveStory) {
                // Se deve avere la storia ma non è ancora presente nell'array, la aggiungiamo
                if (!currentStoriesStr.includes(targetStoryIdStr)) {
                    child.stories.push(storyId);
                }
            } else {
                // Se NON deve avere la storia, la filtriamo via rimuovendola
                child.stories = child.stories.filter(s => {
                    const id = typeof s === 'object' ? s._id : s;
                    return String(id) !== targetStoryIdStr;
                });
            }
        });

        // Salviamo le modifiche nel database
        await user.save();

        res.json({ success: true, message: "Assegnazioni aggiornate con successo!" });
    } catch (error) {
        console.error("Errore durante l'assegnazione della storia:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};