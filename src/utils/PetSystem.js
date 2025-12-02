const db = require('./Database');

class PetSystem {
    getUserPets(userId) {
        const stmt = db.prepare('SELECT * FROM pets WHERE user_id = ?');
        const pets = stmt.all(userId);

        return pets.map(pet => {
            const stats = JSON.parse(pet.stats);
            return {
                id: pet.id,
                petName: pet.pet_name,
                type: pet.type,
                ...stats
            };
        });
    }

    getPet(petId) {
        const stmt = db.prepare('SELECT * FROM pets WHERE id = ?');
        const pet = stmt.get(petId);

        if (!pet) return null;

        const stats = JSON.parse(pet.stats);
        return {
            id: pet.id,
            petName: pet.pet_name,
            type: pet.type,
            ...stats
        };
    }

    addPet(userId, petData) {
        const { id, petName, type, ...stats } = petData;
        const petId = id || Math.random().toString(36).substr(2, 9);

        const stmt = db.prepare(`
            INSERT INTO pets (id, user_id, pet_name, type, stats)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(petId, userId, petName, type, JSON.stringify(stats));
        return petId;
    }

    removePet(petId) {
        const stmt = db.prepare('DELETE FROM pets WHERE id = ?');
        const result = stmt.run(petId);
        return result.changes > 0;
    }

    updatePet(petId, updateFn) {
        const pet = this.getPet(petId);
        if (!pet) return false;

        updateFn(pet);

        const { id, petName, type, ...stats } = pet;

        const stmt = db.prepare(`
            UPDATE pets 
            SET pet_name = ?, type = ?, stats = ?
            WHERE id = ?
        `);

        stmt.run(petName, type, JSON.stringify(stats), id);
        return true;
    }
}

module.exports = new PetSystem();
